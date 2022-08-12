const vscode = require('vscode');
const path = require('path');

module.exports = class WorkspaceFolderItem {
    constructor(uri, parent) {
        this.contextValue = "workspaceFolder";
        this.id = uri.path;
        this.path = uri.path;
        this.pathLowercase = uri.path.toLowerCase();

        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        
        this.children = [];
        this.label = path.basename(uri.path);
        this.parent = parent;

        this.updateConfigurationDependentMembers();
    }

    updateConfigurationDependentMembers() {
        const config = vscode.workspace.getConfiguration("betterOpenEditors");
        
        if (config.get("ShowWorkspaceIcon")) {
            this.iconPath = new vscode.ThemeIcon("root-folder");
        } else {
            delete this.iconPath;
        }
    }
}