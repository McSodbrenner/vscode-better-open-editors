const vscode    = require('vscode');
const path      = require('path');
const helper    = require ('./helpers');

module.exports = class WorkspaceFolderItem {
    constructor(uri, parent) {
        this.contextValue       = "workspaceFolder";
        this.id                 = uri.path;
        this.path               = helper.normalizePath(uri.path);
        this.pathLowercase      = this.path.toLowerCase();
        this.collapsibleState   = vscode.TreeItemCollapsibleState.Expanded;
        
        this.parent             = parent;
        this.children           = [];

        this.label              = path.basename(this.path);

        const config            = vscode.workspace.getConfiguration("betterOpenEditors");
        
        // config dependent members
        if (config.get("ShowWorkspaceIcon")) {
            this.iconPath = new vscode.ThemeIcon("root-folder");
        } else {
            delete this.iconPath;
        }
    }
}