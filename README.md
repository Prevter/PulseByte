# SanyaBot
Multipurpose Discord bot

This is primarily my framework for creating bots, which supports:
- Slash commands and prefix commands simultaneously
- Saving data to database
- Translations
- Permissions
- Command aliases

Added commands:
- Music: 
  - play: Starts playing music
  - stop: Stops the queue
  - join: Join to user's voice channel
  - leave: Leaves current voice channel
  - nowplaying: Shows information about current song
  - queue: Show all songs in queue
  - repeat: Change repeating mode
  - skip: Skip current song
  - volume: Change volume
- help: Can show info about all commands, or detailed about one selected
- lang: Changing language on current server
- ban: Ban specified user
- war: Get latest statistics about russian losses in war 💙💛

Features planned:
- Admin commands (kick, mute)

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
