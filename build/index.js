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
            workspace: process.env.BITBUCKET_WORKSPACE
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
    isPullRequestInput(args) {
        const input = args;
        return typeof args === 'object' &&
            args !== null &&
            typeof input.workspace === 'string' &&
            typeof input.repository === 'string' &&
            typeof input.title === 'string' &&
            typeof input.sourceBranch === 'string' &&
            typeof input.targetBranch === 'string' &&
            (input.description === undefined || typeof input.description === 'string') &&
            (input.reviewers === undefined || Array.isArray(input.reviewers));
    }
    setupToolHandlers() {
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'create_pull_request',
                    description: 'Create a new pull request in Bitbucket Cloud',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            workspace: { type: 'string', description: 'Bitbucket workspace' },
                            repository: { type: 'string', description: 'Repository slug' },
                            title: { type: 'string', description: 'PR title' },
                            description: { type: 'string', description: 'PR description' },
                            sourceBranch: { type: 'string', description: 'Source branch name' },
                            targetBranch: { type: 'string', description: 'Target branch name' },
                            reviewers: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'List of reviewer UUIDs'
                            }
                        },
                        required: ['repository', 'title', 'sourceBranch', 'targetBranch']
                    }
                },
                {
                    name: 'get_pull_request',
                    description: 'Get pull request details from Bitbucket Cloud',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            workspace: { type: 'string', description: 'Bitbucket workspace' },
                            repository: { type: 'string', description: 'Repository slug' },
                            prId: { type: 'number', description: 'Pull request ID' }
                        },
                        required: ['repository', 'prId']
                    }
                },
                {
                    name: 'merge_pull_request',
                    description: 'Merge a pull request in Bitbucket Cloud',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            workspace: { type: 'string', description: 'Bitbucket workspace' },
                            repository: { type: 'string', description: 'Repository slug' },
                            prId: { type: 'number', description: 'Pull request ID' },
                            message: { type: 'string', description: 'Merge commit message' },
                            closeSourceBranch: { type: 'boolean', description: 'Close source branch after merge' },
                            mergeStrategy: {
                                type: 'string',
                                enum: ['merge_commit', 'squash', 'fast_forward'],
                                description: 'Merge strategy to use'
                            }
                        },
                        required: ['repository', 'prId']
                    }
                },
                {
                    name: 'decline_pull_request',
                    description: 'Decline a pull request in Bitbucket Cloud',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            workspace: { type: 'string', description: 'Bitbucket workspace' },
                            repository: { type: 'string', description: 'Repository slug' },
                            prId: { type: 'number', description: 'Pull request ID' }
                        },
                        required: ['repository', 'prId']
                    }
                },
                {
                    name: 'add_comment',
                    description: 'Add a comment to a pull request in Bitbucket Cloud',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            workspace: { type: 'string', description: 'Bitbucket workspace' },
                            repository: { type: 'string', description: 'Repository slug' },
                            prId: { type: 'number', description: 'Pull request ID' },
                            text: { type: 'string', description: 'Comment text' },
                            parentId: { type: 'number', description: 'Parent comment ID for replies' }
                        },
                        required: ['repository', 'prId', 'text']
                    }
                },
                {
                    name: 'get_diff',
                    description: 'Get pull request diff from Bitbucket Cloud',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            workspace: { type: 'string', description: 'Bitbucket workspace' },
                            repository: { type: 'string', description: 'Repository slug' },
                            prId: { type: 'number', description: 'Pull request ID' }
                        },
                        required: ['repository', 'prId']
                    }
                }
            ]
        }));
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            try {
                logger.info(`Called tool: ${request.params.name}`, { arguments: request.params.arguments });
                const args = request.params.arguments ?? {};
                const pullRequestParams = {
                    workspace: args.workspace ?? this.config.workspace,
                    repository: args.repository,
                    prId: args.prId
                };
                if (!pullRequestParams.workspace) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Workspace must be provided either as a parameter or through BITBUCKET_WORKSPACE environment variable');
                }
                switch (request.params.name) {
                    case 'create_pull_request':
                        if (!this.isPullRequestInput(args)) {
                            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Invalid pull request input parameters');
                        }
                        return await this.createPullRequest(args);
                    case 'get_pull_request':
                        return await this.getPullRequest(pullRequestParams);
                    case 'merge_pull_request':
                        return await this.mergePullRequest(pullRequestParams, {
                            message: args.message,
                            closeSourceBranch: args.closeSourceBranch,
                            mergeStrategy: args.mergeStrategy
                        });
                    case 'decline_pull_request':
                        return await this.declinePullRequest(pullRequestParams);
                    case 'add_comment':
                        return await this.addComment(pullRequestParams, {
                            text: args.text,
                            parentId: args.parentId
                        });
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
    async createPullRequest(input) {
        const response = await this.api.post(`/repositories/${input.workspace}/${input.repository}/pullrequests`, {
            title: input.title,
            description: input.description,
            source: {
                branch: {
                    name: input.sourceBranch
                }
            },
            destination: {
                branch: {
                    name: input.targetBranch
                }
            },
            reviewers: input.reviewers?.map(uuid => ({ uuid }))
        });
        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }
    async getPullRequest(params) {
        const { workspace, repository, prId } = params;
        const response = await this.api.get(`/repositories/${workspace}/${repository}/pullrequests/${prId}`);
        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }
    async mergePullRequest(params, options = {}) {
        const { workspace, repository, prId } = params;
        const { message, closeSourceBranch, mergeStrategy } = options;
        const response = await this.api.post(`/repositories/${workspace}/${repository}/pullrequests/${prId}/merge`, {
            message,
            close_source_branch: closeSourceBranch,
            merge_strategy: mergeStrategy
        });
        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }
    async declinePullRequest(params) {
        const { workspace, repository, prId } = params;
        const response = await this.api.post(`/repositories/${workspace}/${repository}/pullrequests/${prId}/decline`);
        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }
    async addComment(params, options) {
        const { workspace, repository, prId } = params;
        const { text, parentId } = options;
        const response = await this.api.post(`/repositories/${workspace}/${repository}/pullrequests/${prId}/comments`, {
            content: {
                raw: text
            },
            parent: parentId ? { id: parentId } : undefined
        });
        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }
    async getDiff(params) {
        const { workspace, repository, prId } = params;
        const response = await this.api.get(`/repositories/${workspace}/${repository}/pullrequests/${prId}/diff`, {
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
