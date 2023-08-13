const vscode                = require('vscode');
const $path                 = require('path');
const orderBy               = require('lodash.orderby');
const minimatch             = require('minimatch');
const helper                = require ('./helpers');
const DataProvider          = require('./DataProvider');
const TabgroupItem          = require('./TreeItem/Tabgroup');
const WorkspaceFolderItem   = require('./TreeItem/Workspace');
const FolderItem            = require('./TreeItem/Folder');
const FileItem              = require('./TreeItem/File');
const packageJson           = require('../package.json');
const event                 = require('./event');

class TreeviewPanel {
	#debugMode;
	#treeview;
	flat;
	#dataProvider;
	tree;

	constructor(context) {
		this.#debugMode = context.extensionMode === vscode.ExtensionMode.Development;
		this.#dataProvider = new DataProvider(this);
		this.#registerEvents();
		this.recreateTree(true);
	}

	#registerEvents() {
		vscode.workspace.onDidChangeConfiguration((item) => {
			this.#log('> vscode.workspace.onDidChangeConfiguration');
			for (const configurationPropertyName in packageJson.contributes.configuration.properties) {
				if (item.affectsConfiguration(configurationPropertyName)) {
					this.recreateTree();
				}
			}
		});
		
		vscode.workspace.onDidChangeTextDocument(changed => {
			this.#log('> vscode.workspace.onDidChangeTextDocument');
			if (changed.document.uri.scheme !== 'file') return;
			if (changed.contentChanges.length !== 0) return;
		
			// search for the item and update it
			const id = helper.getId(changed.document);
			if (!id) return;

			const fileItem = this.flat.files[id];
			if (fileItem) {
				fileItem.update(changed.document);
				this.#dataProvider.refresh();
			}
		});
		
		vscode.window.tabGroups.onDidChangeTabs(tabs => {
			this.#log('> vscode.window.tabGroups.onDidChangeTabs', tabs);
			if (tabs.opened.length || tabs.closed.length) {
				this.recreateTree();
			}
		
			if (tabs.changed.length) {
				tabs.changed.forEach(tab => {
					// if the new page is an internal page (e.g. the Settings page, input is empty)
					if (typeof tab.input === 'undefined') return;
		
					// update the icon
					const fileItem = this.flat.files[helper.getId(tab)];
					fileItem.update(tab);
					this.#updateContextValue(fileItem);
					this.#dataProvider.refresh();
				})
			}
		});

		vscode.window.tabGroups.onDidChangeTabGroups(tabgroups => {
			if (tabgroups.opened.length || tabgroups.closed.length) {
				this.recreateTree();
			}
		});
		
