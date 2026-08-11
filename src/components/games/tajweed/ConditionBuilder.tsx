"use client";
import { useState } from "react";
import { RULE_META, type RuleId } from "@/content/tajweed";
import { siblingRules } from "@/games/tajweed";
import { registerGame, type GameResult } from "../GameRegistry";

/**
 * Drill 6 — Condition Builder. A rule stated as a five-part sentence:
 *
 * > nūn sākin or tanwīn · followed by ب · → iqlāb · pronounced as a hidden meem
 * > at the lips · for 2 counts of ghunnah
 *
 * The learner assembles that sentence from shuffled labelled tiles.
 *
 * **Why this is not `useBuildPuzzle`, which it visibly resembles.** The
 * slot-and-bank mechanic is worth stealing; the hook itself is not usable here.
 * Its `pickDecoys` calls `displayLetters` and reasons about *glyphs* — which
 * letter is written where — and a tile in this drill is an English clause. Its
 * bank is also shuffled inside an effect (`useBuildPuzzle.ts:56-67`, with an
 * eslint suppression for exactly that), the pattern that caused `0b09f21`.
 * Everything here is derived during render from a seed, so there is no frame in
 * which state disagrees with props, and the file itself is left untouched.
 *
 * **Decoys are neighbours, never nonsense.** For iqlāb the tempting wrong rule
 * name is *ikhfāʾ*, the tempting wrong sound is *"hidden — between iẓhār and
 * idghām"*, and the tempting wrong length is *"no ghunnah at all"* — each one is
 * something a rule in this very set really says. A decoy nobody could believe
 * teaches nothing, so the pool is other taught chains (same-family siblings
 * first) plus, for lengths, the counts the tradition actually transmits.
 *
 * **Slots fill left to right, and the open one is labelled.** Each slot shows a
 * neutral hint — "what you see", "what follows", "the rule", "how it sounds",
 * "how long" — so asking for the parts in order is a fair question rather than
 * a guessing game. Two kinds of mistake get two different answers: a tile that
 * belongs to a later slot is *misplaced*, a decoy is *not part of the rule at
 * all*. Both bounce back to the bank; neither ends the round.
 */

const GAME_ID = "condition-builder";

export type SlotRole = "trigger" | "condition" | "rule" | "sound" | "length";

export type ChainSlot = { role: SlotRole; label: string };

export type ConditionChain = {
  rule: RuleId;
  /** The sentence, in reading order. Always the five roles, in this order. */
  slots: ChainSlot[];
};

export type Tile = {
  /** Stable identity — React key and click target. */
  id: string;
  role: SlotRole;
  label: string;
  /** The slot this tile belongs in, or `null` for a decoy. */
  slot: number | null;
};

/** What the empty slot asks for. Deliberately generic — it names no rule. */
const ROLE_HINT: Record<SlotRole, string> = {
  trigger: "what you see",
  condition: "what follows",
  rule: "the rule",
  sound: "how it sounds",
  length: "how long",
};

/**
 * Every length the tradition transmits, as extra decoy candidates for the
 * length slot. A learner who has met madd knows 4 and 6 are real counts, so
 * offering one of them is a genuine question; offering "9 counts" would not be.
 */
export const LENGTH_LADDER = [
  "2 counts of ghunnah",
  "4 counts of ghunnah",
  "6 counts of ghunnah",
  "no ghunnah at all",
];

/* ---------- the chains -------------------------------------------------- */

function chain(rule: RuleId, trigger: string, condition: string, sound: string, length: string) {
  return {
    rule,
    slots: [
      { role: "trigger", label: trigger },
      { role: "condition", label: condition },
      // The rule's own name, from RULE_META — never a paraphrase invented here.
      { role: "rule", label: RULE_META[rule].translit },
      { role: "sound", label: sound },
      { role: "length", label: length },
    ],
  } satisfies ConditionChain;
}

/**
 * The six rules of the nūn sākinah and mīm sākinah groups, worded from
 * `library/02-Rules/`. They are drilled together because they are each other's
 * best decoys: all six begin with a sākin letter, four of them share a trigger,
 * and five of them share a length — so a learner cannot solve one by
 * recognising its shape. Iẓhār is absent for the reason `FamilySorter` gives:
 * it is the absence of a rule and has no `RuleId`.
 */
export const DEFAULT_CHAINS: ConditionChain[] = [
  chain(
    "iqlab",
    "nūn sākin or tanwīn",
    "followed by ب",
    "as a hidden meem at the lips",
    "2 counts of ghunnah",
  ),
  chain(
    "ikhfa",
    "nūn sākin or tanwīn",
    "followed by one of the 15 letters",
    "hidden — between iẓhār and idghām",
    "2 counts of ghunnah",
  ),
  chain(
    "idghaam_ghunnah",
    "nūn sākin or tanwīn",
    "followed by ي ن م و starting the next word",
    "merged into the letter that follows",
    "2 counts of ghunnah",
  ),
  chain(
    "idghaam_no_ghunnah",
    "nūn sākin or tanwīn",
    "followed by ل or ر starting the next word",
    "merged, with the nasal dropped",
    "no ghunnah at all",
  ),
  chain(
    "ikhfa_shafawi",
    "mīm sākin",
    "followed by ب",
    "concealed, with the lips lightly touching",
    "2 counts of ghunnah",
  ),
  chain(
    "idghaam_shafawi",
    "mīm sākin",
    "followed by م",
    "merged into one doubled meem",
    "2 counts of ghunnah",
  ),
];

