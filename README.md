# Instagram Countdown Reel Automation

This project automatically generates and publishes a daily Instagram Reel
showing a countdown animation, including sound, cover image, and caption.

The system is designed to run unattended, using Remotion for rendering,
FTP for hosting assets, and the official Instagram Graph API for publishing.

---

## Features

- 🎬 Daily video generation with Remotion
- 🔊 Audio included in the final MP4
- 🖼 Automatic cover image generation
- ☁️ Asset upload via FTP
- 📤 Instagram Reel publishing via Graph API
- ⏰ Daily execution via cron
- 🤖 Telegram notifications (success & errors)

---

## Tech Stack

- Node.js
- Remotion
- Instagram Graph API
- FTP
- Telegram Bot API
- Cron

---

## Project Structure

```
.
├── src
│   ├── Countdown.jsx        # Remotion composition
│   └── publish-instagram.js # Upload & publish logic
├── out
│   ├── video.mp4
│   └── cover.png
├── public
│   └── flip_sound.mp3
├── .env
├── .env.example
└── cron.txt

````

---

## Setup

### 1. Install dependencies

```bash
npm install
````

### 2. Environment variables

Create a `.env` file based on `.env.example` and fill in:

* Instagram access token
* Instagram user ID
* FTP credentials
* Telegram bot credentials (optional)

---

## Usage

### Render video and cover

```bash
npm run render
```

### Publish Reel to Instagram

```bash
npm run publish
```

### Full daily pipeline

```bash
npm run daily
```

---

## Cron Job

Example cron entry (runs every day at 09:00):

```bash
0 9 * * * cd /absolute/path/to/project && npm run daily >> cron.log 2>&1
```

---

## Notes

* The Instagram access token must have permissions for publishing Reels.
* Video and cover files must be publicly accessible.
* Audio must be mounted from frame 0 in Remotion to be included in the render.

---

## License

Private / Internal Use