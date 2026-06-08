"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { usePetwo } from "@/components/petwo-provider";
import { EmptyRoom, PageTitle, StatBar } from "@/components/ui";
import { petActions, type PetAction } from "@/lib/pet-actions";
import { petEmoji } from "@/lib/pet-visuals";

export default function PetPage() {
  const { pet, egg, room, doPetAction } = usePetwo();

  if (!room) {
    return (
      <div className="space-y-5">
        <PageTitle title="Pet room" subtitle="Connect with someone first." />
        <EmptyRoom />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="space-y-5">
        <PageTitle title="Mystery Egg" subtitle="Play together to hatch faster." />
        <section className="glass-card rounded-2xl p-5 text-center">
          <div className="mx-auto grid h-36 w-36 place-items-center rounded-[32px] bg-primary-container/70 text-7xl">🥚</div>
          <h2 className="mt-5 font-headline text-3xl font-bold text-primary">{egg?.hatch_progress ?? 0}% ready</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Complete missions, play games, write journal, or check mood to hatch faster.</p>
        </section>
      </div>
    );
  }

  const petIcon = petEmoji(pet.pet_type);

  return (
    <div className="space-y-5">
      <PageTitle title={`${pet.name}'s room`} subtitle="Care actions keep Moci cozy. Food and drinks can also be bought from Shop." />

      <section className="grid grid-cols-2 gap-3">
        <StatBar icon="🍖" label="Hunger" value={pet.hunger} />
        <StatBar icon="🥛" label="Thirst" value={pet.thirst} />
        <StatBar icon="🫧" label="Clean" value={pet.cleanliness} />
        <StatBar icon="⚡" label="Energy" value={pet.energy} />
        <StatBar icon="💙" label="Happy" value={pet.happiness} />
        <StatBar icon="✨" label="XP" value={pet.xp} />
      </section>

      <section className="relative grid aspect-square max-h-[430px] place-items-center overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-b from-surface-container-low to-surface-container shadow-cloud">
        <div className="absolute h-72 w-72 rounded-full bg-primary-fixed-dim/30 blur-3xl" />
        <div className="relative text-center">
          <div className="animate-[float_4s_ease-in-out_infinite] text-9xl drop-shadow-sm">{petIcon}</div>
          <h2 className="mt-2 font-headline text-3xl font-bold text-primary">{pet.name}</h2>
          <p className="text-sm font-semibold text-on-surface-variant">Level {pet.level}</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {(Object.keys(petActions) as PetAction[]).map((action) => (
          <button key={action} className="primary-button flex items-center justify-center gap-2" onClick={() => doPetAction(action)}>
            <span>{petActions[action].icon}</span>
            {petActions[action].label}
          </button>
        ))}
      </section>

      <Link className="soft-button flex w-full items-center justify-center gap-2" href="/shop">
        <ShoppingBag size={17} />
        Buy food, drinks, toys, and potions
      </Link>
    </div>
  );
}
