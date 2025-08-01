# Security Warning

⚠️ **IMPORTANT**: Never commit your `.env` file with real tokens and API keys!

The bot token in the `.env` file should be kept secret. If you accidentally committed it:

1. Immediately revoke the token in BotFather:
   - Open @BotFather in Telegram
   - Send `/revoke` command
   - Select your bot
   - Confirm revocation

2. Generate a new token:
   - Send `/token` to BotFather
   - Select your bot
   - Copy the new token

3. Update your local `.env` file with the new token

4. Remove the old token from git history (optional but recommended)

## Best Practices

- Always use `.env.example` as a template
- Keep your actual `.env` file local only
- Use environment variables in production
- Regularly rotate your tokens and API keys