export function chainOf(rule: RuleId): ConditionChain | undefined {
  return DEFAULT_CHAINS.find((c) => c.rule === rule);
}

/* ---------- decoys ------------------------------------------------------ */

/**
 * The other chains, same-family siblings first.
 *
 * `siblingRules` is the right starting point but not the whole answer here: it
 * pads a small family out to three with whatever `TAJWEED_RULES` lists next, so
 * `siblingRules("ikhfa")` ends `["ikhfa_shafawi", "hamzat_wasl", "madd_2"]`.
 * Offering *Hamzat al-Waṣl* as the rule for a nūn sākin before ب is not a
 * question, it is a giveaway. Intersecting with the drilled set keeps the
 * padding out; falling back to the rest of the set keeps a rule whose family has
 * no sibling here — iqlāb, whose only family-mate is plain ghunnah — supplied
 * with the neighbours it is genuinely confused with instead.
 */
function neighbourChains(rule: RuleId, chains: readonly ConditionChain[]): ConditionChain[] {
  const others = chains.filter((c) => c.rule !== rule);
  const sibs = new Set(siblingRules(rule));
  return [...others.filter((c) => sibs.has(c.rule)), ...others.filter((c) => !sibs.has(c.rule))];
}

/** Rule-name decoys, most confusable first. */
export function ruleDecoys(rule: RuleId, chains: readonly ConditionChain[]): RuleId[] {
  return neighbourChains(rule, chains).map((c) => c.rule);
}

/** Candidate labels for one slot, most confusable first, answer excluded. */
function decoyPool(
  chain: ConditionChain,
  slot: ChainSlot,
  chains: readonly ConditionChain[],
): string[] {
  const fromNeighbours = neighbourChains(chain.rule, chains).flatMap(
    (c) => c.slots.find((s) => s.role === slot.role)?.label ?? [],
  );
  const extra = slot.role === "length" ? LENGTH_LADDER : [];
  return [...new Set([...fromNeighbours, ...extra])].filter((label) => label !== slot.label);
}

/**
 * One decoy per slot, so no slot is answerable by elimination and every one of
 * them poses a real choice. The head of the pool is taken rather than a random
 * member: the most confusable neighbour is the decoy worth asking about, and
 * varying it would only make the drill easier some rounds than others.
 */
export function decoysFor(chain: ConditionChain, chains: readonly ConditionChain[]): Tile[] {
  return chain.slots.flatMap((slot) => {
    const [label] = decoyPool(chain, slot, chains);
    return label ? [{ id: `decoy-${slot.role}`, role: slot.role, label, slot: null }] : [];
  });
}

/* ---------- deterministic shuffling ------------------------------------ */

/**
 * Seeded and computed during render, never in an effect — the guard
 * `RuleIdentifier` and `FamilySorter` both document, for the same reason
 * (`0b09f21`). Order is a pure function of the chain, so the server and the
 * browser agree and no frame exists in which state disagrees with props.
 */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  let s = seed >>> 0 || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The real tiles plus their decoys, in a stable shuffled order. */
export function bankFor(chain: ConditionChain, chains: readonly ConditionChain[]): Tile[] {
  const real: Tile[] = chain.slots.map((slot, i) => ({
    id: `slot-${i}`,
    role: slot.role,
    label: slot.label,
    slot: i,
  }));
  return seededShuffle([...real, ...decoysFor(chain, chains)], hashSeed(`bank|${chain.rule}`));
}

/* ---------- one chain ---------------------------------------------------- */

type Note =
  | { kind: "right" }
  | { kind: "misplaced"; role: SlotRole }
  | { kind: "decoy" }
  | null;

