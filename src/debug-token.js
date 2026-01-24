import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const { IG_TOKEN } = process.env;

async function debugToken() {
  if (!IG_TOKEN) {
    console.error("❌ IG_TOKEN is not defined in .env");
    return;
  }

  try {
    console.log("🔍 Debugging IG_TOKEN...");

    // Get info about the token itself via the debug_token endpoint
    // Note: This usually requires an App Access Token or Admin Access Token
    // But we can also just try to get /me to see if it works and what it is.

    const meRes = await axios.get("https://graph.facebook.com/v24.0/me", {
      params: {
        fields: "id,name",
        access_token: IG_TOKEN,
      },
    });

    console.log("✅ Token is VALID");
    console.log("👤 Connected as:", meRes.data.name, `(ID: ${meRes.data.id})`);

    // Check permissions
    const permRes = await axios.get(
      `https://graph.facebook.com/v24.0/${meRes.data.id}/permissions`,
      {
        params: {
          access_token: IG_TOKEN,
        },
      },
    );

    console.log("\n📋 Permissions:");
    permRes.data.data.forEach((p) => {
      console.log(` - ${p.permission}: ${p.status}`);
    });

    const hasPublish = permRes.data.data.find(
      (p) =>
        p.permission === "instagram_content_publish" && p.status === "granted",
    );
    if (!hasPublish) {
      console.error("\n❌ MISSING 'instagram_content_publish' permission!");
    } else {
      console.log("\n✅ Has 'instagram_content_publish' permission.");
    }
  } catch (err) {
    console.error("❌ Token is INVALID or expired.");
    console.error("Error:", err.response?.data?.error?.message || err.message);
  }
}

debugToken();
