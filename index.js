require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Use your bot token from .env
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

// Create bot instance without polling
const bot = new TelegramBot(TELEGRAM_TOKEN);

// Enable CORS & JSON parsing
app.use(cors());
app.use(express.json());

// In-memory user token store
const userTokens = new Map();

// Google Drive link from .env
const DRIVE_LINK = process.env.DRIVE_LINK;

// Function to send a Drive link as a button
function sendDriveButton(userId) {
  return bot.sendMessage(
    userId,
    "✅ Your token is verified.\n\nClick the button below to access the file:",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📂 Open Google Drive File",
              url: DRIVE_LINK,
            },
          ],
        ],
      },
    }
  );
}

// API endpoint to verify user and send button
app.post("/api/verify-user", async (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.status(400).send("Missing userId");

  // Mark the user as verified
  userTokens.set(userId, {
    verified: true,
    issuedAt: Date.now(),
  });

  try {
    // Send confirmation and Drive button
    await sendDriveButton(userId);

    res.status(200).send("✅ User verified and Drive link sent.");
  } catch (err) {
    console.error("❌ Error sending to Telegram:", err.message);
    res.status(500).send("Failed to notify user.");
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
