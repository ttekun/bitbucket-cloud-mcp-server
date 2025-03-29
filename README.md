# Bitbucket Cloud MCP

MCP (Model Context Protocol) server for Bitbucket Cloud Pull Request management. This server provides tools and resources to interact with the Bitbucket Cloud API through the MCP protocol.

## Requirements

- Node.js >= 16

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

The server provides the following tools for Bitbucket Cloud integration:

### `get_pull_request`

Retrieves detailed information about a specific pull request.

Parameters:

- `workspace` (required): Bitbucket workspace name
- `repoSlug` (required): Repository slug
- `pullRequestId` (required): Pull request ID

Example Response:
```json
{
  "id": 123,
  "title": "Feature: Add new functionality",
  "description": "Implements new feature...",
  "state": "OPEN"
}
```

## Dependencies

- `express` - Web framework for API endpoints
- `axios` - HTTP client for API requests
- `winston` - Logging framework
- `dotenv` - Environment variable management

## Configuration

The server requires configuration in the VSCode MCP settings file. Here's a sample configuration:

```json
{
  "mcpServers": {
    "bitbucket-cloud": {
      "command": "node",
      "args": ["/path/to/bitbucket-cloud-mcp-server/dist/index.js"],
      "env": {
        // Required: Bitbucket Cloud Personal Access Token
        "BITBUCKET_TOKEN": "your-bitbucket-cloud-token",
        // Optional: Server port (default: 3000)
        "PORT": "3000"
      }
    }
  }
}
```

### Environment Variables

- `BITBUCKET_TOKEN` (required): Personal access token from Bitbucket Cloud
  - Required permissions: `pullrequest:read`
  - Can be generated from: Bitbucket Cloud > Personal Settings > App passwords
- `PORT` (optional): Server port number (default: 3000)

## API Endpoints

### Get Pull Request
```
GET /api/pullrequests/:workspace/:repoSlug/:pullRequestId
```

Parameters:
- `workspace`: Bitbucket workspace name
- `repoSlug`: Repository slug
- `pullRequestId`: Pull request ID

Example:
```bash
curl http://localhost:3000/api/pullrequests/my-workspace/my-repo/123
```

## Development

### Running Tests
```bash
npm test
```

The test suite includes:
- Unit tests for BitbucketCloudService
- Integration tests for API endpoints
- 100% test coverage

### Local Development
1. Copy `.env.example` to `.env`
2. Set your Bitbucket Cloud token in `.env`
3. Run `npm start` for development

## Error Handling

The server implements comprehensive error handling:
- API errors are properly caught and formatted
- HTTP 500 responses for server errors
- Detailed error messages for debugging 