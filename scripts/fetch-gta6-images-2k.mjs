/**
 * Download official Rockstar GTA VI media at 2K/4K for sharp homepage images.
 * Run: npm run fetch:gta6-images-2k
 */
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "images", "gta6");

const BASE = "https://www.rockstargames.com/VI/_next/static/media";

/** @type {{ file: string; remote: string; width: number }[]} */
const ASSETS = [
  { file: "hero-vice-city.jpg", remote: "hero.0q5-tr6h86ai7.jpg", width: 3840 },
  {
    file: "jason-lucia-03-landscape.jpg",
    remote: "Jason_and_Lucia_03_landscape.0419q._86ukpt.jpg",
    width: 2560,
  },
  {
    file: "jason-lucia-03-portrait.jpg",
    remote: "Jason_and_Lucia_03_portrait.18bejba1ja2jn.jpg",
    width: 1920,
  },
  {
    file: "jason-lucia-03-square.jpg",
    remote: "Jason_and_Lucia_03_square.0nnxubu7dxqky.jpg",
    width: 2560,
  },
  {
    file: "official-cover-landscape.jpg",
    remote: "GTAVI_Official_Cover_Art_Landscape.03y6bcce9e2jr.jpg",
    width: 2560,
  },
  { file: "lucia-portrait.jpg", remote: "Lucia_Caminos_06.0fxbjfk0jakb3.jpg", width: 2560 },
  { file: "jason-duval-01.jpg", remote: "Jason_Duval_Video_Clip.024oe-y640yxp.jpg", width: 2560 },
  { file: "lucia-caminos-02.jpg", remote: "Lucia_Caminos_Video_Clip.0uqwkm_u_fu_9.jpg", width: 2560 },
  {
    file: "jason-lucia-motel.jpg",
    remote: "Jason_and_Lucia_03_phone.0_stuhzopjvgo.jpg",
    width: 2560,
  },
  { file: "jason-duval-04.jpg", remote: "ULTIMATE_EDITION_GROTTI_CHEETAH_01.0a.wy3s_ogjey.jpg", width: 2560 },
  { file: "raul-bautista.jpg", remote: "Cal_Hampton_03.0.q68~pt1to9z.jpg", width: 2560 },
  {
    file: "boobie-ike.jpg",
    remote: "ULTIMATE_EDITION_ONE_EYED_WILLIE_01.0n7-__or5f.b6.jpg",
    width: 2560,
  },
  { file: "vice-city-banner.jpg", remote: "Vice_City_01.135x56yoeu.6t.jpg", width: 2560 },
  {
    file: "vice-city-blank.jpg",
    remote: "Vice_City_Postcard_square.0-3vs90osir2l.jpg",
    width: 2560,
  },
  {
    file: "trailer-2-header.jpg",
    remote: "Jason_and_Lucia_03_ultrawide.0n9063mlg7f.u.jpg",
    width: 3840,
  },
];

function urlFor(remote, width) {
  return `${BASE}/${remote}?akim=1&imdensity=1&imwidth=${width}`;
}

async function download(file, remote, width) {
  const dest = join(OUT_DIR, file);
  const res = await fetch(urlFor(remote, width));
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  if (!res.body) throw new Error(`${file}: empty body`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  console.log(`  + ${file} (${width}px)`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Downloading ${ASSETS.length} assets to public/images/gta6 …`);
  for (const asset of ASSETS) {
    await download(asset.file, asset.remote, asset.width);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
