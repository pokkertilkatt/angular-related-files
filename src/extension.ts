// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Extension "angular-related-files" is now active!');

  const showCommand = vscode.commands.registerCommand('angular-related-files.show', async () => {
  
    // 1. Get the currently active text editor
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return; // No editor is open
    }

    const currentFilePath = activeEditor.document.uri.fsPath;
    const dirName = path.dirname(currentFilePath);

    // 2. Parse the file name to find its base.
    // e.g., 'c:/.../my-component.component.ts' -> baseName = 'my-component.component'
    const parsedPath = path.parse(currentFilePath);
    const baseNameMatch = parsedPath.name.match(/^([^.]+)\.(component|service|directive|pipe|guard|module|resolver)/);

    if (!baseNameMatch) {
        vscode.window.showInformationMessage('Not a recognized Angular file pattern (e.g., .component.ts, .service.ts)');
        return;
    }

    // e.g. "my-component.component"
    const baseName = `${baseNameMatch[1]}.${baseNameMatch[2]}`;

    // 3. Define all potential related file extensions
    const relatedExtensions = ['.ts', '.html', '.scss', '.css', '.less', '.sass', '.spec.ts', '.type.ts'];

    // 4. Find all existing files in the same directory that match the base name
    const relatedFiles: { label: string; filePath: string }[] = [];

    for (const ext of relatedExtensions) {
        const potentialFile = path.join(dirName, baseName + ext);
        // Check if the file exists and is not the one we currently have open
        if (fs.existsSync(potentialFile) && potentialFile !== currentFilePath) {
            relatedFiles.push({
                label: path.basename(potentialFile), // The file name to display in the list
                filePath: potentialFile // The full path to the file
            });
        }
    }

    if (relatedFiles.length === 0) {
        vscode.window.showInformationMessage('No related files found.');
        return;
    }

    // 5. Show a Quick Pick dropdown menu with the found files
    const selectedFile = await vscode.window.showQuickPick(relatedFiles, {
        placeHolder: 'Select a related file to open'
    });

    if (selectedFile) {
        // 6. Open the selected file, replacing the current one
        const uri = vscode.Uri.file(selectedFile.filePath);
        const document = await vscode.workspace.openTextDocument(uri);
        
        await vscode.window.showTextDocument(document, {
            viewColumn: vscode.ViewColumn.Active, // Open in the active column
            preview: false // Make the tab permanent
        });
    }
  });

  const cycleCommand = vscode.commands.registerCommand('angular-related-files.cycle', async () => {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }

    const currentFilePath = activeEditor.document.uri.fsPath;
    const dirName = path.dirname(currentFilePath);
    const parsedPath = path.parse(currentFilePath);
    const baseNameMatch = parsedPath.name.match(/^([^.]+)\.(component|service|directive|pipe|guard|module|resolver)/);

    if (!baseNameMatch) {
        return; // Not a recognized file, do nothing silently
    }

    const baseName = `${baseNameMatch[1]}.${baseNameMatch[2]}`;

    // Priority order for file types
    const priorityOrder = ['.html', '.ts', '.scss', '.css', '.less', '.sass', '.spec.ts', '.type.ts'];

    const allRelatedFiles: string[] = [];
    for (const ext of priorityOrder) {
        const potentialFile = path.join(dirName, baseName + ext);
        if (fs.existsSync(potentialFile)) {
            allRelatedFiles.push(potentialFile);
        }
    }

    if (allRelatedFiles.length < 2) {
        return; // Not enough files to cycle
    }

    const currentIndex = allRelatedFiles.indexOf(currentFilePath);
    if (currentIndex === -1) {
        return; // Should not happen if logic is correct
    }

    const nextIndex = (currentIndex + 1) % allRelatedFiles.length;
    const fileToOpen = allRelatedFiles[nextIndex];

    const uri = vscode.Uri.file(fileToOpen);
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document, {
        viewColumn: vscode.ViewColumn.Active,
        preview: false
    });
  });

	context.subscriptions.push(showCommand, cycleCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
