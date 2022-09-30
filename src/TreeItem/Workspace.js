const vscode    = require('vscode');
const path      = require('path');
const helper    = require ('../helpers');

module.exports = class Workspace {
    constructor(uri, tabGroupIndex, parent, packageData) {
        const config            = vscode.workspace.getConfiguration("betterOpenEditors");

        this.contextValue       = "workspace";
        this.id                 = `${tabGroupIndex}-${uri.path}`;
        this.resourceUri        = uri;
        this.path               = helper.normalizePath(uri.path);
        this.sortKey            = helper.normalizePath(uri.path).toLowerCase();
        this.collapsibleState   = vscode.TreeItemCollapsibleState.Expanded;
        
        this.parent             = parent;
        this.children           = [];

        this.label              = path.basename(this.path);

        if (packageData) {
            if (config.get("ShowPackageInfo")) {
                this.description = `${packageData.name} ${packageData.version}`;

                if (config.get("HidePackagePath")) {
                    this.label = "";
                }
            }
        }

        if (config.get("ShowWorkspaceIcon")) {
            this.iconPath = new vscode.ThemeIcon("root-folder");
        } else {
            delete this.iconPath;
        }
    }
}