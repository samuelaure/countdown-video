import { notifyTelegram } from "./telegram.js";
import logger from "./logger.js";

async function main() {
  try {
    const today = Math.max(
      0,
      999 - Math.floor((new Date() - new Date("2026-01-01")) / 864e5),
    );

    logger.info(`Starting daily notification for day ${today}`);

    await notifyTelegram(
      `1️⃣🎬 <b>@in999days Daily commitment started:</b> Rendering video and cover (${today + 1}->${today})...`,
    );

    logger.info("Daily start notification sent");
  } catch (error) {
    logger.error("Failed to send daily start notification", error);
    process.exit(1);
  }
}

main();
