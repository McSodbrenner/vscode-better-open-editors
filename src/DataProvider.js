const vscode = require('vscode');

module.exports = class DataProvider {
    #treeviewPanel;

    constructor(treeviewPanel) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.#treeviewPanel = treeviewPanel;
    }

    // needed methods
    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (typeof element === 'undefined') {
            return this.#treeviewPanel.tree.children;
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
