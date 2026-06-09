"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { usePetwo } from "@/components/petwo-provider";
import { AuthorName, EmptyRoom, PageTitle, TimelineAvatar, formatTime } from "@/components/ui";

export default function JournalPage() {
  const { room, journals, profile, partner, addJournal } = usePetwo();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim() || submitting) return;

    const nextContent = content;
    setContent("");
    setSubmitting(true);
    setMessage("");
    try {
      const saved = await addJournal(nextContent);
      if (!saved) {
        setContent(nextContent);
        setMessage("Could not save journal note. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Shared Journal" subtitle="A simple timeline for notes from both of you." />
      {!room ? <EmptyRoom /> : null}

      <form className="glass-card rounded-2xl p-4" onSubmit={submit}>
        <textarea
          className="field min-h-28 resize-none"
          placeholder="Write a small memory..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={!room || submitting}
        />
        <button className="primary-button mt-3 flex w-full items-center justify-center gap-2" disabled={!room || !content.trim() || submitting}>
          <Send size={17} />
          {submitting ? "Saving..." : "Add note"}
        </button>
        {message ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{message}</p> : null}
      </form>

      <section className="relative space-y-5 before:absolute before:left-[21px] before:top-0 before:h-full before:w-0.5 before:bg-primary/10">
        {journals.map((journal) => {
          const name = journal.author_id === profile?.id ? profile?.name ?? "You" : partner?.name ?? "Partner";
          return (
            <article key={journal.id} className="relative pl-14">
              <TimelineAvatar name={name} />
              <div className="glass-card rounded-2xl p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-primary">
                    <AuthorName
                      id={journal.author_id}
                      profileId={profile?.id}
                      partnerId={partner?.id}
                      profileName={profile?.name}
                      partnerName={partner?.name}
                    />
                  </p>
                  <time className="text-xs text-on-surface-variant">{formatTime(journal.created_at)}</time>
                </div>
                <p className="whitespace-pre-line text-sm leading-6">{journal.content}</p>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
