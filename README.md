# Bitbucket Cloud MCP

MCP (Model Context Protocol) server for Bitbucket Cloud Pull Request management. This server provides tools to interact with the Bitbucket Cloud API through the Model Context Protocol.

## Requirements

- Node.js >= 18

## Installation

### Manual Installation
```bash
npm install
```

## Build

```bash
npm run build
```

## Features

The server provides the following MCP tools for Bitbucket Cloud integration:

### `create_pull_request`

Creates a new pull request in a Bitbucket Cloud repository.

Parameters:
- `workspace` (required): Bitbucket workspace
- `repository` (required): Repository slug
- `title` (required): PR title
- `description`: PR description
- `sourceBranch` (required): Source branch name
- `targetBranch` (required): Target branch name
- `reviewers`: List of reviewer UUIDs

### `get_pull_request`

Retrieves detailed information about a specific pull request.

Parameters:
- `workspace` (required): Bitbucket workspace
- `repository` (required): Repository slug
- `prId` (required): Pull request ID

### `merge_pull_request`

Merges a pull request.

Parameters:
- `workspace` (required): Bitbucket workspace
- `repository` (required): Repository slug
- `prId` (required): Pull request ID
- `message`: Merge commit message
- `closeSourceBranch`: Close source branch after merge
- `mergeStrategy`: Merge strategy to use ('merge_commit', 'squash', or 'fast_forward')

### `decline_pull_request`

Declines a pull request.

Parameters:
- `workspace` (required): Bitbucket workspace
- `repository` (required): Repository slug
- `prId` (required): Pull request ID

### `add_comment`

Adds a comment to a pull request.

Parameters:
- `workspace` (required): Bitbucket workspace
- `repository` (required): Repository slug
- `prId` (required): Pull request ID
- `text` (required): Comment text
- `parentId`: Parent comment ID for replies

### `get_diff`

Gets the diff for a pull request.

Parameters:
- `workspace` (required): Bitbucket workspace
- `repository` (required): Repository slug
- `prId` (required): Pull request ID

## Dependencies

- `@modelcontextprotocol/sdk` - Model Context Protocol SDK
- `axios` - HTTP client for API requests
- `winston` - Logging framework
- `dotenv` - Environment variable management

## Configuration

The server requires configuration in the MCP client settings. Here's a sample configuration for VSCode:

```json
{
  "mcpServers": {
    "bitbucket-cloud": {
      "command": "node",
      "args": ["/path/to/bitbucket-cloud-mcp-server/dist/index.js"],
      "env": {
        // Required: Bitbucket Cloud Personal Access Token
        "BITBUCKET_TOKEN": "your-bitbucket-cloud-token",
        // Optional: Default Bitbucket workspace
        "BITBUCKET_WORKSPACE": "your-workspace"
      }
    }
  }
}
```

### Environment Variables

- `BITBUCKET_TOKEN` (required): Personal access token from Bitbucket Cloud
  - Required permissions: Repository read/write, Pull request read/write
  - Can be generated from: Bitbucket Cloud > Personal Settings > App passwords
- `BITBUCKET_WORKSPACE` (optional): Default Bitbucket workspace to use

## Development

### Running Tests
```bash
npm test
```

### Local Development
1. Copy `.env.example` to `.env`
2. Set your Bitbucket Cloud token in `.env`
3. Run `npm start` for development

## Model Context Protocol

This server implements the Model Context Protocol (MCP), a standard protocol for AI tools that allows AI assistants to:

1. Discover available tools
2. Understand tool capabilities and required parameters
3. Call tools with appropriate parameters
4. Receive structured responses

The MCP implementation uses the `@modelcontextprotocol/sdk` package to facilitate communication between the AI assistant and the Bitbucket Cloud API. 