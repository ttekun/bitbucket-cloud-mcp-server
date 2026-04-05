# Agent Guidelines for Bitbucket Cloud MCP Server

## Commands
- Build: `npm run build` (compiles TypeScript to build/)
- Test: `npm test` (runs all Jest tests)
- Test single file: `npm test -- path/to/test.test.ts`
- Lint: `npm run lint`
- Dev watch: `npm run dev` (watches for TypeScript changes)
- Start: `npm start` (runs the built MCP server)
- Inspector: `npm run inspector` (MCP debugging tool)

## Architecture
- **MCP Server**: Node.js MCP server for Bitbucket Cloud API integration (read-only)
- **Main entry**: src/index.ts (executable MCP server using @modelcontextprotocol/sdk)
- **Services**: src/services/BitbucketCloudService.ts (encapsulates Bitbucket API calls)
- **Tests**: src/__tests__/ (Jest tests with ts-jest preset, tests in **/__tests__/**/*.test.ts pattern)
- **API**: Bitbucket Cloud REST API v2.0 via axios with Bearer token authentication
- **Logging**: Winston logger writing to bitbucket-cloud.log
- **Config**: Environment variables via dotenv (BITBUCKET_TOKEN required, BITBUCKET_WORKSPACE optional)

## Code Style
- **Language**: TypeScript with strict mode enabled
- **Module system**: CommonJS (target: es2020)
- **Formatting**: TypeScript-ESLint with @typescript-eslint/recommended rules
- **Types**: Prefer explicit interfaces (e.g., BitbucketConfig, PullRequestParams); no-explicit-any is warning-level
- **Naming**: snake_case for API params (workspace, repo_slug, pull_request_id), camelCase for TypeScript code
- **Error handling**: Use McpError from SDK with appropriate ErrorCode; catch and log axios errors
- **Comments**: Japanese comments allowed (環境変数, ロガー seen in codebase)
- **Imports**: Group by external packages first, then types/interfaces
