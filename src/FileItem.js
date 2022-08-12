const vscode = require('vscode');
const $os = require('os');
const $path = require('path');

module.exports = class FileItem {
    constructor(item, parent) {
        this.contextValue = 'file';
        this.id = item.uri.path;
        this.path = item.uri.path
        this.pathLowercase = item.uri.path.toLowerCase();

        this.collapsibleState = vscode.TreeItemCollapsibleState.None;

        this.isPinned = item.isPinned;

        // necessary to automatically get the correct file icons
        this.resourceUri = item.uri;
        this.command = {
            command: "vscode.open",
            title: "Open",
            arguments: [item.uri],
        }

        this.parent = parent;

        this.internalLabel = this.path.replace(new RegExp(this.parent.path + $path.sep), "");
        this.internalLabel = this.internalLabel.replace($os.homedir(), "~");

        this.updateConfigurationDependentMembers();
        this.updateIcon(item);
    }

    updateConfigurationDependentMembers() {
        const config = vscode.workspace.getConfiguration("betterOpenEditors");
        
        // TODO Unschön, dass dieser Code unten wiederholt wird
        if (config.get("InsertSpacesAroundSlashes")) {
            this.label = this.internalLabel.replaceAll($path.sep, " " + $path.sep + " ");
        } else {
            this.label = this.internalLabel;
        }
    }

    updateIcon(tab) {
        const config = vscode.workspace.getConfiguration("betterOpenEditors");

        this.iconPath = vscode.ThemeIcon.File;

        this.isPinned = typeof tab.isPinned !== "undefined" ? tab.isPinned : this.isPinned

        if (this.isPinned) {
            this.iconPath = new vscode.ThemeIcon("pinned");
        }
        if (tab.isDirty) {
            this.iconPath = new vscode.ThemeIcon("close-dirty");
        }
        if (this.isPinned && tab.isDirty) {
            this.iconPath = new vscode.ThemeIcon("pinned-dirty");
        }
     
        if (config.get("InsertSpacesAroundSlashes")) {
            this.label = this.internalLabel.replaceAll($path.sep, " " + $path.sep + " ");
        } else {
            this.label = this.internalLabel;
        }
        this.label = tab.isPreview ? this.makeItalic(this.label) : this.label;
        this.description = tab.isPreview ? 'preview' : '';
    }

    makeItalic(text) {
        return text.replace(/[A-Za-z]/g, (char) => {
            let diff;
            if (/[A-Z]/.test(char)) {
                diff = "𝘈".codePointAt(0) - "A".codePointAt(0);
            } else {
                diff = "𝘢".codePointAt(0) - "a".codePointAt(0);
            }
            return String.fromCodePoint(char.codePointAt (0) + diff);
        });
    }
}