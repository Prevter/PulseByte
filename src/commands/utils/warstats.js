const Command = require("../../types/command");
const { AttachmentBuilder } = require('discord.js');

const { join } = require('path');
const https = require("https");
const { createCanvas, GlobalFonts, loadImage } = require('@napi-rs/canvas')
GlobalFonts.registerFromPath(join(__dirname, '../../assets/e-UkraineHead-Regular.ttf'), 'e-Ukraine');

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'warstats',
            aliases: ['war'],
            category: 'utils'
        });
    }

    /**
     * Returns attachment with image of war statistics
     * @param {(key:string, ...args) => string} locale  Locale function
     * @param {Object} data Data to create image
     * @param {(Message|Interaction)} message Message to reply
     */
    async createImage(locale, data) {
        const canvas = createCanvas(1280, 1080);
        const ctx = canvas.getContext('2d');

        const text = (text, x, y, maxWidth, fontSize, color = '#000000', align = 'left') => {
            ctx.save();
            ctx.font = `${fontSize}px e-Ukraine`;
            ctx.fillStyle = color;
            ctx.textAlign = align;
            ctx.textBaseline = 'top';
            ctx.fillText(text, x, y, maxWidth);
            ctx.restore();
        }

        const calculateTextWidth = (text, fontSize) => {
            ctx.save();
            ctx.font = `${fontSize}px e-Ukraine`;
            const width = ctx.measureText(text).width;
            ctx.restore();
            return width;
        }

        const background = await loadImage(join(__dirname, '../../assets/stats_template.png'));
        ctx.save();
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        text(locale('warstats.title'), 35, 50, 800, 94, '#ffffff');
        text(locale('warstats.description'), 45, 150, 800, 38, '#ffffff');

        data.day = data.day.toString();
        const dayLabelCenterX = 1065;
        const dayWidth = calculateTextWidth(data.day, 90);
        const dayLabelWidth = calculateTextWidth(locale('warstats.th_day'), 30);
        const centerWidth = (dayWidth + dayLabelWidth) / 2;
        const offsetDay = (dayWidth / 2) - centerWidth;
        const offsetDayLabel = (dayLabelWidth / 2) - centerWidth;
        text(data.day, dayLabelCenterX + offsetDay, 55, 330, 90, '#000', 'center');
        text(locale('warstats.th_day'), dayLabelCenterX - offsetDayLabel, 105, 330, 30, '#000', 'center');
        text(data.date, dayLabelCenterX, 155, 330, 36, '#000', 'center');

        text(locale('warstats.data_verifying'), canvas.width / 2, 1035, 1150, 24, '#ffffff', 'center');

        const stats = data.stats;
        const increase = data.increase;

        const bigCard = (x, y, title, value, delta) => {
            const numberStr = value.toLocaleString('en-US').replace(',', ' ');
            text(numberStr, x, y, 390, 38, '#000');
            const numberWidth = calculateTextWidth(numberStr, 38);
            if (delta) {
                const deltaStr = `(+${delta.toLocaleString('en-US').replace(',', ' ')})`;
                text(deltaStr, x + numberWidth + 10, y + 5, 390, 24, '#000');
            }
            text(title, x, y + 40, 390, 36, '#000');
        }

        const smallCard = (x, y, title, value, delta) => {
            const numberStr = value.toLocaleString('en-US').replace(',', ' ');
            text(numberStr, x, y, 250, 30, '#000');
            const numberWidth = calculateTextWidth(numberStr, 30);
            if (delta) {
                const deltaStr = `(+${delta.toLocaleString('en-US').replace(',', ' ')})`;
                text(deltaStr, x + numberWidth + 10, y + 5, 250, 18, '#000');
            }
            text(title, x, y + 32, 250, 30, '#000');
        }

        const card = (x, y, type, name) => {
            if (type == 'small')
                smallCard(x, y, locale(`warstats.${name}`), stats[name], increase[name]);
            else
                bigCard(x, y, locale(`warstats.${name}`), stats[name], increase[name]);
        }

        card(250, 280, 'big', 'personnel_units');
        card(870, 280, 'big', 'tanks');
        card(180, 440, 'small', 'armoured_fighting_vehicles');
        card(570, 440, 'small', 'artillery_systems');
        card(960, 440, 'small', 'mlrs');
        card(180, 585, 'small', 'aa_warfare_systems');
        card(570, 585, 'small', 'planes');
        card(960, 585, 'small', 'helicopters');
        card(180, 740, 'small', 'vehicles_fuel_tanks');
        card(570, 740, 'small', 'warships_cutters');
        card(960, 740, 'small', 'uav_systems');
        card(180, 890, 'small', 'special_military_equip');
        card(570, 890, 'small', 'atgm_srbm_systems');
        card(960, 890, 'small', 'cruise_missiles');

        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'stats.png' });
        return attachment;
    }

    /**
     * Fetches data from the API and returns it
     * @returns {Promise<WarStatsData>}
     */
    async getData() {
        return new Promise((resolve, reject) => {
            const url = "https://russianwarship.rip/api/v2/statistics/latest";

            https.get(url, (res) => {
                var body = '';
    
                res.on('data', function (chunk) {
                    body += chunk;
                });
    
                res.on('end', () => {
                    var response = JSON.parse(body).data;
                    response.date = response.date.split('-').reverse().join('.');
                    resolve(response);
                });
            }).on('error', function (e) {
                this.logger.error('warstats', e);
                reject(e);
            });
        });
    }

    async runAsSlash(interaction, locale, args) {
        await interaction.deferReply();
        const data = await this.getData();
        const attachment = await this.createImage(locale, data);
        await interaction.editReply({ files: [attachment] });
    }

    async run(message, locale, args) {
        const data = await this.getData();
        const attachment = await this.createImage(locale, data);
        await message.reply({ files: [attachment] });
    }
}