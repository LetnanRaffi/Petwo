"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Dice5 } from "lucide-react";
import { PageTitle } from "@/components/ui";
import { usePetwo } from "@/components/petwo-provider";

const truths = [
  "What tiny thing made you smile this week?",
  "What is one memory with us you replay often?",
  "What would make tomorrow feel lighter?",
];

const dares = [
  "Send a voice note saying one kind sentence.",
  "Pick tomorrow's Moci care action for your partner.",
  "Write a two-line journal note before sleeping.",
];

export default function GamesPage() {
  const { room, playTruthOrDare } = usePetwo();
  const [prompt, setPrompt] = useState("Tap start for a Truth or Dare prompt.");
  const [played, setPlayed] = useState(false);
  const cards = useMemo(
    () => [
      { title: "Truth or Dare", body: prompt, active: true },
      { title: "Tic Tac Toe", body: "Coming soon", active: false },
      { title: "Couple Quiz", body: "Coming soon", active: false },
    ],
    [prompt],
  );

  function start() {
    const list = Math.random() > 0.5 ? truths : dares;
    const type = list === truths ? "Truth" : "Dare";
    setPrompt(`${type}: ${list[Math.floor(Math.random() * list.length)]}`);
    setPlayed(false);
  }

  async function markPlayed() {
    if (!room || played) return;
    await playTruthOrDare(prompt);
    setPlayed(true);
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Games" subtitle="Truth or Dare now earns coins and helps hatch the egg." />
      <section className="grid gap-4">
        {cards.map((card) => (
          <div key={card.title} className="glass-card rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-headline text-xl font-bold text-primary">{card.title}</h2>
              <Dice5 className="text-primary" size={22} />
            </div>
            <p className="min-h-12 text-sm leading-6 text-on-surface-variant">{card.body}</p>
            {card.active ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button className="primary-button" onClick={start} disabled={!room}>
                  Start
                </button>
                <button className="soft-button flex items-center justify-center gap-2" onClick={markPlayed} disabled={!room || played || prompt.startsWith("Tap")}>
                  <CheckCircle2 size={17} />
                  {played ? "Earned" : "Played"}
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-white/45 px-4 py-3 text-center text-sm font-bold text-on-surface-variant">Coming soon</div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
