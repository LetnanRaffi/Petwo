import { Avatar } from "./app-shell";

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h1 className="font-headline text-3xl font-bold tracking-normal text-primary">{title}</h1>
      {subtitle ? <p className="text-sm leading-6 text-on-surface-variant">{subtitle}</p> : null}
    </div>
  );
}

export function StatBar({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="glass-card rounded-xl p-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-sm font-bold text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span>{icon}</span>
          {label}
        </span>
        <span className="text-primary">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest/70">
        <div className="h-full rounded-full bg-primary-container" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function EmptyRoom() {
  return (
    <div className="glass-card rounded-2xl p-5 text-center">
      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary-container text-2xl">🏡</div>
      <h2 className="font-headline text-xl font-bold text-primary">Create your little world</h2>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">
        Generate an invite code or join your partner to receive a shared mystery egg.
      </p>
    </div>
  );
}

export function AuthorName({
  id,
  profileId,
  partnerId,
  profileName,
  partnerName,
}: {
  id: string | null;
  profileId?: string;
  partnerId?: string;
  profileName?: string | null;
  partnerName?: string | null;
}) {
  if (id === profileId) return <>{profileName ?? "You"}</>;
  if (id === partnerId) return <>{partnerName ?? "Partner"}</>;
  return <>Someone</>;
}

export function TimelineAvatar({ name }: { name: string }) {
  return <Avatar name={name} className="absolute left-0 top-1 h-11 w-11" />;
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(
    new Date(value),
  );
}
