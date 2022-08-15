const $path = require('path');
const $util = require('util');

exports.normalizePath = (path) => {
	// the uri.path in vscode is sometimes with forward slashes...
	path = $path.normalize(path);
	// remove the leading slash on windows ("\c:\\...\...") and make the drive letter always uppercase
	path = path.replace(/^\\(.\:\\)/, (...hits) => {
		return hits[1].toUpperCase();
	});
	return path;
}

exports.log = () => {
	console.log.apply(console, Array.from(arguments).map(item => $util.inspect(item)));
}
