# AI Commenter 🤖

**AI Commenter** is a lightweight, productivity-focused VS Code extension that uses Mistral AI to instantly generate professional, authoritative git commit messages based on your uncommitted changes.

Stop wasting time thinking of commit titles. Let the AI analyze your code diffs and generate a concise summary formatted exactly how you like it.

---

## ✨ Features

- **Mistral AI Powered**: Leverages the high-performance `mistral-small-latest` model for smart code analysis.
- **Context-Aware**: Automatically detects your current Git branch and prepends it to the commit message in the `[branch] - message` format.
- **One-Click Generation**: Use the Command Palette to generate a message in seconds.
- **Smart Formatting**: Generates authoritative, senior-level commit messages (max 15 words) and copies them directly to your clipboard.
- **Flexible Workspace**: Works even with no active editor open—it analyzes your whole staged/unstaged workspace diff.

---

## 🚀 How to Use

1. **Make Changes**: Edit your code and save your files.
2. **Open Command Palette**: Press `Cmd + Shift + P` (Mac) or `Ctrl + Shift + P` (Windows).
3. **Run AI Commenter**: Search for **AI: Generate Commit Message**.
4. **Paste!**: A loading notification will appear. Once finished, your commit message is copied to your clipboard. Just paste it (`Cmd + V`) into your Git commit input or terminal!

---

## ⚙️ Configuration

To use this extension, you need a **Mistral AI API Key**.

1. Go to **Settings** (`Cmd + ,`).
2. Search for `aiCommenter`.
3. Enter your key in the **Mistral Api Key** field.

> **Tip**: If you haven't set a key yet, the extension will provide a helpful button to open settings directly for you.

---

## 🛠️ Local Development (For Contributors)

If you are running this project from source:

1. Clone the repository.
2. Run `npm install` to get dependencies.
3. Press `F5` to open the **Extension Development Host**.
4. Test the command `AI: Generate Commit Message` in a git-initialized project.

---

## 📦 Packaging

To increment the version and create a `.vsix` installer in one step:
```bash
npm run package
```

---

**Built with ❤️ for developers who love clean commit histories.**
