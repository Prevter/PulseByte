# SanyaBot
Multipurpose Discord bot

This is primarily my framework for creating bots, which supports:
- Slash commands and prefix commands simultaneously
- Saving data to database
- Translations
- Permissions
- Command aliases
- Multiple prefixes
- XP system
- Music player
- And more

## Running
Install all requirements using npm:
```
npm i
```

Create a new file `config.json` and fill it like this:
```json
{
    "token": "<DISCORD BOT TOKEN>",
    "prefixes": [
        "<PREFIX_1>",
        "<PREFIX_2>",
        "<PREFIX_3>"
    ],
    "case_sensitive": false,
    "xp": {
        "enabled": true,
        "cooldown": 60,
        "xp_min": 15,
        "xp_max": 25,
        "level_up_message": {
            "en": "⬆️ You are now level {0}!",
            "uk": "⬆️ Ти тепер {0} рівня!"
        }
    }
}
```
"case_sensitive" only applies to prefix

After this, you can run the bot using
```
npm run start
```
