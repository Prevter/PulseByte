const { Translator } = require('../common/utils');
const { xp } = require('../config.json');

const translations = {
    en: {
        desc: "Change XP settings",
        args: {
            enable: "Enable/disable XP"
        },
        on: ["on", "enable", "true"],
        off: ["off", "disable", "false"],
        invalid: "Invalid value. Use `on` or `off`",
        xpIs: "XP system on this server is {0}",
        enabled: "enabled",
        disabled: "disabled"
    },
    uk: {
        desc: "Змінити налаштування XP",
        args: {
            enable: "Включити/виключити XP"
        },
        on: ["вкл", "включити", "ввімкнути"],
        off: ["вимк", "викл", "виключити", "вимкнути"],
        invalid: "Неправильне значення. Використовуйте `вкл` або `вимк`",
        xpIs: "Система XP на цьому сервері {0}",
        enabled: "включена",
        disabled: "вимкнена"
    }
};

module.exports = {
    name: 'xp-settings',
    category: 'experience',
    aliases: ['xp-set', 'xp-s'],
    arguments: [
        {
            name: 'enable',
            type: 'string',
            required: false,
        }
    ],
    permissions: ['ManageGuild'],
    guildOnly: true,
    translations: translations,
    run: async (args, db, locale, callback, meta) => {
        const translate = new Translator(translations, locale);


        if (args.enable) {
            // check all translations for "on" and "off"
            let mode = 'on';
            let found = false;
            for (const translation of Object.values(translations)) {
                if (translation.on.includes(args.enable)) {
                    mode = 'on';
                    found = true;
                } else if (translation.off.includes(args.enable)) {
                    mode = 'off';
                    found = true;
                }
            }

            if (!found) {
                callback({ type: 'text', content: translate('invalid') });
                return;
            }

            let sql = 'SELECT * FROM settings WHERE guild_id = ?';
            let row = db.prepare(sql).get(meta.guild.id);

            try {
                if (!row) {
                    sql = 'INSERT INTO settings (guild_id, xp_enabled) VALUES (?, ?)';
                    db.prepare(sql).run(meta.guild.id, mode === 'on' ? 1 : 0);
                }
                else {
                    sql = 'UPDATE settings SET xp_enabled = ? WHERE guild_id = ?';
                    db.prepare(sql).run(mode === 'on' ? 1 : 0, meta.guild.id);
                }
                callback({ type: 'text', content: translate('xpIs', translate(mode === 'on' ? 'enabled' : 'disabled')) });
            }
            catch (e) {
                console.error(e);
                return;
            }
        }
        else {
            let sql = 'SELECT * FROM settings WHERE guild_id = ?';
            let row = db.prepare(sql).get(meta.guild.id);

            if (!row) {
                callback({ type: 'text', content: translate('xpIs', translate(xp.enabled ? 'enabled' : 'disabled')) });
            } else {
                let xp_enabled = row.xp_enabled;
                callback({ type: 'text', content: translate('xpIs', translate(xp_enabled ? 'enabled' : 'disabled')) });
            }
        }

    }
};
