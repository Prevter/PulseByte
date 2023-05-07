const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Calculate expression",
        args: {
            expression: "Expression to calculate"
        },
        noExpression: "No expression provided",
        result: "Result:",
    },
    uk: {
        desc: "Розрахувати вираз",
        args: {
            expression: "Вираз для розрахунку"
        },
        noExpression: "Вираз не вказано",
        result: "Результат:",
    },
};

module.exports = {
    name: "calc",
    category: "utils",
    aliases: ["calculate", "calculator", "калькулятор", "порахуй", "порахувати"],
    arguments: [
        {
            name: "expression",
            type: "string",
            isRequired: true,
            longString: true,
            useQuotes: false,
        }
    ],
    translations: translations,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);

        if (!args.expression) {
            callback({ type: 'text', content: translate('noExpression') });
            return;
        }

        try {
            const expression = args.expression.replace(/[^0-9+\-*/.()\[\]{}!]/g, '');
            const result = `${translate('result')} ${eval(expression)}`;
            callback({ type: 'text', content: result });
        } catch (e) {
            console.log(e);
            callback({ type: 'text', content: e.message });
        }
    }
}