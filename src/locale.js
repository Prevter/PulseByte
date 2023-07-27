const fs = require('fs');
const config = require('../config.json');

let locales = [];
fs.readdirSync('./src/locales').forEach(file => {
    if (file.endsWith('.json')) {
        locales.push(file);
    }
});

const getNestedKey = (obj, key) => {
    if (!key.includes('.')) return obj[key];
    return key.split('.').reduce((o, i) => o[i], obj);
}

/**
 * Creates a locale function for the specified locale.
 * @param {string} locale The locale to create the function for.
 * @returns {(key:string, ...args) => string} The locale function. 
 * Translates a key to the specified locale, can be nested with dots. 
 * Can take arguments.
 * @example
 * // en.json
 * {
 *    "test": "Test",
 *    "test2": "Test {0}"
 * }
 * 
 * // js
 * const locale = localeBuilder('en');
 * console.log(locale('test')); // 'Test'
 * console.log(locale('test2', 'Hello')); // 'Test Hello'
 */
module.exports = (locale) => {
    if (!locales.includes(locale + '.json')) {
        throw new Error(`Locale ${locale} not found.`);
    }

    const localeFile = require(`./locales/${locale}.json`);

    return (key, ...args) => {
        if (key === '_locale') return locale;

        let defaultNull = key.startsWith('!');
        let defaultNullIgnore = key.startsWith('~');
        if (defaultNull || defaultNullIgnore) key = key.substring(1);
        if (defaultNullIgnore) defaultNull = true;

        let value = null;
        try {
            value = getNestedKey(localeFile, key);
        }
        catch (e) { /* empty */ }

        if (!value && !defaultNull) {
            const defaultLocale = require(`./locales/${config.default_language}.json`);
            try {
                value = getNestedKey(defaultLocale, key);
            }
            catch (e) {
                process.logger.error('Locale', `Locale key '${key}' not found in default locale '${config.default_language}'!`)
            }

            if (!value) return null;
        }

        if (!value) {
            if (defaultNullIgnore) return null;

            process.logger.warn('Locale', `Locale key '${key}' not found in '${locale}'${!defaultNull ? ` and '${config.default_language}'` : ''}!`)
            return null;
        }

        if (typeof value === 'string' && args.length > 0) {
            return value.replace(/{(\d+)}/g, (match, number) => {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        }

        return value;
    };
}