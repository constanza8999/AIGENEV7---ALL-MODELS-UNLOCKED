# AIGENEV7 Telegram Channel Setup Guide

## Step 1: Create the Bot

1. Open Telegram and search for **@BotFather**
2. Start a chat and send `/newbot`
3. Choose a **name**: `AIGENEV7 Updates Bot`
4. Choose a **username**: `aigenev7bot` (must end in `bot`)
5. BotFather will give you a **token** like `123456789:ABCdefGHIjklMNOpqrSTUvwxYZ`
6. **Save this token securely** — you'll need it for `TELEGRAM_BOT_TOKEN`

## Step 2: Create the Channel

1. In Telegram, tap **New Channel** (or the pencil icon)
2. Choose a **name**: `AIGENEV7 Updates`
3. Choose a **username**: `@AIGENEV7Updates` (or your preference)
4. Set as **Public** for discoverability
5. Skip adding a description for now (you can add it later)

## Step 3: Add Bot as Channel Admin

1. Open your channel → tap the channel name → **Administrators**
2. Tap **Add Admin**
3. Search for your bot's username (`@aigenev7bot`)
4. Grant these permissions:
   - ✅ **Post Messages** (required)
   - ✅ **Edit Messages** (optional, for updating posts)
   - ✅ **Delete Messages** (optional)
5. Tap **Save**

## Step 4: Get Your Channel ID

For public channels, you can use the `@username` directly (e.g., `@AIGENEV7Updates`).

If you need the numeric ID:
1. Forward any message from your channel to `@userinfobot` or `@RawDataBot`
2. Look for the `chat.id` field — it will be something like `-1001234567890`

## Step 5: Configure Environment Variables

Set these in your environment or `.env` file:

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_CHANNEL_ID=@AIGENEV7Updates
```

### For GitHub Actions

Go to your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Name | Value |
|------|-------|
| `TELEGRAM_BOT_TOKEN` | Your bot token from BotFather |
| `TELEGRAM_CHANNEL_ID` | `@AIGENEV7Updates` or numeric ID |

## Step 6: Test the Bot

```bash
cd freebuff/telegram
TELEGRAM_BOT_TOKEN=your_token TELEGRAM_CHANNEL_ID=@AIGENEV7Updates node bot.js test
```

You should see a test message in your channel!

## Step 7: Post Updates

```bash
# Post a release announcement
node bot.js post-release 7.0.0

# Post a feature announcement
node bot.js post-feature "Quantum Computing Support"

# Post a general update
node bot.js post-update "AIGENEV7 now supports 23 AI models!"

# Post a custom message
node bot.js post "🔥 Your custom message here"
```

## Bot Commands Reference

| Command | Description |
|---------|-------------|
| `node bot.js test` | Send a test message |
| `node bot.js post-release <version>` | Release announcement |
| `node bot.js post-feature <name>` | Feature announcement |
| `node bot.js post-update <message>` | General update |
| `node bot.js post <message>` | Custom message |

## Auto-Posting via GitHub Actions

The `.github/workflows/telegram-update.yml` workflow automatically posts to your channel when:

- A new release is published
- Push to `main` with specific commit prefixes (`feat:`, `fix:`)

## Channel Management

### Pin Important Messages
- Long-press a message → **Pin** to keep it at the top

### Create Topics (if using Forum Topics)
- Enable topics in channel settings for organized categories:
  - 🚀 Releases
  - ✨ Features
  - 📢 Announcements
  - 🔧 Bug Fixes

### Welcome Message
Set a welcome message in channel settings that explains what the channel is about.

## Security Notes

- **Never commit your bot token to git** — use environment variables
- The bot can only post to channels where it's an admin
- Revoke the token via @BotFather if it's ever compromised
- Use GitHub repository secrets for CI/CD workflows

---

**Author:** CONSTANZA (José Jaime Juliá)
