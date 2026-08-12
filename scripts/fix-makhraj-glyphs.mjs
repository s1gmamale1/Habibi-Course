#!/usr/bin/env node
// Replaces the Arabic letters the image model draws wrong with real text.
//
// WHY
//
// `build-makhraj-points.mjs` asks the generator to letter each diagram. It gets
// ج ش ي, ت د ط, ق, ك, ض and ن right, and it consistently mis-draws **ل and ر**
// — both single-stroke letters, which is the irony — producing a teal hook that
// is not the letter. Re-rolling does not help: points 5 and 7 were regenerated
// and came back with the same malformed glyph, so it is a reproducible failure
// of the model rather than a bad sample.
//
// On a page whose entire job is teaching letterforms, a wrong letter is worse
// than no letter, so those two are not left to chance. The fix is deterministic:
// cover the drawn glyph and composite the real character, rendered from a system
// Arabic font through sharp. Text drawn this way cannot be mis-shaped.
//
// Only the images that need it are touched, and each entry says what it is
// covering. Coordinates are read off the render by eye — there is nothing to
// derive them from — so a regenerated image needs its numbers re-checked. That
// is why the chip is drawn in the label palette: if it ever lands in the wrong
// place it reads as an obviously misplaced label, not as anatomy.
import sharp from "sharp";

const DIR = "public/images/makhraj";

const FIXES = [
  {
    n: 5,
    letters: "ل",
    // The model's hook sits below the label box, over the neck. The chip is
    // sized to swallow it whole rather than to fit the letter.
    cover: { left: 726, top: 112, width: 110, height: 118 },
  },
  {
    n: 7,
    letters: "ر",
    // Same failure, over the navy field this time, so the chip blends in.
    cover: { left: 668, top: 130, width: 106, height: 96 },
  },
];

/** A label-box chip: dark fill, thin teal border, teal Arabic centred in it. */
function chip({ width, height }, letters) {
  const size = Math.round(Math.min(width, height) * 0.62);
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
       <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="14"
             fill="#0b1020" fill-opacity="0.96" stroke="#7fe3d4" stroke-width="2"/>
       <text x="${width / 2}" y="${height / 2 + size * 0.36}" text-anchor="middle"
             font-family="Geeza Pro, Al Bayan, Baghdad, sans-serif"
             font-size="${size}" fill="#7fe3d4">${letters}</text>
     </svg>`,
  );
}

for (const fix of FIXES) {
  const file = `${DIR}/lisan-${fix.n}.jpg`;
  const out = `${DIR}/lisan-${fix.n}.tmp.jpg`;
  await sharp(file)
    .composite([{ input: chip(fix.cover, fix.letters), left: fix.cover.left, top: fix.cover.top }])
    .jpeg({ quality: 90 })
    .toFile(out);
  await sharp(out).toFile(file).catch(async () => {
    // sharp refuses to write over the file it is reading, hence the temp hop.
    const { rename } = await import("node:fs/promises");
    await rename(out, file);
  });
  const { rm } = await import("node:fs/promises");
  await rm(out, { force: true });
  console.log(`  lisan-${fix.n}.jpg — ${fix.letters} redrawn as real text`);
}
