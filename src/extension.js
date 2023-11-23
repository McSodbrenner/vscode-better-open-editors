const vscode		= require('vscode');
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
		if (treeItem.tab?.input?.viewType === 'imagePreview.previewEditor') {
			const input = treeItem.tab.input.uri;
			const tabs = vscode.window.tabGroups.all.map(tg => tg.tabs).flat();
			const index = tabs.findIndex(tab => tab.input.uri.path === input.path);
			if (index !== -1) {
				vscode.window.tabGroups.close(tabs[index]);
			}
		} else {
			vscode.window.tabGroups.close(treeItem.tab);
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
