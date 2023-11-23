const vscode        = require('vscode');
const helper        = require ('./helpers');
const $path			= require('path');

class QuickPick {
	#pick;
	#treeviewPanel;
	#packageFolder;

	constructor(_context, treeviewPanel) {
		this.#treeviewPanel = treeviewPanel;

		this.#pick = vscode.window.createQuickPick();
		this.#pick.placeholder = 'Search files by name';
		this.#pick.onDidAccept(() => {
			this.#pick.activeItems.forEach((item) => {
				vscode.commands.executeCommand('vscode.open', item.resourceUri);
			});
		});

		this.#pick.onDidChangeValue((q) => {
			this.#updateItems(q);
		});
	}

	findFiles() {
		this.#pick.value = '';

		const tab = vscode.window.tabGroups.activeTabGroup.activeTab;
		const id = helper.getId(tab);

		if (!this.#treeviewPanel.flat.files[id]) return;
		const item = this.#treeviewPanel.flat.files[id];
		if (!item.parent.hasContextValue('folder')) return;
		this.#packageFolder = item.parent;
		
		this.#pick.title = this.#packageFolder.label || this.#packageFolder.description;

		this.#updateItems('');
	}

	#updateItems(q) {
		let currentDir = null;
		let glob;

		if (q === '') {
			glob = '**';
			this.#pick.busy = true;
			this.#pick.show();
		} else {
			const globQ = q.split('').map((char) => {
				return char.match(/\s/) ? '*' : `[${char.toLowerString()}${char.toUpperString()}]`;
			}).join('');
			glob = `*${globQ}*`;
		}

		// use https://code.visualstudio.com/api/references/vscode-api#QuickPick:~:text=)%3A%20FileSystemWatcher-,findFiles,-(include%3A
		vscode.workspace.findFiles(
			new vscode.RelativePattern(this.#packageFolder.resourceUri.fsPath, glob),
			undefined, // When undefined, default file-excludes (e.g. the files.exclude-setting but not search.exclude) will apply. When null, no excludes will apply.
			100,
		).then((files) => {
			const items = [];

			files = helper.sortPaths(files, (file) => file.fsPath, $path.sep);

			files.forEach((file) => {
				const dirname = $path.dirname(file.fsPath).replace(this.#packageFolder.resourceUri.fsPath, '');

				if (dirname !== currentDir) {
					currentDir = dirname;
					if (dirname !== '.') {
						items.push({
							label: dirname.substring(1),
							kind: vscode.QuickPickItemKind.Separator,
						});
					}
				}


				const config = vscode.workspace.getConfiguration('betterOpenEditors');
				let label = file.fsPath.replace(this.#packageFolder.resourceUri.fsPath, '').substring(1);
				
				if (config.get('InsertSpacesAroundSlashes')) {
					label = label.replaceAll($path.sep, ' ' + $path.sep + ' ');
				}
		
				if (config.get('InsertSpaceForLastSlug')) {
					const parts = label.split($path.sep);
					if (parts.length > 1) {
						const last = $path.sep + ' ' + parts.pop();
						label = parts.join($path.sep) + last;
					}
				}

				items.push({
					label,
					description: dirname,
					iconPath: vscode.ThemeIcon.File,
					resourceUri: file,
				});
			});

			this.#pick.items = items;
			this.#pick.busy = false;
		});
	}
}

module.exports = QuickPick;