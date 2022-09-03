# Better Open Editors

This is a replacement for the Open Editors panel, which becomes very cluttered with many open files. Especially in projects with package folders (e.g. in monorepos) you often have many files with the same name open and have difficulties to distinguish them.

Therefore, this extension helps to group open files in package folders (defined by package.json or composer.json) or in folders defined by setting.

![This is why it is better](./meta/screenshot.gif)

## Features

  * Automatically detects packages (package.json, composer.json).
  * Specification of RegExp patterns to build custom "virtual" package folders.
  * Supports multiple workspace folders.
  * Support tab groups.
  * Platform independent.

## Package folder generation

The main purpose of the extension is to group files automatically that belong to packages. For this it is looked whether there is a package.json/composer.json in a folder or whether a package corresponds to a glob pattern from the settings.
If indeed all folders should be displayed as package folders, it is also possible to pass `**` as pattern.
Package folders, which only contain other folders, are not created.

## Extension Settings

* `betterOpenEditors.InsertSpaceForLastSlug`  
   Insert space before the last slug to improve the readability.
* `betterOpenEditors.InsertSpacesAroundSlashes`  
   Insert spaces around path slashes to improve the readability.
* `betterOpenEditors.ShowWorkspaceIcon`  
   Shows a Workspace Icon in front of workspace folders.
* `betterOpenEditors.ShowPackageIcon`  
   Shows a Workspace Icon in front of workspace folders.
* `betterOpenEditors.PackagePatterns`  
   One glob expression per line which creates a package folder if a parent path of a file matches it, e.g. `**/components/*`. Useful in workspace dependent settings.
* `betterOpenEditors.ShowPackageInfo`  
   Shows name and version if there is a package file.
* `betterOpenEditors.SkipWorkspacesIfNotNeeded`  
   Skips the workspace tree level if you have only one folder opened. But it could be useful to disable this setting if you want to see the package info for the workspace folder.


## Known Issues

* Meta tabs like the "Settings" tab are currently not visible as the API does not offer a possibility to get the internal URI of those tabs.  

  If you would like to support the feature request I've created in the VS Code issue tracker, give a thumbs up to this issue (20 Thumbs up push the issue into the backlog): https://github.com/microsoft/vscode/issues/158853
