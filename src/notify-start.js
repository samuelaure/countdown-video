import { notifyTelegram } from "./telegram.js";

const today = Math.max(
  0,
  999 - Math.floor((new Date() - new Date("2026-01-01")) / 864e5),
);

await notifyTelegram(
  `1️⃣🎬 <b>@in999days Daily commitment started:</b> Rendering video and cover (${today + 1}->${today})...`,
);
