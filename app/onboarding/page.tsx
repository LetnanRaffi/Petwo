"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { usePetwo } from "@/components/petwo-provider";

const avatarOptions = [
  { key: "blue", label: "Blue", className: "from-blue-300 to-blue-600" },
  { key: "pink", label: "Pink", className: "from-rose-200 to-pink-500" },
  { key: "mint", label: "Mint", className: "from-emerald-200 to-teal-500" },
  { key: "sunny", label: "Sunny", className: "from-amber-200 to-orange-500" },
];

const relationshipOptions = [
  { key: "partner", label: "Partner" },
  { key: "best_friend", label: "Best friend" },
  { key: "family", label: "Family" },
  { key: "close_friend", label: "Close friend" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, completeOnboarding } = usePetwo();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? profile?.name ?? "");
  const [avatarType, setAvatarType] = useState(profile?.avatar_type ?? avatarOptions[0].key);
  const [relationshipType, setRelationshipType] = useState(profile?.relationship_type ?? relationshipOptions[0].key);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = displayName.trim().length > 1 && !saving;

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? profile.name ?? "");
    setAvatarType(profile.avatar_type ?? avatarOptions[0].key);
    setRelationshipType(profile.relationship_type ?? relationshipOptions[0].key);
  }, [profile]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError("");
    const saved = await completeOnboarding({ displayName, avatarType, relationshipType });
    setSaving(false);

    if (!saved) {
      setError("Could not save onboarding. Check Supabase profile columns, then try again.");
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <main className="relative min-h-dvh overflow-hidden px-4 py-6">
      <img src="/auth-bg.png" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-bottom" />
      <div className="absolute inset-0 bg-white/25" />

      <form onSubmit={submit} className="relative z-10 mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-col justify-end">
        <div className="mb-5 text-center">
          <img src="/logo-petwo.png" alt="Petwo" className="mx-auto h-20 w-20 rounded-2xl object-cover shadow-cloud" />
          <h1 className="mt-4 font-headline text-4xl font-bold tracking-normal text-primary">Set up your profile</h1>
          <p className="mt-1 text-sm font-semibold text-primary/75">Your shared egg comes after you connect.</p>
        </div>

        <section className="space-y-5 rounded-2xl border border-white/70 bg-white/[0.82] p-5 shadow-cloud backdrop-blur-xl">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Display name</span>
            <input className="field bg-white/80" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" />
          </label>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Avatar</p>
            <div className="grid grid-cols-4 gap-2">
              {avatarOptions.map((avatar) => (
                <button
                  type="button"
                  key={avatar.key}
                  className={`grid aspect-square place-items-center rounded-2xl bg-gradient-to-br ${avatar.className} text-lg font-black text-white shadow-sm ring-primary transition ${
                    avatarType === avatar.key ? "ring-4" : "ring-0"
                  }`}
                  onClick={() => setAvatarType(avatar.key)}
                  aria-label={avatar.label}
                >
                  {displayName.trim().slice(0, 1).toUpperCase() || "P"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Relationship type</p>
            <div className="grid grid-cols-2 gap-2">
              {relationshipOptions.map((option) => (
                <button
                  type="button"
                  key={option.key}
                  className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                    relationshipType === option.key ? "border-primary bg-primary-container text-primary" : "border-white/70 bg-white/60 text-on-surface-variant"
                  }`}
                  onClick={() => setRelationshipType(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button className="primary-button flex w-full items-center justify-center gap-2" disabled={!canSubmit}>
            {saving ? <Check size={18} /> : <ChevronRight size={18} />}
            {saving ? "Saving" : "Continue"}
          </button>
          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}
        </section>
      </form>
    </main>
  );
}
