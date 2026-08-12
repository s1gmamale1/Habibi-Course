/**
 * Side-effect barrel for the six letter drills, the twin of `./tajweed`.
 *
 * Unlike that one this barrel is not the *only* thing keeping the drills alive:
 * `GamePanel` already imports all five modules by name for its literal tab list,
 * so their `registerGame(...)` calls fire wherever the panel is loaded. It exists
 * for the two things that import does not give — a single named import site the
 * registry's readers can point at, and one list of the ids so nothing has to
 * hand-copy them — and as insurance for the day the literal tab list goes away,
 * which is exactly the change that would otherwise silently un-register all six.
 *
 * `./tajweed` records what that costs: seven drills sat dead for weeks because
 * nothing outside their own tests imported them, and the tests passed the whole
 * time. `letters.test.tsx` guards this one by importing the *page* rather than
 * this file, so it proves the app loads them and not merely that the barrel does.
 *
 * Import it for its side effects only — `import "@/components/games/letters"`.
 */
import "./Flashcards";
import "./LetterQuiz";
import "./FormSwap";
import "./SpotTheLetter";
import "./WordBuilder";

/**
 * Every drill id this barrel registers.
 *
 * Deliberately separate from `TAJWEED_GAME_IDS`: they are two different sets
 * behind two different barrels, and the test that pins the tajweed set at seven
 * is asserting that all seven of *those* are reachable, not that the registry
 * has seven entries in it.
 *
 * Two flashcard ids rather than one `flashcards`, because the decks drill
 * different concepts — a letter is one of the 47 the scheduler tracks, a word is
 * not. See `Flashcards.tsx`.
 */
export const LETTER_GAME_IDS = [
  "letter-flashcards",
  "word-flashcards",
  "letter-quiz",
  "form-swap",
  "spot-the-letter",
  "word-builder",
] as const;
