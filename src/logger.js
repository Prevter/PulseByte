const fs = require('fs');
const levels = ['log', 'info', 'warn', 'error', 'fatal'];

const convertObject = (obj) => {
    if (typeof obj === 'object') {
        return JSON.stringify(obj, null, 2);
    } else {
        return obj;
    }
}

const getString = (type, ...args) => {
    return `(${type.toUpperCase()}) ${args.map(a => convertObject(a)).join(' ')}\n`;
}

module.exports = class Logger {
    constructor(level, file, options = { stdout: true, file: true }) {
        this.level = level;
        this.file = file;
        this.options = options;
    }

    checkLevel(level) {
        return levels.indexOf(level) >= levels.indexOf(this.level);
    }

    /**
     * Logs with the level 'log'
     * @param  {...any} args The arguments to log
     */
    log(...args) {
        if (this.checkLevel('log')) {
            if (this.options.stdout) console.log(...args);
            if (this.options.file) this.writeToFile(getString('LOG', ...args));
        }
    }

    /**
     * Logs with the level 'info'
     * @param  {...any} args The arguments to log
     */
    info(...args) {
        if (this.checkLevel('info')) {
            if (this.options.stdout) console.info(...args);
            if (this.options.file) this.writeToFile(getString('INFO', ...args));
        }
    }

    /**
     * Logs with the level 'warn'
     * @param  {...any} args The arguments to log
     */
    warn(...args) {
        if (this.checkLevel('warn')) {
            if (this.options.stdout) console.warn(...args);
            if (this.options.file) this.writeToFile(getString('WARN', ...args));
        }
    }

    /**
     * Logs with the level 'error'
     * @param  {...any} args The arguments to log
     */
    error(...args) {
        if (this.checkLevel('error')) {
            if (this.options.stdout) console.error(...args);
            if (this.options.file) this.writeToFile(getString('ERROR', ...args));
        }
    }

    /**
     * Logs with the level 'fatal'
     * @param  {...any} args The arguments to log
     */
    fatal(...args) {
        if (this.checkLevel('fatal')) {
            if (this.options.stdout) console.error(...args);
            if (this.options.file) this.writeToFile(getString('FATAL', ...args));
        }
    }

    /**
     * Writes a string to the log file
     * @param {string} str logged string
     */
    writeToFile(str) {
        const formatted = `[${new Date().toLocaleString()}] ${str}`;
        fs.appendFile(this.file, formatted, (err) => {
            if (err) throw err;
        });
    }

    /**
     * Clears the log file
     */
    clearFile() {
        fs.writeFile(this.file, '', (err) => {
            if (err) throw err;
        });
    }
}