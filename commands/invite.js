const translations = {
    en: {
        desc: "Get invite link for bot",
        args: {},
    },
    uk: {
        desc: "Отримати посилання для запрошення бота",
        args: {},
    },
};

module.exports = {
    name: "invite",
    aliases: ["link", "лінк", "інвайт", "приєднати", "посилання", "запросити"],
    arguments: [],
    translations: translations,
    run: async (args, db, locale, callback, meta) => {
        let invite = `https://discord.com/oauth2/authorize?client_id=${meta.client.user.id}&scope=bot&permissions=8`;
        callback({ type: 'text', content: invite });
    }
}