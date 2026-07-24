import type { Slide } from "@/content/schema";
import type { GameData } from "./derive";

export type DeckSlide = Slide | { kind: "games"; data: GameData };

// One games slide per lesson, right before homework (spec §3).
export function buildDeckSlides(slides: Slide[], data: GameData): DeckSlide[] {
  if (data.letterPool.length === 0 && data.wordPool.length === 0) return [...slides];
  const out: DeckSlide[] = [...slides];
  const games: DeckSlide = { kind: "games", data };
  const hw = out.findIndex((s) => s.kind === "homework");
  if (hw === -1) out.push(games);
  else out.splice(hw, 0, games);
  return out;
}
