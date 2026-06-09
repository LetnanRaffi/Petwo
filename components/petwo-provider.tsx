"use client";

import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { applyPetAction, clamp, petActions, type PetAction } from "@/lib/pet-actions";
import { getPetDisplayName } from "@/lib/pet-assets";
import { getShopItem } from "@/lib/shop";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Activity, AppState, Egg, GameEvent, Journal, Mission, MissionTaskType, Mood, Pet, Profile, QuizAnswer, Room, RoomWallet } from "@/lib/types";

export type OnboardingInput = {
  displayName: string;
  avatarType: string;
  relationshipType: string;
};

export type ActionResult = {
  ok: boolean;
  message?: string;
};

type PetwoContextValue = AppState & {
  loading: boolean;
  session: Session | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  createRoom: () => Promise<ActionResult>;
  joinRoom: (inviteCode: string) => Promise<ActionResult>;
  doPetAction: (action: PetAction) => Promise<void>;
  updateMood: (mood: string) => Promise<void>;
  addJournal: (content: string) => Promise<boolean>;
  playTruthOrDare: (prompt: string) => Promise<void>;
  completeCoupleQuiz: (sessionId: string, playerOneScore: number, playerTwoScore: number) => Promise<boolean>;
  buyShopItem: (itemId: string) => Promise<boolean>;
  renamePet: (name: string) => Promise<boolean>;
  selectPet: (petId: string) => void;
  completeOnboarding: (input: OnboardingInput) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const PetwoContext = createContext<PetwoContextValue | null>(null);

const initialState: AppState = {
  profile: null,
  room: null,
  partner: null,
  egg: null,
  pet: null,
  pets: [],
  selectedPetId: null,
  wallet: null,
  activities: [],
  moods: [],
  journals: [],
  missions: [],
  gameEvents: [],
  hatchCelebrated: false,
};

const actionMissionMap: Partial<Record<PetAction, MissionTaskType>> = {
  feed: "feed_pet",
  drink: "drink_pet",
  play: "play_pet",
  bath: "bath_pet",
};

function prependUniqueById<T extends { id: string }>(items: T[], item: T, limit: number) {
  return [item, ...items.filter((current) => current.id !== item.id)].slice(0, limit);
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function dayRange(value: Date) {
  const start = new Date(value);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function missionLabel(taskType: MissionTaskType, petName: string) {
  const labels: Record<MissionTaskType, string> = {
    mood_check: "Check mood",
    journal_entry: "Write journal",
    truth_or_dare_played: "Play Truth or Dare",
    feed_pet: `Feed ${petName}`,
    drink_pet: `Give ${petName} a drink`,
    play_pet: `Play with ${petName}`,
    bath_pet: `Bath ${petName}`,
  };
  return labels[taskType];
}

function getOAuthRedirectUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const baseUrl = siteUrl || (typeof window !== "undefined" ? window.location.origin : "");
  return `${baseUrl.replace(/\/$/, "")}/onboarding`;
}

export function PetwoProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<AppState>(initialState);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const loadingRequestId = useRef(0);

  const insertActivity = useCallback(async (roomId: string, actorId: string | null, action: string, message: string) => {
    if (!supabase) return null;

    const { data } = await supabase
      .from("pet_activities")
      .insert({ room_id: roomId, actor_id: actorId, action, message })
      .select()
      .single();

    if (data) setState((prev) => ({ ...prev, activities: prependUniqueById(prev.activities, data as Activity, 30) }));
    return data as Activity | null;
  }, []);

  const upsertProfile = useCallback(async (user: User) => {
    if (!supabase) return null;

    const fallbackName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Petwo Friend";
    const defaults = {
      id: user.id,
      name: fallbackName,
      display_name: fallbackName,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      avatar_type: "blue",
      email: user.email ?? null,
      relationship_type: null,
      onboarding_completed: false,
    };

    const { data: existing } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

    if (existing) {
      const { data } = await supabase
        .from("profiles")
        .update({
          email: user.email ?? existing.email ?? null,
          avatar_url: existing.avatar_url ?? user.user_metadata?.avatar_url ?? null,
        })
        .eq("id", user.id)
        .select()
        .single();
      return data as Profile;
    }

    const { data } = await supabase.from("profiles").insert(defaults).select().single();
    return data as Profile;
  }, []);

  const completeOnboarding = useCallback(async (input: OnboardingInput) => {
    if (!supabase || !session) return false;

    const displayName = input.displayName.trim();
    if (!displayName) return false;

    const { data, error } = await supabase
      .from("profiles")
      .update({
        name: displayName,
        display_name: displayName,
        avatar_type: input.avatarType,
        relationship_type: input.relationshipType,
        onboarding_completed: true,
      })
      .eq("id", session.user.id)
      .select()
      .single();

    if (error || !data) return false;
    setState((prev) => ({ ...prev, profile: data as Profile }));
    return true;
  }, [session]);

  const ensureWallet = useCallback(async (roomId: string) => {
    if (!supabase) return null;

    const { data: existing } = await supabase.from("room_wallets").select("*").eq("room_id", roomId).maybeSingle();
    if (existing) return existing as RoomWallet;

    const { data } = await supabase.from("room_wallets").insert({ room_id: roomId, coins: 0, total_earned: 0 }).select().single();
    return data as RoomWallet | null;
  }, []);

  const ensureEgg = useCallback(async (roomId: string, actorId: string | null) => {
    if (!supabase) return null;

    const { data: existing } = await supabase.from("eggs").select("*").eq("room_id", roomId).maybeSingle();
    if (existing) return existing as Egg;

    const startedAt = new Date();
    const { data, error } = await supabase
      .from("eggs")
      .insert({
        room_id: roomId,
        egg_type: "mystery_common",
        status: "hatching",
        hatch_progress: 0,
        hatch_started_at: startedAt.toISOString(),
        hatch_ready_at: null,
      })
      .select()
      .single();

    if (error) {
      const { data: fallback } = await supabase.from("eggs").select("*").eq("room_id", roomId).maybeSingle();
      return fallback as Egg | null;
    }

    if (data) await insertActivity(roomId, actorId, "egg_created", "A shared mystery egg appeared.");
    return data as Egg | null;
  }, [insertActivity]);

  const createHatchedPet = useCallback(async (roomId: string, petId?: string | null) => {
    if (!supabase) return null;

    if (petId) {
      const { data: existing } = await supabase.from("pets").select("*").eq("id", petId).maybeSingle();
      if (existing) return existing as Pet;
    }

    const { data } = await supabase
      .from("pets")
      .insert({
        room_id: roomId,
        pet_type: "cat",
        name: "Unnamed Pet",
        hunger: 80,
        thirst: 80,
        happiness: 80,
        energy: 80,
        cleanliness: 80,
        level: 1,
        xp: 0,
      })
      .select()
      .single();

    if (data) await insertActivity(roomId, null, "pet_created", "A new pet joined your little world.");
    return data as Pet | null;
  }, [insertActivity]);

  const hatchEgg = useCallback(async (egg: Egg, actorId: string | null) => {
    if (!supabase || egg.status === "hatched") return egg;

    const pet = await createHatchedPet(egg.room_id, egg.pet_id);
    const { data } = await supabase
      .from("eggs")
      .update({
        status: "hatched",
        hatch_progress: 100,
        hatched_at: new Date().toISOString(),
        pet_id: pet?.id ?? egg.pet_id,
      })
      .eq("id", egg.id)
      .select()
      .single();

    await insertActivity(egg.room_id, actorId, "egg_hatched", "The mystery egg hatched. Name your new friend.");
    setSelectedPetId(pet?.id ?? null);
    setState((prev) => ({
      ...prev,
      egg: data as Egg,
      pet: pet ?? prev.pet,
      pets: pet ? prependUniqueById(prev.pets, pet, 20) : prev.pets,
      selectedPetId: pet?.id ?? prev.selectedPetId,
      hatchCelebrated: true,
    }));
    return data as Egg;
  }, [createHatchedPet, insertActivity]);

  const ensureMissions = useCallback(async (roomId: string, hasPet: boolean) => {
    if (!supabase) return [] as Mission[];

    const today = isoDate(new Date());
    const { data: members } = await supabase.from("room_members").select("user_id").eq("room_id", roomId).order("created_at", { ascending: true });
    const memberIds = (members ?? []).map((member) => member.user_id).filter(Boolean);
    if (!memberIds.length) return [];

    const beforeHatch: Array<[MissionTaskType, number, number, number]> = [
      ["mood_check", 5, 0, 0],
      ["journal_entry", 5, 0, 0],
      ["truth_or_dare_played", 10, 0, 0],
    ];
    const afterHatch: Array<[MissionTaskType, number, number, number]> = [
      ["feed_pet", 10, 0, 5],
      ["drink_pet", 10, 0, 5],
      ["play_pet", 10, 0, 5],
      ["bath_pet", 10, 0, 5],
      ["journal_entry", 5, 0, 0],
    ];
    const desired = hasPet ? afterHatch : beforeHatch;

    const { data: existing } = await supabase.from("missions").select("*").eq("room_id", roomId).eq("date", today);
    const existingTasks = new Set((existing ?? []).map((mission) => mission.task_type));
    const rows = desired
      .filter(([taskType]) => !existingTasks.has(taskType))
      .map(([taskType, rewardCoins, rewardHatchProgress, rewardXp], index) => ({
        room_id: roomId,
        assigned_to: memberIds[index % memberIds.length],
        task_type: taskType,
        status: "pending",
        date: today,
        reward_coins: rewardCoins,
        reward_hatch_progress: rewardHatchProgress,
        reward_xp: rewardXp,
      }));

    if (rows.length) await supabase.from("missions").insert(rows);

    const { data } = await supabase.from("missions").select("*").eq("room_id", roomId).eq("date", today).order("created_at", { ascending: true });
    return (data ?? []) as Mission[];
  }, []);

  const addCoins = useCallback(async (roomId: string, amount: number, actorId: string | null, reason: string) => {
    if (!supabase || amount <= 0) return null;

    let data: RoomWallet | null = null;
    const { data: incremented, error } = await supabase.rpc("increment_room_wallet", { target_room_id: roomId, amount });

    if (!error && incremented) {
      data = Array.isArray(incremented) ? (incremented[0] as RoomWallet | undefined) ?? null : (incremented as RoomWallet);
    } else {
      const wallet = await ensureWallet(roomId);
      const result = await supabase
        .from("room_wallets")
        .update({
          coins: (wallet?.coins ?? 0) + amount,
          total_earned: (wallet?.total_earned ?? 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq("room_id", roomId)
        .select()
        .single();
      data = result.data as RoomWallet | null;
    }

    if (data) setState((prev) => ({ ...prev, wallet: data as RoomWallet }));
    await insertActivity(roomId, actorId, "coins_earned", `${reason} +${amount} coins`);
    return data as RoomWallet | null;
  }, [ensureWallet, insertActivity]);

  const addHatchProgress = useCallback(async (roomId: string, amount: number, actorId: string | null, reason: string, eggInput?: Egg | null) => {
    if (!supabase || amount <= 0) return null;

    const egg = eggInput ?? state.egg;
    if (!egg || egg.status === "hatched") return egg;

    const { data: currentData } = await supabase.from("eggs").select("*").eq("id", egg.id).maybeSingle();
    const currentEgg = (currentData as Egg | null) ?? egg;
    if (currentEgg.status === "hatched") return currentEgg;

    const nextProgress = Math.min(100, currentEgg.hatch_progress + amount);
    setState((prev) => (prev.egg?.id === currentEgg.id ? { ...prev, egg: { ...prev.egg, hatch_progress: nextProgress } } : prev));
    const { data } = await supabase.from("eggs").update({ hatch_progress: nextProgress }).eq("id", currentEgg.id).select().single();
    if (!data) return egg;
    const nextEgg = data as Egg;

    await insertActivity(roomId, actorId, "hatch_progress_added", `${reason} +${amount}% hatch progress`);
    if (nextProgress >= 100) return hatchEgg(nextEgg, actorId);

    setState((prev) => ({ ...prev, egg: nextEgg }));
    return nextEgg;
  }, [hatchEgg, insertActivity, state.egg]);

  const hasAwardedToday = useCallback(async (roomId: string, action: string) => {
    if (!supabase) return true;

    const { start, end } = dayRange(new Date());
    const { data } = await supabase
      .from("pet_activities")
      .select("id")
      .eq("room_id", roomId)
      .eq("action", action)
      .gte("created_at", start)
      .lt("created_at", end)
      .limit(1);

    return Boolean(data?.length);
  }, []);

  const maybeAwardJournalPairBonus = useCallback(async (roomId: string, actorId: string | null) => {
    if (!supabase || !state.egg || state.egg.status === "hatched") return;
    if (await hasAwardedToday(roomId, "journal_pair_bonus_awarded")) return;

    const { start, end } = dayRange(new Date());
    const { data: journals } = await supabase
      .from("journals")
      .select("author_id")
      .eq("room_id", roomId)
      .gte("created_at", start)
      .lt("created_at", end);
    const authorIds = new Set((journals ?? []).map((journal) => journal.author_id).filter(Boolean));
    if (authorIds.size < 2) return;

    await addHatchProgress(roomId, 15, actorId, "Both wrote journals today");
    await insertActivity(roomId, actorId, "journal_pair_bonus_awarded", "Both of you wrote today. The egg felt closer.");
  }, [addHatchProgress, hasAwardedToday, insertActivity, state.egg]);

  const maybeAwardCoupleSyncBonus = useCallback(async (roomId: string, actorId: string | null) => {
    if (!supabase || !state.egg || state.egg.status === "hatched") return;
    if (await hasAwardedToday(roomId, "couple_sync_bonus_awarded")) return;

    const today = isoDate(new Date());
    const { start, end } = dayRange(new Date());
    const [{ data: members }, { data: moods }, { data: journals }, { data: gameEvents }] = await Promise.all([
      supabase.from("room_members").select("user_id").eq("room_id", roomId),
      supabase.from("moods").select("user_id").eq("room_id", roomId).eq("mood_date", today),
      supabase.from("journals").select("author_id").eq("room_id", roomId).gte("created_at", start).lt("created_at", end),
      supabase.from("game_events").select("actor_id").eq("room_id", roomId).gte("created_at", start).lt("created_at", end),
    ]);

    const memberIds = new Set((members ?? []).map((member) => member.user_id).filter(Boolean));
    const activeIds = new Set<string>();
    (moods ?? []).forEach((mood) => {
      if (memberIds.has(mood.user_id)) activeIds.add(mood.user_id);
    });
    (journals ?? []).forEach((journal) => {
      if (memberIds.has(journal.author_id)) activeIds.add(journal.author_id);
    });
    (gameEvents ?? []).forEach((event) => {
      if (event.actor_id && memberIds.has(event.actor_id)) activeIds.add(event.actor_id);
    });

    if (activeIds.size < Math.min(2, memberIds.size)) return;

    await addHatchProgress(roomId, 20, actorId, "Couple sync bonus");
    await insertActivity(roomId, actorId, "couple_sync_bonus_awarded", "You both showed up today. The egg glowed brighter.");
  }, [addHatchProgress, hasAwardedToday, insertActivity, state.egg]);

  const maybeHatchByProgress = useCallback(async (egg: Egg | null, actorId: string | null) => {
    if (!egg || egg.status === "hatched") return egg;

    if (egg.hatch_progress >= 100) return hatchEgg(egg, actorId);
    return egg;
  }, [hatchEgg]);

  const loadState = useCallback(
    async (activeSession: Session | null = null, options: { showLoading?: boolean } = {}) => {
      const requestId = ++loadingRequestId.current;
      if (!supabase || !activeSession) {
        setState(initialState);
        setLoading(false);
        return;
      }

      if (options.showLoading) setLoading(true);
      const profile = await upsertProfile(activeSession.user);

      const { data: member } = await supabase.from("room_members").select("room_id").eq("user_id", activeSession.user.id).maybeSingle();

      if (!member?.room_id) {
        setState({ ...initialState, profile });
        if (requestId === loadingRequestId.current) setLoading(false);
        return;
      }

      const { data: members } = await supabase.from("room_members").select("user_id").eq("room_id", member.room_id);
      const memberCount = members?.length ?? 0;

      const [roomResult, walletResult, activitiesResult, moodsResult, journalsResult, gameEventsResult] = await Promise.all([
        supabase.from("rooms").select("*").eq("id", member.room_id).single(),
        ensureWallet(member.room_id),
        supabase.from("pet_activities").select("*").eq("room_id", member.room_id).order("created_at", { ascending: false }).limit(30),
        supabase.from("moods").select("*").eq("room_id", member.room_id).order("created_at", { ascending: false }).limit(10),
        supabase.from("journals").select("*").eq("room_id", member.room_id).order("created_at", { ascending: false }).limit(30),
        supabase.from("game_events").select("*").eq("room_id", member.room_id).order("created_at", { ascending: false }).limit(20),
      ]);

      const room = roomResult.data as Room | null;
      const partnerId = room?.owner_id === activeSession.user.id ? room.partner_id : room?.owner_id;
      let partner: Profile | null = null;
      if (partnerId) {
        const { data } = await supabase.from("profiles").select("*").eq("id", partnerId).maybeSingle();
        partner = data as Profile | null;
      }

      let egg: Egg | null = null;
      if (memberCount >= 2) egg = await ensureEgg(member.room_id, activeSession.user.id);
      egg = await maybeHatchByProgress(egg, activeSession.user.id);

      const { data: petRows } = await supabase.from("pets").select("*").eq("room_id", member.room_id).order("updated_at", { ascending: false });
      const pets = (petRows ?? []) as Pet[];
      const selectedPet = pets.find((item) => item.id === selectedPetId) ?? pets[0] ?? null;
      const missions = await ensureMissions(member.room_id, pets.length > 0);
      setSelectedPetId(selectedPet?.id ?? null);

      setState({
        profile,
        room,
        partner,
        egg,
        pet: selectedPet,
        pets,
        selectedPetId: selectedPet?.id ?? null,
        wallet: walletResult,
        activities: (activitiesResult.data ?? []) as Activity[],
        moods: (moodsResult.data ?? []) as Mood[],
        journals: (journalsResult.data ?? []) as Journal[],
        missions,
        gameEvents: (gameEventsResult.data ?? []) as GameEvent[],
        hatchCelebrated: false,
      });
      if (requestId === loadingRequestId.current) setLoading(false);
    },
    [ensureEgg, ensureMissions, ensureWallet, maybeHatchByProgress, selectedPetId, upsertProfile],
  );

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadState(data.session, { showLoading: true });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      loadState(nextSession, { showLoading: true });
    });

    return () => listener.subscription.unsubscribe();
  }, [loadState]);

  const completeMission = useCallback(async (taskType: MissionTaskType) => {
    if (!supabase || !session || !state.room || !state.profile) return;

    const today = isoDate(new Date());
    const mission = state.missions.find(
      (item) => item.task_type === taskType && item.status !== "completed" && item.date === today && (!item.assigned_to || item.assigned_to === state.profile?.id),
    );
    if (!mission) return;

    const { data } = await supabase
      .from("missions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", mission.id)
      .eq("status", "pending")
      .select()
      .maybeSingle();
    if (!data) return;

    setState((prev) => ({ ...prev, missions: prev.missions.map((item) => (item.id === mission.id ? (data as Mission) : item)) }));
    await addCoins(state.room.id, mission.reward_coins, state.profile.id, "Mission completed");
    await addHatchProgress(state.room.id, mission.reward_hatch_progress, state.profile.id, "Mission completed");

    if (mission.reward_xp && state.pet) {
      const next = applyPetXp(state.pet, mission.reward_xp);
      const { data: pet } = await supabase.from("pets").update(next).eq("id", state.pet.id).select().single();
      if (pet) {
        setState((prev) => ({
          ...prev,
          pet: pet as Pet,
          pets: prev.pets.map((item) => (item.id === (pet as Pet).id ? (pet as Pet) : item)),
        }));
      }
    }

    const petName = getPetDisplayName(state.pet?.name);
    await insertActivity(state.room.id, state.profile.id, "daily_mission_completed", `${state.profile.name ?? "Someone"} completed ${missionLabel(taskType, petName)} ✨`);
  }, [addCoins, addHatchProgress, insertActivity, session, state.missions, state.pet, state.profile, state.room]);

  const signIn = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: getOAuthRedirectUrl() } });
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setSelectedPetId(null);
    setState(initialState);
  }, []);

  const createRoom = useCallback(async () => {
    if (!supabase || !session) return { ok: false, message: "Sign in before creating a room." };

    const { data: existingMember } = await supabase.from("room_members").select("room_id").eq("user_id", session.user.id).maybeSingle();
    if (existingMember?.room_id) {
      await loadState(session);
      return { ok: true, message: "You already have a room." };
    }

    const inviteCode = crypto.randomUUID().slice(0, 6).toUpperCase();
    const { data: roomData, error } = await supabase.from("rooms").insert({ invite_code: inviteCode, owner_id: session.user.id }).select().single();
    if (error || !roomData) return { ok: false, message: "Could not create invite code. Try again." };

    const { error: memberError } = await supabase.from("room_members").insert({ room_id: roomData.id, user_id: session.user.id });
    if (memberError) return { ok: false, message: "Room was created, but membership failed. Refresh and try again." };
    await ensureWallet(roomData.id);
    await insertActivity(roomData.id, session.user.id, "room_created", "Room created. Invite someone to start your little world.");
    await loadState(session);
    return { ok: true, message: "Invite code created." };
  }, [ensureWallet, insertActivity, loadState, session]);

  const joinRoom = useCallback(async (inviteCode: string) => {
    if (!supabase || !session) return { ok: false, message: "Sign in before joining a room." };

    const code = inviteCode.trim().toUpperCase();
    if (!code) return { ok: false, message: "Enter an invite code first." };

    const { data: existingMember } = await supabase.from("room_members").select("room_id").eq("user_id", session.user.id).maybeSingle();
    if (existingMember?.room_id) {
      await loadState(session);
      return { ok: true, message: "You already have a room." };
    }

    const { data: roomData } = await supabase.from("rooms").select("*").eq("invite_code", code).maybeSingle();
    if (!roomData) return { ok: false, message: "Invite code not found." };
    if (roomData.owner_id === session.user.id) return { ok: false, message: "You cannot join your own invite code." };
    if (roomData.partner_id) return { ok: false, message: "This room is already full." };

    const { data: joinedRoom, error: joinError } = await supabase
      .from("rooms")
      .update({ partner_id: session.user.id })
      .eq("id", roomData.id)
      .is("partner_id", null)
      .select()
      .maybeSingle();
    if (joinError || !joinedRoom) return { ok: false, message: "Someone already joined this room. Ask for a new code." };

    const { error: memberError } = await supabase.from("room_members").insert({ room_id: roomData.id, user_id: session.user.id });
    if (memberError) return { ok: false, message: "Could not join room membership. Try again." };
    await ensureWallet(roomData.id);
    await insertActivity(roomData.id, session.user.id, "user_joined_room", "A partner joined the room 💙");
    const egg = await ensureEgg(roomData.id, session.user.id);
    await addHatchProgress(roomData.id, 15, session.user.id, "Partner joined", egg);
    await loadState(session);
    return { ok: true, message: "Joined room." };
  }, [addHatchProgress, ensureEgg, ensureWallet, insertActivity, loadState, session]);

  const doPetAction = useCallback(async (action: PetAction) => {
    if (!supabase || !session || !state.room || !state.pet || !state.profile) return;

    const nextPet = applyPetAction(state.pet, action);
    const meta = petActions[action];
    const { data } = await supabase
      .from("pets")
      .update({
        hunger: nextPet.hunger,
        thirst: nextPet.thirst,
        cleanliness: nextPet.cleanliness,
        energy: nextPet.energy,
        happiness: nextPet.happiness,
        level: nextPet.level,
        xp: nextPet.xp,
        updated_at: nextPet.updated_at,
      })
      .eq("id", nextPet.id)
      .select()
      .single();

    if (!data) return;

    setState((prev) => ({
      ...prev,
      pet: data as Pet,
      pets: prev.pets.map((item) => (item.id === (data as Pet).id ? (data as Pet) : item)),
    }));
    await insertActivity(state.room.id, state.profile.id, meta.activity, `${state.profile.name ?? "Someone"} ${meta.messageVerb} ${getPetDisplayName(state.pet.name)} ${meta.icon}`);
    await addCoins(state.room.id, 5, state.profile.id, "Care action");

    const missionType = actionMissionMap[action];
    if (missionType) await completeMission(missionType);
  }, [addCoins, completeMission, insertActivity, session, state.pet, state.profile, state.room]);

  const updateMood = useCallback(async (mood: string) => {
    if (!supabase || !session || !state.room || !state.profile) return;

    const today = isoDate(new Date());
    const alreadyUpdatedToday = state.moods.some((item) => item.user_id === state.profile?.id && item.mood_date === today);
    if (alreadyUpdatedToday) return;

    const { data } = await supabase.from("moods").insert({ room_id: state.room.id, user_id: state.profile.id, mood, mood_date: today }).select().single();
    if (!data) return;

    setState((prev) => ({ ...prev, moods: [data as Mood, ...prev.moods] }));
    await insertActivity(state.room.id, state.profile.id, "mood_checked", `${state.profile.name ?? "Someone"} checked in: ${mood}`);
    await addCoins(state.room.id, 5, state.profile.id, "Mood check");
    await addHatchProgress(state.room.id, 8, state.profile.id, "Mood check");
    await maybeAwardCoupleSyncBonus(state.room.id, state.profile.id);
    await completeMission("mood_check");
  }, [addCoins, addHatchProgress, completeMission, insertActivity, maybeAwardCoupleSyncBonus, session, state.moods, state.profile, state.room]);

  const addJournal = useCallback(async (content: string) => {
    if (!supabase || !session || !state.room || !state.profile || !content.trim()) return false;

    const { data } = await supabase.from("journals").insert({ room_id: state.room.id, author_id: state.profile.id, content: content.trim() }).select().single();
    if (!data) return false;

    setState((prev) => ({ ...prev, journals: prependUniqueById(prev.journals, data as Journal, 30) }));
    await insertActivity(state.room.id, state.profile.id, "journal_created", `${state.profile.name ?? "Someone"} wrote a journal note`);
    await addCoins(state.room.id, 5, state.profile.id, "Journal entry");
    await addHatchProgress(state.room.id, 10, state.profile.id, "Journal entry");
    await maybeAwardJournalPairBonus(state.room.id, state.profile.id);
    await maybeAwardCoupleSyncBonus(state.room.id, state.profile.id);
    await completeMission("journal_entry");
    return true;
  }, [addCoins, addHatchProgress, completeMission, insertActivity, maybeAwardCoupleSyncBonus, maybeAwardJournalPairBonus, session, state.profile, state.room]);

  const playTruthOrDare = useCallback(async (prompt: string) => {
    if (!supabase || !session || !state.room || !state.profile) return;

    const { data } = await supabase
      .from("game_events")
      .insert({ room_id: state.room.id, actor_id: state.profile.id, game_type: "truth_or_dare", result: prompt })
      .select()
      .single();

    if (data) setState((prev) => ({ ...prev, gameEvents: prependUniqueById(prev.gameEvents, data as GameEvent, 20) }));
    await insertActivity(state.room.id, state.profile.id, "truth_or_dare_played", `${state.profile.name ?? "Someone"} played Truth or Dare 🎲`);
    await addCoins(state.room.id, 10, state.profile.id, "Truth or Dare");
    await addHatchProgress(state.room.id, 15, state.profile.id, "Truth or Dare");
    await maybeAwardCoupleSyncBonus(state.room.id, state.profile.id);
    await completeMission("truth_or_dare_played");
  }, [addCoins, addHatchProgress, completeMission, insertActivity, maybeAwardCoupleSyncBonus, session, state.profile, state.room]);

  const completeCoupleQuiz = useCallback(async (sessionId: string, playerOneScore: number, playerTwoScore: number) => {
    if (!supabase || !session || !state.room || !state.profile) return false;

    const { data: quizSession } = await supabase
      .from("quiz_sessions")
      .select("id, player_one_id, player_two_id, reward_claimed")
      .eq("id", sessionId)
      .eq("room_id", state.room.id)
      .maybeSingle();
    if (!quizSession || quizSession.reward_claimed) return false;

    const { data: answerRows } = await supabase.from("quiz_answers").select("*").eq("session_id", sessionId).eq("room_id", state.room.id);
    const quizAnswers = (answerRows ?? []) as QuizAnswer[];
    const freshPlayerOneScore = quizAnswers
      .filter((answer) => answer.user_id === quizSession.player_one_id)
      .reduce((total, answer) => total + answer.score, 0);
    const freshPlayerTwoScore = quizAnswers
      .filter((answer) => answer.user_id === quizSession.player_two_id)
      .reduce((total, answer) => total + answer.score, 0);
    const finalPlayerOneScore = freshPlayerOneScore || playerOneScore;
    const finalPlayerTwoScore = freshPlayerTwoScore || playerTwoScore;
    const totalScore = Math.max(0, finalPlayerOneScore + finalPlayerTwoScore);
    const maxScore = 3000;
    const boost = 10 + Math.round(Math.min(1, totalScore / maxScore) * 20);
    const { data: claimed } = await supabase
      .from("quiz_sessions")
      .update({ reward_claimed: true, updated_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("room_id", state.room.id)
      .eq("reward_claimed", false)
      .select()
      .maybeSingle();

    if (!claimed) return false;

    await supabase
      .from("game_events")
      .insert({
        room_id: state.room.id,
        actor_id: state.profile.id,
        game_type: "couple_quiz",
        result: `Score ${finalPlayerOneScore}-${finalPlayerTwoScore}`,
      });

    if (state.egg && state.egg.status !== "hatched") {
      await addHatchProgress(state.room.id, boost, state.profile.id, "Couple Quiz");
      await insertActivity(state.room.id, state.profile.id, "couple_quiz_completed", `Couple Quiz made the egg glow brighter +${boost}%`);
      return true;
    }

    if (state.pet) {
      const nextXp = state.pet.xp + boost;
      const leveled = nextXp >= 100;
      const nextPet = {
        happiness: clamp(state.pet.happiness + Math.round(boost / 2)),
        xp: leveled ? nextXp - 100 : nextXp,
        level: leveled ? state.pet.level + 1 : state.pet.level,
        updated_at: new Date().toISOString(),
      };
      const { data: pet } = await supabase.from("pets").update(nextPet).eq("id", state.pet.id).select().single();
      if (pet) {
        setState((prev) => ({
          ...prev,
          pet: pet as Pet,
          pets: prev.pets.map((item) => (item.id === (pet as Pet).id ? (pet as Pet) : item)),
        }));
      }
      await insertActivity(state.room.id, state.profile.id, "couple_quiz_completed", `Couple Quiz boosted ${getPetDisplayName(state.pet.name)}'s happiness and XP`);
      return true;
    }

    await insertActivity(state.room.id, state.profile.id, "couple_quiz_completed", "Couple Quiz finished. You learned a little more together.");
    return true;
  }, [addHatchProgress, insertActivity, session, state.egg, state.pet, state.profile, state.room]);

  const buyShopItem = useCallback(async (itemId: string) => {
    if (!supabase || !session || !state.room || !state.profile || !state.pet || !state.wallet) return false;

    const item = getShopItem(itemId);
    if (!item || state.wallet.coins < item.price) return false;

    const next = applyShopEffect(state.pet, item.effect);
    const { data: wallet } = await supabase
      .from("room_wallets")
      .update({ coins: state.wallet.coins - item.price, updated_at: new Date().toISOString() })
      .eq("room_id", state.room.id)
      .select()
      .single();
    const { data: pet } = await supabase.from("pets").update(next).eq("id", state.pet.id).select().single();

    if (wallet) setState((prev) => ({ ...prev, wallet: wallet as RoomWallet }));
    if (pet) {
      setState((prev) => ({
        ...prev,
        pet: pet as Pet,
        pets: prev.pets.map((item) => (item.id === (pet as Pet).id ? (pet as Pet) : item)),
      }));
    }
    await insertActivity(state.room.id, state.profile.id, "shop_item_bought", `${state.profile.name ?? "Someone"} bought ${item.name} for ${getPetDisplayName(state.pet.name)}`);
    return true;
  }, [insertActivity, session, state.pet, state.profile, state.room, state.wallet]);

  const renamePet = useCallback(async (name: string) => {
    if (!supabase || !session || !state.room || !state.profile || !state.pet) return false;

    const petName = getPetDisplayName(name);
    const { data } = await supabase.from("pets").update({ name: petName, updated_at: new Date().toISOString() }).eq("id", state.pet.id).select().single();
    if (!data) return false;

    setState((prev) => ({
      ...prev,
      pet: data as Pet,
      pets: prev.pets.map((item) => (item.id === (data as Pet).id ? (data as Pet) : item)),
      hatchCelebrated: false,
    }));
    await insertActivity(state.room.id, state.profile.id, "pet_named", `${state.profile.name ?? "Someone"} named your pet ${petName}`);
    return true;
  }, [insertActivity, session, state.pet, state.profile, state.room]);

  const selectPet = useCallback((petId: string) => {
    setSelectedPetId(petId);
    setState((prev) => {
      const pet = prev.pets.find((item) => item.id === petId) ?? prev.pet;
      return { ...prev, pet, selectedPetId: pet?.id ?? null };
    });
  }, []);

  const value = useMemo<PetwoContextValue>(
    () => ({
      ...state,
      loading,
      session,
      signIn,
      signOut,
      createRoom,
      joinRoom,
      doPetAction,
      updateMood,
      addJournal,
      playTruthOrDare,
      completeCoupleQuiz,
      buyShopItem,
      renamePet,
      selectPet,
      completeOnboarding,
      refresh: () => loadState(session),
    }),
    [loading, session, state, signIn, signOut, createRoom, joinRoom, doPetAction, updateMood, addJournal, playTruthOrDare, completeCoupleQuiz, buyShopItem, renamePet, selectPet, completeOnboarding, loadState],
  );

  if (!isSupabaseConfigured) return <SetupErrorScreen />;
  return <PetwoContext.Provider value={value}>{children}</PetwoContext.Provider>;
}

function applyPetXp(pet: Pet, amount: number) {
  const xp = pet.xp + amount;
  const leveled = xp >= 100;
  return {
    xp: leveled ? xp - 100 : xp,
    level: leveled ? pet.level + 1 : pet.level,
    updated_at: new Date().toISOString(),
  };
}

function applyShopEffect(pet: Pet, effect: Partial<Pick<Pet, "hunger" | "thirst" | "happiness" | "energy" | "xp">>) {
  const xp = pet.xp + (effect.xp ?? 0);
  const leveled = xp >= 100;
  return {
    hunger: clamp(pet.hunger + (effect.hunger ?? 0)),
    thirst: clamp(pet.thirst + (effect.thirst ?? 0)),
    happiness: clamp(pet.happiness + (effect.happiness ?? 0)),
    energy: clamp(pet.energy + (effect.energy ?? 0)),
    xp: leveled ? xp - 100 : xp,
    level: leveled ? pet.level + 1 : pet.level,
    updated_at: new Date().toISOString(),
  };
}

export function usePetwo() {
  const context = useContext(PetwoContext);
  if (!context) throw new Error("usePetwo must be used inside PetwoProvider");
  return context;
}

function SetupErrorScreen() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <section className="glass-card w-full max-w-lg rounded-2xl p-6">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary-container text-2xl">⚙️</div>
        <h1 className="font-headline text-2xl font-bold text-primary">Supabase setup required</h1>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          Petwo requires a real Supabase project. Add the public Supabase URL and anon key, then restart the dev server.
        </p>
        <div className="mt-4 rounded-xl bg-white/55 p-4 text-sm">
          <p className="font-bold text-on-surface">Missing one or both values:</p>
          <code className="mt-2 block text-primary">NEXT_PUBLIC_SUPABASE_URL</code>
          <code className="mt-1 block text-primary">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
        </div>
      </section>
    </main>
  );
}
