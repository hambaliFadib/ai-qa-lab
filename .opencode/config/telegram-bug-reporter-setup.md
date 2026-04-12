# Telegram Bug Reporter Setup

1. Create or reuse a Telegram bot using BotFather.
2. Add the bot to the target bug-reporting group.
3. Give the bot permission to post messages.
4. Copy `02-brain/.opencode/config/telegram-bug-reporter.env.example` to `02-brain/.opencode/config/telegram-bug-reporter.local.env`, or fill `02-brain/.opencode/config/telegram-bug-reporter.env` if you prefer that name.
5. Fill `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
6. If the group uses topics, fill `TELEGRAM_THREAD_ID`.

Commands:

```powershell
node 01-runtime/tools/telegram-bug-reporter.js --input 06-testing/bug-reports/telegram/_template.bug-report.json
node 01-runtime/tools/telegram-bug-reporter.js --get-updates --label chat-discovery
node 01-runtime/tools/telegram-bug-reporter.js --input 06-testing/bug-reports/telegram/<bug>.json --send
```

Safety:

- The local env file is ignored by git.
- Dry-run is the default.
- `--send` is required before any Telegram API call.
- Telegram token is never written to reporting artifacts.
