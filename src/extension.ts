import * as vscode from 'vscode';
import * as path from 'path';

const FILE_EXTENSIONS = ['.ts', '.html', '.scss', '.css', '.less', '.sass', '.spec.ts', '.type.ts', '.types.ts'];
const CYCLE_PRIORITY_ORDER = ['.html', '.ts', '.scss', '.css', '.less', '.sass', '.spec.ts', '.type.ts', '.types.ts'];

interface FileContext {
    dirName: string;
    baseName: string;
    currentFilePath: string;
}

function getFileContext(uri?: vscode.Uri): FileContext | undefined {
    const editor = vscode.window.activeTextEditor;
    const filePath = uri?.fsPath ?? editor?.document.uri.fsPath;

    if (!filePath) {
        return undefined;
    }

    const parsedPath = path.parse(filePath);
    const baseNameMatch = parsedPath.name.match(/(.+?)\.(component|service|directive|pipe|guard|module|resolver)/);

    if (!baseNameMatch) {
        return undefined;
    }

    return {
        dirName: parsedPath.dir,
        baseName: `${baseNameMatch[1]}.${baseNameMatch[2]}`,
        currentFilePath: filePath,
    };
}

async function findRelatedFiles(dirName: string, baseName: string, ignorePatterns: string[]): Promise<string[]> {
    const searchPattern = new vscode.RelativePattern(dirName, `${baseName}.*`);
    const excludePattern = `{${ignorePatterns.join(',')}}`;
    
    const foundUris = await vscode.workspace.findFiles(searchPattern, excludePattern);

    return foundUris
        .map(uri => uri.fsPath)
        .filter(p => FILE_EXTENSIONS.some(ext => p.endsWith(ext)));
}

async function openF(filePath: string) {
    const config = vscode.workspace.getConfiguration('angular-related-files');
    const openInPreview = config.get<boolean>('openInPreview', true);
    const uri = vscode.Uri.file(filePath);
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document, {
        viewColumn: vscode.ViewColumn.Active,
        preview: openInPreview,
    });
}

export function activate(context: vscode.ExtensionContext) {
    const activeCycles: { [key: string]: { cycleList: string[]; currentIndex: number } } = {};

    const showCommand = vscode.commands.registerCommand('angular-related-files.show', async (uri?: vscode.Uri) => {
        const fileContext = getFileContext(uri);
        if (!fileContext) {
            vscode.window.showInformationMessage('Not a recognized Angular file pattern (e.g., .component.ts, .service.ts)');
            return;
        }

        const { dirName, baseName, currentFilePath } = fileContext;
        const config = vscode.workspace.getConfiguration('angular-related-files');
        const ignorePatterns = config.get<string[]>('ignore', []);

        const allRelatedFiles = await findRelatedFiles(dirName, baseName, ignorePatterns);

        const quickPickItems = allRelatedFiles
            .filter(f => f !== currentFilePath)
            .map(f => ({ label: path.basename(f), filePath: f }));

        if (quickPickItems.length === 0) {
            vscode.window.showInformationMessage('No related files found.');
            return;
        }

        const selectedFile = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: 'Select a related file to open',
        });

        if (selectedFile) {
            await openF(selectedFile.filePath);
        }
    });

    const cycleCommand = vscode.commands.registerCommand('angular-related-files.cycle', async () => {
        const fileContext = getFileContext();
        if (!fileContext) {
            return; // Silently fail if not a recognized file
        }

        const { dirName, baseName, currentFilePath } = fileContext;
        const stateKey = path.join(dirName, baseName);

        let fileToOpen: string;
        const activeCycle = activeCycles[stateKey];

        if (activeCycle && activeCycle.cycleList[activeCycle.currentIndex] === currentFilePath) {
            // Continue existing cycle
            const nextIndex = (activeCycle.currentIndex + 1) % activeCycle.cycleList.length;
            activeCycles[stateKey].currentIndex = nextIndex;
            fileToOpen = activeCycle.cycleList[nextIndex];
        } else {
            // Start a new cycle
            const config = vscode.workspace.getConfiguration('angular-related-files');
            const ignorePatterns = config.get<string[]>('ignore', []);
            const allRelatedFiles = await findRelatedFiles(dirName, baseName, ignorePatterns);

            if (allRelatedFiles.length < 2) {
                return; // Not enough files to cycle
            }

            // Sort files by priority order
            const sortedFiles = allRelatedFiles.sort((a, b) => {
                const extA = path.extname(a);
                const extB = path.extname(b);
                return CYCLE_PRIORITY_ORDER.indexOf(extA) - CYCLE_PRIORITY_ORDER.indexOf(extB);
            });

            const currentFileIndex = sortedFiles.indexOf(currentFilePath);
            if (currentFileIndex === -1) {
                return; // Should not happen if context is correct
            }

            // Create the cycle list by moving the current file to the end
            const newCycleList = [
                ...sortedFiles.slice(0, currentFileIndex),
                ...sortedFiles.slice(currentFileIndex + 1),
                sortedFiles[currentFileIndex]
            ];

            activeCycles[stateKey] = {
                cycleList: newCycleList,
                currentIndex: 0 // Start at the beginning of the new cycle
            };

            fileToOpen = newCycleList[0];
        }

        await openF(fileToOpen);
    });

    context.subscriptions.push(showCommand, cycleCommand);
}

export function deactivate() {}