function Round({
  chain,
  chains,
  onResult,
  now,
  onNext,
  onScored,
}: {
  chain: ConditionChain;
  chains: readonly ConditionChain[];
  onResult?: (r: GameResult) => void;
  now: () => number;
  onNext: () => void;
  onScored: (firstTry: boolean) => void;
}) {
  /** Slot index → the tile id locked into it. Only correct tiles ever land. */
  const [placed, setPlaced] = useState<Record<number, string>>({});
  const [missed, setMissed] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [shake, setShake] = useState<{ id: string; n: number } | null>(null);

  const bank = bankFor(chain, chains);
  const filled = Object.keys(placed).length;
  const active = filled < chain.slots.length ? filled : -1;
  const complete = active === -1;
  const meta = RULE_META[chain.rule];

  function place(t: Tile) {
    if (complete) return;
    const correct = t.slot === active;
    onResult?.({ gameId: GAME_ID, ruleId: chain.rule, correct, at: now() });
    if (correct) {
      setNote({ kind: "right" });
      setShake(null);
      if (filled + 1 === chain.slots.length) onScored(!missed);
      setPlaced((p) => ({ ...p, [active]: t.id }));
      return;
    }
    setMissed(true);
    setShake({ id: t.id, n: (shake?.n ?? 0) + 1 });
    // A tile from a later slot is a sequencing slip; a decoy is a real error.
    setNote(
      t.slot === null
        ? { kind: "decoy" }
        : { kind: "misplaced", role: chain.slots[active].role },
    );
  }

  return (
    <div data-testid="condition-builder" data-complete={complete ? "true" : "false"}>
      <p data-testid="condition-prompt" className="mb-5 text-center text-white/80">
        Build the rule one part at a time. The open slot says which part it wants.
      </p>

      <ol className="mb-6 flex flex-wrap items-stretch justify-center gap-2">
        {chain.slots.map((slot, i) => {
          const done = placed[i] !== undefined;
          const isActive = i === active;
          return (
            <li
              key={slot.role}
              data-slot={i}
              data-role={slot.role}
              data-state={done ? "correct" : "empty"}
              data-active={isActive ? "true" : undefined}
              className={`flex min-w-36 flex-col justify-center rounded-2xl border px-3 py-2 text-sm ${
                done
                  ? "game-correct"
                  : isActive
                    ? "border-white/70 border-dashed bg-white/10"
                    : "border-white/15 bg-white/5"
              }`}
            >
              {/* The hint is always visible, so the ask is legible with the
                  slot empty and the answer is still readable once filled. */}
              <span className="text-[0.65rem] uppercase tracking-wide text-white/50">
                {ROLE_HINT[slot.role]}
                {isActive && <span className="ms-1 text-white/80">← open</span>}
              </span>
              <span className="mt-1 text-white">
                {done ? slot.label : <span className="text-white/30">—</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <div role="group" aria-label="parts" className="flex flex-wrap justify-center gap-2">
        {bank.map((t) => {
          const used = t.slot !== null && placed[t.slot] === t.id;
          if (used) return null;
          const shaking = shake?.id === t.id;
          return (
            <button
              // Keyed by the shake count so a repeat wrong tap restarts it.
              key={`${t.id}-${shaking ? shake!.n : 0}`}
              type="button"
              data-testid={`tile-${t.id}`}
              data-state={shaking ? "wrong" : undefined}
              disabled={complete}
              onClick={() => place(t)}
              className={`rounded-2xl border px-3 py-2 text-sm text-white transition ${
                shaking ? "border-red-400/60 bg-red-500/10 game-shake" : "border-white/15 bg-white/5"
              } ${complete ? "opacity-50" : ""}`}
            >
              {t.label}
              {shaking && (
                <span aria-hidden="true" className="ms-2">
                  ✗
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* One live region, and the state is always in words — never colour alone. */}
      <p role="status" className="mx-auto mt-5 min-h-6 max-w-lg text-center text-sm">
        {complete ? (
          <span className="text-green-300">
            ✓ Complete — {meta.translit} ({meta.en}) <span className="arabic">{meta.ar}</span>
          </span>
        ) : note?.kind === "right" ? (
          <span className="text-green-300">✓ Right — next part.</span>
        ) : note?.kind === "decoy" ? (
          <span className="text-amber-300">✗ Not part of this rule — put it back.</span>
        ) : note?.kind === "misplaced" ? (
          <span className="text-amber-300">
            ✗ That part comes later — this slot wants {ROLE_HINT[note.role]}.
          </span>
        ) : (
          ""
        )}
      </p>

      {complete && (
        <div className="text-center">
          <button type="button" className="cta-primary mt-3 rounded-full px-4 py-2" onClick={onNext}>
            Next rule →
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- the drill ---------------------------------------------------- */

export function ConditionBuilder({
  chains = DEFAULT_CHAINS,
  onResult,
  now = () => Date.now(),
}: {
  chains?: ConditionChain[];
  onResult?: (r: GameResult) => void;
  /** Injected clock, so scoring stays free of ambient time. */
  now?: () => number;
}) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState({ right: 0, asked: 0 });

  if (chains.length === 0) return <p className="text-white/50">Nothing to build yet.</p>;
  const chain = chains[round % chains.length];

  return (
    <div>
      <Round
        // Remount per round: per-chain state is discarded, not reset in an
        // effect — the guard the plan requires after `0b09f21`.
        key={round}
        chain={chain}
        // Decoys always come from the full taught set, even when a lesson
        // drills one rule: a bank built from a single chain would have none.
        chains={DEFAULT_CHAINS}
        onResult={onResult}
        now={now}
        onNext={() => setRound((r) => r + 1)}
        onScored={(firstTry) =>
          setScore((s) => ({ right: s.right + (firstTry ? 1 : 0), asked: s.asked + 1 }))
        }
      />
      {score.asked > 0 && (
        <p className="mt-3 text-center text-xs text-white/50">
          First-try score: {score.right} / {score.asked}
        </p>
      )}
    </div>
  );
}

/* ---------- registration -------------------------------------------------- */

registerGame({
  id: GAME_ID,
  label: "🧩 Build the rule",
  render: ({ onResult }) => <ConditionBuilder chains={DEFAULT_CHAINS} onResult={onResult} />,
});
