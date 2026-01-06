import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";
import FTP from "ftp";

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

function uploadViaFTP(localFilePath, remoteFileName) {
    return new Promise((resolve, reject) => {
        const client = new FTP();

        client.on("ready", () => {
            client.put(localFilePath, remoteFileName, (err) => {
                client.end();
                if (err) return reject(err);
                resolve(`${PUBLIC_VIDEO_BASE_URL}/${remoteFileName}`);
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

        const status = res.data.status_code;
        if (status === "FINISHED") return;
        if (status === "ERROR") {
            throw new Error("Instagram processing error");
        }
    }
}

async function publishReel() {
    if (!fs.existsSync(LOCAL_VIDEO_PATH)) {
        throw new Error("Video file not found");
    }

    if (!fs.existsSync(LOCAL_COVER_PATH)) {
        throw new Error("Cover file not found");
    }

    console.log("⬆️ Uploading VIDEO by FTP...");
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
    await axios.post(
        `https://graph.facebook.com/v24.0/${IG_USER_ID}/media_publish`,
        {
            creation_id: containerId,
            access_token: IG_TOKEN,
        }
    );

    console.log("✅ Reel published correctly!");
}

publishReel().catch((err) => {
    console.error("❌ Error:", err.response?.data || err.message);
    process.exit(1);
});
