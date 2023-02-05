const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Ask the magic 8-ball a question",
        args: {
            question: "Question"
        },
        noQuestion: "❌ You didn't specify a question",
        answers: [
            "It is certain",
            "It is decidedly so",
            "Without a doubt",
            "Yes, definitely",
            "You may rely on it",
            "As I see it, yes",
            "Most likely",
            "Outlook good",
            "Yes",
            "Signs point to yes",
            "Reply hazy, try again",
            "Ask again later",
            "Better not tell you now",
            "Cannot predict now",
            "Concentrate and ask again",
            "Don't count on it",
            "My reply is no",
            "My sources say no",
            "Outlook not so good",
            "Very doubtful"
        ]
    },
    uk: {
        desc: "Задайте магічній кулі питання",
        args: {
            question: "Питання"
        },
        noQuestion: "❌ Ви не вказали питання",
        answers: [
            "Без сумніву",
            "Однозначно так",
            "Так, звичайно",
            "Так, ви можете на це покластися",
            "Як я бачу, так",
            "Найбільш ймовірно",
            "Перспективи хороші",
            "Так",
            "Зірки вказують на так",
            "Відповідь туманна, спробуйте ще раз",
            "Запитайте пізніше",
            "Краще не розказувати вам зараз",
            "Не можу передбачити зараз",
            "Зосередьтеся і запитайте ще раз",
            "Не розраховуйте на це",
            "Моя відповідь - ні",
            "Мої джерела кажуть ні",
            "Перспективи не так хороші",
            "Дуже сумнівно"
        ]
    },
};

module.exports = {
    name: "8ball",
    category: "fun",
    aliases: ["шарик", "ball", "шар", "8", "8шар", "8шарик", "кулька", "кулька8", "куля", "куля8"],
    arguments: [{
        name: "question",
        type: "string",
        required: true
    }],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);
        if (!args.question) return callback({ type: 'text', content: translate('noQuestion') });
        const answers = translate('answers');
        const index = Math.floor(Math.random() * answers.length);
        const answer = answers[index];
        callback({ type: 'text', content: answer });
    }
}