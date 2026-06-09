"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Coins, Copy, Egg, PawPrint, Send, ShoppingBag, Sparkles } from "lucide-react";
import { EggDisplay } from "@/components/egg-display";
import { PetDisplay } from "@/components/pet-display";
import { PageTitle, StatBar, formatTime } from "@/components/ui";
import { usePetwo } from "@/components/petwo-provider";
import { getPetDisplayName } from "@/lib/pet-assets";
import type { MissionTaskType } from "@/lib/types";

const moods = ["😊 Happy", "😌 Chill", "😴 Tired", "😔 Sad", "😤 Stressed"];

export default function DashboardPage() {
  const {
    profile,
    partner,
    pet,
    pets,
    egg,
    room,
    wallet,
    missions,
    moods: moodRows,
    activities,
    hatchCelebrated,
    updateMood,
    createRoom,
    joinRoom,
    session,
  } = usePetwo();
  const [inviteCode, setInviteCode] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const myMoodToday = moodRows.find((item) => item.user_id === profile?.id && item.mood_date === today);
  const myMissions = useMemo(
    () => missions.filter((mission) => mission.date === today && (!mission.assigned_to || mission.assigned_to === profile?.id)),
    [missions, profile?.id, today],
  );
  const hatchPercent = egg?.status === "hatched" ? 100 : egg?.hatch_progress ?? 0;
  const petName = getPetDisplayName(pet?.name);
  const hatchMessage = hatchProgressMessage(hatchPercent);

  async function submitJoin(event: FormEvent) {
    event.preventDefault();
    await joinRoom(inviteCode);
    setInviteCode("");
  }

  if (!room) {
    return (
      <div className="space-y-5">
        <PageTitle title={`Hi, ${profile?.display_name ?? profile?.name ?? "Friend"}`} subtitle="Invite someone to start your little world." />
        <section className="glass-card rounded-2xl p-5">
          <div className="grid place-items-center rounded-2xl bg-primary-container/65 p-6 text-center">
            <Egg className="text-primary" size={44} />
            <h2 className="mt-4 font-headline text-2xl font-bold text-primary">Start with a mystery egg</h2>
            <p className="mt-2 text-sm leading-6 text-on-primary-container/80">Connect with someone first. Your shared egg appears when both of you are in the room.</p>
          </div>
          <div className="mt-4 grid gap-3">
            <button className="primary-button flex items-center justify-center gap-2" onClick={createRoom} disabled={!session}>
              <Send size={17} />
              Create Invite Code
            </button>
            <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={submitJoin}>
              <input className="field uppercase" placeholder="Invite code" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} disabled={!session} />
              <button className="soft-button px-5" disabled={!session || !inviteCode.trim()}>
                Join With Code
              </button>
            </form>
          </div>
        </section>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="space-y-5">
        <PageTitle title="Waiting for your person" subtitle="Share this invite code to start your little world." />
        <section className="rounded-2xl border border-white/60 bg-primary-container/80 p-5 shadow-cloud">
          <p className="text-xs font-bold uppercase tracking-wider text-primary/80">Invite code</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <code className="font-headline text-4xl font-bold text-primary">{room.invite_code}</code>
            <button className="soft-button px-3 py-2" onClick={() => navigator.clipboard?.writeText(room.invite_code)} aria-label="Copy invite code">
              <Copy size={17} />
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageTitle title={pet ? `${petName}'s little world` : "Mystery Egg"} subtitle={`Shared with ${partner.name ?? "your partner"}`} />

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/50 bg-primary-container/80 p-5 shadow-cloud">
          <p className="text-xs font-bold uppercase tracking-wider text-primary/80">Room coins</p>
          <h2 className="mt-2 flex items-center gap-2 font-headline text-4xl font-bold text-primary">
            <Coins size={30} />
            {wallet?.coins ?? 0}
          </h2>
          <p className="mt-1 text-sm text-on-primary-container/80">Total earned {wallet?.total_earned ?? 0}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Partner</p>
          <h2 className="mt-2 font-headline text-2xl font-bold text-primary">{partner.name ?? "Partner"}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Invite code {room.invite_code}</p>
        </div>
      </section>

      {!pet ? (
        <section className="glass-card rounded-2xl p-5">
          <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="h-36 w-36">
              <EggDisplay progress={hatchPercent} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Hatch bond</p>
              <h2 className="mt-1 font-headline text-3xl font-bold text-primary">Play together to hatch faster.</h2>
              <p className="mt-2 text-sm text-on-surface-variant">{hatchMessage}</p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/70">
                <div className="h-full rounded-full bg-primary" style={{ width: `${hatchPercent}%` }} />
              </div>
              <p className="mt-2 text-xs font-bold text-primary">{hatchPercent}% bond energy</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link className="soft-button text-center" href="/games">Play games</Link>
            <Link className="soft-button text-center" href="/journal">Write journal</Link>
          </div>
        </section>
      ) : (
        <section className="glass-card rounded-2xl p-5">
          {hatchCelebrated ? <p className="mb-3 rounded-xl bg-primary-container px-3 py-2 text-sm font-bold text-primary">The egg hatched. Name your new friend.</p> : null}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="mb-2 h-24 w-24">
                <PetDisplay name={petName} />
              </div>
              <h2 className="font-headline text-3xl font-bold text-primary">{petName}</h2>
              <p className="text-sm text-on-surface-variant">Level {pet.level} · {pet.xp}% XP</p>
            </div>
            <div className="flex gap-2">
              <Link className="soft-button px-3 py-2" href="/shop" aria-label="Shop"><ShoppingBag size={17} /></Link>
              <Link className="soft-button flex items-center gap-2 px-3 py-2" href="/pet"><PawPrint size={17} />Care</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatBar icon="🍖" label="Hunger" value={pet.hunger} />
            <StatBar icon="🥛" label="Thirst" value={pet.thirst} />
            <StatBar icon="⚡" label="Energy" value={pet.energy} />
            <StatBar icon="🫧" label="Clean" value={pet.cleanliness} />
          </div>
        </section>
      )}

      {pets.length > 1 ? (
        <section className="glass-card rounded-2xl p-5">
          <h2 className="mb-3 font-headline text-xl font-bold text-primary">Pet Family</h2>
          <div className="grid grid-cols-2 gap-3">
            {pets.slice(0, 4).map((item) => {
              const itemName = getPetDisplayName(item.name);
              return (
                <div key={item.id} className="rounded-xl bg-white/50 p-3">
                  <div className="h-20 w-20">
                    <PetDisplay name={itemName} />
                  </div>
                  <p className="mt-2 truncate text-sm font-bold text-primary">{itemName}</p>
                  <p className="text-xs font-semibold text-on-surface-variant">Level {item.level}</p>
                </div>
              );
            })}
          </div>
          {pets.length > 4 ? <p className="mt-3 text-xs font-bold text-on-surface-variant">+{pets.length - 4} more pets in the room.</p> : null}
        </section>
      ) : null}

      <section className="glass-card rounded-2xl p-5">
        <h2 className="mb-3 font-headline text-xl font-bold text-primary">Daily missions</h2>
        <div className="grid gap-2">
          {myMissions.map((mission) => {
            const copy = missionCopy(mission.task_type, petName);
            const done = mission.status === "completed";
            return (
              <div key={mission.id} className={`flex items-center justify-between rounded-xl px-3 py-3 ${done ? "bg-primary-container/60 text-primary" : "bg-white/50"}`}>
                <span className="flex items-center gap-2 text-sm font-bold"><span>{copy.icon}</span>{copy.label}</span>
                {done ? <CheckCircle2 size={18} /> : <span className="text-xs font-bold text-on-surface-variant">+{mission.reward_coins} coins</span>}
              </div>
            );
          })}
          {!myMissions.length ? <p className="rounded-xl bg-white/45 p-3 text-sm font-semibold text-on-surface-variant">Fetching today’s missions...</p> : null}
        </div>
      </section>

      <section className="glass-card rounded-2xl p-5">
        <h2 className="mb-3 font-headline text-xl font-bold text-primary">Mood check</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {moods.map((mood) => (
            <button key={mood} className="soft-button px-2 py-2 text-xs" onClick={() => updateMood(mood)} disabled={Boolean(myMoodToday)}>
              {mood}
            </button>
          ))}
        </div>
        {myMoodToday ? <p className="mt-3 text-xs font-semibold text-on-surface-variant">Mood today: {myMoodToday.mood}</p> : null}
      </section>

      <section className="glass-card rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-headline text-xl font-bold text-primary">Activity feed</h2>
          <Sparkles size={18} className="text-primary" />
        </div>
        <div className="space-y-3">
          {activities.slice(0, 7).map((activity) => (
            <div key={activity.id} className="rounded-xl bg-white/45 p-3">
              <p className="text-sm font-semibold">{activity.message}</p>
              <p className="text-xs text-on-surface-variant">{formatTime(activity.created_at)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function hatchProgressMessage(progress: number) {
  if (progress >= 100) return "Your new friend is ready to meet you.";
  if (progress >= 70) return "Tiny cracks appear. Keep caring together.";
  if (progress >= 30) return "It wiggles when you two spend time together.";
  return "The egg is getting used to your little world.";
}

function missionCopy(taskType: MissionTaskType, petName: string): { label: string; icon: string } {
  const labels: Record<MissionTaskType, { label: string; icon: string }> = {
    mood_check: { label: "Check mood", icon: "😊" },
    journal_entry: { label: "Write journal", icon: "📓" },
    truth_or_dare_played: { label: "Play Truth or Dare", icon: "🎲" },
    feed_pet: { label: `Feed ${petName}`, icon: "🍖" },
    drink_pet: { label: `Give ${petName} a drink`, icon: "🥛" },
    play_pet: { label: `Play with ${petName}`, icon: "🎾" },
    bath_pet: { label: `Bath ${petName}`, icon: "🫧" },
  };
  return labels[taskType];
}
