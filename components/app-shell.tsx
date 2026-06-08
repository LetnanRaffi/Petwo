"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookHeart, Gamepad2, Heart, Home, PawPrint, Settings, ShoppingBag } from "lucide-react";
import { PetwoProvider, usePetwo } from "./petwo-provider";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/pet", label: "Pet", icon: PawPrint },
  { href: "/journal", label: "Journal", icon: BookHeart },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PetwoProvider>
      <ShellChrome>{children}</ShellChrome>
    </PetwoProvider>
  );
}

function ShellChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, partner, session, loading } = usePetwo();
  const isAuth = pathname === "/auth";
  const isOnboarding = pathname === "/onboarding";

  useEffect(() => {
    if (loading) return;

    if (!session) {
      if (!isAuth) router.replace("/auth");
      return;
    }

    if (!profile?.onboarding_completed) {
      if (!isOnboarding) router.replace("/onboarding");
      return;
    }

    if (isAuth || isOnboarding) {
      router.replace("/dashboard");
    }
  }, [isAuth, isOnboarding, loading, profile?.onboarding_completed, router, session]);

  if (isAuth) return <>{children}</>;
  if (isOnboarding && session && !profile?.onboarding_completed) return <>{children}</>;

  if (loading) {
    return <PetwoLoading />;
  }

  if (!session) {
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <section className="glass-card w-full max-w-sm rounded-2xl p-6 text-center">
          <img src="/logo-petwo.png" alt="Petwo" className="mx-auto mb-4 h-20 w-20 rounded-2xl object-cover shadow-cloud" />
          <h1 className="font-headline text-2xl font-bold text-primary">Login dulu</h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Masuk dengan Google sebelum buka dashboard, pet room, journal, games, atau settings.
          </p>
          <Link className="primary-button mt-5 flex w-full justify-center" href="/auth">
            Go to login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-dvh pb-24 text-on-surface">
      <header className="sticky top-0 z-40 border-b border-white/40 bg-surface/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src="/logo-petwo.png" alt="Petwo" className="h-10 w-10 rounded-xl object-cover shadow-sm" />
            <div className="flex items-center">
              <Avatar name={profile?.name ?? "You"} avatarKey={profile?.avatar_type} />
              <Avatar name={partner?.name ?? "?"} avatarKey={partner?.avatar_type} className="-ml-3" muted={!partner} />
            </div>
            <span className="font-headline text-2xl font-bold text-primary">Petwo</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/55 px-3 py-2 text-xs font-bold text-primary">
            <Heart size={16} fill="currentColor" />
            {session ? "Live" : "Sign in"}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-5">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto grid h-20 max-w-3xl grid-cols-6 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold transition ${
                  active ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                <span className={`rounded-full px-3 py-1.5 ${active ? "bg-primary-container/70" : ""}`}>
                  <Icon size={19} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function PetwoLoading() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <section className="w-full max-w-xs text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/70 shadow-cloud">
          <img src="/logo-petwo.png" alt="Petwo" className="h-12 w-12 rounded-xl object-cover" />
        </div>
        <div className="mx-auto mt-5 h-1.5 w-28 overflow-hidden rounded-full bg-primary-container/60">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-primary/70" />
        </div>
        <p className="mt-4 text-sm font-semibold text-on-surface-variant">Preparing your little world...</p>
      </section>
    </main>
  );
}

const avatarClasses: Record<string, string> = {
  blue: "from-blue-300 to-blue-600",
  pink: "from-rose-200 to-pink-500",
  mint: "from-emerald-200 to-teal-500",
  sunny: "from-amber-200 to-orange-500",
};

export function Avatar({
  name,
  avatarKey,
  className = "",
  muted = false,
}: {
  name: string;
  avatarKey?: string | null;
  className?: string;
  muted?: boolean;
}) {
  const gradient = avatarClasses[avatarKey ?? "blue"] ?? avatarClasses.blue;

  return (
    <div
      className={`grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-gradient-to-br text-sm font-black text-white shadow-sm ${
        muted ? "from-surface-container-high to-surface-container-high text-outline" : gradient
      } ${className}`}
      title={name}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
