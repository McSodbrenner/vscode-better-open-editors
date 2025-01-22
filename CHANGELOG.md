# Change Log

## Release Notes

### 1.12.0

  * Feature: Add "Collapse all" button to Better Open Editors panel (fixes #32)

### 1.11.2

  * Fix: Fix closing of tabs that stopped working in VS Code version 1.90 or 1.91 (fixes #25)

### 1.11.1

  * Fix: Improve Quick Pick display
  * Fix: Show internal tabs with notification
  
### 1.11.0

  * Feature: Add "Save all" button to Better Open Editors panel (fixes #19)
  * Fix: The settings link does now use the official string (fixes #2)

### 1.10.2

 * Fix errors on startup with meta pages like "Welcome"

### 1.10.1

 * Fix: Show panel on startup

### 1.10.0

 * Feature: Add support for images

### 1.9.0

 * Feature: Add "Hide file path" feature to be able to hide the file paths

### 1.8.0

 * Feature: Add "Quick Pick" feature to open a file that belongs to the currently edited package

### 1.7.0

 * Feature: Add "Close all tabs of package" as icon command for folders
 * Feature: Add "Open package file" in context menu for folders

### 1.6.1

 * Fix: Current file was no longer marked correctly
 * Fix: Fix case sensitive filename issue for linux users

### 1.6.0

 * Feature: Add "Pin/Unpin Tab" on context menu (fixes #9)

### 1.5.0

 * Feature: Allow to hide package path by config
 * Fix: Handle errors caused by undefined tab.input (e.g. "Settings" page)

### 1.4.2

 * Fix: Remove accidently added parentheses
 * Fix: Fix functionality of "Copy relative path" (fixes #13)

### 1.4.1

 * Fix: Integrate workaround for broken treeview.reveal of VS Code (fixes #12)
 * Fix: Remove the naming of the terminal to prevent doubled cwd display (fixes #10)

### 1.4.0

 * Feature: Added "Close" & "Open in Integrated Terminal" buttons
 * Feature: Added some context menu items

### 1.3.0

 * Feature: Added the possibility to use Tab groups.
 * Feature: Improved handling for scheme "git" inputs.
 * Fix: Fixed incorrect reveal of current item.

### 1.2.1

 * Fix: Empty documents do not longer open additional empty documents on click (fixes #6).

### 1.2.0

 * Invalid version

### 1.1.2

 * Feature: Improved handling for "git" input schemes.
 * Fix: Fixed sometimes not working reveal of tree items.

### 1.1.1

 * Fix: Automatically refresh view on configuration changes.
 
### 1.1.0

 * Feature: Added "Refresh tree" button.
 * Feature: New setting `betterOpenEditors.InsertSpaceForLastSlug`: Insert space before the last slug to improve the readability.
 * Feature: New setting `betterOpenEditors.ShowPackageInfo`: Shows name and version if there is a package file.
 * Feature: New setting `betterOpenEditors.SkipWorkspacesIfNotNeeded`: Skips the workspace tree level if you have only one folder opened. But it could be useful to disable this setting if you want to see the package info for the workspace folder.
 * Fix: Changes of the workspace folders did not trigger refresh of the tree.
 
 ### 1.0.3

 * Fix: Settings icon is now only displayed on the Better Open Editors panel.
 * Fix: Gitlens and standard file diffs are now displayed.
 * Fix: New files support improved.
 * Fix: File/folder sorting improved.

### 1.0.2

 * Chore: Just some non code relevant corrections for the release.


### 1.0.0

 * Initial release.

