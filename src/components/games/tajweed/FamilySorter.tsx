"use client";
import { useState } from "react";
import { lookupVerse } from "@/components/tajweed/verses";
import { RULE_META, type Family, type RuleId } from "@/content/tajweed";
import { registerGame, type GameResult } from "../GameRegistry";

/**
 * Drill 2 — Family Sorter. Several āyah fragments, one marked span each, and a
 * row of labelled buckets. The learner assigns every fragment to a family.
 *
 * **Why this is not `useSwapPuzzle`.** That hook models a fixed one-tile-per-slot
 * bijection — a permutation, where placing tile A in slot 3 necessarily evicts
 * whatever was there. This is an N-items-into-M-buckets assignment: many
 * fragments share a bucket, and a wrong drop must *return* the fragment rather
 * than swap it with something. A permutation cannot express that, so the state
 * here is a plain `itemId → bucketId` map of the placements made so far.
 *
 * **Why the fragments are not rendered with `TajweedText`.** `TajweedText`
 * paints a span in the rule's palette colour and underlines it with
 * `UNDERLINE[family]` — the family *is* the answer here, so painting it would
 * hand the learner the answer in two redundant channels at once. (The same
 * leak is harmless in `RuleIdentifier`, where every choice is same-family and
 * so shares one underline style; here the argument inverts.) The marked span
 * gets a neutral ring instead, identical for every family.
 *
 * **Why the buckets are families and not the four noon rules.** Iẓhār has no
 * `RuleId` and never will: it is the *absence* of a rule, so the corpus marks
 * no span for it and a coloured-span fragment for iẓhār would be identifiable
 * by having nothing marked at all. Families are what the data can pose
 * honestly. A hand-authored noon round can still be built — pass `buckets`
 * explicitly and give each item a `bucket`, with `rule` omitted for the iẓhār
 * fragments.
 */

const GAME_ID = "family-sorter";

export type Bucket = { id: string; label: string; ar?: string };

type ItemBase = {
  /** Stable identity — the React key and the placement-map key. */
  id: string;
  /** The fragment, marks and all. Never pass this through `stripDiacritics`. */
  text: string;
  /** The span being asked about, as offsets into `text`. */
  spanStart: number;
  spanEnd: number;
};

/**
 * An item declares a rule, a bucket, or both. The union makes "neither" a type
 * error, because an item with neither has no right answer to check against.
 */
export type SorterItem = ItemBase &
  ({ rule: RuleId; bucket?: string } | { rule?: RuleId; bucket: string });

/** Canonical bucket order — stable across rounds, so the layout is learnable. */
const FAMILY_ORDER: readonly Family[] = ["madd", "ghunnah", "idgham", "ikhfa", "qalqalah", "silent"];

/** The silent gloss follows `RULE_META.silent`, rather than inventing a term. */
const FAMILY_BUCKET: Record<Family, Bucket> = {
  madd: { id: "madd", label: "Madd", ar: "مد" },
  ghunnah: { id: "ghunnah", label: "Ghunnah", ar: "غنة" },
  idgham: { id: "idgham", label: "Idghām", ar: "إدغام" },
  ikhfa: { id: "ikhfa", label: "Ikhfāʾ", ar: "إخفاء" },
  qalqalah: { id: "qalqalah", label: "Qalqalah", ar: "قلقلة" },
  silent: { id: "silent", label: "Silent", ar: "حرف ساكن" },
};

/** The one bucket an item belongs in. Every rule has exactly one family. */
export function bucketOf(item: SorterItem): string {
  return item.bucket ?? RULE_META[item.rule!].family;
}

/**
 * The buckets a set of items needs, in canonical order. Only families are
 * derived; a round using bucket ids of its own (`izhar`) passes `buckets`.
 */
export function bucketsFor(items: SorterItem[]): Bucket[] {
  const present = new Set(items.map(bucketOf));
  return FAMILY_ORDER.filter((f) => present.has(f)).map((f) => FAMILY_BUCKET[f]);
}

/**
 * Expand a span to whole words and re-base its offsets, so a fragment is a
 * readable card rather than a whole āyah. Slicing at spaces is safe: no
 * combining mark ever attaches across one, so no cluster can be split.
 */
