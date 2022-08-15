const vscode = require('vscode');
const $path = require('path');
const $fs = require('fs');
const orderBy = require('lodash.orderby');
const minimatch = require('minimatch');
const helper = require ('./helpers');
const FileItem = require('./FileItem.js');
const FolderItem = require('./FolderItem.js');
const WorkspaceFolderItem = require('./WorkspaceFolderItem.js');

let treeview;
let tree;
let flat;

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
    
    let rootPath = "/";
    if (vscode.workspace.workspaceFolders) {
        const ws = vscode.workspace.workspaceFolders;
        if (ws.length === 1) {
            rootPath = helper.normalizePath(ws[0].uri.path);
        }
    }

    tree = new FolderItem(rootPath);
    
    flat = {
        'workspaceFolders': {},
        'folders': {},
        'files': {},
    };
    
    let tabs = vscode.window.tabGroups.all.map(group => group.tabs).flat();

    // filter virtual elements like "Keyboard Shortcuts"
    tabs = tabs.filter(tab => typeof tab.input !== "undefined");

    // simplify items to the values we need
    tabs = tabs.map(tab => ({
        uri: tab.input.uri,
        pathLowercase: tab.input.uri.path.toLowerCase(), // just for sorting
        isDirty: tab.isDirty,
        isActive: tab.isActive,
        isPinned: tab.isPinned,
        isPreview: tab.isPreview,
    }));

    // sort items
    tabs = orderBy(tabs, ['pathLowercase', 'asc']);

    // created nested Tree
    tabs.forEach(tab => {
        addItem(tab);
    });

    if (initial) {
        treeview = vscode.window.createTreeView('betterOpenEditors', {
            treeDataProvider: dataProvider
        });

        // does not exist if the currently active item on startup is eg. the "Settings" editor
        if (!vscode.window.activeTextEditor) return;

        // highlight currently active editor
        dataProvider.refresh();
        treeview.reveal(flat.files[helper.normalizePath(vscode.window.activeTextEditor.document.uri.path)]);
    } else {
        dataProvider.refresh();
    }
    // console.log("treeCreated", tree);
}

function addItem(item) {
    const config = vscode.workspace.getConfiguration("betterOpenEditors");

    // we use parent to know to which item we have to add the next level
    let parent = tree;
    let workspaceFolder = null;
    let folder = null;
    const itemPath = helper.normalizePath(item.uri.path);

    // check if the file is part of a workspace folder
    // could be undefined
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {
        // iterate through all workspaces to find the matching one
        vscode.workspace.workspaceFolders.every(_workspace => {
            const workspacePath = helper.normalizePath(_workspace.uri.path);
            // we need to add the path sep to be sure it is the correct workspace
            // otherwise a file "workspace2/foo.bar" would macht "workspace", because the "2" is ignored
            if (itemPath.startsWith(workspacePath + $path.sep)) {
                if (flat.workspaceFolders[workspacePath]) {
                    workspaceFolder = flat.workspaceFolders[workspacePath];
                } else {
                    workspaceFolder = new WorkspaceFolderItem(_workspace.uri, parent);
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
        
        const packageJsonPath = $path.join(path, "package.json");
        const packageJsonMatch = $fs.existsSync(packageJsonPath);
        const patternMatch = packagePatterns.filter(pattern => { return minimatch(path, pattern); } ).length > 0;

        if (packageJsonMatch || patternMatch) {
            if (flat.folders[path]) {
                folder = flat.folders[path];
            } else {
                const packageJson = packageJsonMatch ? JSON.parse($fs.readFileSync(packageJsonPath, { encoding:'utf8', flag:'r' })) : null;
                folder = new FolderItem(path, parent, packageJson);
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
    flat.files[itemPath] = file;
    file.workspaceFolder = workspaceFolder;
    file.folder = folder;

    parent.children.push(file);

    // sort parents children
    parent.children = orderBy(parent.children, ['pathLowercase', 'asc']);

    return file;
}

vscode.workspace.onDidChangeConfiguration((item) => {
    if (
        item.affectsConfiguration("betterOpenEditors.InsertSpacesAroundSlashes")
        || item.affectsConfiguration("betterOpenEditors.ShowWorkspaceIcon")
        || item.affectsConfiguration("betterOpenEditors.ShowPackageIcon")
        || item.affectsConfiguration("betterOpenEditors.PackagePatterns")
    ) {
        recreateTree();
    }
});

vscode.workspace.onDidChangeTextDocument(changed => {
    if (changed.document.uri.scheme !== 'file') return;
    if (changed.contentChanges.length !== 0) return;

    // search for the item and update it
    flat.files[helper.normalizePath(changed.document.uri.path)].updateIcon(changed.document);

    dataProvider.refresh();
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
            flat.files[helper.normalizePath(tab.input.uri.path)].updateIcon(tab);
        })
    }

    dataProvider.refresh();
});

// highlight currently active editor
vscode.window.onDidChangeActiveTextEditor(editor => {
    if (typeof editor === "undefined") return; // if we change to the settings tab, editor is undefined
    if (editor.document.uri.scheme !== "file") return;
    
    // highlight currently active editor
    if (!vscode.window.activeTextEditor) return;
    treeview.reveal(flat.files[helper.normalizePath(vscode.window.activeTextEditor.document.uri.path)]);
});

const dataProvider = new DataProvider();
recreateTree(true);
module.exports = dataProvider;
