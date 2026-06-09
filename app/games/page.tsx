"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Dice5, Hourglass, Trophy, Users } from "lucide-react";
import { PageTitle, formatTime } from "@/components/ui";
import { usePetwo } from "@/components/petwo-provider";
import { pickQuizQuestionIds, quizQuestionCount, quizQuestionMs, quizQuestionSeconds, scoreQuizAnswer, getQuizQuestions } from "@/lib/quiz";
import { supabase } from "@/lib/supabase";
import type { QuizAnswer, QuizSession } from "@/lib/types";

const truths = [
  "What tiny thing made you smile this week?",
  "What is one memory with us you replay often?",
  "What would make tomorrow feel lighter?",
];

const dares = [
  "Send a voice note saying one kind sentence.",
  "Pick tomorrow's pet care action for your partner.",
  "Write a two-line journal note before sleeping.",
];

export default function GamesPage() {
  const { room, profile, partner, egg, pet, playTruthOrDare, completeCoupleQuiz } = usePetwo();
  const [prompt, setPrompt] = useState("Tap start for a Truth or Dare prompt.");
  const [played, setPlayed] = useState(false);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const claimedRewardFor = useRef<string | null>(null);

  const questions = useMemo(() => getQuizQuestions(quizSession?.question_ids ?? []), [quizSession?.question_ids]);
  const currentQuestion = quizSession?.status === "active" ? questions[quizSession.current_question_index] ?? null : null;
  const currentStartedAt = quizSession?.question_started_at ? new Date(quizSession.question_started_at).getTime() : 0;
  const elapsedMs = currentStartedAt ? Math.max(0, now - currentStartedAt) : 0;
  const timeLeftMs = Math.max(0, quizQuestionMs - elapsedMs);
  const timeLeft = Math.ceil(timeLeftMs / 1000);
  const myAnswer = currentQuestion ? answers.find((answer) => answer.question_id === currentQuestion.id && answer.user_id === profile?.id) : null;
  const playerIds = [quizSession?.player_one_id, quizSession?.player_two_id].filter((id): id is string => Boolean(id));
  const scores = useMemo(() => getScores(answers, playerIds), [answers, playerIds]);
  const myScore = profile?.id ? scores[profile.id] ?? 0 : 0;
  const partnerId = playerIds.find((id) => id !== profile?.id) ?? null;
  const partnerScore = partnerId ? scores[partnerId] ?? 0 : 0;

  const loadQuizState = useCallback(async () => {
    if (!supabase || !room) {
      setQuizSession(null);
      setAnswers([]);
      return;
    }

    const { data: sessions, error: sessionError } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("room_id", room.id)
      .in("status", ["lobby", "active", "completed"])
      .order("created_at", { ascending: false })
      .limit(5);
    if (sessionError) {
      setError("Couple Quiz database is not ready. Apply the Supabase quiz schema first.");
      setQuizSession(null);
      setAnswers([]);
      return;
    }
    const rows = (sessions ?? []) as QuizSession[];
    const nextSession = rows.find((session) => session.status === "active") ?? rows.find((session) => session.status === "lobby") ?? rows[0] ?? null;

    if (nextSession?.status === "lobby" && new Date(nextSession.expires_at).getTime() < Date.now()) {
      await supabase.from("quiz_sessions").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", nextSession.id);
      setQuizSession(null);
      setAnswers([]);
      return;
    }

    setQuizSession(nextSession);
    if (!nextSession) {
      setAnswers([]);
      return;
    }

    const { data: answerRows, error: answersError } = await supabase
      .from("quiz_answers")
      .select("*")
      .eq("session_id", nextSession.id)
      .order("answered_at", { ascending: true });
    if (answersError) {
      setError("Could not load quiz answers. Check Supabase schema and RLS.");
      return;
    }
    setAnswers((answerRows ?? []) as QuizAnswer[]);
  }, [room]);

  useEffect(() => {
    loadQuizState();
  }, [loadQuizState]);

  useEffect(() => {
    if (!supabase || !room) return;

    const client = supabase;
    const channel = client
      .channel(`couple-quiz-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_sessions", filter: `room_id=eq.${room.id}` }, () => {
        loadQuizState();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_answers", filter: `room_id=eq.${room.id}` }, () => {
        loadQuizState();
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [loadQuizState, room]);

  useEffect(() => {
    if (quizSession?.status !== "active") return;

    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [quizSession?.status]);

  const advanceQuestion = useCallback(async () => {
    if (!supabase || !quizSession || quizSession.status !== "active") return;

    const isLastQuestion = quizSession.current_question_index >= Math.min(questions.length, quizQuestionCount) - 1;
    const patch = isLastQuestion
      ? { status: "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      : {
          current_question_index: quizSession.current_question_index + 1,
          question_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

    await supabase
      .from("quiz_sessions")
      .update(patch)
      .eq("id", quizSession.id)
      .eq("current_question_index", quizSession.current_question_index)
      .eq("status", "active");
  }, [questions.length, quizSession]);

  const submitAnswer = useCallback(
    async (selectedIndex: number | null) => {
      if (!supabase || !room || !profile || !quizSession || !currentQuestion || myAnswer || busy) return;

      setBusy(true);
      setError("");
      const responseMs = Math.min(quizQuestionMs, Math.max(0, Date.now() - currentStartedAt));
      const isCorrect = selectedIndex === currentQuestion.answerIndex;
      const score = scoreQuizAnswer(isCorrect, selectedIndex === null ? null : responseMs);
      const { error: answerError } = await supabase
        .from("quiz_answers")
        .upsert(
          {
            session_id: quizSession.id,
            room_id: room.id,
            user_id: profile.id,
            question_id: currentQuestion.id,
            selected_index: selectedIndex,
            is_correct: isCorrect,
            score,
            response_ms: selectedIndex === null ? null : responseMs,
          },
          { onConflict: "session_id,user_id,question_id", ignoreDuplicates: true },
        );

      if (answerError) setError("Could not submit your answer. Try again.");
      await loadQuizState();
      setBusy(false);
    },
    [busy, currentQuestion, currentStartedAt, loadQuizState, myAnswer, profile, quizSession, room],
  );

  useEffect(() => {
    if (!quizSession || quizSession.status !== "active" || !currentQuestion) return;

    const currentAnswers = answers.filter((answer) => answer.question_id === currentQuestion.id);
    const allPlayersAnswered = playerIds.length >= 2 && currentAnswers.length >= playerIds.length;
    if (allPlayersAnswered) {
      advanceQuestion();
      return;
    }

    if (timeLeftMs <= 0) {
      if (!myAnswer) {
        submitAnswer(null);
        return;
      }
      advanceQuestion();
    }
  }, [advanceQuestion, answers, currentQuestion, myAnswer, playerIds.length, quizSession, submitAnswer, timeLeftMs]);

  useEffect(() => {
    if (!quizSession || quizSession.status !== "completed" || claimedRewardFor.current === quizSession.id) return;

    claimedRewardFor.current = quizSession.id;
    completeCoupleQuiz(quizSession.id, scores[quizSession.player_one_id] ?? 0, quizSession.player_two_id ? scores[quizSession.player_two_id] ?? 0 : 0).then(() => {
      loadQuizState();
    });
  }, [completeCoupleQuiz, loadQuizState, quizSession, scores]);

  function startTruthOrDare() {
    const list = Math.random() > 0.5 ? truths : dares;
    const type = list === truths ? "Truth" : "Dare";
    setPrompt(`${type}: ${list[Math.floor(Math.random() * list.length)]}`);
    setPlayed(false);
  }

  async function markTruthOrDarePlayed() {
    if (!room || played) return;
    await playTruthOrDare(prompt);
    setPlayed(true);
  }

  async function createQuizLobby() {
    if (!supabase || !room || !profile || busy) return;

    setBusy(true);
    setError("");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error: createError } = await supabase.from("quiz_sessions").insert({
      room_id: room.id,
      host_id: profile.id,
      player_one_id: profile.id,
      status: "lobby",
      question_ids: pickQuizQuestionIds(),
      expires_at: expiresAt,
    });
    if (createError) setError("Could not create quiz lobby.");
    await loadQuizState();
    setBusy(false);
  }

  async function joinQuizLobby() {
    if (!supabase || !quizSession || !profile || busy || quizSession.status !== "lobby" || quizSession.player_one_id === profile.id) return;

    setBusy(true);
    setError("");
    const startedAt = new Date().toISOString();
    const { error: joinError } = await supabase
      .from("quiz_sessions")
      .update({
        player_two_id: profile.id,
        status: "active",
        started_at: startedAt,
        question_started_at: startedAt,
        current_question_index: 0,
        updated_at: startedAt,
      })
      .eq("id", quizSession.id)
      .eq("status", "lobby")
      .is("player_two_id", null);
    if (joinError) setError("Could not join quiz lobby.");
    await loadQuizState();
    setBusy(false);
  }

  async function startNewQuiz() {
    await createQuizLobby();
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Games" subtitle="Play quick couple games that earn progress for your little world." />

      <CoupleQuizCard
        answers={answers}
        busy={busy}
        currentQuestion={currentQuestion}
        eggActive={Boolean(egg && egg.status !== "hatched")}
        error={error}
        myAnswer={myAnswer ?? null}
        myName={profile?.name ?? "You"}
        myScore={myScore}
        onAnswer={submitAnswer}
        onCreate={createQuizLobby}
        onJoin={joinQuizLobby}
        onNew={startNewQuiz}
        partnerName={partner?.name ?? "Partner"}
        partnerScore={partnerScore}
        petName={pet?.name ?? null}
        playerIds={playerIds}
        profileId={profile?.id ?? null}
        questions={questions}
        roomReady={Boolean(room)}
        session={quizSession}
        timeLeft={timeLeft}
      />

      <section className="glass-card rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-headline text-xl font-bold text-primary">Truth or Dare</h2>
          <Dice5 className="text-primary" size={22} />
        </div>
        <p className="min-h-12 text-sm leading-6 text-on-surface-variant">{prompt}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="primary-button" onClick={startTruthOrDare} disabled={!room}>
            Start
          </button>
          <button className="soft-button flex items-center justify-center gap-2" onClick={markTruthOrDarePlayed} disabled={!room || played || prompt.startsWith("Tap")}>
            <CheckCircle2 size={17} />
            {played ? "Earned" : "Played"}
          </button>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-5 opacity-80">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-headline text-xl font-bold text-primary">Tic Tac Toe</h2>
          <Dice5 className="text-primary" size={22} />
        </div>
        <p className="text-sm leading-6 text-on-surface-variant">Coming soon</p>
      </section>
    </div>
  );
}

function CoupleQuizCard({
  answers,
  busy,
  currentQuestion,
  eggActive,
  error,
  myAnswer,
  myName,
  myScore,
  onAnswer,
  onCreate,
  onJoin,
  onNew,
  partnerName,
  partnerScore,
  petName,
  playerIds,
  profileId,
  questions,
  roomReady,
  session,
  timeLeft,
}: {
  answers: QuizAnswer[];
  busy: boolean;
  currentQuestion: ReturnType<typeof getQuizQuestions>[number] | null;
  eggActive: boolean;
  error: string;
  myAnswer: QuizAnswer | null;
  myName: string;
  myScore: number;
  onAnswer: (selectedIndex: number | null) => Promise<void>;
  onCreate: () => Promise<void>;
  onJoin: () => Promise<void>;
  onNew: () => Promise<void>;
  partnerName: string;
  partnerScore: number;
  petName: string | null;
  playerIds: string[];
  profileId: string | null;
  questions: ReturnType<typeof getQuizQuestions>;
  roomReady: boolean;
  session: QuizSession | null;
  timeLeft: number;
}) {
  const canJoin = Boolean(session?.status === "lobby" && profileId && session.player_one_id !== profileId);
  const isHostWaiting = Boolean(session?.status === "lobby" && profileId && session.player_one_id === profileId);
  const currentIndex = session?.current_question_index ?? 0;

  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-headline text-2xl font-bold text-primary">Couple Quiz</h2>
          <p className="mt-1 text-sm leading-6 text-on-surface-variant">10 trivia questions. 10 seconds each. Fast correct answers boost your bond.</p>
        </div>
        <Trophy className="shrink-0 text-primary" size={26} />
      </div>

      {!roomReady ? (
        <p className="rounded-xl bg-white/45 p-3 text-sm font-semibold text-on-surface-variant">Connect with someone before starting Couple Quiz.</p>
      ) : null}

      {roomReady && !session ? (
        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl bg-primary-container/60 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-primary">
              <Users size={17} />
              Realtime duel for two
            </p>
            <p className="mt-2 text-sm leading-6 text-on-primary-container/80">
              Create a lobby, wait for your partner, then answer the same trivia set together.
            </p>
          </div>
          <button className="primary-button" onClick={onCreate} disabled={busy}>
            Create Quiz Lobby
          </button>
        </div>
      ) : null}

      {session?.status === "lobby" ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-primary-container/60 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-primary">
              <Hourglass size={17} />
              {isHostWaiting ? "Waiting for your partner" : "Your partner started a quiz"}
            </p>
            <p className="mt-2 text-sm text-on-primary-container/80">Lobby expires {formatTime(session.expires_at)}.</p>
          </div>
          {canJoin ? (
            <button className="primary-button w-full" onClick={onJoin} disabled={busy}>
              Join Quiz
            </button>
          ) : (
            <p className="rounded-xl bg-white/45 p-3 text-sm font-semibold text-on-surface-variant">Keep this page open. The match starts when your partner joins.</p>
          )}
        </div>
      ) : null}

      {session?.status === "active" && currentQuestion ? (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Question {currentIndex + 1}/{quizQuestionCount}</p>
              <p className="mt-1 text-xs font-bold text-primary">{currentQuestion.category}</p>
            </div>
            <div className={`grid h-14 w-14 place-items-center rounded-2xl text-xl font-black ${timeLeft <= 3 ? "bg-red-100 text-red-700" : "bg-primary-container text-primary"}`}>
              {timeLeft}
            </div>
          </div>

          <div className="rounded-2xl bg-white/55 p-4">
            <h3 className="font-headline text-2xl font-bold leading-tight text-on-surface">{currentQuestion.question}</h3>
          </div>

          <div className="grid gap-2">
            {currentQuestion.options.map((option, index) => {
              const selected = myAnswer?.selected_index === index;
              return (
                <button
                  key={option}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${
                    selected ? "border-primary bg-primary-container text-primary" : "border-white/60 bg-white/60 text-on-surface"
                  }`}
                  onClick={() => onAnswer(index)}
                  disabled={Boolean(myAnswer) || busy}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ScorePill label={myName} score={myScore} active />
            <ScorePill label={partnerName} score={partnerScore} active={playerIds.length > 1} />
          </div>
          {myAnswer ? <p className="rounded-xl bg-white/45 p-3 text-center text-sm font-bold text-primary">Answer locked. Waiting for the next question.</p> : null}
        </div>
      ) : null}

      {session?.status === "completed" ? (
        <QuizResult
          answers={answers}
          eggActive={eggActive}
          myName={myName}
          myScore={myScore}
          onNew={onNew}
          partnerName={partnerName}
          partnerScore={partnerScore}
          petName={petName}
          profileId={profileId}
          questions={questions}
          session={session}
        />
      ) : null}

      {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}
    </section>
  );
}

