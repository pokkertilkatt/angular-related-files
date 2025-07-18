import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const SHARED_EXTENSIONS = ['.scss', '.css', '.less', '.sass', '.spec.ts', '.type.ts', '.types.ts'];
const SHOW_EXTENSIONS = ['.ts', '.html', ...SHARED_EXTENSIONS];
const CYCLE_PRIORITY_ORDER = ['.html', '.ts', ...SHARED_EXTENSIONS];

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

function findRelatedFiles(dirName: string, baseName: string, extensions: string[], ignorePatterns: string[]): string[] {
    const relatedFiles: string[] = [];
    for (const ext of extensions) {
        const potentialFile = path.join(dirName, baseName + ext);
        if (fs.existsSync(potentialFile) && !isIgnored(potentialFile, ignorePatterns)) {
            relatedFiles.push(potentialFile);
        }
    }
    return relatedFiles;
}

export function activate(context: vscode.ExtensionContext) {

  // State to keep track of active cycle lists
  const activeCycles: { [key: string]: { cycleList: string[]; currentIndex: number } } = {};

  const showCommand = vscode.commands.registerCommand('angular-related-files.show', async (uri?: vscode.Uri) => {
  
    // 1. Get the currently active text editor
    const activeEditor = vscode.window.activeTextEditor;
    
    // Determine the file path from the provided URI or the active editor
    let currentFilePath: string;
    if (uri) {
        currentFilePath = uri.fsPath;
    } else if (activeEditor) {
        currentFilePath = activeEditor.document.uri.fsPath;
    } else {
        return; // No file context available
    }
    const dirName = path.dirname(currentFilePath);

    // 2. Parse the file name to find its base.
    // e.g., 'c:/.../my-component.component.ts' -> baseName = 'my-component.component'
    const parsedPath = path.parse(currentFilePath);
    const baseNameMatch = parsedPath.name.match(/(.+)\.(component|service|directive|pipe|guard|module|resolver)/);

    if (!baseNameMatch) {
        vscode.window.showInformationMessage('Not a recognized Angular file pattern (e.g., .component.ts, .service.ts)');
        return;
    }

    // e.g. "my-component.component"
    const baseName = `${baseNameMatch[1]}.${baseNameMatch[2]}`;

    // 3. Get ignore settings from configuration
    const config = vscode.workspace.getConfiguration('angular-related-files');
    const ignorePatterns = config.get<string[]>('ignore', []);

    // 4. Find all existing files in the same directory that match the base name
    const allRelatedFiles = findRelatedFiles(dirName, baseName, SHOW_EXTENSIONS, ignorePatterns);

    const relatedFiles = allRelatedFiles
        .filter(f => f !== currentFilePath)
        .map(f => ({ label: path.basename(f), filePath: f }));

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
    const baseNameMatch = parsedPath.name.match(/(.+)\.(component|service|directive|pipe|guard|module|resolver)/);

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
        const sortedFiles = findRelatedFiles(dirName, baseName, CYCLE_PRIORITY_ORDER, ignorePatterns);

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

export function deactivate() {}
