module.exports = {
    "env": {
        "node": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "overrides": [
    ],
    "parserOptions": {
        "ecmaVersion": "latest"
    },
    "rules": {
        "no-unused-vars": [2, {"args": "all", "argsIgnorePattern": "^_"}]
    }
}
