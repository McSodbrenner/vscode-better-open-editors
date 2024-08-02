const vscode		= require('vscode');
const helper        = require ('./helpers');
const TreeviewPanel	= require('./treeviewPanel');
const QuickPick		= require('./QuickPick.js');

function activate(context) {
	const treeviewPanel = new TreeviewPanel(context);
	const quickPick = new QuickPick(context, treeviewPanel);

	vscode.commands.registerCommand('betterOpenEditors.openExtensionSettings', () => {
		vscode.commands.executeCommand('workbench.action.openSettings', '@ext:McSodbrenner.better-open-editors');
	});

	vscode.commands.registerCommand('betterOpenEditors.saveAll', () => {
		vscode.commands.executeCommand('workbench.action.files.saveAll');
	});

	vscode.commands.registerCommand('betterOpenEditors.refreshTree', () => {
		treeviewPanel.recreateTree();
	});

	vscode.commands.registerCommand('betterOpenEditors.showTab', (input, tabGroupIndex) => {
		vscode.window.showTextDocument(input, tabGroupIndex, true);
	});

	vscode.commands.registerCommand('betterOpenEditors.closeTab', (treeItem) => {
		// for some reason we cannot simply call this when closing images:
		// vscode.window.tabGroups.close(treeItem.tab);
		// so we have to search for the current tab by uri and close it
		for (const tabGroup of vscode.window.tabGroups.all) {
			for (const realTab of tabGroup.tabs) {
				// allow to close a meta tab like "Settings" which does not have input
				if (typeof treeItem.tab.input === 'undefined') {
					if (typeof realTab.input === 'undefined' && realTab.label === treeItem.tab.label) {
						vscode.window.tabGroups.close(realTab);
					}
					continue;
				}

				if (helper.getPath(realTab.input) === helper.getPath(treeItem.tab.input)) {
					vscode.window.tabGroups.close(realTab);
				}
			}
		}
	});

	vscode.commands.registerCommand('betterOpenEditors.closeFolder', (treeItem) => {
		treeItem.children.forEach(child => {
			vscode.commands.executeCommand('betterOpenEditors.closeTab', child);
		});
	});

	vscode.commands.registerCommand('betterOpenEditors.openInIntegratedTerminal', (treeItem) => {
		vscode.window.createTerminal({
			cwd: treeItem.path,
		}).show();
	});

	vscode.commands.registerCommand('betterOpenEditors.copyPath', (treeItem) => {
		vscode.env.clipboard.writeText(treeItem.path);
	});

	vscode.commands.registerCommand('betterOpenEditors.copyRelativePath', (treeItem) => {
		vscode.env.clipboard.writeText(treeItem.path.replace(treeItem.workspaceFolder.path, ''));
	});

	vscode.commands.registerCommand('betterOpenEditors.revealFileInOS', (treeItem) => {
		vscode.commands.executeCommand('revealFileInOS', treeItem.resourceUri);
	});

	vscode.commands.registerCommand('betterOpenEditors.pinTab', () => {
		vscode.commands.executeCommand('workbench.action.pinEditor');
	});

	vscode.commands.registerCommand('betterOpenEditors.unpinTab', () => {
		vscode.commands.executeCommand('workbench.action.unpinEditor');
	});

	vscode.commands.registerCommand('betterOpenEditors.openPackageFile', (treeItem) => {
		vscode.commands.executeCommand('vscode.open', vscode.Uri.file(treeItem.packageData.packageFile));
	});
	
	vscode.commands.registerCommand('betterOpenEditors.openFileOfCurrentPackage', () => {
		quickPick.findFiles(vscode.window.tabGroups.activeTabGroup.activeTab);
	});

	vscode.commands.registerCommand('betterOpenEditors.showUnknownFileInfo', (message) => {
		vscode.window.showWarningMessage(message);
	});
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
