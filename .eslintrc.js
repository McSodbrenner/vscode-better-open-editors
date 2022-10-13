module.exports = {
	env: {
		node: true,
		es2021: true
	},
	extends: 'eslint:recommended',
	overrides: [
	],
	parserOptions: {
		ecmaVersion: 'latest'
	},
	plugins: [
		'import',
	],
	rules: {
		'no-unused-vars': [2, {'args': 'all', 'argsIgnorePattern': '^_'}],
		'import/no-unresolved': [2, { commonjs: true, caseSensitiveStrict: true, ignore: ['vscode'] }],
		'indent': ['error', 'tab'],
		'quotes': ['error', 'single'],
		'linebreak-style': ['error', 'unix'],
	}
}
