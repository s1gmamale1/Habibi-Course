import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Attempt } from "./types";

/**
 * The attempt ledger. The only thing in the app that writes practice history,
 * and it can only **append**.
 *
 * There is no `updateAttempt`, no `deleteAttempt`, no `clearAttempts`. That is
 * the design, not an omission: everything else the practice engine shows — due
 * queue, mastery band, practice density — is a pure function of this table, so
 * the table has to stay a faithful log of what actually happened. A retry is a
 * new row. A correction is a new row. Nothing here rewrites the past.
 *
 * It matters most for the duration-graded drills. `GhunnahTimer` grades a held
 * duration against a target, and what we want from it over weeks is the
 * *distribution* of holds — whether the learner is converging on two ḥarakāt or
 * drifting. Overwrite a row on retry and every session collapses to its last
 * sample, which is precisely the sample least likely to be representative.
 */

const DB_NAME = "habibi-practice";
const DB_VERSION = 1;
const STORE = "attempts";

interface PracticeDB extends DBSchema {
  attempts: {
    key: string;
    value: Attempt;
    indexes: {
      /** The scheduling key — deriving one concept's state must not scan the table. */
      conceptId: string;
      /** Chronological order; `derive()` folds attempts in the order they happened. */
      at: number;
    };
  };
}

/**
 * A connection per operation, closed straight after.
 *
 * A module-level cached handle would be the usual shape, but it would also be a
 * hidden piece of state that outlives a test and that only a `reset()` export
 * could clear — and a `reset()` on this module is exactly the kind of escape
 * hatch that erodes the append-only guarantee. Sessions write on the order of a
 * dozen rows, so an open per write costs nothing worth having state for.
 */
async function connect(): Promise<IDBPDatabase<PracticeDB>> {
  return openDB<PracticeDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (db.objectStoreNames.contains(STORE)) return;
      const store = db.createObjectStore(STORE, { keyPath: "id" });
      store.createIndex("conceptId", "conceptId");
      store.createIndex("at", "at");
    },
  });
}

/** Write one attempt. Never overwrites: a repeat id is an error, not an update. */
export async function appendAttempt(attempt: Attempt): Promise<void> {
  const db = await connect();
  try {
    // `add`, deliberately, not `put`. `put` is an upsert — it would silently
    // replace a row that already carried this id, which is the exact failure
    // this module exists to make impossible.
    await db.add(STORE, attempt);
  } finally {
    db.close();
  }
}

/**
 * Every attempt ever recorded, oldest first.
 *
 * Read through the `at` index rather than the store itself: the primary key is
 * a random UUID, so a plain `getAll` would come back in an order unrelated to
 * when anything happened, and `derive()` folds an ordered sequence.
 */
export async function allAttempts(): Promise<Attempt[]> {
  const db = await connect();
  try {
    return await db.getAllFromIndex(STORE, "at");
  } finally {
    db.close();
  }
}
