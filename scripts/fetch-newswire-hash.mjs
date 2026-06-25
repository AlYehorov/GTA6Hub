import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage();
let hash = null;

page.on("request", (req) => {
  const url = req.url();
  if (!url.includes("NewswireList")) return;
  try {
    const params = new URL(url).searchParams;
    const ext = params.get("extensions");
    if (ext) {
      hash = JSON.parse(ext).persistedQuery.sha256Hash;
    }
  } catch {
    // ignore
  }
});

await page.goto("https://www.rockstargames.com/newswire", {
  waitUntil: "networkidle2",
  timeout: 90000,
});
await new Promise((r) => setTimeout(r, 8000));
await browser.close();

if (!hash) {
  console.error("Hash not found");
  process.exit(1);
}

console.log(hash);
