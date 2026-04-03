# AI Commenter

`ai-commenter` is a lightweight VS Code extension that reviews your current uncommitted codebase changes (via `git diff HEAD`) and uses an AI to generate a clean, developer-friendly commit message based on your active code changes.

## Features

- Reads project Git diffs asynchronously.
- Connects to Mistral AI APIs (or drop-in alternatives) using native `fetch`.
- Provides loading states using native VS Code Notifications.
- Automatically copies the formatted multi-line AI commit message directly to your clipboard.

## 🚀 Setup Instructions

1. **Install Dependencies**: Open your terminal in the directory and run:
   ```bash
   npm install
   ```
2. **Add API Key**: Open `src/extension.ts` and locate the `generateAIComment` function. Update `YOUR_API_KEY_HERE` with your actual Mistral AI API Key.
   *Note: Without a key, an automatic mock response will be provided to easily test the UI integration!*

## 🛠️ Testing the Extension (Running it locally)

1. Open the project folder in VS Code.
2. Press **`F5`**. This will compile the TypeScript code and launch a new **"Extension Development Host"** window.
3. In the new window, make sure you open a folder that is part of a Git repository.
4. **Make a file change** but do not commit it.
5. While actively editing the changed file, open the Command Palette (**`Cmd+Shift+P`** / **`Ctrl+Shift+P`**).
6. Type and select **`AI: Generate Commit Message`**.

You should see a loading notification pop up, and 1-2 seconds later, an AI commit message for your changes will be copied to your clipboard ready to paste!
