import fs from "node:fs";
import path from "node:path";

const urls = new Map(); // url -> kind
function walk(node) {
  if (Array.isArray(node)) return node.forEach(walk);
  if (node && typeof node === "object") {
    if (node.type === "qari-clip" && node.url) urls.set(node.url, "audio");
    else if (node.type === "youtube-cue" && node.videoId) urls.set(`https://www.youtube.com/watch?v=${node.videoId}`, "youtube");
    else if (node.type === "teacher-voice") { /* no url by schema */ }
    else if (typeof node.url === "string") urls.set(node.url, /youtu\.?be/.test(node.url) ? "youtube" : "link");
    Object.values(node).forEach(walk);
  }
}

const contentDir = path.join(process.cwd(), "content");
for (const file of fs.readdirSync(contentDir, { recursive: true })) {
  if (String(file).endsWith(".json")) walk(JSON.parse(fs.readFileSync(path.join(contentDir, String(file)), "utf8")));
}

let failures = 0;
for (const [url, kind] of urls) {
  const target = kind === "youtube"
    ? `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    : url;
  try {
    let res = await fetch(target, { method: kind === "youtube" ? "GET" : "HEAD", redirect: "follow" });
    if (res.status === 405) res = await fetch(target, { method: "GET", redirect: "follow" });
    if (!res.ok) { failures++; console.error(`FAIL ${res.status} [${kind}] ${url}`); }
    else console.log(`ok   [${kind}] ${url}`);
  } catch (err) {
    failures++; console.error(`FAIL error [${kind}] ${url}: ${err.message}`);
  }
}
console.log(`\n${urls.size - failures}/${urls.size} references ok`);
process.exit(failures ? 1 : 0);
