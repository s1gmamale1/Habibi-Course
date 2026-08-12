#!/usr/bin/env node
// Generates the ten tongue-makhraj diagrams with the codex CLI's image tool.
//
// WHY THIS EXISTS
//
// 18 of the 29 letters issue from the tongue, and every one of them pointed at
// `lisan.jpg` — one image whose teal highlight covers the WHOLE tongue. So ك
// (back), ض (side) and ت (tip) looked identical to a learner. This is the
// image half of ROADMAP Phase 7a; the data half is `makhraj_point` in the
// library notes, and the two are joined by `src/content/makhraj.ts`.
//
// HOW THE IMAGES ARE MADE
//
// `codex exec` with the model-side `image_gen.imagegen` tool. It is not a CLI
// subcommand and does not appear in `codex --help`, which is why it looks
// absent until you ask the agent directly. The two existing rasters are passed
// as style references with `-i` so the ten land in the same visual language as
// `lisan.jpg` and `halq-zones.jpg` rather than beside it.
//
// The prompt goes in on **stdin**, not as an argument: `-i` is variadic and
// swallows a trailing positional prompt as another filename.
//
// TWO PLACES THE FRAMING HAD TO CHANGE, AND WHY
//
// 1. ض (point 4) is a LATERAL articulation — the side edges of the tongue
//    against the upper molars. A mid-sagittal section is a slice down the
//    midline and physically cannot show a side contact, so putting a marker on
//    the midline for ض would be a confident-looking lie about the hardest
//    letter in the alphabet. It gets an oblique cutaway instead.
// 2. Points 6-10 all sit on the tongue tip, millimetres apart. At the wide
//    framing of points 1-5 they would be five near-identical images, which is
//    the exact failure this whole exercise exists to end. They get a close
//    framing on the front of the mouth.
//
// Regenerating is deliberate, not idempotent: the model returns a new render
// each run, so `npm run build:makhraj` will not reproduce a byte-identical set.
// Run it when a point is wrong, not as part of a build.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const OUT_DIR = "public/images/makhraj";
const REFS = [`${OUT_DIR}/lisan.jpg`, `${OUT_DIR}/halq-zones.jpg`];

/** The wide mid-sagittal framing that points 1-5 share with the references. */
const WIDE =
  "photorealistic 3D medical illustration of a mid-sagittal (side-cut) human head showing mouth, tongue, teeth, palate and throat; the head faces LEFT; deep navy (#0b1a3a) background fills the left and lower area; the tongue is tinted bright teal/turquoise";

/** Close on the front of the mouth, for the five contacts that share the tip. */
const CLOSE =
  "photorealistic 3D medical illustration, mid-sagittal (side-cut) CLOSE-UP of the FRONT of the mouth — the lips, the upper and lower incisors, the gums and the tongue TIP fill the frame; the head faces LEFT; deep navy (#0b1a3a) background; the tongue is tinted bright teal/turquoise";

/** Oblique, because a midline slice cannot show a side-edge contact. */
const OBLIQUE =
  "photorealistic 3D medical illustration, OBLIQUE three-quarter cutaway of the mouth seen from the front-left so that the UPPER MOLARS along one side and the SIDE EDGE of the tongue are both clearly visible; deep navy (#0b1a3a) background; the tongue is tinted bright teal/turquoise";

