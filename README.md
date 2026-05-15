# AI Commenter 🤖

AI-generated commits and high-performance prompt optimization for modern developers.

## 🧐 Why?

Because "fixed bug", "idk", and "update" are not commit messages, and prompt engineering is time-consuming. **AI Commenter** uses Mistral AI to turn messy diffs into senior-level commit messages and messy prompts into high-performance agent instructions.

## ✨ Features

### 1. 🧠 AI Commit Message Generator
Mistral-powered diff analysis. Understands your code changes and generates professional commit messages.
- **Shortcut**: `Ctrl+Shift+C` (Mac: `Cmd+Shift+C`)
- **Branch Aware**: Automatically prepends your branch name (e.g., `[feature/login] - Added auth validation`).
- **Clipboard Ready**: Generated message is copied to your clipboard instantly.

### 2. ⚡ AI Prompt Optimizer (NEW)
Turns verbose human prompts into minimal, high-precision instructions for AI coding agents like Cursor or Antigravity.
- **Shortcut**: `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`)
- **Flow**: Select any text (in the editor or agent chat) → Hit Shortcut → Paste optimized prompt.
- **Token Efficient**: Optimizes for TOTAL token cost (input + exploration + retries).

## 🚀 Setup

1. **API Key**: Get your Mistral AI API key.
2. **Configure**: Open VS Code Settings (`Cmd + ,`) → Search `aiCommenter` → Paste your API Key.
3. **Enjoy**: Use the shortcuts to speed up your workflow.

## 🎹 Shortcuts

| Feature | Windows/Linux | macOS |
|---------|---------------|-------|
| **Generate Commit** | `Ctrl + Shift + C` | `Cmd + Shift + C` |
| **Optimize Prompt** | `Ctrl + Shift + P` | `Cmd + Shift + P` |

---
*Built for developers who value their time and token usage.*
