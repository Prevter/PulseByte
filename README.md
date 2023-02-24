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
    "activity_type": "Playing",
    "activity_name": "<ANY STATUS>",
    "owner_id": "<YOUR ID>",
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

## Commands

### General
- `help <page/category/page>` - Shows help message
- `invite` - Shows invite link for the bot
- `lang [language]` - Changes bot language
- `status` - Shows bot status (ping, uptime, etc.)

### Moderation
- `ban [user] [reason]` - Bans user
- `clean [amount]` - Deletes messages

### Music
- `autoplay` - Toggles autoplay
- `bass` - Toggles bassboost
- `filter [filter]` - Toggle specified filter
- `join` - Joins voice channel
- `leave` - Leaves voice channel
- `nowplaying` - Shows current song
- `pause` - Pauses music
- `play [query]` - Plays music
- `playnow [query]` - Adds music to the beginning of the queue
- `previous` - Plays previous song
- `queue` - Shows queue
- `repeat [off/song/queue]` - Toggles repeat mode
- `resume` - Resumes music
- `seek [time]` - Seeks to specified time
- `shuffle` - Shuffles queue
- `skip [amount]` - Skips current song
- `stop` - Stops music
- `volume [amount]` - Changes volume

### Utility
- `embed [json code]` - Sends embed
- `profile <user>` - Shows user profile
- `war` - Get latest statistics about russian losses

### Fun
- `8ball [question]` - Ask a question

### Experience
- `rating` - Shows server rating
- `xp <user>` - Shows user XP
- `xp-settings <enable/disable>` - Toggles XP system on the server
