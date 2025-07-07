// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Helper function to check if a file should be ignored based on glob patterns
function isIgnored(filePath: string, ignorePatterns: string[]): boolean {
    const fileName = path.basename(filePath);
    for (const pattern of ignorePatterns) {
        // Simple glob implementation: *.test.ts -> endsWith('.test.ts')
        if (pattern.startsWith('*') && fileName.endsWith(pattern.substring(1))) {
            return true;
        }
        // Exact match
        if (pattern === fileName) {
            return true;
        }
    }
    return false;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Extension "angular-related-files" is now active!');

  // State to keep track of active cycle lists
  const activeCycles: { [key: string]: { cycleList: string[]; currentIndex: number } } = {};

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

    // 3. Get ignore settings from configuration
    const config = vscode.workspace.getConfiguration('angular-related-files');
    const ignorePatterns = config.get<string[]>('ignore', []);

    // 4. Define all potential related file extensions
    const relatedExtensions = ['.ts', '.html', '.scss', '.css', '.less', '.sass', '.spec.ts', '.type.ts'];

    // 5. Find all existing files in the same directory that match the base name
    const relatedFiles: { label: string; filePath: string }[] = [];

    for (const ext of relatedExtensions) {
        const potentialFile = path.join(dirName, baseName + ext);
        // Check if the file exists, is not the one we currently have open, and is not ignored
        if (fs.existsSync(potentialFile) && potentialFile !== currentFilePath && !isIgnored(potentialFile, ignorePatterns)) {
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
    const stateKey = path.join(dirName, baseName);

    let fileToOpen: string;
    const activeCycle = activeCycles[stateKey];

    // Check if we are continuing an existing cycle
    if (activeCycle && activeCycle.cycleList[activeCycle.currentIndex] === currentFilePath) {
        const nextIndex = (activeCycle.currentIndex + 1) % activeCycle.cycleList.length;
        activeCycles[stateKey].currentIndex = nextIndex;
        fileToOpen = activeCycle.cycleList[nextIndex];
    } else {
        // Start a new cycle
        const config = vscode.workspace.getConfiguration('angular-related-files');
        const ignorePatterns = config.get<string[]>('ignore', []);
        const priorityOrder = ['.html', '.ts', '.scss', '.css', '.less', '.sass', '.spec.ts', '.type.ts'];
        const sortedFiles: string[] = [];
        for (const ext of priorityOrder) {
            const potentialFile = path.join(dirName, baseName + ext);
            if (fs.existsSync(potentialFile) && !isIgnored(potentialFile, ignorePatterns)) {
                sortedFiles.push(potentialFile);
            }
        }

        if (sortedFiles.length < 2) {
            return; // Not enough files to cycle
        }

        const currentFileIndexInSorted = sortedFiles.indexOf(currentFilePath);
        if (currentFileIndexInSorted === -1) {
            return;
        }

        // Create the new cycle list by moving the current file to the end
        const newCycleList = [
            ...sortedFiles.slice(0, currentFileIndexInSorted),
            ...sortedFiles.slice(currentFileIndexInSorted + 1),
            sortedFiles[currentFileIndexInSorted]
        ];

        activeCycles[stateKey] = {
            cycleList: newCycleList,
            currentIndex: 0 // Start at the beginning of the new cycle
        };

        fileToOpen = newCycleList[0];
    }

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
