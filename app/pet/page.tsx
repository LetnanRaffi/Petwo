"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { EggDisplay } from "@/components/egg-display";
import { PetDisplay } from "@/components/pet-display";
import { usePetwo } from "@/components/petwo-provider";
import { EmptyRoom, PageTitle, StatBar } from "@/components/ui";
import { getPetDisplayName, type PetVisualState } from "@/lib/pet-assets";
import { petActions, type PetAction } from "@/lib/pet-actions";

export default function PetPage() {
  const { pet, pets, selectedPetId, egg, room, doPetAction, selectPet } = usePetwo();
  const [pendingAction, setPendingAction] = useState<PetAction | null>(null);
  const [visualState, setVisualState] = useState<PetVisualState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (visualState === "idle") return;

    const timeout = window.setTimeout(() => setVisualState("idle"), 3000);
    return () => window.clearTimeout(timeout);
  }, [visualState]);

  async function handlePetAction(action: PetAction) {
    if (pendingAction) return;
    setPendingAction(action);
    setMessage("");
    try {
      await doPetAction(action);
      setVisualState(petActionVisualState(action));
      setMessage(`${careActionLabel(action, getPetDisplayName(pet?.name))} saved.`);
    } catch {
      setMessage("Could not save pet action. Try again.");
    } finally {
      setPendingAction(null);
    }
  }

  if (!room) {
    return (
      <div className="space-y-5">
        <PageTitle title="Pet room" subtitle="Connect with someone first." />
        <EmptyRoom />
      </div>
    );
  }

  if (!pet) {
    const hatchPercent = egg?.hatch_progress ?? 0;
    return (
      <div className="space-y-5">
        <PageTitle title="Mystery Egg" subtitle="Play together to hatch faster." />
        <section className="glass-card rounded-2xl p-5 text-center">
          <div className="mx-auto h-48 w-48">
            <EggDisplay progress={hatchPercent} />
          </div>
          <h2 className="mt-5 font-headline text-3xl font-bold text-primary">{hatchPercent}% bond energy</h2>
          <p className="mt-2 text-sm text-on-surface-variant">{hatchProgressMessage(hatchPercent)}</p>
        </section>
      </div>
    );
  }

  const petName = getPetDisplayName(pet.name);

  return (
    <div className="space-y-5">
      <PageTitle title={`${petName}'s room`} subtitle={`Care actions keep ${petName} cozy. Food and drinks can also be bought from Shop.`} />
      {message ? <p className="glass-card rounded-2xl p-4 text-sm font-bold text-primary">{message}</p> : null}

      {pets.length > 1 ? (
        <section className="glass-card rounded-2xl p-4">
          <h2 className="mb-3 font-headline text-xl font-bold text-primary">Pet Family</h2>
          <div className="grid grid-cols-2 gap-3">
            {pets.map((item) => {
              const itemName = getPetDisplayName(item.name);
              const active = item.id === selectedPetId;
              return (
                <button
                  key={item.id}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    active ? "border-primary bg-primary-container/70 text-primary" : "border-white/60 bg-white/50 text-on-surface"
                  }`}
                  onClick={() => selectPet(item.id)}
                >
                  <div className="mx-auto h-20 w-20">
                    <PetDisplay name={itemName} />
                  </div>
                  <p className="mt-2 truncate text-sm font-bold">{itemName}</p>
                  <p className="text-xs font-semibold text-on-surface-variant">Level {item.level}</p>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

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
          <div className="mx-auto h-56 w-56">
            <PetDisplay state={visualState} name={petName} />
          </div>
          <h2 className="mt-2 font-headline text-3xl font-bold text-primary">{petName}</h2>
          <p className="text-sm font-semibold text-on-surface-variant">Level {pet.level}</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {(Object.keys(petActions) as PetAction[]).map((action) => (
          <button
            key={action}
            className="primary-button flex items-center justify-center gap-2"
            onClick={() => handlePetAction(action)}
            disabled={Boolean(pendingAction)}
          >
            <span>{petActions[action].icon}</span>
            {pendingAction === action ? "Saving..." : careActionLabel(action, petName)}
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

function petActionVisualState(action: PetAction): PetVisualState {
  const states: Record<PetAction, PetVisualState> = {
    feed: "eating",
    drink: "drinking",
    bath: "bath",
    sleep: "sleep",
    play: "idle",
  };
  return states[action];
}

function careActionLabel(action: PetAction, petName: string) {
  const labels: Record<PetAction, string> = {
    feed: `Feed ${petName}`,
    drink: `Give ${petName} a drink`,
    bath: `Bath ${petName}`,
    play: `Play with ${petName}`,
    sleep: `Help ${petName} sleep`,
  };
  return labels[action];
}

function hatchProgressMessage(progress: number) {
  if (progress >= 100) return "Your new friend is ready to meet you.";
  if (progress >= 70) return "Tiny cracks appear. Keep caring together.";
  if (progress >= 30) return "It wiggles when you two spend time together.";
  return "The egg is getting used to your little world.";
}