export function wordWindow(
  text: string,
  start: number,
  end: number,
): { text: string; spanStart: number; spanEnd: number } {
  const from = text.lastIndexOf(" ", start) + 1;
  const cut = text.indexOf(" ", end);
  const to = cut === -1 ? text.length : cut;
  return { text: text.slice(from, to), spanStart: start - from, spanEnd: end - from };
}

/* ---------- deterministic shuffling ----------------------------------- */

/**
 * Seeded and computed during render, never in an effect — the same guard
 * `RuleIdentifier` documents, for the same reason (`0b09f21`): a shuffle in an
 * effect leaves one frame where state disagrees with props, and disagrees
 * between server and client too. Order is a pure function of the item ids.
 *
 * These two helpers are duplicated from `RuleIdentifier`, which keeps them
 * module-private. Extracting them into a shared module is worth doing once a
 * third drill needs them; that file is owned by another session right now.
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

/* ---------- one fragment card ----------------------------------------- */

type CardState = "idle" | "selected" | "wrong" | "correct";

function Card({
  item,
  state,
  onSelect,
}: {
  item: SorterItem;
  state: CardState;
  onSelect: () => void;
}) {
  const locked = state === "correct";
  return (
    <button
      type="button"
      data-testid={`fragment-${item.id}`}
      data-state={state}
      aria-pressed={locked ? undefined : state === "selected"}
      // The lock is announced, not just coloured — ✓ alone is a visual channel.
      aria-label={locked ? `${item.text} — correct` : undefined}
      disabled={locked}
      onClick={onSelect}
      className={`rounded-2xl border px-3 py-2 text-white transition ${
        locked
          ? "game-correct"
          : state === "selected"
            ? "border-white/70 bg-white/15"
            : state === "wrong"
              ? "border-red-400/60 bg-red-500/10"
              : "border-white/15 bg-white/5"
      } ${state === "wrong" ? "game-shake" : ""}`}
    >
      <span className="quran arabic text-3xl leading-loose" dir="rtl" lang="ar">
        {item.text.slice(0, item.spanStart)}
        {/* Neutral, class-only marking: no palette colour, no family underline. */}
        <span
          data-target="true"
          className="rounded-md bg-white/15 px-0.5 underline decoration-white/60 decoration-2 underline-offset-4"
        >
          {item.text.slice(item.spanStart, item.spanEnd)}
        </span>
        {item.text.slice(item.spanEnd)}
      </span>
      {locked && (
        <span aria-hidden="true" className="ms-2 text-green-300">
          ✓
        </span>
      )}
    </button>
  );
}

/* ---------- the drill -------------------------------------------------- */

