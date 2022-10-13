const vscode    = require('vscode');
const $os       = require('os');
const $path     = require('path');
const helper    = require ('../helpers');

module.exports = class Folder {
	constructor(path, tabGroupIndex, parent = null, workspaceFolder = null, packageData = null) {
		const config = vscode.workspace.getConfiguration('betterOpenEditors');
		
		this.contextValue       = 'folder';
		this.id                 = `${tabGroupIndex}-${path}`;
		this.resourceUri        = vscode.Uri.parse('/' + path);
		this.path               = path;
		this.sortKey            = helper.normalizePath(path).toLowerCase();
		this.collapsibleState   = vscode.TreeItemCollapsibleState.Expanded;
		this.workspaceFolder    = workspaceFolder;
		
		this.parent             = parent;
		this.children           = [];

		// config dependent members
		if (config.get('ShowPackageIcon')) {
			this.iconPath = new vscode.ThemeIcon('package');   
		} else {
			delete this.iconPath;
		}

		// add label
		this.label = this.path;
		if (this.parent !== null) {
			this.label = this.label.replace(this.parent.path + $path.sep, '');
		}

		// replace homedir
		this.label = this.label.replace($os.homedir(), '~');

		// add whitespace around slashes
		if (config.get('InsertSpacesAroundSlashes')) {
			this.label = this.label.replaceAll($path.sep, ' ' + $path.sep + ' ');
		}

		if (config.get('InsertSpaceForLastSlug')) {
			const parts = this.label.split($path.sep);
			if (parts.length > 1) {
				const last = $path.sep + ' ' + parts.pop();
				this.label = parts.join($path.sep) + last;
			}
		}

		if (packageData) {
			if (config.get('ShowPackageInfo')) {
				this.description = `${packageData.name} ${packageData.version}`;

				if (config.get('HidePackagePath')) {
					this.label = '';
				}
			}
		}
	}
}