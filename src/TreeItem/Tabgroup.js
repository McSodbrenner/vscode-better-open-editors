const vscode    = require('vscode');
const helper    = require ('../helpers');

module.exports = class Tabgroup {
    constructor(index, parent) {
        this.contextValue       = "tabgroup";
        this.id                 = `group-${index}`;
        this.sortKey            = this.id;
        this.collapsibleState   = vscode.TreeItemCollapsibleState.Expanded;
        
        this.path               = "/";
        if (typeof vscode.workspace.workspaceFolders !== "undefined") {
            const ws = vscode.workspace.workspaceFolders;
            if (ws.length === 1) {
                this.path = helper.getPath(ws[0]);
            }
        }

        this.parent             = parent;
        this.children           = [];

        this.label              = helper.makeBold(`GROUP ${index}`);
    }
}