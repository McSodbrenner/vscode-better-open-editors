const vscode    = require('vscode');
const $os       = require('os');
const $path     = require('path');
const helper    = require ('../helpers');
const Base		= require ('./Base');

module.exports = class File extends Base {
	constructor(tab, parent, workspaceFolder) {
		super();
		
		this.addContextValue('file');
		this.collapsibleState   = vscode.TreeItemCollapsibleState.None;
		this.parent             = parent;
		this.isPinned           = tab.isPinned;
		this.tab                = tab;
		this.workspaceFolder    = workspaceFolder;

		this.id         = helper.getId(tab);
		this.path       = helper.getPath(tab.input);
		this.sortKey    = this.path.toLowerCase();

		// standard items
		if  (typeof tab.input.uri !== 'undefined') {
			this.internalLabel  = this.path;
			this.resourceUri    = tab.input.uri;

			this.command = {
				// "untitled" files cannot be handled via vscode.open :(
				command: tab.input.uri.scheme === 'untitled' ? 'betterOpenEditors.showTab' : 'vscode.open',
				title: 'Open',
				arguments: [tab.input.uri, tab.group.viewColumn],
			}

		// two editors items
		} else if (typeof tab.input.original !== 'undefined') {
			this.internalLabel  = this.path;
			this.resourceUri    = tab.input.original;

			this.command = {
				command: 'vscode.diff',
				title: 'Open',
				arguments: [tab.input.original, tab.input.modified, 'Differences', tab.group.viewColumn],
			}

			// add description
			try {
				if (tab.input.original.scheme === 'file') {
					this.internalLabel += ` ↔ ${$path.basename(tab.input.modified.path)}`;
				} else if (tab.input.original.scheme === 'gitlens') {
					let original = '';
					let modified = $path.basename(tab.input.modified.path);
					
					try {
						original += `${JSON.parse(tab.input.original.query).ref}`;
					// eslint-disable-next-line no-empty
					} catch (e) {}

					try {
						modified += ` ${JSON.parse(tab.input.modified.query).ref}`;
					// eslint-disable-next-line no-empty
					} catch (e) {}

					this.description = `${original} 🠖 ${modified}`;
				} else if (tab.input.original.scheme === 'git') {
					this.description = 'Changes';
				}
			} catch(e) {
				this.description = 'Case not handled';
			}
		} else if (typeof tab.input.viewType !== 'undefined') {
			this.internalLabel  = tab.label;
			this.resourceUri    = tab.input.uri;

			// cannot switch to preview tab... true anymore?
			// this.command = {
			//     // "untitled" files cannot be handled via vscode.open :(
			//     command: "betterOpenEditors.showTab",
			//     title: "Open",
			//     arguments: [tab.input.uri, tab.group.viewColumn],
			// }
		}

		this.internalLabel      = this.internalLabel.replace(this.parent.path + $path.sep, '');
		this.internalLabel      = this.internalLabel.replace($os.homedir(), '~');

		this.update(tab);
	}

	update(tab) {
		// config dependent members
		const config = vscode.workspace.getConfiguration('betterOpenEditors');

		this.iconPath = vscode.ThemeIcon.File;

		this.isPinned = typeof tab.isPinned !== 'undefined' ? tab.isPinned : this.isPinned

		if (this.isPinned) {
			this.iconPath = new vscode.ThemeIcon('pinned');
		}
		if (tab.isDirty) {
			this.iconPath = new vscode.ThemeIcon('close-dirty');
		}
		if (this.isPinned && tab.isDirty) {
			this.iconPath = new vscode.ThemeIcon('pinned-dirty');
		}
	
		this.label = this.internalLabel;

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

		if (config.get('HideFilePath')) {
			const parts = this.label.split($path.sep);
			if (parts.length > 1) {
				this.label = parts.pop();
			}
		}

		this.label = tab.isPreview ? helper.makeItalic(this.label) : this.label;
	}
}