export function FamilySorter({
  items,
  buckets,
  onResult,
  now = () => Date.now(),
}: {
  items: SorterItem[];
  /** Explicit buckets, for rounds whose categories are not families. */
  buckets?: Bucket[];
  onResult?: (r: GameResult) => void;
  /** Injected clock, so scoring stays free of ambient time. */
  now?: () => number;
}) {
  /**
   * Placement state is keyed by item id, so a parent swapping `items` in place
   * would carry stale placements over. Remount with `key` when the round
   * changes rather than mutating the prop.
   */
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [missed, setMissed] = useState<string[]>([]);
  const [note, setNote] = useState<{ kind: "right" | "wrong"; bucket: Bucket; item: string } | null>(
    null,
  );

  const bucketList = buckets ?? bucketsFor(items);
  const order = seededShuffle(items, hashSeed(items.map((i) => i.id).join("|")));
  const unplaced = order.filter((i) => !placed[i.id]);
  const allPlaced = items.length > 0 && unplaced.length === 0;

  function drop(bucket: Bucket) {
    const item = items.find((i) => i.id === selected);
    if (!item || placed[item.id]) return;
    const correct = bucketOf(item) === bucket.id;

    onResult?.({ gameId: GAME_ID, ruleId: item.rule, correct, at: now() });
    setSelected(null);
    setNote({ kind: correct ? "right" : "wrong", bucket, item: item.id });
    if (correct) setPlaced((p) => ({ ...p, [item.id]: bucket.id }));
    else setMissed((m) => (m.includes(item.id) ? m : [...m, item.id]));
  }

  function stateOf(item: SorterItem): CardState {
    if (placed[item.id]) return "correct";
    if (selected === item.id) return "selected";
    if (note?.kind === "wrong" && note.item === item.id) return "wrong";
    return "idle";
  }

  if (items.length === 0) return <p className="text-white/50">No fragments to sort yet.</p>;

  return (
    <div data-testid="family-sorter" data-complete={allPlaced ? "true" : "false"}>
      <p className="mb-4 text-center text-white/80">
        Pick a fragment, then the family of the rule marked in it.
      </p>

      <div
        role="group"
        aria-label="fragments"
        className="mb-6 flex min-h-16 flex-wrap justify-center gap-3"
      >
        {unplaced.map((item) => (
          // Keyed by the miss count so a repeat wrong drop restarts the shake.
          <Card
            key={`${item.id}-${missed.includes(item.id) ? "m" : ""}${note?.item === item.id ? 1 : 0}`}
            item={item}
            state={stateOf(item)}
            onSelect={() => setSelected(item.id)}
          />
        ))}
        {unplaced.length === 0 && <p className="text-sm text-white/40">Every fragment is sorted.</p>}
      </div>

      <div role="group" aria-label="buckets" className="grid gap-3 sm:grid-cols-2">
        {bucketList.map((b) => {
          const inside = items.filter((i) => placed[i.id] === b.id);
          return (
            <div key={b.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <button
                type="button"
                data-bucket={b.id}
                data-testid={`bucket-${b.id}`}
                aria-label={`Place in ${b.label}`}
                disabled={!selected}
                onClick={() => drop(b)}
                className={`w-full rounded-xl border px-3 py-2 text-white transition ${
                  selected ? "border-white/40 bg-white/10" : "border-white/10 opacity-60"
                }`}
              >
                <span>{b.label}</span>
                {b.ar && (
                  <span className="arabic ms-2 text-white/60" dir="rtl" lang="ar">
                    {b.ar}
                  </span>
                )}
              </button>

              <ul data-testid={`placed-${b.id}`} className="mt-3 flex flex-wrap gap-2">
                {inside.map((item) => (
                  <li key={item.id}>
                    <Card item={item} state="correct" onSelect={() => {}} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* One live region: the outcome in words, never colour alone. */}
      <p role="status" className="mt-4 min-h-6 text-center text-sm">
        {allPlaced ? (
          <span className="text-green-300">
            ✓ Round complete — {items.length - missed.length} of {items.length} on the first try.
          </span>
        ) : note?.kind === "right" ? (
          <span className="text-green-300">✓ {note.bucket.label} — correct.</span>
        ) : note?.kind === "wrong" ? (
          <span className="text-amber-300">✗ Not {note.bucket.label} — try another family.</span>
        ) : (
          ""
        )}
      </p>
    </div>
  );
}

/* ---------- registration ----------------------------------------------- */

/**
 * Six real fragments over four families, drawn from the bundled surahs. Two of
 * them are ikhfāʾ and two idghām, with different sub-rules inside each bucket —
 * so the round cannot be solved by dealing one card per bucket, and sorting it
 * is exactly the lesson: the family is what the sound *does*, not which letter
 * triggered it.
 */
const DEFAULT_SPECS = [
  [106, 4, "ikhfa"],
  [105, 4, "ikhfa_shafawi"],
  [106, 4, "idghaam_shafawi"],
  [112, 4, "idghaam_no_ghunnah"],
  [108, 1, "ghunnah"],
  [105, 2, "qalqalah"],
] as const;

const DEFAULT_ITEMS: SorterItem[] = DEFAULT_SPECS.flatMap(([surah, ayah, rule]) => {
  const verse = lookupVerse(surah, ayah);
  const span = verse?.spans.find((s) => s.rules[0] === rule);
  if (!verse || !span) return [];
  return [
    {
      id: `${surah}:${ayah}:${span.start}`,
      ...wordWindow(verse.text, span.start, span.end),
      rule: rule as RuleId,
    },
  ];
});

registerGame({
  id: GAME_ID,
  label: "🗂️ Sort by family",
  render: ({ onResult }) => <FamilySorter items={DEFAULT_ITEMS} onResult={onResult} />,
});
