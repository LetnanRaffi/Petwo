import type { Pet } from "./types";

export type PetAction = "feed" | "drink" | "bath" | "play" | "sleep";

export const petActions: Record<
  PetAction,
  { label: string; icon: string; activity: string; messageVerb: string; patch: Partial<Pet> }
> = {
  feed: {
    label: "Feed",
    icon: "🍖",
    activity: "pet_fed",
    messageVerb: "fed",
    patch: { hunger: 10, happiness: 3, xp: 6 },
  },
  drink: {
    label: "Drink",
    icon: "🥛",
    activity: "pet_drink",
    messageVerb: "gave a drink to",
    patch: { thirst: 15, happiness: 2, xp: 5 },
  },
  bath: {
    label: "Bath",
    icon: "🫧",
    activity: "pet_bathed",
    messageVerb: "bathed",
    patch: { cleanliness: 14, happiness: 2, xp: 6 },
  },
  play: {
    label: "Play",
    icon: "🎾",
    activity: "pet_played",
    messageVerb: "played with",
    patch: { happiness: 12, energy: -8, xp: 8 },
  },
  sleep: {
    label: "Sleep",
    icon: "💤",
    activity: "pet_slept",
    messageVerb: "helped",
    patch: { energy: 16, hunger: -4, thirst: -3, xp: 5 },
  },
};

export function applyPetAction(pet: Pet, action: PetAction): Pet {
  const patch = petActions[action].patch;
  const xp = pet.xp + (patch.xp ?? 0);
  const leveled = xp >= 100;

  return {
    ...pet,
    hunger: clamp(pet.hunger + (patch.hunger ?? 0)),
    thirst: clamp(pet.thirst + (patch.thirst ?? 0)),
    cleanliness: clamp(pet.cleanliness + (patch.cleanliness ?? 0)),
    energy: clamp(pet.energy + (patch.energy ?? 0)),
    happiness: clamp(pet.happiness + (patch.happiness ?? 0)),
    xp: leveled ? xp - 100 : xp,
    level: leveled ? pet.level + 1 : pet.level,
    updated_at: new Date().toISOString(),
  };
}

export function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
