const { EmbedBuilder } = require('discord.js');

const translations = {
    en: {
        duration: "⏱️ Duration",
        views: "👀 Views",
        requestedBy: "Requested By"
    },
    uk: {
        duration: "⏱️ Тривалість",
        views: "👀 Переглядів",
        requestedBy: "За запитом"
    }
}

module.exports = (track, locale, queue) => {
    if (!track) return;
    var embed = new EmbedBuilder().setColor(0x0099FF);

    if (track.title || track.name)
        embed.setTitle(track.title ?? track.name);

    if (track.author || track.uploader)
        embed.setAuthor({ name: track.author ?? track.uploader.name });

    if (track.formattedDuration || track.duration)
        embed.addFields({ name: translations[locale].duration, value: `${track.formattedDuration ?? track.duration}`, inline: true });

    if (track.views)
        embed.addFields({ name: translations[locale].views, value: `${track.views}`, inline: true });

    if (track.user)
        embed.addFields({ name: translations[locale].requestedBy, value: `${track.user.username}` });

    if (queue?.formattedCurrentTime) {
        let progress = queue.currentTime / track.duration;
        progress = Math.round(progress * 10);
        let bar = '';
        for (var i = 0; i < 10; i++) {
            if (i == progress) bar += '🔘';
            else bar += '▬';
        }
        embed.setDescription(`${queue.formattedCurrentTime}${bar}${track.formattedDuration}`);
    }

    if (track.url)
        embed.setURL(track.url);

    if (track.thumbnail)
        embed.setThumbnail(track.thumbnail);

    if (track.source) {
        switch (track.source) {
            case 'youtube':
                embed.setFooter({ text: 'YouTube' });
                break;
        }
    }


    return embed;
}