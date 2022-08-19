const vscode = require('vscode');
require('./dataprovider');

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
	
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
