import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";

dotenv.config();

// Replace with your bot token from .env
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// In-memory store for user token status
const userTokens = new Map();

// Use your actual verification page URL from .env
const VERIFICATION_URL = process.env.VERIFICATION_URL;

// Your Google Drive link from .env
const DRIVE_LINK = process.env.DRIVE_LINK;

// Function to send Drive link as a button
function sendDriveButton(userId) {
  bot.sendMessage(
    userId,
    "Click the button below to open your Google Drive file:",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Open Google Drive File",
              url: DRIVE_LINK,
            },
          ],
        ],
      },
    }
  );
}

// Handle /start with optional parameter
bot.onText(/\/start(?: (.+))?/, (msg, match) => {
  const userId = msg.chat.id;
  const param = match ? match[1] : null;

  if (param === "verified") {
    userTokens.set(userId, { verified: true, issuedAt: Date.now() });

    bot.sendMessage(userId, "✅ Your token is verified successfully.");

    // Send the Drive link as a button
    sendDriveButton(userId);
  } else {
    userTokens.set(userId, {
      verified: false,
      issuedAt: null,
    });

    bot.sendMessage(
      userId,
      "❌ Your token is not verified.\n\nPlease complete verification by clicking the button below:",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Verify Token",
                url: `${VERIFICATION_URL}?userId=${userId}`,
              },
            ],
          ],
        },
      }
    );
  }
});

// Verification command from frontend or user
bot.onText(/\/verify/, (msg) => {
  const userId = msg.chat.id;
  const token = userTokens.get(userId);
  if (!token) {
    return bot.sendMessage(
      userId,
      `❗ Please start verification first by typing /start`
    );
  }

  if (token.verified) {
    return bot.sendMessage(userId, "✅ Your token is already verified.");
  }

  token.verified = true;
  token.issuedAt = Date.now();
  userTokens.set(userId, token);

  bot.sendMessage(userId, `✅ Your token is verified.`);

  // Send the Drive link as a button
  sendDriveButton(userId);
});

// Status command so user can check verification anytime
bot.onText(/\/status/, (msg) => {
  const userId = msg.chat.id;
  const token = userTokens.get(userId);

  if (!token) {
    return bot.sendMessage(
      userId,
      "You have not started verification yet. Type /start to begin."
    );
  }

  if (token.verified) {
    // Check if token expired
    const now = Date.now();
    if (now - token.issuedAt > 24 * 60 * 60 * 1000) {
      userTokens.set(userId, { verified: false, issuedAt: null });
      return bot.sendMessage(
        userId,
        "⚠️ Your token has expired. Please type /start to verify again."
      );
    }

    return bot.sendMessage(userId, "✅ Your token is still valid.");
  } else {
    return bot.sendMessage(
      userId,
      "❌ Your token is not verified. Please type /start to verify."
    );
  }
});

// Optional: Expiry checker (runs every 5 minutes)
setInterval(() => {
  const now = Date.now();
  userTokens.forEach((data, userId) => {
    if (data.verified && now - data.issuedAt > 24 * 60 * 60 * 1000) {
      userTokens.set(userId, { verified: false, issuedAt: null });
      bot.sendMessage(
        userId,
        `⚠️ Your token has expired. Please type /start to verify again.`
      );
    }
  });
}, 5 * 60 * 1000);

console.log("Telegram bot started...");
