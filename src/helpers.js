const $path = require('path');
const $util = require('util');

/**
 * Normalizes the path in a way we can handle windows and mac pathes nearly the same way
 * 
 * @param {string} path - A path that comes from VS code
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
 * @param {object} input - An input object (or document) that comes from VS code
 */
 exports.getId = (input) => {
	if  (typeof input.uri !== "undefined") {
        return exports.normalizePath(input.uri.path);
    // diff items
    } else if (typeof input.original !== "undefined") {
        return `${exports.normalizePath(input.original.path)}|${exports.normalizePath(input.modified.path)}`;
    }
}

exports.log = () => {
	console.log.apply(console, Array.from(arguments).map(item => $util.inspect(item)));
}
