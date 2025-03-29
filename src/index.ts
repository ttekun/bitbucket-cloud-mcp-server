#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';
import winston from 'winston';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

// ロガーの設定
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'bitbucket-cloud.log' })
  ]
});

interface BitbucketConfig {
  baseUrl: string;
  token: string;
  workspace?: string;
}

interface RepositoryParams {
  workspace: string;
  repo_slug: string;
}

interface PullRequestParams extends RepositoryParams {
  pull_request_id?: number;
}

class BitbucketCloud {
  private readonly server: Server;
  private readonly api: AxiosInstance;
  private readonly config: BitbucketConfig;

  constructor() {
    this.server = new Server(
      {
        name: 'bitbucket-cloud-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

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
    this.api = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Content-Type': 'application/json'
      }
    });

    this.setupToolHandlers();
    
    this.server.onerror = (error) => logger.error('[MCP Error]', error);
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_bb_pull_request',
          description: 'Get pull request details from Bitbucket Cloud',
          inputSchema: {
            type: 'object',
            properties: {
              workspace: { type: 'string', description: 'Bitbucket workspace' },
              repo_slug: { type: 'string', description: 'Repository slug' },
              pull_request_id: { type: 'number', description: 'Pull request ID' }
            },
            required: ['workspace', 'repo_slug', 'pull_request_id']
          }
        },
        {
          name: 'get_bb_diff',
          description: 'Get pull request diff from Bitbucket Cloud',
          inputSchema: {
            type: 'object',
            properties: {
              workspace: { type: 'string', description: 'Bitbucket workspace' },
              repo_slug: { type: 'string', description: 'Repository slug' },
              pull_request_id: { type: 'number', description: 'Pull request ID' }
            },
            required: ['workspace', 'repo_slug', 'pull_request_id']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        logger.info(`Called tool: ${request.params.name}`, { arguments: request.params.arguments });
        const args = request.params.arguments ?? {};

        const pullRequestParams: PullRequestParams = {
          workspace: (args.workspace as string) ?? this.config.workspace,
          repo_slug: (args.repo_slug as string),
          pull_request_id: (args.pull_request_id as number)
        };

        if (!pullRequestParams.workspace) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Workspace must be provided either as a parameter or through BITBUCKET_WORKSPACE environment variable'
          );
        }

        if (!pullRequestParams.repo_slug) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Repository slug (repo_slug) must be provided'
          );
        }

        if (!pullRequestParams.pull_request_id) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Pull request ID (pull_request_id) must be provided'
          );
        }

        switch (request.params.name) {
          case 'get_bb_pull_request':
            return await this.getBbPullRequest(pullRequestParams);
          case 'get_bb_diff':
            return await this.getBbDiff(pullRequestParams);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        logger.error('Tool execution error', { error });
        if (axios.isAxiosError(error)) {
          throw new McpError(
            ErrorCode.InternalError,
            `Bitbucket API error: ${error.response?.data.error?.message ?? error.message}`
          );
        }
        throw error;
      }
    });
  }

  private async getBbPullRequest(params: PullRequestParams) {
    const { workspace, repo_slug, pull_request_id } = params;
    
    try {
      const response = await this.api.get(
        `/repositories/${workspace}/${repo_slug}/pullrequests/${pull_request_id}`
      );
      
      return {
        content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
      };
    } catch (error) {
      logger.error('Failed to get pull request', { error, params });
      if (axios.isAxiosError(error)) {
        throw new McpError(
          ErrorCode.InternalError,
          `Bitbucket API error: ${error.response?.data.error?.message ?? error.message}`
        );
      }
      throw error;
    }
  }

  private async getBbDiff(params: PullRequestParams) {
    const { workspace, repo_slug, pull_request_id } = params;
    
    const response = await this.api.get(
      `/repositories/${workspace}/${repo_slug}/pullrequests/${pull_request_id}/diff`,
      {
        headers: { Accept: 'text/plain' }
      }
    );

    return {
      content: [{ type: 'text', text: response.data }]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Bitbucket Cloud MCP server running on stdio');
  }
}

const server = new BitbucketCloud();
server.run().catch((error) => {
  logger.error('Server error', error);
  process.exit(1);
}); 