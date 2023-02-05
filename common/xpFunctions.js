const { xp } = require('../config.json');

const getRandomXp = () => {
    // create a random number between xp.xp_min and xp.xp_max
    return Math.floor(Math.random() * (xp.xp_max - xp.xp_min + 1)) + xp.xp_min;
}

const getLevelXp = (level) => {
    return 5 / 6 * level * (2 * Math.pow(level, 2) + 27 * level + 91);
}

const getLevel = (total_xp) => {
    let level = 0;
    while (total_xp >= getLevelXp(level))
        level++;
    return level - 1;
}

const isEnabledOnServer = (db, guild_id) => {
    let sql = `SELECT xp_enabled FROM settings WHERE guild_id = '${guild_id}'`;
    const row = db.prepare(sql).get();
    let enabled = xp.enabled;
    if (row) {
        enabled = row.xp_enabled;
    }
    return enabled;
}

module.exports = { getRandomXp, getLevelXp, getLevel, isEnabledOnServer }