const $fs = require('fs');
const $path = require('path');

/**
 * Normalizes the path in a way we can handle windows and mac pathes nearly the same way
 *
 * @param {string} path - A path that comes from VS code
 * @returns {string} a normalized path
 */
exports.normalizePath = (path) => {
	// the uri.path in vscode is sometimes with forward slashes...
	path = $path.normalize(path);
	// remove the leading slash on windows ("\c:\\...\...") and make the drive letter always uppercase
	path = path.replace(/^\\(.:\\)/, (...hits) => {
		return hits[1].toUpperCase();
	});
	return path;
};

/**
 * Extracts a path string from a VS Code input object
 *
 * @param {object} input - An input object (or document) that comes from VS code
 * @returns {string} a normalized path which is the main path for this input object
 */
exports.getPath = (input) => {
	if (typeof input.uri !== 'undefined') {
		return exports.normalizePath(input.uri.path);
		// diff items
	} else if (typeof input.original !== 'undefined') {
		return exports.normalizePath(input.original.path);
	} else {
		return '';
	}
};

/**
 * Generates an Id for the flat repository
 *
 * @param {object} input An input object (or document) that comes from VS code
 * @returns {string} which is in unique identifier for this tab
 */
exports.getId = (tab) => {
	if (tab.input && typeof tab.input.uri !== 'undefined') {
		return (
			tab.group.viewColumn +
			'-' +
			exports.normalizePath(tab.input.uri.path)
		);
		// diff items
	} else if (tab.input && typeof tab.input.original !== 'undefined') {
		return (
			tab.group.viewColumn +
			'-' +
			`${exports.normalizePath(
				tab.input.original.path
			)}|${exports.normalizePath(tab.input.modified.path)}`
		);
	}
	return null;
};

/**
 * Generates a package description string from various package manager files
 *
 * @param {string} path The folder in which the file is searched
 * @returns {string|null} version string in the format "[package-name] [package-version]"
 */
exports.getPackageData = (path) => {
	let packageFile;
	let data = null;
	const returner = {
		name: '',
		version: '',
	};

	// try multiple package files
	if (!data) {
		packageFile = $path.join(path, 'package.json');
		if ($fs.existsSync(packageFile)) {
			data = JSON.parse(
				$fs.readFileSync(packageFile, { encoding: 'utf8', flag: 'r' })
			);
		}
	}

	if (!data) {
		packageFile = $path.join(path, 'composer.json');
		if ($fs.existsSync(packageFile)) {
			data = JSON.parse(
				$fs.readFileSync(packageFile, { encoding: 'utf8', flag: 'r' })
			);
		}
	}

	if (
		data &&
		typeof data.name !== 'undefined' &&
		typeof data.name === 'string'
	) {
		returner.name = data.name;
	}
	if (
		data &&
		typeof data.version !== 'undefined' &&
		typeof data.version === 'string'
	) {
		returner.version = data.version;
	}

	if (returner.name === '') {
		return null;
	}

	return returner;
};

exports.makeItalic = (text) => {
	return text.replace(/[A-Za-z0-9]/g, (char) => {
		let diff;
		if (/[a-z]/.test(char)) {
			diff = '𝘢'.codePointAt(0) - 'a'.codePointAt(0);
		} else if (/[A-Z]/.test(char)) {
			diff = '𝘈'.codePointAt(0) - 'A'.codePointAt(0);
		} else if (/[0-9]/.test(char)) {
			diff = '0'.codePointAt(0) - '0'.codePointAt(0);
		}
		return String.fromCodePoint(char.codePointAt(0) + diff);
	});
};

exports.makeBold = (text) => {
	return text.replace(/[A-Za-z0-9]/g, (char) => {
		let diff;
		if (/[a-z]/.test(char)) {
			diff = '𝗮'.codePointAt(0) - 'a'.codePointAt(0);
		} else if (/[A-Z]/.test(char)) {
			diff = '𝗔'.codePointAt(0) - 'A'.codePointAt(0);
		} else if (/[0-9]/.test(char)) {
			diff = '𝟬'.codePointAt(0) - '0'.codePointAt(0);
		}
		return String.fromCodePoint(char.codePointAt(0) + diff);
	});
};
