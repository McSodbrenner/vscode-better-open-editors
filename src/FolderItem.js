const vscode = require('vscode');
const $os = require('os');
const $path = require('path');

module.exports = class FolderItem {
    constructor(path, parent = null, packageJson = null) {
        this.contextValue = "folder";
        this.id = path;
        this.path = path;
        this.pathLowercase = path.toLowerCase();

        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        
        this.children = [];
        this.parent = parent;
        
        // add package description
        this.packageJson = packageJson;
        
        if (this.packageJson) {
            this.description = packageJson.name + ' ' + packageJson.version;
        }
        
        this.updateConfigurationDependentMembers();
    }

    updateConfigurationDependentMembers() {
        const config = vscode.workspace.getConfiguration("betterOpenEditors");
        
        if (config.get("ShowPackageIcon")) {
            this.iconPath = vscode.ThemeIcon.Folder;
            if (this.packageJson) {
                this.iconPath = new vscode.ThemeIcon("package");   
            }
        } else {
            delete this.iconPath;
        }

        // add label
        this.label = this.path;
        if (this.parent !== null) {
            this.label = this.label.replace(this.parent.path, "");
            this.label = this.label.replace(/^\//, "");
        }

        // replace homedir
        this.label = this.label.replace($os.homedir(), "~");

        // add whitespace around slashes
        if (config.get("InsertSpacesAroundSlashes")) {
            this.label = this.label.replaceAll($path.sep, " " + $path.sep + " ");
        }
    }
}