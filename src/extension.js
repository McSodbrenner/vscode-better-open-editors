const vscode		= require('vscode');
const TreeviewPanel	= require('./TreeviewPanel');

function activate(context) {
	// code for a close button / doesn't work proerly
    // "commands": [
	// 	{
	// 	  "command": "betterOpenEditors.closeEditor",
	// 	  "title": "Close",
	// 	  "icon": "$(close)"
	// 	}
	//   ],
	//   "menus": {
	// 	"view/item/context": [
	// 	  {
	// 		"command": "betterOpenEditors.closeEditor",
	// 		"group": "inline",
	// 		"when": "viewItem == file"
	// 	  }
	// 	]
	//   }
	// vscode.commands.registerCommand('betterOpenEditors.closeEditor', (item) => {
	// 	vscode.window.showTextDocument(item.resourceUri)
    // 		.then(() => {
    //     		return vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    // 		});
	// });

	const treeviewPanel = new TreeviewPanel(context);

	vscode.commands.registerCommand('betterOpenEditors.openExtensionSettings', () => {
		// the correct way but does not keep the correct order
		// vscode.commands.executeCommand('workbench.action.openSettings', '@ext:McSodbrenner.better-open-editors');
		vscode.commands.executeCommand('workbench.action.openSettings', 'betterOpenEditors.');
	});
	
	vscode.commands.registerCommand('betterOpenEditors.refreshTree', () => {
		treeviewPanel.recreateTree();
	});

	vscode.commands.registerCommand('betterOpenEditors.showTab', (input) => {
		vscode.window.showTextDocument(input, { preserveFocus: true });
	});
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
