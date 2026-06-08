"use client";

import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { applyPetAction, clamp, petActions, type PetAction } from "@/lib/pet-actions";
import { getShopItem } from "@/lib/shop";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Activity, AppState, Egg, GameEvent, Journal, Mission, MissionTaskType, Mood, Pet, Profile, Room, RoomWallet } from "@/lib/types";

export type OnboardingInput = {
  displayName: string;
  avatarType: string;
  relationshipType: string;
};

type PetwoContextValue = AppState & {
  loading: boolean;
  session: Session | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  createRoom: () => Promise<void>;
  joinRoom: (inviteCode: string) => Promise<void>;
  doPetAction: (action: PetAction) => Promise<void>;
  updateMood: (mood: string) => Promise<void>;
  addJournal: (content: string) => Promise<void>;
  playTruthOrDare: (prompt: string) => Promise<void>;
  buyShopItem: (itemId: string) => Promise<boolean>;
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
  wallet: null,
  activities: [],
  moods: [],
  journals: [],
  missions: [],
  gameEvents: [],
  hatchCelebrated: false,
};

const missionLabels: Record<MissionTaskType, string> = {
  mood_check: "Check mood",
  journal_entry: "Write journal",
  truth_or_dare_played: "Play Truth or Dare",
  feed_pet: "Feed Moci",
  drink_pet: "Give Moci a drink",
  play_pet: "Play with Moci",
  bath_pet: "Bath Moci",
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

function addHours(value: Date, hours: number) {
  return new Date(value.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function PetwoProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<AppState>(initialState);
  const [loading, setLoading] = useState(isSupabaseConfigured);

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
    const { data } = await supabase
      .from("eggs")
      .insert({
        room_id: roomId,
        egg_type: "mystery_common",
        status: "hatching",
        hatch_progress: 0,
        hatch_started_at: startedAt.toISOString(),
        hatch_ready_at: addHours(startedAt, 1),
      })
      .select()
      .single();

    if (data) await insertActivity(roomId, actorId, "egg_created", "A shared mystery egg appeared 🥚");
    return data as Egg | null;
  }, [insertActivity]);

  const createHatchedPet = useCallback(async (roomId: string) => {
    if (!supabase) return null;

    const { data: existing } = await supabase.from("pets").select("*").eq("room_id", roomId).maybeSingle();
    if (existing) return existing as Pet;

    // TODO: Replace fixed MVP result with rarity-based random hatch results.
    const { data } = await supabase
      .from("pets")
      .insert({
        room_id: roomId,
        pet_type: "cat",
        name: "Moci",
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

    if (data) await insertActivity(roomId, null, "pet_created", "Moci joined your little world 🐱");
    return data as Pet | null;
  }, [insertActivity]);

  const hatchEgg = useCallback(async (egg: Egg, actorId: string | null) => {
    if (!supabase || egg.status === "hatched") return egg;

    const pet = await createHatchedPet(egg.room_id);
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

    await insertActivity(egg.room_id, actorId, "egg_hatched", "The mystery egg hatched into Moci 🎉");
    setState((prev) => ({ ...prev, egg: data as Egg, pet: pet ?? prev.pet, hatchCelebrated: true }));
    return data as Egg;
  }, [createHatchedPet, insertActivity]);

  const ensureMissions = useCallback(async (roomId: string, hasPet: boolean) => {
    if (!supabase) return [] as Mission[];

    const today = isoDate(new Date());
    const { data: members } = await supabase.from("room_members").select("user_id").eq("room_id", roomId).order("created_at", { ascending: true });
    const memberIds = (members ?? []).map((member) => member.user_id).filter(Boolean);
    if (!memberIds.length) return [];

    const beforeHatch: Array<[MissionTaskType, number, number, number]> = [
      ["mood_check", 5, 5, 0],
      ["journal_entry", 5, 5, 0],
      ["truth_or_dare_played", 10, 10, 0],
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

    const wallet = await ensureWallet(roomId);
    const { data } = await supabase
      .from("room_wallets")
      .update({
        coins: (wallet?.coins ?? 0) + amount,
        total_earned: (wallet?.total_earned ?? 0) + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("room_id", roomId)
      .select()
      .single();

    await insertActivity(roomId, actorId, "coins_earned", `${reason} +${amount} coins`);
    if (data) setState((prev) => ({ ...prev, wallet: data as RoomWallet }));
    return data as RoomWallet | null;
  }, [ensureWallet, insertActivity]);

  const addHatchProgress = useCallback(async (roomId: string, amount: number, actorId: string | null, reason: string, eggInput?: Egg | null) => {
    if (!supabase || amount <= 0) return null;

    const egg = eggInput ?? state.egg;
    if (!egg || egg.status === "hatched") return egg;

    const nextProgress = Math.min(100, egg.hatch_progress + amount);
    const { data } = await supabase.from("eggs").update({ hatch_progress: nextProgress }).eq("id", egg.id).select().single();
    const nextEgg = data as Egg;

    await insertActivity(roomId, actorId, "hatch_progress_added", `${reason} +${amount}% hatch progress`);
    if (nextProgress >= 100) return hatchEgg(nextEgg, actorId);

    setState((prev) => ({ ...prev, egg: nextEgg }));
    return nextEgg;
  }, [hatchEgg, insertActivity, state.egg]);

  const maybeAutoHatch = useCallback(async (egg: Egg | null, actorId: string | null) => {
    if (!egg || egg.status === "hatched") return egg;

    const readyAt = egg.hatch_ready_at ? new Date(egg.hatch_ready_at).getTime() : Infinity;
    if (egg.hatch_progress >= 100 || readyAt <= Date.now()) return hatchEgg(egg, actorId);
    return egg;
  }, [hatchEgg]);

  const loadState = useCallback(
    async (activeSession: Session | null = null) => {
      if (!supabase || !activeSession) {
        setState(initialState);
        setLoading(false);
        return;
      }

      setLoading(true);
      const profile = await upsertProfile(activeSession.user);

      const { data: member } = await supabase.from("room_members").select("room_id").eq("user_id", activeSession.user.id).maybeSingle();

      if (!member?.room_id) {
        setState({ ...initialState, profile });
        setLoading(false);
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
      egg = await maybeAutoHatch(egg, activeSession.user.id);

      const { data: petData } = await supabase.from("pets").select("*").eq("room_id", member.room_id).maybeSingle();
      const pet = petData as Pet | null;
      const missions = await ensureMissions(member.room_id, Boolean(pet));

      setState({
        profile,
        room,
        partner,
        egg,
        pet,
        wallet: walletResult,
        activities: (activitiesResult.data ?? []) as Activity[],
        moods: (moodsResult.data ?? []) as Mood[],
        journals: (journalsResult.data ?? []) as Journal[],
        missions,
        gameEvents: (gameEventsResult.data ?? []) as GameEvent[],
        hatchCelebrated: false,
      });
      setLoading(false);
    },
    [ensureEgg, ensureMissions, ensureWallet, maybeAutoHatch, upsertProfile],
  );

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadState(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      loadState(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, [loadState]);

  useEffect(() => {
    if (!supabase || !state.room?.id) return;
    const roomId = state.room.id;
    const client = supabase;

    const channel = client
      .channel(`room:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, () => loadState(session))
      .on("postgres_changes", { event: "*", schema: "public", table: "eggs", filter: `room_id=eq.${roomId}` }, () => loadState(session))
      .on("postgres_changes", { event: "*", schema: "public", table: "pets", filter: `room_id=eq.${roomId}` }, () => loadState(session))
      .on("postgres_changes", { event: "*", schema: "public", table: "room_wallets", filter: `room_id=eq.${roomId}` }, () => loadState(session))
      .on("postgres_changes", { event: "*", schema: "public", table: "missions", filter: `room_id=eq.${roomId}` }, () => loadState(session))
      .on("postgres_changes", { event: "*", schema: "public", table: "pet_activities", filter: `room_id=eq.${roomId}` }, () => loadState(session))
      .on("postgres_changes", { event: "*", schema: "public", table: "moods", filter: `room_id=eq.${roomId}` }, () => loadState(session))
      .on("postgres_changes", { event: "*", schema: "public", table: "journals", filter: `room_id=eq.${roomId}` }, () => loadState(session))
      .on("postgres_changes", { event: "*", schema: "public", table: "game_events", filter: `room_id=eq.${roomId}` }, () => loadState(session))
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [loadState, session, state.room?.id]);

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
      .select()
      .single();
    if (!data) return;

    setState((prev) => ({ ...prev, missions: prev.missions.map((item) => (item.id === mission.id ? (data as Mission) : item)) }));
    await addCoins(state.room.id, mission.reward_coins, state.profile.id, "Mission completed");
    await addHatchProgress(state.room.id, mission.reward_hatch_progress, state.profile.id, "Mission completed");

    if (mission.reward_xp && state.pet) {
      const next = applyPetXp(state.pet, mission.reward_xp);
      const { data: pet } = await supabase.from("pets").update(next).eq("id", state.pet.id).select().single();
      if (pet) setState((prev) => ({ ...prev, pet: pet as Pet }));
    }

    await insertActivity(state.room.id, state.profile.id, "daily_mission_completed", `${state.profile.name ?? "Someone"} completed ${missionLabels[taskType]} ✨`);
  }, [addCoins, addHatchProgress, insertActivity, session, state.missions, state.pet, state.profile, state.room]);

  const signIn = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/onboarding` } });
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setState(initialState);
  }, []);

  const createRoom = useCallback(async () => {
    if (!supabase || !session) return;

    const inviteCode = crypto.randomUUID().slice(0, 6).toUpperCase();
    const { data: roomData, error } = await supabase.from("rooms").insert({ invite_code: inviteCode, owner_id: session.user.id }).select().single();
    if (error || !roomData) return;

    await supabase.from("room_members").insert({ room_id: roomData.id, user_id: session.user.id });
    await ensureWallet(roomData.id);
    await insertActivity(roomData.id, session.user.id, "room_created", "Room created. Invite someone to start your little world.");
    await loadState(session);
  }, [ensureWallet, insertActivity, loadState, session]);

  const joinRoom = useCallback(async (inviteCode: string) => {
    if (!supabase || !session) return;

    const code = inviteCode.trim().toUpperCase();
    const { data: roomData } = await supabase.from("rooms").select("*").eq("invite_code", code).maybeSingle();
    if (!roomData || roomData.owner_id === session.user.id || roomData.partner_id) return;

    await supabase.from("rooms").update({ partner_id: session.user.id }).eq("id", roomData.id);
    await supabase.from("room_members").insert({ room_id: roomData.id, user_id: session.user.id });
    await ensureWallet(roomData.id);
    await ensureEgg(roomData.id, session.user.id);
    await insertActivity(roomData.id, session.user.id, "user_joined_room", "A partner joined the room 💙");
    await loadState(session);
  }, [ensureEgg, ensureWallet, insertActivity, loadState, session]);

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

    setState((prev) => ({ ...prev, pet: data as Pet }));
    await insertActivity(state.room.id, state.profile.id, meta.activity, `${state.profile.name ?? "Someone"} ${meta.messageVerb} ${state.pet.name} ${meta.icon}`);
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
    await addHatchProgress(state.room.id, 5, state.profile.id, "Mood check");
    await completeMission("mood_check");
  }, [addCoins, addHatchProgress, completeMission, insertActivity, session, state.moods, state.profile, state.room]);

  const addJournal = useCallback(async (content: string) => {
    if (!supabase || !session || !state.room || !state.profile || !content.trim()) return;

    const { data } = await supabase.from("journals").insert({ room_id: state.room.id, author_id: state.profile.id, content: content.trim() }).select().single();
    if (!data) return;

    setState((prev) => ({ ...prev, journals: prependUniqueById(prev.journals, data as Journal, 30) }));
    await insertActivity(state.room.id, state.profile.id, "journal_created", `${state.profile.name ?? "Someone"} wrote a journal note`);
    await addCoins(state.room.id, 5, state.profile.id, "Journal entry");
    await addHatchProgress(state.room.id, 5, state.profile.id, "Journal entry");
    await completeMission("journal_entry");
  }, [addCoins, addHatchProgress, completeMission, insertActivity, session, state.profile, state.room]);

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
    await addHatchProgress(state.room.id, 10, state.profile.id, "Truth or Dare");
    await completeMission("truth_or_dare_played");
  }, [addCoins, addHatchProgress, completeMission, insertActivity, session, state.profile, state.room]);

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
    if (pet) setState((prev) => ({ ...prev, pet: pet as Pet }));
    await insertActivity(state.room.id, state.profile.id, "shop_item_bought", `${state.profile.name ?? "Someone"} bought ${item.name} for ${state.pet.name}`);
    return true;
  }, [insertActivity, session, state.pet, state.profile, state.room, state.wallet]);

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
      buyShopItem,
      completeOnboarding,
      refresh: () => loadState(session),
    }),
    [loading, session, state, signIn, signOut, createRoom, joinRoom, doPetAction, updateMood, addJournal, playTruthOrDare, buyShopItem, completeOnboarding, loadState],
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
