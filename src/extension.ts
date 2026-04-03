import * as vscode from 'vscode';
import * as cp from 'child_process';
import { promisify } from 'util';

const exec = promisify(cp.exec);

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('aiCommenter.generate', async () => {
    // 1. Determine Workspace Folder
    let workspaceFolder: vscode.WorkspaceFolder | undefined;

    if (vscode.window.activeTextEditor) {
      workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
    }

    if (!workspaceFolder && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      workspaceFolder = vscode.workspace.workspaceFolders[0];
    }

    if (!workspaceFolder) {
      vscode.window.showErrorMessage('AI Commenter: No workspace folder found. Please open a project.');
      return;
    }

    try {
      // 2. Get Git Diff and Branch Name
      const diff = await getGitDiff(workspaceFolder.uri.fsPath);
      const branchName = await getGitBranch(workspaceFolder.uri.fsPath);

      // Error Handling: Empty diff
      if (!diff || diff.trim() === '') {
        vscode.window.showInformationMessage('AI Commenter: No staged changes found. Please stage your changes first.');
        return;
      }

      // 3. Fetch API Key and Check Configuration
      const config = vscode.workspace.getConfiguration('aiCommenter');
      const mistralApiKey = config.get<string>('mistralApiKey');

      if (!mistralApiKey) {
        const action = await vscode.window.showWarningMessage(
          'Mistral API Key is missing. Please configure it in your Settings.',
          'Open Settings'
        );
        if (action === 'Open Settings') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'aiCommenter.mistralApiKey');
        }
        return;
      }

      // 4. Call AI API (with loading notification)
      const aiComment = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating AI Commit Message...",
        cancellable: false
      }, async (progress) => {
        return await generateAIComment(diff, mistralApiKey);
      });

      // 5. Format and Copy to Clipboard
      const finalMessage = `[${branchName}] - ${aiComment}`;
      await copyToClipboard(finalMessage);

      vscode.window.showInformationMessage('AI Commenter: Commit message copied to clipboard!');

    } catch (error: any) {
      // 5. Error Handling: API failure or Git failure
      vscode.window.showErrorMessage(`AI Commenter Error: ${error.message}`);
    }
  });

  context.subscriptions.push(disposable);
}

/**
 * Executes `git diff --cached` in the given directory.
 * We use '--cached' to capture only staged changes.
 */
async function getGitDiff(cwd: string): Promise<string> {
  try {
    const { stdout } = await exec('git diff --cached', { cwd });
    return stdout;
  } catch (error) {
    throw new Error('Failed to run git diff. Ensure you are in a git repository.');
  }
}

/**
 * Executes `git branch --show-current` to get the current branch name.
 */
async function getGitBranch(cwd: string): Promise<string> {
  try {
    const { stdout } = await exec('git branch --show-current', { cwd });
    return stdout.trim() || 'main'; // fallback
  } catch (error) {
    return 'main'; // fallback
  }
}

/**
 * Calls the AI API to generate a summary of the diff.
 */
async function generateAIComment(diff: string, apiKey: string): Promise<string> {
  const API_URL = "https://api.mistral.ai/v1/chat/completions";

  const prompt = `You are a strict senior principal engineer reviewing a git diff.
Provide an authoritative commit message for the changes.

Rules:
* ABSOLUTE MAXIMUM of 15 words.
* Do include it is AI comment.
* Direct and to the point.
* Do not include pleasantries.
* Provide only the raw commit message text.

DIFF:
${diff}`;

  try {
    // Native fetch handles API requests efficiently
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content?.trim() || "Failed to parse AI API response.";
  } catch (error: any) {
    throw new Error(`AI Call failed: ${error.message}`);
  }
}

/**
 * Copies the generated AI commit message to the clipboard.
 */
async function copyToClipboard(comment: string): Promise<void> {
  await vscode.env.clipboard.writeText(comment);
}

// This method is called when your extension is deactivated
export function deactivate() { }