function QuizResult({
  answers,
  eggActive,
  myName,
  myScore,
  onNew,
  partnerName,
  partnerScore,
  petName,
  profileId,
  questions,
  session,
}: {
  answers: QuizAnswer[];
  eggActive: boolean;
  myName: string;
  myScore: number;
  onNew: () => Promise<void>;
  partnerName: string;
  partnerScore: number;
  petName: string | null;
  profileId: string | null;
  questions: ReturnType<typeof getQuizQuestions>;
  session: QuizSession;
}) {
  const resultTitle = myScore === partnerScore ? "Perfectly synced" : myScore > partnerScore ? `${myName} wins this round` : `${partnerName} wins this round`;
  const rewardCopy = eggActive ? "The egg felt your teamwork and gained hatch energy." : `${petName ?? "Your pet"} felt the bond and gained happiness.`;
  const bothCorrect = questions.filter((question) => {
    const first = answers.find((answer) => answer.question_id === question.id && answer.user_id === session.player_one_id);
    const second = answers.find((answer) => answer.question_id === question.id && answer.user_id === session.player_two_id);
    return first?.is_correct && second?.is_correct;
  }).length;
  const differentAnswers = questions
    .map((question) => {
      const mine = answers.find((answer) => answer.question_id === question.id && answer.user_id === profileId);
      const theirs = answers.find((answer) => answer.question_id === question.id && answer.user_id !== profileId);
      if (!mine || !theirs || mine.selected_index === theirs.selected_index) return null;
      return {
        id: question.id,
        question: question.question,
        mine: mine.selected_index === null ? "No answer" : question.options[mine.selected_index],
        theirs: theirs.selected_index === null ? "No answer" : question.options[theirs.selected_index],
      };
    })
    .filter((item): item is { id: string; question: string; mine: string; theirs: string } => Boolean(item))
    .slice(0, 3);

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-2xl bg-primary-container/70 p-5 text-center">
        <Trophy className="mx-auto text-primary" size={34} />
        <h3 className="mt-3 font-headline text-3xl font-bold text-primary">{resultTitle}</h3>
        <p className="mt-2 text-sm font-semibold text-on-primary-container/80">{rewardCopy}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ScorePill label={myName} score={myScore} active />
        <ScorePill label={partnerName} score={partnerScore} active />
      </div>
      <p className="rounded-xl bg-white/50 p-3 text-sm font-bold text-on-surface-variant">You both got {bothCorrect} questions right together.</p>
      {differentAnswers.length ? (
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-primary">Talk about these</h4>
          {differentAnswers.map((item) => (
            <div key={item.id} className="rounded-xl bg-white/50 p-3">
              <p className="text-sm font-bold">{item.question}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{myName}: {item.mine} · {partnerName}: {item.theirs}</p>
            </div>
          ))}
        </div>
      ) : null}
      <button className="soft-button w-full" onClick={onNew}>
        Clear result and start another lobby
      </button>
    </div>
  );
}

function ScorePill({ label, score, active }: { label: string; score: number; active: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-3 ${active ? "bg-white/60" : "bg-white/30 opacity-70"}`}>
      <p className="truncate text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 font-headline text-2xl font-bold text-primary">{score}</p>
    </div>
  );
}

function getScores(answers: QuizAnswer[], playerIds: string[]) {
  return playerIds.reduce<Record<string, number>>((scores, playerId) => {
    scores[playerId] = answers.filter((answer) => answer.user_id === playerId).reduce((total, answer) => total + answer.score, 0);
    return scores;
  }, {});
}
