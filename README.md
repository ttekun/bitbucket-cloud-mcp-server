# Bitbucket Cloud MCP

MCP (Model Context Protocol) server for Bitbucket Cloud Pull Request management. This server provides read-only tools to interact with the Bitbucket Cloud API through the Model Context Protocol.

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

The server provides the following read-only MCP tools for Bitbucket Cloud integration:

### `get_pull_request`

Retrieves detailed information about a specific pull request.

Parameters:
- `owner` (required): Bitbucket workspace/owner
- `repository` (required): Repository slug
- `prId` (required): Pull request ID

### `get_diff`

Gets the diff for a pull request.

Parameters:
- `owner` (required): Bitbucket workspace/owner
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
      "args": ["/path/to/bitbucket-cloud-mcp-server/build/index.js"],
      "env": {
        // Required: Bitbucket Cloud Personal Access Token
        "BITBUCKET_TOKEN": "your-bitbucket-cloud-token-here",
        // Optional: Default Bitbucket workspace/owner
        "BITBUCKET_WORKSPACE": "your-bitbucket-workspace-here"
      }
    }
  }
}
```

### Environment Variables

- `BITBUCKET_TOKEN` (required): Personal access token from Bitbucket Cloud
  - Required permissions: Repository read, Pull request read
  - Can be generated from: Bitbucket Cloud > Personal Settings > App passwords
- `BITBUCKET_WORKSPACE` (optional): Default Bitbucket workspace/owner to use

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