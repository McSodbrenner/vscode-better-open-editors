const vscode    = require('vscode');
const $os       = require('os');
const $path     = require('path');
const helper    = require ('../helpers');

module.exports = class File {
    constructor(item, parent, workspaceFolder) {
        this.contextValue       = 'file';
        this.collapsibleState   = vscode.TreeItemCollapsibleState.None;
        this.parent             = parent;
        this.isPinned           = item.isPinned;
        this.tab                = item;
        this.workspaceFolder    = workspaceFolder;

        // standard items
        if  (typeof item.input.uri !== "undefined") {
            this.id             = helper.getId(item);
            this.sortKey        = helper.getPath(item.input).toLowerCase();
            this.internalLabel  = helper.getPath(item.input);
            this.resourceUri    = item.input.uri;
            this.path           = helper.getPath(item.input);

            this.command = {
                // "untitled" files cannot be handled via vscode.open :(
                command: item.input.uri.scheme === "untitled" ? "betterOpenEditors.showTab" : "vscode.open",
                title: "Open",
                arguments: [item.input.uri, item.group.viewColumn],
            }

        // two editors items
        } else if (typeof item.input.original !== "undefined") {
            this.id             = helper.getId(item);
            this.sortKey        = helper.getPath(item.input).toLowerCase();
            this.internalLabel  = helper.getPath(item.input);
            this.resourceUri    = item.input.original;
            this.path           = helper.getPath(item.input);

            this.command = {
                command: "vscode.diff",
                title: "Open",
                arguments: [item.input.original, item.input.modified, "Differences", tabGroupIndex],
            }

            // add description
            try {
                if (item.input.original.scheme === "file") {
                    this.internalLabel += ` ↔ ${$path.basename(item.input.modified.path)}`;
                } else if (item.input.original.scheme === "gitlens") {
                    this.description = `${JSON.parse(item.input.original.query).ref} 🠖 ${JSON.parse(item.input.modified.query).ref}`;
                } else if (item.input.original.scheme === "git") {
                    this.description = `Changes`;
                }
            } catch(e) {
                this.description = "Case not handled";
            }
        }

        this.internalLabel      = this.internalLabel.replace(this.parent.path + $path.sep, "");
        this.internalLabel      = this.internalLabel.replace($os.homedir(), "~");

        this.updateIcon(item);
    }

    updateIcon(tab) {
        // config dependent members
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
     
        this.label = this.internalLabel;

        if (config.get("InsertSpacesAroundSlashes")) {
            this.label = this.label.replaceAll($path.sep, " " + $path.sep + " ");
        }

        if (config.get("InsertSpaceForLastSlug")) {
            const parts = this.label.split($path.sep);
            if (parts.length > 1) {
                const last = $path.sep + " " + parts.pop();
                this.label = parts.join($path.sep) + last;
            }
        }

        this.label = tab.isPreview ? helper.makeItalic(this.label) : this.label;
    }
}