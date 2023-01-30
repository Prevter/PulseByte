# SanyaBot
Multipurpose Discord bot

This is primarily my framework for creating bots, which supports:
- Slash commands and prefix commands simultaneously
- Saving data to database
- Translations
- Permissions
- Command aliases
- Multiple prefixes

## Running
Install all requirements using npm:
```
npm i
```

Create a new file `config.json` and fill it like this:
```json
{
    "token": "DISCORD_BOT_TOKEN",
    "prefix": "COMMAND_PREFIX",
    "case_sensitive": false
}
```
"case_sensitive" only applies to prefix

After this, you can run the bot using
```
npm run run
```
