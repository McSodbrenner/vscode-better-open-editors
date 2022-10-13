const vscode = require('vscode');
const event = require('./event');

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
		let children;

		if (typeof element === 'undefined') {
			children = this.#treeviewPanel.tree.children;
		} else {
			children = element.children;
		}

		// https://github.com/microsoft/vscode-discussions/discussions/125
		// AFTER getChildren was called it is safe to reveal
		setTimeout(() => {
			event.emit('safeToReveal', children);
		});

		return children;
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
