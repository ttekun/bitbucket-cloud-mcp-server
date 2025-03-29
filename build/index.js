#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const axios_1 = __importDefault(require("axios"));
const winston_1 = __importDefault(require("winston"));
const dotenv_1 = __importDefault(require("dotenv"));
// 環境変数の読み込み
dotenv_1.default.config();
// ロガーの設定
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [
        new winston_1.default.transports.File({ filename: 'bitbucket-cloud.log' })
    ]
});
class BitbucketCloud {
    constructor() {
        this.server = new index_js_1.Server({
            name: 'bitbucket-cloud-mcp-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        // 環境変数からの初期設定
        this.config = {
            baseUrl: 'https://api.bitbucket.org/2.0',
            token: process.env.BITBUCKET_TOKEN ?? '',
            owner: process.env.BITBUCKET_WORKSPACE
        };
        if (!this.config.token) {
            throw new Error('BITBUCKET_TOKEN is required');
        }
        // Axiosインスタンスの設定
        this.api = axios_1.default.create({
            baseURL: this.config.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.config.token}`,
                'Content-Type': 'application/json'
            }
        });
        this.setupToolHandlers();
        this.server.onerror = (error) => logger.error('[MCP Error]', error);
    }
    setupToolHandlers() {
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'get_pull_request',
                    description: 'Get pull request details from Bitbucket Cloud',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            owner: { type: 'string', description: 'Bitbucket workspace/owner' },
                            repo: { type: 'string', description: 'Repository slug' },
                            pull_number: { type: 'number', description: 'Pull request number' },
                            prId: { type: 'number', description: 'Pull request ID (alternative to pull_number)' },
                            repository: { type: 'string', description: 'Repository slug (legacy, use repo instead)' }
                        },
                        required: ['owner', 'repo', 'pull_number']
                    }
                },
                {
                    name: 'get_diff',
                    description: 'Get pull request diff from Bitbucket Cloud',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            owner: { type: 'string', description: 'Bitbucket workspace/owner' },
                            repo: { type: 'string', description: 'Repository slug' },
                            pull_number: { type: 'number', description: 'Pull request number' },
                            prId: { type: 'number', description: 'Pull request ID (alternative to pull_number)' },
                            repository: { type: 'string', description: 'Repository slug (legacy, use repo instead)' }
                        },
                        required: ['owner', 'repo', 'pull_number']
                    }
                }
            ]
        }));
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            try {
                logger.info(`Called tool: ${request.params.name}`, { arguments: request.params.arguments });
                const args = request.params.arguments ?? {};
                const pullRequestParams = {
                    owner: args.owner ?? this.config.owner,
                    repo: args.repo ?? args.repository,
                    prId: args.pull_number ??
                        args.prId ??
                        args.pull_request_id ??
                        args.pullRequestId ??
                        args.pr_id ??
                        args.id
                };
                if (!pullRequestParams.owner) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Owner must be provided either as a parameter or through BITBUCKET_WORKSPACE environment variable');
                }
                if (!pullRequestParams.repo) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Repository slug (repo) must be provided');
                }
                if (!pullRequestParams.prId) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Pull request ID (prId) must be provided');
                }
                switch (request.params.name) {
                    case 'get_pull_request':
                        return await this.getPullRequest(pullRequestParams);
                    case 'get_diff':
                        return await this.getDiff(pullRequestParams);
                    default:
                        throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
                }
            }
            catch (error) {
                logger.error('Tool execution error', { error });
                if (axios_1.default.isAxiosError(error)) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Bitbucket API error: ${error.response?.data.error?.message ?? error.message}`);
                }
                throw error;
            }
        });
    }
    async getPullRequest(params) {
        const { owner, repo, prId } = params;
        const response = await this.api.get(`/repositories/${owner}/${repo}/pullrequests/${prId}`);
        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }
    async getDiff(params) {
        const { owner, repo, prId } = params;
        const response = await this.api.get(`/repositories/${owner}/${repo}/pullrequests/${prId}/diff`, {
            headers: { Accept: 'text/plain' }
        });
        return {
            content: [{ type: 'text', text: response.data }]
        };
    }
    async run() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        logger.info('Bitbucket Cloud MCP server running on stdio');
    }
}
const server = new BitbucketCloud();
server.run().catch((error) => {
    logger.error('Server error', error);
    process.exit(1);
});
