const $fs   = require('fs');
const $path = require('path');
const $util = require('util');

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
	path = path.replace(/^\\(.\:\\)/, (...hits) => {
		return hits[1].toUpperCase();
	});
	return path;
}

/**
 * Extracts a path string from a VS Code input object
 * 
 * @param {object} input - An input object (or document) that comes from VS code
 * @returns {string} a normalized path which is the main path for this input object
 */
 exports.getPath = (input) => {
	if  (typeof input.uri !== "undefined") {
        return exports.normalizePath(input.uri.path);
    // diff items
    } else if (typeof input.original !== "undefined") {
        return exports.normalizePath(input.original.path);
    }
}

/**
 * Generates an Id for the flat repository
 * 
 * @param {object} input An input object (or document) that comes from VS code
 * @returns {string} which is in unique identifier for this tab
 */
 exports.getId = (input) => {
	if  (typeof input.uri !== "undefined") {
        return exports.normalizePath(input.uri.path);
    // diff items
    } else if (typeof input.original !== "undefined") {
        return `${exports.normalizePath(input.original.path)}|${exports.normalizePath(input.modified.path)}`;
    }
}

/**
 * Generates a package description string from various package manager files
 * 
 * @param {string} path The folder in which the file is searched
 * @returns {string|null} version string in the format "[package-name] [package-version]"
 */
exports.getPackageData = (path) => {
	let packageFile;
	let data = null;
	let returner = '';

	// try multiple package files
	if (!data) {
		packageFile = $path.join(path, "package.json");
		if ($fs.existsSync(packageFile)) {
			data = JSON.parse($fs.readFileSync(packageFile, { encoding:'utf8', flag:'r' }));
		}
	}

	if (!data) {
		packageFile = $path.join(path, "composer.json");
		if ($fs.existsSync(packageFile)) {
			data = JSON.parse($fs.readFileSync(packageFile, { encoding:'utf8', flag:'r' }));
		}
	}

	if (data && typeof data.name !== "undefined" && typeof data.name === "string") {
		returner = data.name;
	}
	if (data && typeof data.version !== "undefined" && typeof data.version === "string") {
		returner += " " + data.version;
	}

	return returner !== '' ? returner : null;
}

exports.log = () => {
	console.log.apply(console, Array.from(arguments).map(item => $util.inspect(item)));
}
