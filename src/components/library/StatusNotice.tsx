import type { LibraryNote } from "@/library/schema";

type Status = LibraryNote["status"];

/**
 * The two status signals, kept deliberately distinct.
 *
 * `needs-review` means a sourcing claim is unsettled, and surfacing it is mandatory —
 * WISHLIST:141: "A library that presents an unverified rule as settled is worse than
 * no library." It gets the amber caution.
 *
 * `draft` describes the NOTE'S authoring state, not the correctness of the teaching.
 * All 29 letter notes are draft while those letters are taught in live lessons today,
 * so an alarm here would tell a student that material she has already been taught is
 * untrustworthy. It gets a quiet factual line.
 *
 * Note that `status` is NOT a publish signal in this vault and must never be used as
 * one — see the docblock at scripts/check-library.mjs:19-22.
 */
export function StatusNotice({ status, kind }: { status: Status; kind: "rule" | "letter" | "source" }) {
  if (status === "verified") return null;

  if (status === "needs-review") {
    return (
      <p role="note" className="mb-4 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-100/90">
        <strong className="font-semibold">Needs review.</strong>{" "}
        This {kind} is not yet verified against a vendored source. The note below records what is still missing.
      </p>
    );
  }

  return (
    <p role="note" className="mb-4 text-xs text-white/50">
      This note is not yet reviewed.
    </p>
  );
}
