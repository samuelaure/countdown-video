import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";
import FTP from "ftp";
import { notifyTelegram } from "./telegram.js";
import logger from "./logger.js";

dotenv.config();

const {
  IG_TOKEN,
  IG_USER_ID,
  FTP_HOST,
  FTP_USER,
  FTP_PASSWORD,
  PUBLIC_VIDEO_BASE_URL,
} = process.env;

const date = new Date().toISOString().slice(0, 10);

const LOCAL_VIDEO_PATH = "./out/video.mp4";
const LOCAL_COVER_PATH = "./out/cover.png";

const CAPTION = `${Math.max(
  0,
  999 - Math.floor((new Date() - new Date("2026-01-01")) / 864e5),
)}...`;

function uploadViaFTP(localPath, remoteName) {
  return new Promise((resolve, reject) => {
    const client = new FTP();

    client.on("ready", () => {
      client.put(localPath, remoteName, (err) => {
        client.end();
        if (err) return reject(err);
        resolve(`${PUBLIC_VIDEO_BASE_URL}/${remoteName}`);
      });
    });

    client.on("error", (err) => {
      reject(new Error(`FTP Error: ${err.message}`));
    });

    try {
      client.connect({
        host: FTP_HOST,
        user: FTP_USER,
        password: FTP_PASSWORD,
      });
    } catch (err) {
      reject(new Error(`FTP Connection Error: ${err.message}`));
    }
  });
}

async function waitForContainer(containerId) {
  let attempts = 0;
  while (true) {
    attempts++;
    if (attempts > 20) throw new Error("Timeout waiting for media container"); // Prevent infinite loop

    await new Promise((r) => setTimeout(r, 5000));

    try {
      const res = await axios.get(
        `https://graph.facebook.com/v24.0/${containerId}`,
        {
          params: {
            fields: "status_code,status",
            access_token: IG_TOKEN,
          },
        },
      );

      logger.info(`Container status check #${attempts}`, {
        status_code: res.data.status_code,
        status: res.data.status,
      });

      if (res.data.status_code === "FINISHED") return;
      if (res.data.status_code === "ERROR") {
        throw new Error(
          `Instagram processing error: ${JSON.stringify(res.data)}`,
        );
      }
    } catch (error) {
      // If it's the specific processing error, rethrow. Otherwise log and retry (e.g. network blip)
      if (error.message.includes("Instagram processing error")) throw error;
      logger.error("Error checking container status", error);
    }
  }
}

async function publishReel() {
  try {
    logger.info("Starting publish process", { date });

    if (!fs.existsSync(LOCAL_VIDEO_PATH)) {
      throw new Error(`Video not found at ${LOCAL_VIDEO_PATH}`);
    }
    if (!fs.existsSync(LOCAL_COVER_PATH)) {
      throw new Error(`Cover not found at ${LOCAL_COVER_PATH}`);
    }

    logger.info("⬆️ Uploading VIDEO by FTP...");
    await notifyTelegram(
      "2️⃣⏳ @in999days Successful rendering... Start uploading video and cover to Instagram.",
    );

    const videoUrl = await uploadViaFTP(LOCAL_VIDEO_PATH, `video_${date}.mp4`);
    logger.info("🌐 Video URL uploaded", { videoUrl });

    logger.info("⬆️ Uploading COVER by FTP...");
    const coverUrl = await uploadViaFTP(LOCAL_COVER_PATH, `cover_${date}.png`);
    logger.info("🌐 Cover URL uploaded", { coverUrl });

    logger.info("⏳ Waiting 15 seconds for file synchronization...");
    await new Promise((resolve) => setTimeout(resolve, 15000));

    logger.info("📦 Creating Reel container...");

    const containerRes = await axios.post(
      `https://graph.facebook.com/v24.0/${IG_USER_ID}/media`,
      {
        media_type: "REELS",
        video_url: videoUrl,
        cover_url: coverUrl,
        caption: CAPTION,
        access_token: IG_TOKEN,
      },
    );

    const containerId = containerRes.data.id;
    logger.info("⏳ Processing Reel", { containerId });

    await waitForContainer(containerId);

    logger.info("🚀 Publishing Reel...");
    const publishRes = await axios.post(
      `https://graph.facebook.com/v24.0/${IG_USER_ID}/media_publish`,
      {
        creation_id: containerId,
        access_token: IG_TOKEN,
      },
    );

    logger.info("✅ Reel published correctly!", { id: publishRes.data.id });

    const mediaId = publishRes.data.id;

    const permalinkRes = await axios.get(
      `https://graph.facebook.com/v24.0/${mediaId}`,
      {
        params: {
          fields: "permalink",
          access_token: IG_TOKEN,
        },
      },
    );

    logger.info("Fetching permalink...", {
      permalink: permalinkRes.data.permalink,
    });
    await notifyTelegram(
      `3️⃣✅ <b>Reel published</b>\n<a href="${permalinkRes.data.permalink}">View on Instagram</a>`,
    );
    logger.info("Notification sent.");
  } catch (err) {
    logger.error("Fatal error in publishReel", err);
    await notifyTelegram(`❌ <b>Error</b>\n${err.message}`);
    throw err;
  }
}

publishReel().catch((err) => {
  logger.error("Unhandled promise rejection", err);
  process.exit(1);
});
