const vscode                = require('vscode');
const $path                 = require('path');
const orderBy               = require('lodash.orderby');
const minimatch             = require('minimatch');
const helper                = require ('./helpers');
const DataProvider          = require('./DataProvider.js');
const TabgroupItem          = require('./TreeItem/Tabgroup.js');
const WorkspaceFolderItem   = require('./TreeItem/Workspace.js');
const FolderItem            = require('./TreeItem/Folder.js');
const FileItem              = require('./TreeItem/File.js');
const packageJson           = require('../package.json');

module.exports = class TreeviewPanel {
    #debugMode;
    #treeview;
    #flat;
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
            this.#log("> vscode.workspace.onDidChangeConfiguration");
            for (const configurationPropertyName in packageJson.contributes.configuration.properties) {
                if (item.affectsConfiguration(configurationPropertyName)) {
                    this.recreateTree();
                }
            }
        });
        
        vscode.workspace.onDidChangeTextDocument(changed => {
            this.#log("> vscode.workspace.onDidChangeTextDocument");
            if (changed.document.uri.scheme !== 'file') return;
            if (changed.contentChanges.length !== 0) return;
        
            // search for the item and update it
            const fileItem = this.#flat.files[helper.getId(changed.document)];
            if (fileItem) {
                fileItem.updateIcon(changed.document);
                this.#dataProvider.refresh();
            }
        });
        
        vscode.window.tabGroups.onDidChangeTabs(tabs => {
            this.#log("> vscode.window.tabGroups.onDidChangeTabs");
            if (tabs.opened.length || tabs.closed.length) {
                this.recreateTree();
            }
        
            if (tabs.changed.length) {
                tabs.changed.forEach(tab => {
                    // if the new page is an internal page (e.g. the Settings page, input is empty)
                    if (typeof tab.input === "undefined") return;
        
                    // update the icon
                    const fileItem = this.#flat.files[helper.getId(tab)];
                    fileItem.updateIcon(tab);
                    this.#dataProvider.refresh();
                    this.#revealCurrentTab();
                })
            }
        });

        vscode.window.tabGroups.onDidChangeTabGroups(tabgroups => {
            if (tabgroups.opened.length || tabgroups.closed.length) {
                this.recreateTree();
            }

            if (tabgroups.changed.length) {
                this.#revealCurrentTab();
            }
        });
        
        // recreate tree if a workspace folder was added/removed
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            this.#log("> vscode.workspace.onDidChangeWorkspaceFolders");
            this.recreateTree();
        });
    }

    recreateTree(initial = false) {
        this.#log("recreateTree", (new Date).toLocaleTimeString());
    
        this.#flat = {
            'tabGroups': {},
            'workspaceFolders': {},
            'folders': {},
            'files': {},
        };
    
        // create the root that we don't display in the GUI but has a children member we add our items to, and a path that is used to shorten the labels of the tree items
        let rootPath = "/";
        if (typeof vscode.workspace.workspaceFolders !== "undefined") {
            const ws = vscode.workspace.workspaceFolders;
            if (ws.length === 1) {
                rootPath = helper.getPath(ws[0]);
            }
        }
        this.tree = new FolderItem(rootPath);
        
        let tabs = vscode.window.tabGroups.all.map(group => group.tabs).flat();
        // console.log(tabs);
        
        // filter virtual elements like "Keyboard Shortcuts"
        tabs = tabs.filter(tab => typeof tab.input !== "undefined");

        // created nested Tree
        tabs.forEach(tab => {
            const config = vscode.workspace.getConfiguration("betterOpenEditors");
            this.#addTabToTree(tab, config);
        });
    
        // iterate all flat.workspaces and flat.folders and sort content (first show folders and then files)
        this.tree.children = orderBy(this.tree.children, ['contextValue', 'sortKey'], ['desc', 'asc']);
    
        for (const id in this.#flat.tabGroups) {
            this.#flat.tabGroups[id].children = orderBy(this.#flat.tabGroups[id].children, ['contextValue', 'sortKey'], ['desc', 'asc']);
        }
        for (const id in this.#flat.workspaceFolders) {
            this.#flat.workspaceFolders[id].children = orderBy(this.#flat.workspaceFolders[id].children, ['contextValue', 'sortKey'], ['desc', 'asc']);
        }
        for (const id in this.#flat.folders) {
            this.#flat.folders[id].children = orderBy(this.#flat.folders[id].children, ['contextValue', 'sortKey'], ['desc', 'asc']);
        }
        
        if (initial) {
            this.#treeview = vscode.window.createTreeView('betterOpenEditors', {
                treeDataProvider: this.#dataProvider
            });

            this.#treeview.onDidChangeVisibility((event) => {
                this.#log("> this.#treeview.onDidChangeVisibility");
                // highlight currently active editor
                if (event.visible) {
                    this.#revealCurrentTab();
                }
            });
        } else {
            this.#dataProvider.refresh();
        }
    }
    
    #addTabToTree(item, config) {
        this.#log("> #addTabToTree");
        const itemPath = helper.getPath(item.input);
    
        // we use parent to know to which item we have to add the next level
        let parent = this.tree;
        let tabGroup = null;
        let tabGroupIndex;
        let workspaceFolder = null;
        let folder = null;
        
        // add tab group for workspace folder
        if (vscode.window.tabGroups.all.length > 1) {
            tabGroupIndex = item.group.viewColumn;
            if (this.#flat.tabGroups[tabGroupIndex]) {
                tabGroup = this.#flat.tabGroups[tabGroupIndex];
            } else {
                tabGroup = new TabgroupItem(tabGroupIndex, parent);
                this.#flat.tabGroups[tabGroupIndex] = tabGroup;
                parent.children.push(tabGroup);
            }
            parent = tabGroup;
        }

        // check if the file is part of a workspace folder
        // could be undefined
        if (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 1 || !config.get('SkipWorkspacesIfNotNeeded'))) {
            // iterate through all workspaces to find the matching one
            vscode.workspace.workspaceFolders.every(_workspace => {
                const workspacePath = helper.getPath(_workspace);
                const workspaceFlatId = `${tabGroupIndex}-${workspacePath}`;
                // we need to add the path sep to be sure it is the correct workspace
                // otherwise a file "workspace2/foo.bar" would macht "workspace", because the "2" is ignored
                if (itemPath.startsWith(workspacePath + $path.sep)) {
                    if (this.#flat.workspaceFolders[workspaceFlatId]) {
                        workspaceFolder = this.#flat.workspaceFolders[workspaceFlatId];
                    } else {
                        const packageData = helper.getPackageData(workspacePath);
                        workspaceFolder = new WorkspaceFolderItem(_workspace.uri, tabGroupIndex, parent, packageData);
                        this.#flat.workspaceFolders[workspaceFlatId] = workspaceFolder;
                        parent.children.push(workspaceFolder);
                    }
                    parent = workspaceFolder;
                    return false;
                }
                return true;
            });
        }
    
        // check if the file is in a folder (by package.json or pattern)
        let path = $path.dirname(itemPath);
        const packagePatterns = config.get("PackagePatterns").split("\n");
    
        while (true) {
            // second parts mean: if we have only one path separator in the path (the case on Mac for "/" and on Windows for "\")
            if (path === parent.path || path.split($path.sep).length - 1 === 1) break;
            
            const packageData = helper.getPackageData(path);
            const patternMatch = packagePatterns.filter(pattern => { return minimatch(path, pattern); } ).length > 0;
            const folderFlatId = `${tabGroupIndex}-${path}`;
    
            if (packageData || patternMatch) {
                if (this.#flat.folders[folderFlatId]) {
                    folder = this.#flat.folders[folderFlatId];
                } else {
                    folder = new FolderItem(path, tabGroupIndex, parent, packageData);
                    this.#flat.folders[folderFlatId] = folder;
                    parent.children.push(folder);
                }
                parent = folder;
                break;
            }
            path = $path.join(path, "..");
        }
    
        // at least add the file item
        let file;
        file = new FileItem(item, parent, tabGroupIndex);
        this.#flat.files[file.id] = file;
        file.workspaceFolder = workspaceFolder;
        file.folder = folder;
    
        parent.children.push(file);
    
        return file;
    }
    
    #revealCurrentTab() {
        // does not exist if the currently active item on startup is eg. the "Settings" editor
        if (!vscode.window.tabGroups.activeTabGroup.activeTab.input) {
            this.#log("#revealCurrentTab: There is no activeTab");
            return;
        }

        this.#log("> #revealCurrentTab", helper.getId(vscode.window.tabGroups.activeTabGroup.activeTab));

        this.#treeview.reveal(this.#flat.files[helper.getId(vscode.window.tabGroups.activeTabGroup.activeTab)]);
    }

    #log() {
        if (this.#debugMode) {
            console.log.apply(this, arguments);
        }
    }
}
