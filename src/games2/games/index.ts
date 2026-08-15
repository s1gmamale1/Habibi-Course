// Side-effect barrel. `./tajweed` in the old tree records what happens without
// one: seven drills sat dead for weeks because nothing outside their own tests
// imported them, and every test passed the whole time.
import "./brokenForm";
import "./matchAnswer";
import "./buildByForm";

export const SLICE_GAME_IDS = ["broken-form", "match-answer", "build-by-form"] as const;
