const vscode                = require('vscode');
const $path                 = require('path');
const orderBy               = require('lodash.orderby');
const minimatch             = require('minimatch');
const helper                = require ('./helpers');
const FileItem              = require('./FileItem.js');
const FolderItem            = require('./FolderItem.js');
const WorkspaceFolderItem   = require('./WorkspaceFolderItem.js');
const package               = require('../package.json');

let treeview;
let tree;
let flat;

vscode.commands.registerCommand('betterOpenEditors.openExtensionSettings', () => {
    // the correct way but does not keep the correct order
    // vscode.commands.executeCommand('workbench.action.openSettings', '@ext:McSodbrenner.better-open-editors');
    vscode.commands.executeCommand('workbench.action.openSettings', 'betterOpenEditors.');
});

vscode.commands.registerCommand('betterOpenEditors.refreshTree', () => {
    recreateTree();
});


class DataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    // needed methods
    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (typeof element === 'undefined') {
            return tree.children;
        }
        return element.children;
    }

    getParent(element) {
        if (typeof element.parent === 'undefined') {
            return null;
        }
        return element.parent;
    }

    // // custom methods
    refresh() {
        this._onDidChangeTreeData.fire();
    }
}

function recreateTree(initial = false) {
    // console.log("###", "recreateTree", (new Date).toLocaleTimeString());

    flat = {
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
    tree = new FolderItem(rootPath);
    
    
    let tabs = vscode.window.tabGroups.all.map(group => group.tabs).flat();

    // filter virtual elements like "Keyboard Shortcuts"
    tabs = tabs.filter(tab => typeof tab.input !== "undefined");

    // created nested Tree
    tabs.forEach(tab => {
        addTabToTree(tab);
    });

    // iterate all flat.workspaces and flat.folders and sort content (first show folders and then files)
    tree.children = orderBy(tree.children, ['contextValue', 'sortKey'], ['desc', 'asc']);

    for (const path in flat.workspaceFolders) {
        flat.workspaceFolders[path].children = orderBy(flat.workspaceFolders[path].children, ['contextValue', 'sortKey'], ['desc', 'asc']);
    }
    for (const path in flat.folders) {
        flat.folders[path].children = orderBy(flat.folders[path].children, ['contextValue', 'sortKey'], ['desc', 'asc']);
    }
    
    if (initial) {
        treeview = vscode.window.createTreeView('betterOpenEditors', {
            treeDataProvider: dataProvider
        });

        // does not exist if the currently active item on startup is eg. the "Settings" editor
        if (!vscode.window.tabGroups.activeTabGroup.activeTab.input) return;

        dataProvider.refresh();

        treeview.onDidChangeVisibility((event) => {
            // highlight currently active editor
            if (event.visible) {
                treeview.reveal(flat.files[helper.getId(vscode.window.tabGroups.activeTabGroup.activeTab.input)]);
            }
        });
    }
}

function addTabToTree(item) {
    const config = vscode.workspace.getConfiguration("betterOpenEditors");
    const itemPath = helper.getPath(item.input);

    // we use parent to know to which item we have to add the next level
    let parent = tree;
    let workspaceFolder = null;
    let folder = null;

    // check if the file is part of a workspace folder
    // could be undefined
    if (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 1 || !config.get('SkipWorkspacesIfNotNeeded'))) {
        // iterate through all workspaces to find the matching one
        vscode.workspace.workspaceFolders.every(_workspace => {
            const workspacePath = helper.getPath(_workspace);
            // we need to add the path sep to be sure it is the correct workspace
            // otherwise a file "workspace2/foo.bar" would macht "workspace", because the "2" is ignored
            if (itemPath.startsWith(workspacePath + $path.sep)) {
                if (flat.workspaceFolders[workspacePath]) {
                    workspaceFolder = flat.workspaceFolders[workspacePath];
                } else {
                    const packageData = helper.getPackageData(workspacePath);
                    workspaceFolder = new WorkspaceFolderItem(_workspace.uri, parent, packageData);
                    flat.workspaceFolders[workspacePath] = workspaceFolder;
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

        if (packageData || patternMatch) {
            if (flat.folders[path]) {
                folder = flat.folders[path];
            } else {
                folder = new FolderItem(path, parent, packageData);
                flat.folders[path] = folder;
                parent.children.push(folder);
            }
            parent = folder;
            break;
        }
        path = $path.join(path, "..");
    }

    // at least add the file item
    let file;
    file = new FileItem(item, parent);
    flat.files[file.id] = file;
    file.workspaceFolder = workspaceFolder;
    file.folder = folder;

    parent.children.push(file);

    return file;
}

vscode.workspace.onDidChangeConfiguration((item) => {
    for (const configurationPropertyName in package.contributes.configuration.properties) {
        if (item.affectsConfiguration(configurationPropertyName)) {
            recreateTree();
        }
    }
});

vscode.workspace.onDidChangeTextDocument(changed => {
    if (changed.document.uri.scheme !== 'file') return;
    if (changed.contentChanges.length !== 0) return;

    // search for the item and update it
    const fileItem = flat.files[helper.getId(changed.document)];
    if (fileItem) {
        fileItem.updateIcon(changed.document);
        dataProvider.refresh();
    }
});

vscode.window.tabGroups.onDidChangeTabs(tabs => {
    if (tabs.opened.length || tabs.closed.length) {
        recreateTree();
    }

    if (tabs.changed.length) {
        tabs.changed.forEach(tab => {
            // if the new page is an internal page (e.g. the Settings page, input is empty)
            if (typeof tab.input === "undefined") return;

            // update the icon
            const fileItem = flat.files[helper.getId(tab.input)];
            fileItem.updateIcon(tab);
            dataProvider.refresh();

            treeview.reveal(fileItem);
        })
    }
});

// recreate tree if a workspace folder was added/removed
vscode.workspace.onDidChangeWorkspaceFolders(() => {
    recreateTree();
});

const dataProvider = new DataProvider();
recreateTree(true);
module.exports = dataProvider;
