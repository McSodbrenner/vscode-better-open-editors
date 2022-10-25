const $fs = require('fs');
const $path = require('path');

/**
 * Extracts a path string from a VS Code input object
 *
 * @param {object} input - An input object (or document) that comes from VS code
 * @returns {string} a normalized path which is the main path for this input object
 */
exports.getPath = (input) => {
	if (typeof input.uri !== 'undefined') {
		return input.uri.fsPath;
		// diff items
	} else if (typeof input.original !== 'undefined') {
		return input.original.fsPath;
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
		return tab.group.viewColumn + '-' + tab.input.uri.fsPath;
		// diff items
	} else if (tab.input && typeof tab.input.original !== 'undefined') {
		return tab.group.viewColumn + '-' + tab.input.original.fsPath + '|' + tab.input.modified.fsPath;
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
		packageFile: '',
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

	returner.packageFile = packageFile;

	return returner;
};


/**
 * Escapes parameters for the use in a regular expression
 *
 * @param {string} string The input string
 */

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Sort a list of file paths
 *
 * @param {array} paths The list of file paths
 * @param {callback} pathExtractor A function that returns that corresponding path, eg. (item) => item.fsPath
 * @param {string} sep The path separator that should be used
 */
exports.sortPaths = (paths, pathExtractor, sep) => {
	const dirs = Object.fromEntries(paths
		// extract dir and set space before dir separator (nice trick to sort correctly)
		.map((item) => pathExtractor(item).match(new RegExp(`(.+)${escapeRegExp(sep)}`))[1].replaceAll(sep, ' ' + sep))
		.sort()
		// remove the space before the dir separator
		.map((path) => path.replaceAll(' ' + sep, sep))
		// we only want to have unique dirs
		.filter((value, index, self) => self.indexOf(value) === index )
		// create an "entries" object to be able to use Object.fromEntries
		.map((path) => [path, []])
	);
	
	// put all files in the correct folders
	paths.forEach((item) => {
		const path = pathExtractor(item).match(new RegExp(`(.+)${escapeRegExp(sep)}`))[1];
		dirs[path].push(item);
	});

	// get all the files back and sort the files
	let result = [];
	for (const dir in dirs) {
		result = result.concat(dirs[dir].sort());
	}

	return result;
}

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
