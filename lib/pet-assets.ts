export type PetVisualState = "idle" | "eating" | "drinking" | "bath" | "sleep" | "play" | "sad" | "dirty" | "excited";
export type EggVisualState = "idle" | "cracking" | "hatching";

const petAssets: Record<PetVisualState, string> = {
  idle: "/pet/cat/cat-idle.png?v=pet-assets-1",
  eating: "/pet/cat/cat-eating.png?v=pet-assets-1",
  drinking: "/pet/cat/cat-drinking.png?v=pet-assets-1",
  bath: "/pet/cat/cat-bath.png?v=pet-assets-1",
  sleep: "/pet/cat/cat-sleep.png?v=pet-assets-1",
  play: "/pet/cat/cat-idle.png?v=pet-assets-1",
  sad: "/pet/cat/cat-idle.png?v=pet-assets-1",
  dirty: "/pet/cat/cat-idle.png?v=pet-assets-1",
  excited: "/pet/cat/cat-idle.png?v=pet-assets-1",
};

const eggAssets: Record<EggVisualState, string> = {
  idle: "/pet/cat/egg-idle.png?v=pet-assets-1",
  cracking: "/pet/cat/egg-cracking.png?v=pet-assets-1",
  hatching: "/pet/cat/egg-hatching.png?v=pet-assets-1",
};

export function getPetAsset(state: PetVisualState = "idle") {
  return petAssets[state] ?? petAssets.idle;
}

export function getEggAsset(state: EggVisualState = "idle") {
  return eggAssets[state] ?? eggAssets.idle;
}

export function getEggState(progress = 0, hatching = false): EggVisualState {
  if (hatching) return "hatching";
  if (progress >= 70) return "cracking";
  return "idle";
}

export function getPetDisplayName(name?: string | null) {
  const trimmed = name?.trim();
  return trimmed || "Unnamed Pet";
}
