const { Translator } = require('../common/utils');

const { spawn } = require("child_process");

function runCode(code) {
    return new Promise((resolve, reject) => {
        code = `alert=console.log;document={write:console.log};\n` + code

        const child = spawn("node", ["-e", code]);

        let output = "";
        let error = "";

        child.stdout.on("data", (data) => {
            output += data;
        });

        child.stderr.on("data", (data) => {
            error += data;
        });

        child.on("close", (code) => {
            if (code !== 0) {
                reject(`Child process exited with code ${code}: ${error}`);
            } else {
                resolve(output);
            }
        });

        setTimeout(() => {
            child.kill();
            reject(output + "\n*Execution time exceeded*");
        }, 5000); // Set a maximum execution time of 5 seconds
    });
}

const translations = {
    en: {
        desc: "Run JavaScript code",
        args: {},
        noCode: "No code specified",
        output: "Result",
        error: "Error",
        tooBig: "Result is too big",
    },
    uk: {
        desc: "Виконати JavaScript код",
        args: {},
        noCode: "Код не вказано",
        output: "Результат",
        error: "Помилка",
        tooBig: "Результат занадто великий",
    },
};

module.exports = {
    name: "eval",
    category: "utils",
    aliases: ["js", "javascript", "code", "execute", "run", "евал", "джаваскрипт"],
    arguments: [
        {
            name: "code",
            type: "string",
            isRequired: true,
            longString: true,
        }
    ],
    translations: translations,
    ownerOnly: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);

        if (!args.code) {
            callback({ type: 'text', content: translate('noCode') })
            return;
        }

        if (args.code.startsWith('```js'))
            args.code = args.code.substring(5);
        if (args.code.startsWith('```'))
            args.code = args.code.substring(3);
        if (args.code.endsWith('```'))
            args.code = args.code.substring(0, args.code.length - 3);

        try {
            let result = await runCode(args.code);

            if (result.length > 2000) {
                result = result.substring(0, 1800) + `\n*${translate("tooBig")}*`;
            }

            callback({ type: 'text', content: `${translate("output")}:\`\`\`${result}\`\`\`` });
        } catch (e) {
            console.log(e);
            callback({ type: 'text', content: `${translate("error")}:\`\`\`${e}\`\`\`` });
        }
    }
}