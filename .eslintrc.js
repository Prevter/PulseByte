module.exports = {
    "globals": {
        "module": false,
        "require": false,
        "process": false
    },
    "env": {
        "browser": true,
        "amd": true,
        "node": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "rules": {
        "no-unused-vars": ["off"],
    }
}