// const vscode    = require('vscode');
const helper    = require ('../helpers');
const Base		= require ('./Base');

// class UnknowFileDecorationProvider {
// 	provideFileDecoration(uri) {
// 		return {
// 			badge: '1',
// 			color: new vscode.ThemeColor('errorForeground'),
// 		}
// 	}
// }

// vscode.window.registerFileDecorationProvider(new UnknowFileDecorationProvider);

module.exports = class UnknownFile extends Base {
	constructor(tab) {
		super();
		
		this.addContextValue('unknownfile');
		this.id				= tab.label;
		this.tab        	= tab;

		this.command = {
			command: 'betterOpenEditors.showUnknownFileInfo',
			title: 'Show UnknownFile info',
			arguments: [`
At the moment it is not possible to switch to this tab because the VS Code API does not provide the possibility to switch to internal tabs (like "Settings", "Keybindings", "Welcome page" etc.).

If you would like to support me in my request to make this possible, please leave a like or comment on the following ticket:
https://github.com/microsoft/vscode/issues/158853
`, this.tab],
		}

		this.label = helper.makeItalic(tab.label);
	}
}
