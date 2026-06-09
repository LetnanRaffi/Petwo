"use client";

import { getEggAsset, getEggState, type EggVisualState } from "@/lib/pet-assets";

const animationClass: Record<EggVisualState, string> = {
  idle: "egg-asset-idle",
  cracking: "egg-asset-cracking",
  hatching: "egg-asset-hatching",
};

export function EggDisplay({
  progress = 0,
  state,
  className = "",
}: {
  progress?: number;
  state?: EggVisualState;
  className?: string;
}) {
  const visualState = state ?? getEggState(progress);

  return (
    <img
      src={getEggAsset(visualState)}
      alt="Mystery egg"
      className={`mx-auto h-full w-full object-contain drop-shadow-sm ${animationClass[visualState]} ${className}`}
      draggable={false}
    />
  );
}
