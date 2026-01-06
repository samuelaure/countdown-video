import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";
import FTP from "ftp";
import { notifyTelegram } from "./telegram.js";

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
    999 - Math.floor((new Date() - new Date("2026-01-01")) / 864e5)
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

        client.on("error", reject);

        client.connect({
            host: FTP_HOST,
            user: FTP_USER,
            password: FTP_PASSWORD,
        });
    });
}

async function waitForContainer(containerId) {
    while (true) {
        await new Promise((r) => setTimeout(r, 5000));

        const res = await axios.get(
            `https://graph.facebook.com/v24.0/${containerId}`,
            {
                params: {
                    fields: "status_code",
                    access_token: IG_TOKEN,
                },
            }
        );

        if (res.data.status_code === "FINISHED") return;
        if (res.data.status_code === "ERROR") {
            throw new Error("Instagram processing error");
        }
    }
}

async function publishReel() {
    try {
        if (!fs.existsSync(LOCAL_VIDEO_PATH)) {
            throw new Error("Video not found");
        }
        if (!fs.existsSync(LOCAL_COVER_PATH)) {
            throw new Error("Cover not found");
        }

        console.log("⬆️ Uploading VIDEO by FTP...");
        await notifyTelegram("2️⃣⏳ @in999days Successful rendering... Start uploading video and cover to Instagram.");

        const videoUrl = await uploadViaFTP(
            LOCAL_VIDEO_PATH,
            `video_${date}.mp4`
        );
        console.log("🌐 Video URL:", videoUrl);

        console.log("⬆️ Uploading COVER by FTP...");
        const coverUrl = await uploadViaFTP(
            LOCAL_COVER_PATH,
            `cover_${date}.png`
        );
        console.log("🌐 Cover URL:", coverUrl);

        console.log("📦 Creating Reel container...");

        const containerRes = await axios.post(
            `https://graph.facebook.com/v24.0/${IG_USER_ID}/media`,
            {
                media_type: "REELS",
                video_url: videoUrl,
                cover_url: coverUrl,
                caption: CAPTION,
                access_token: IG_TOKEN,
            }
        );

        const containerId = containerRes.data.id;
        console.log("⏳ Processing Reel:", containerId);

        await waitForContainer(containerId);

        console.log("🚀 Publishing Reel...");
        const publishRes = await axios.post(
            `https://graph.facebook.com/v24.0/${IG_USER_ID}/media_publish`,
            {
                creation_id: containerId,
                access_token: IG_TOKEN,
            }
        );

        console.log("✅ Reel published correctly!");

        const mediaId = publishRes.data.id;

        const permalinkRes = await axios.get(
            `https://graph.facebook.com/v24.0/${mediaId}`,
            {
                params: {
                    fields: "permalink",
                    access_token: IG_TOKEN,
                },
            }
        );

        console.log("Notificando a Telegram...");
        await notifyTelegram(
            `3️⃣✅ <b>Reel publicado</b>\n<a href="${permalinkRes.data.permalink}">Ver en Instagram</a>`
        );
        console.log("Notificación enviada.");
    } catch (err) {
        await notifyTelegram(`❌ <b>Error</b>\n${err.message}`);
        throw err;
    }
}

publishReel().catch(() => process.exit(1));
