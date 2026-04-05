# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # Compile TypeScript to build/ and chmod +x
npm start              # Run compiled server (node build/index.js)
npm run dev            # TypeScript watch mode
npm test               # Run all Jest tests
npm test -- src/__tests__/index.test.ts  # Run a single test file
npm run lint           # ESLint on src/**/*.ts
npm run inspector      # Launch MCP Inspector for debugging
```

## Architecture

This is an MCP (Model Context Protocol) server that provides read-only access to Bitbucket Cloud pull requests via stdio transport.

- **Entry point**: `src/index.ts` — `BitbucketCloud` class wraps `@modelcontextprotocol/sdk` Server, registers tool handlers, and connects via `StdioServerTransport`
- **Service layer**: `src/services/BitbucketCloudService.ts` — encapsulates Bitbucket API calls (`getPullRequest`, `getPullRequestDiff`)
- **Types**: `src/types/index.ts` — shared interfaces (`BitbucketConfig`, `RepositoryParams`, `PullRequestParams`, `PullRequestData`)
- **API**: Bitbucket Cloud REST API v2.0 via axios with Bearer token authentication
- **Logging**: Winston logger writes to `bitbucket-cloud.log`

### MCP Tools

| Tool | Description | API Endpoint |
|------|-------------|--------------|
| `get_bb_pull_request` | Get PR details | `/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}` |
| `get_bb_diff` | Get PR diff (text/plain) | `.../pullrequests/{pull_request_id}/diff` |

All tools require: `workspace`, `repo_slug`, `pull_request_id`. The `workspace` parameter falls back to `BITBUCKET_WORKSPACE` env var if omitted.

### Environment Variables

Loaded via `dotenv` from `.env` file (see `.env.example`):
- `BITBUCKET_TOKEN` (required): Bitbucket Cloud app password with repository/PR read permissions
- `BITBUCKET_WORKSPACE` (optional): Default workspace fallback

## Code Style

- TypeScript strict mode, CommonJS modules, ES2020 target
- `@typescript-eslint/recommended` rules; `no-explicit-any` is warn-level
- **API parameters**: snake_case (`workspace`, `repo_slug`, `pull_request_id`)
- **TypeScript code**: camelCase
- Error handling: `McpError` with `ErrorCode` enums from SDK; catch and wrap axios errors
- Japanese comments are used in the codebase
- Tests live in `__tests__/` directories alongside source, matching `**/__tests__/**/*.test.ts`
