# Bitbucket Cloud MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue.svg)](https://modelcontextprotocol.io/)

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that lets AI assistants read Bitbucket Cloud pull requests. Connect Claude, Copilot, or any MCP-compatible client to your Bitbucket Cloud workspace and review PRs through natural conversation.

## What Can It Do?

| Tool | Description |
|------|-------------|
| `get_bb_pull_request` | Retrieve pull request details (title, author, status, branches, etc.) |
| `get_bb_diff` | Get the full diff of a pull request |

**Example prompts you can use with your AI assistant:**

> "Summarize pull request #42 in the my-app repo"
>
> "Review the diff for PR #15 and suggest improvements"
>
> "What's the status of open PRs in our project?"

## Quick Start

### 1. Install

```bash
git clone https://github.com/ttekun/bitbucket-cloud-mcp-server.git
cd bitbucket-cloud-mcp-server
npm install
npm run build
```

### 2. Get a Bitbucket App Password

1. Go to **Bitbucket Cloud** → **Personal Settings** → **App passwords**
2. Create a new app password with **Repository: Read** and **Pull request: Read** permissions

### 3. Configure Your MCP Client

<details>
<summary><strong>Claude Desktop</strong></summary>

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "bitbucket-cloud": {
      "command": "node",
      "args": ["/absolute/path/to/bitbucket-cloud-mcp-server/build/index.js"],
      "env": {
        "BITBUCKET_TOKEN": "your-app-password",
        "BITBUCKET_WORKSPACE": "your-workspace"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>VS Code (Copilot / Claude Code)</strong></summary>

Add to your VS Code settings or `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "bitbucket-cloud": {
      "command": "node",
      "args": ["/absolute/path/to/bitbucket-cloud-mcp-server/build/index.js"],
      "env": {
        "BITBUCKET_TOKEN": "your-app-password",
        "BITBUCKET_WORKSPACE": "your-workspace"
      }
    }
  }
}
```

</details>

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BITBUCKET_TOKEN` | Yes | Bitbucket Cloud app password |
| `BITBUCKET_WORKSPACE` | No | Default workspace (can be overridden per request) |

## Tool Parameters

Both tools accept the same parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workspace` | string | Yes* | Bitbucket workspace (*falls back to `BITBUCKET_WORKSPACE` env var) |
| `repo_slug` | string | Yes | Repository slug |
| `pull_request_id` | number | Yes | Pull request ID |

## Development

```bash
npm run dev        # Watch mode
npm test           # Run tests
npm run lint       # Lint
npm run inspector  # MCP Inspector (debug tool)
```

## License

[MIT](LICENSE)
