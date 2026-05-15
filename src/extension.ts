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

  // --- Prompt Optimizer Command ---
  // Single shortcut flow:
  // 1. Auto-copies whatever is selected (works in editor, agent UI, webviews)
  // 2. Reads the copied text from clipboard
  // 3. Sends to AI for optimization
  // 4. Writes optimized prompt back to clipboard — ready to paste
  let optimizeDisposable = vscode.commands.registerCommand('aiCommenter.optimizePrompt', async () => {
    // Step 1: Trigger native copy to grab selection from any context (editor, agent UI, webview)
    await vscode.commands.executeCommand('editor.action.clipboardCopyAction');

    // Brief wait for the clipboard to be populated
    await new Promise(resolve => setTimeout(resolve, 150));

    // Step 2: Read what was just copied
    const selectedText = await vscode.env.clipboard.readText();

    if (!selectedText || selectedText.trim() === '') {
      vscode.window.showWarningMessage(
        'AI Commenter: No text selected. Select your prompt and try again.'
      );
      return;
    }

    // Fetch API Key
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

    try {
      const optimizedPrompt = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Optimizing prompt...",
        cancellable: false
      }, async () => {
        return await optimizePromptWithAI(selectedText, mistralApiKey);
      });

      // Step 3: Write optimized prompt back to clipboard
      await copyToClipboard(optimizedPrompt);
      vscode.window.showInformationMessage('Optimized prompt copied to clipboard — just paste it!');
    } catch (error: any) {
      vscode.window.showErrorMessage(`AI Commenter Error: ${error.message}`);
    }
  });

  context.subscriptions.push(optimizeDisposable);
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
* Do not include it is AI comment.
* Direct and to the point.
* Do not include pleasantries.
* Provide only the raw commit message text.
* Do not include any other text.

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
 * Calls the AI API to optimize a user's prompt for maximum efficiency.
 */
async function optimizePromptWithAI(selectedText: string, apiKey: string): Promise<string> {
  const API_URL = "https://api.mistral.ai/v1/chat/completions";

  const systemPrompt = `You are an expert prompt optimizer for AI coding agents.

Your task:
Convert the selected user text into the most efficient high-performance prompt possible.

Goals:
- Minimize token usage
- Maximize instruction clarity
- Preserve ALL intent
- Remove ambiguity
- Remove conversational filler
- Convert vague requirements into executable tasks
- Optimize for autonomous coding agents
- Improve output quality and determinism

Rules:
1. Keep prompts compact but complete
2. Prefer bullet instructions over paragraphs
3. Convert implicit requirements into explicit constraints
4. Preserve technical stack, libraries, APIs, and architecture references
5. Infer missing implementation expectations from context
6. Avoid generic phrases
7. Avoid repeated instructions
8. Prefer action-oriented language
9. Output only the optimized prompt
10. Never explain changes

Optimization Strategy:
- Extract objective
- Extract constraints
- Extract tech stack
- Extract expected output
- Extract edge cases
- Extract performance/security concerns
- Convert into structured execution prompt

Prompt Structure:
# Objective
# Context
# Requirements
# Constraints
# Expected Output

If applicable, include:
- scalability requirements
- type safety
- error handling
- accessibility
- responsiveness
- performance optimizations
- code style consistency
- production-readiness
- backward compatibility

When code-related:
- prefer maintainable solutions
- minimize dependencies
- preserve existing architecture
- avoid breaking changes
- ensure clean typing
- avoid unnecessary abstractions

When unclear:
- make the most reasonable engineering assumption
- do NOT ask questions unless critical`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Selected Text:\n${selectedText}` }
        ],
        max_tokens: 2048,
        temperature: 0.1,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content?.trim() || "Failed to parse AI API response.";
  } catch (error: any) {
    throw new Error(`Prompt optimization failed: ${error.message}`);
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
