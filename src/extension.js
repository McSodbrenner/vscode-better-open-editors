const vscode		= require('vscode');
const TreeviewPanel	= require('./treeviewPanel');

function activate(context) {
	const treeviewPanel = new TreeviewPanel(context);

	vscode.commands.registerCommand('betterOpenEditors.openExtensionSettings', () => {
		// the correct way but does not keep the correct order
		// vscode.commands.executeCommand('workbench.action.openSettings', '@ext:McSodbrenner.better-open-editors');
		vscode.commands.executeCommand('workbench.action.openSettings', 'betterOpenEditors.');
	});
	
	vscode.commands.registerCommand('betterOpenEditors.refreshTree', () => {
		treeviewPanel.recreateTree();
	});

	vscode.commands.registerCommand('betterOpenEditors.showTab', (input, tabGroupIndex) => {
		vscode.window.showTextDocument(input, tabGroupIndex, true);
	});

	vscode.commands.registerCommand('betterOpenEditors.closeTab', (treeItem) => {
		vscode.window.tabGroups.close(treeItem.tab);
	});

	vscode.commands.registerCommand('betterOpenEditors.closeFolder', (treeItem) => {
		treeItem.children.forEach(child => {
			vscode.window.tabGroups.close(child.tab);
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
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
