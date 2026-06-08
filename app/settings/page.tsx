"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Copy, LogOut } from "lucide-react";
import { usePetwo } from "@/components/petwo-provider";
import { PageTitle } from "@/components/ui";

export default function SettingsPage() {
  const { room, profile, partner, session, createRoom, joinRoom, signOut } = usePetwo();
  const [inviteCode, setInviteCode] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    await joinRoom(inviteCode);
    setInviteCode("");
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Settings" subtitle="Pairing, account, and prototype status." />

      <section className="glass-card rounded-2xl p-5">
        <h2 className="font-headline text-xl font-bold text-primary">Account</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          {profile?.name ?? "Not signed in"} · {profile?.email ?? "Sign in with Google to use Petwo"}
        </p>
        <div className="mt-4 flex gap-3">
          <Link className="soft-button flex-1 text-center" href="/auth">
            Auth
          </Link>
          <button className="soft-button flex flex-1 items-center justify-center gap-2" onClick={signOut}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-5">
        <h2 className="font-headline text-xl font-bold text-primary">Pairing</h2>
        {room ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl bg-primary-container/60 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary/80">Invite code</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <code className="font-headline text-3xl font-bold text-primary">{room.invite_code}</code>
                <button className="soft-button px-3 py-2" onClick={() => navigator.clipboard?.writeText(room.invite_code)} aria-label="Copy invite code">
                  <Copy size={17} />
                </button>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant">Partner: {partner?.name ?? "Waiting for partner to join"}</p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <button className="primary-button w-full" onClick={createRoom} disabled={!session}>
              Generate invite code
            </button>
            <form className="space-y-3" onSubmit={submit}>
              <input className="field uppercase" placeholder="Enter invite code" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} disabled={!session} />
              <button className="soft-button w-full" disabled={!session || !inviteCode.trim()}>
                Join room
              </button>
            </form>
            {!session ? (
              <p className="rounded-xl bg-primary-container/40 p-3 text-xs leading-5 text-primary">
                Sign in with Google before creating or joining a room.
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section className="glass-card rounded-2xl p-5">
        <h2 className="font-headline text-xl font-bold text-primary">MVP notes</h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          Voice calls, photobooth, push notifications, and payments are intentionally not included yet.
        </p>
      </section>
    </div>
  );
}