		// recreate tree if a workspace folder was added/removed
		vscode.workspace.onDidChangeWorkspaceFolders(() => {
			this.#log('> vscode.workspace.onDidChangeWorkspaceFolders');
			this.recreateTree();
		});
	}

	recreateTree(initial = false) {
		this.#log('> recreateTree', (new Date).toLocaleTimeString());
	
		this.flat = {
			'tabGroups': {},
			'workspaceFolders': {},
			'folders': {},
			'files': {},
		};
	
		// create the root that we don't display in the GUI but has a children member we add our items to, and a path that is used to shorten the labels of the tree items
		let rootPath = '/';
		if (typeof vscode.workspace.workspaceFolders !== 'undefined') {
			const ws = vscode.workspace.workspaceFolders;
			if (ws.length === 1) {
				rootPath = helper.getPath(ws[0]);
			}
		}
		this.tree = new FolderItem(rootPath);
		
		// flatten all current tabs as we don't need the tab groups
		let tabs = vscode.window.tabGroups.all.map(group => group.tabs).flat();

		tabs = tabs.filter(tab => {
			if (!tab.input) return false;

			// keep images
			if (tab.input.viewType === 'imagePreview.previewEditor') return true;

			// filter virtual elements like "Keyboard Shortcuts" or "Markdown preview" as we don't know of which file this is the preview
			if (typeof tab.input !== 'undefined' && typeof tab.input.viewType === 'undefined') return true;

			return false;
		});

		// created nested Tree
		tabs.forEach(tab => {
			const config = vscode.workspace.getConfiguration('betterOpenEditors');

			// an object of items that are changing between the next four steps
			const payload = {
				parent: this.tree,
				workspaceFolder: this.tree,
			}
			
			this.#addTabGroup(tab, payload, config);
			this.#addWorkspace(tab, payload, config);
			this.#addFolder(tab, payload, config);
			this.#addTab(tab, payload, config);
		});
	
		// iterate all flat.workspaces and flat.folders and sort content (first show folders and then files)
		this.tree.children = orderBy(this.tree.children, ['contextValue', 'sortKey'], ['desc', 'asc']);
	
		for (const id in this.flat.tabGroups) {
			this.flat.tabGroups[id].children = orderBy(this.flat.tabGroups[id].children, ['contextValue', 'sortKey'], ['desc', 'asc']);
		}
		for (const id in this.flat.workspaceFolders) {
			this.flat.workspaceFolders[id].children = orderBy(this.flat.workspaceFolders[id].children, ['contextValue', 'sortKey'], ['desc', 'asc']);
		}
		for (const id in this.flat.folders) {
			this.flat.folders[id].children = orderBy(this.flat.folders[id].children, ['contextValue', 'sortKey'], ['desc', 'asc']);
		}
		
		if (initial) {
			this.#treeview = vscode.window.createTreeView('betterOpenEditors', {
				treeDataProvider: this.#dataProvider
			});

			this.#treeview.onDidChangeVisibility((e) => {
				this.#log('> this.#treeview.onDidChangeVisibility');

				if (e.visible) {
					this.recreateTree();
				}
			});

			event.on('safeToReveal', (children) => {
				this.#revealCurrentTab(children);
			});
		} else {
			this.#dataProvider.refresh();
		}
	}
	
	#addTabGroup(tab, payload, _config) {
		if (vscode.window.tabGroups.all.length > 1) {
			let tabGroup = null;
			const tabGroupIndex = tab.group.viewColumn;

			if (this.flat.tabGroups[tabGroupIndex]) {
				tabGroup = this.flat.tabGroups[tabGroupIndex];
			} else {
				tabGroup = new TabgroupItem(tabGroupIndex, payload.parent);
				this.flat.tabGroups[tabGroupIndex] = tabGroup;
				payload.parent.children.push(tabGroup);
			}
			payload.parent = tabGroup;
		}

		return payload;
	}

	#addWorkspace(tab, payload, config) {
		// check if the file is part of a workspace folder
		// could be undefined
		if (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 1 || !config.get('SkipWorkspacesIfNotNeeded'))) {
			const tabGroupIndex = tab.group.viewColumn;
			const itemPath = helper.getPath(tab.input);
			let workspaceFolder = null;
	
			// iterate through all workspaces to find the matching one
			vscode.workspace.workspaceFolders.every(_workspace => {
				const workspacePath = helper.getPath(_workspace);
				const workspaceFlatId = `${tabGroupIndex}-${workspacePath}`;
				// we need to add the path sep to be sure it is the correct workspace
				// otherwise a file "workspace2/foo.bar" would macht "workspace", because the "2" is ignored
				if (itemPath.startsWith(workspacePath + $path.sep)) {
					if (this.flat.workspaceFolders[workspaceFlatId]) {
						workspaceFolder = this.flat.workspaceFolders[workspaceFlatId];
					} else {
						const packageData = helper.getPackageData(workspacePath);
						workspaceFolder = new WorkspaceFolderItem(_workspace.uri, tabGroupIndex, payload.parent, packageData);
						this.flat.workspaceFolders[workspaceFlatId] = workspaceFolder;
						payload.parent.children.push(workspaceFolder);
					}
					payload.parent = workspaceFolder;
					payload.workspaceFolder = workspaceFolder;
					return false;
				}
				return true;
			});
		}
		
		return payload;
	}

	#addFolder(tab, payload, config) {
		const tabGroupIndex = tab.group.viewColumn;
		const itemPath = helper.getPath(tab.input);
		let folder;

		// check if the file is in a folder (by package.json or pattern)
		let path = $path.dirname(itemPath);
		const packagePatterns = config.get('PackagePatterns').split('\n');

		// second parts mean: if we have only one path separator in the path (the case on Mac for "/" and on Windows for "\")
		while (path !== payload.parent.path && path.split($path.sep).length - 1 > 1) {
			const packageData = helper.getPackageData(path);
			const patternMatch = packagePatterns.filter(pattern => { return minimatch(path, pattern); } ).length > 0;
			const folderFlatId = `${tabGroupIndex}-${path}`;

			if (packageData || patternMatch) {
				if (this.flat.folders[folderFlatId]) {
					folder = this.flat.folders[folderFlatId];
				} else {
					folder = new FolderItem(path, tabGroupIndex, payload.parent, payload.workspaceFolder, packageData);
					this.flat.folders[folderFlatId] = folder;
					payload.parent.children.push(folder);
				}
				payload.parent = folder;
				break;
			}
			path = $path.join(path, '..');
		}

		return payload;
	}

	#addTab(tab, payload, _config) {
		const file = new FileItem(tab, payload.parent, payload.workspaceFolder);
		this.flat.files[file.id] = file;
		payload.parent.children.push(file);
		
		return payload;
	}

	// https://github.com/microsoft/vscode-discussions/discussions/125
	#revealCurrentTab(children) {
		const tab = vscode.window.tabGroups.activeTabGroup.activeTab;
		const id = helper.getId(tab);

		// find the id in the children. If it is found it is safe to reveal it
		const treeItem = children.find((treeItem) => treeItem.hasContextValue('file') && treeItem.id === id );
		if (treeItem) {
			const ref = this.flat.files[id];
			this.#treeview.reveal(ref);
			this.#updateContextValue(ref);
		}
	}

	// update the contextValue to view the "pin tab" context menu
	// set the contextValue of the file to "[file][current]" and others to "[file]" only
	#updateContextValue(fileItem) {
		for (const id in this.flat.files) {
			this.flat.files[id].setContextValue('file');
		}

		fileItem.addContextValue('current');

		if (fileItem.isPinned) {
			fileItem.addContextValue('pinned');
		}
	}

	#log() {
		if (!this.#debugMode) return;
		console.log.apply(this, arguments);
	}
}

module.exports = TreeviewPanel;