const POINTS = [
  { n: 1, view: WIDE, name: "Aqsa al-Lisan — deepest", letters: "ق",
    anatomy: "the DEEPEST/rearmost part of the tongue pressing up against the SOFT PALATE directly above it",
    caption: "the back of the tongue rises to the soft palate" },
  { n: 2, view: WIDE, name: "Aqsa — just forward of qaf", letters: "ك",
    anatomy: "the deep part of the tongue a little FORWARD of the qaf point, pressing against the HARD PALATE",
    caption: "the same deep tongue, one step further forward than ق" },
  { n: 3, view: WIDE, name: "Wasat al-Lisan — the middle", letters: "ج ش ي",
    anatomy: "the MIDDLE of the tongue rising against the roof of the mouth (the palate) directly above it",
    caption: "the middle of the tongue meets the palate above it" },
  { n: 4, view: OBLIQUE, name: "Hafat al-Lisan — the side", letters: "ض",
    anatomy: "one SIDE EDGE of the tongue pressing outward against the inside faces of the UPPER MOLARS on that side — a lateral contact along the tongue's edge, not on its midline",
    caption: "the only letter made with the SIDE of the tongue" },
  { n: 5, view: WIDE, name: "Adna al-Hafah — edge to tip", letters: "ل",
    anatomy: "the tongue's EDGE running from its rear side forward to the TIP, meeting the GUMS above the upper front teeth",
    caption: "a long contact: the tongue's edge sweeps forward to the tip" },
  { n: 6, view: CLOSE, name: "Tip — the gums, below lam", letters: "ن",
    anatomy: "the TIP of the tongue against the GUMS just above the two upper front incisors, slightly BELOW the lam contact",
    caption: "the tip on the gum ridge — with resonance in the nose" },
  { n: 7, view: CLOSE, name: "Tip — deeper than nun", letters: "ر",
    anatomy: "the BACK of the tongue TIP, curled slightly, against the GUMS of the upper incisors — a little DEEPER into the mouth than the nun contact",
    caption: "the tip curls back a little further than ن" },
  { n: 8, view: CLOSE, name: "Tip — roots of the incisors", letters: "ت د ط",
    anatomy: "the TIP of the tongue pressed against the ROOTS of the two upper front incisors, where tooth meets gum",
    caption: "the tip meets the roots of the upper front teeth" },
  { n: 9, view: CLOSE, name: "Tip — between the incisors", letters: "ص س ز",
    anatomy: "the TIP of the tongue placed BETWEEN the upper and lower front incisors, closer to the LOWER ones, leaving a narrow gap for a whistling airstream",
    caption: "a narrow channel between the teeth — the whistling letters" },
  { n: 10, view: CLOSE, name: "Tip — edges of the incisors", letters: "ث ذ ظ",
    anatomy: "the TIP of the tongue against the LOWER EDGES of the two upper front incisors, protruding slightly between the teeth",
    caption: "the tip touches the edges of the upper teeth" },
];

function promptFor(p) {
  return `Use your image_gen tool to create ONE 900x900 image and save it to ${OUT_DIR}/lisan-${p.n}.jpg (JPEG).

Match the style of the attached reference images: ${p.view}.

Subject: the ${p.n}${p.n === 1 ? "st" : p.n === 2 ? "nd" : p.n === 3 ? "rd" : "th"} of the ten tongue makharij in Arabic tajweed — ${p.anatomy}. Highlight ONLY that contact zone in saturated magenta/pink with a soft glow; leave the rest of the tongue teal. Draw a thin white leader line from that zone to a dark rounded label box with a thin teal border containing the bold white English text: ${p.name}
Below that line, in teal, the Arabic letters: ${p.letters}

Bottom left, small white caption text: Tongue point ${p.n} of 10 — ${p.caption}

Render all text crisply and spell it exactly as given. Anatomical accuracy matters more than decoration. Save the file, then report the path.`;
}

const only = process.argv.slice(2).map(Number).filter(Boolean);
for (const p of POINTS) {
  if (only.length && !only.includes(p.n)) continue;
  const out = `${OUT_DIR}/lisan-${p.n}.jpg`;
  process.stdout.write(`point ${p.n} (${p.letters}) … `);
  try {
    execFileSync(
      "codex",
      ["exec", "--skip-git-repo-check", "-s", "workspace-write", "-i", ...REFS, "-"],
      { input: promptFor(p), stdio: ["pipe", "ignore", "ignore"], timeout: 600_000 },
    );
  } catch {
    /* fall through to the existence check — a non-zero exit with a written
       file is still a usable render, and a clean exit with none is not. */
  }
  console.log(existsSync(out) ? `wrote ${out}` : `FAILED — no ${out}`);
}
