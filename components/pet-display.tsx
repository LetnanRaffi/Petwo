"use client";

import { getPetAsset, type PetVisualState } from "@/lib/pet-assets";

const animationClass: Record<PetVisualState, string> = {
  idle: "pet-asset-idle",
  eating: "pet-asset-action",
  drinking: "pet-asset-action",
  bath: "pet-asset-action",
  sleep: "pet-asset-sleep",
  play: "pet-asset-idle",
  sad: "pet-asset-idle",
  dirty: "pet-asset-idle",
  excited: "pet-asset-idle",
};

export function PetDisplay({
  state = "idle",
  name = "Unnamed Pet",
  className = "",
}: {
  state?: PetVisualState;
  name?: string;
  className?: string;
}) {
  return (
    <img
      src={getPetAsset(state)}
      alt={name}
      className={`mx-auto h-full w-full object-contain drop-shadow-sm ${animationClass[state]} ${className}`}
      draggable={false}
    />
  );
}
