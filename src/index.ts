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
  owner?: string;
}

interface RepositoryParams {
  owner: string;
  repo: string;
}

interface PullRequestParams extends RepositoryParams {
  prId?: number;
  pull_number?: number;
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
      owner: process.env.BITBUCKET_WORKSPACE
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
          name: 'get_pull_request',
          description: 'Get pull request details from Bitbucket Cloud',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Bitbucket workspace/owner' },
              repo: { type: 'string', description: 'Repository slug' },
              pull_number: { type: 'number', description: 'Pull request ID' }
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
              prId: { type: 'number', description: 'Pull request ID' }
            },
            required: ['owner', 'repo', 'prId']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        logger.info(`Called tool: ${request.params.name}`, { arguments: request.params.arguments });
        const args = request.params.arguments ?? {};

        const pullRequestParams: PullRequestParams = {
          owner: (args.owner as string) ?? this.config.owner,
          repo: (args.repo as string),
        };

        if (request.params.name === 'get_pull_request') {
          pullRequestParams.pull_number = (args.pull_number as number);
        } else {
          pullRequestParams.prId = (args.prId as number);
        }

        if (!pullRequestParams.owner) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Owner must be provided either as a parameter or through BITBUCKET_WORKSPACE environment variable'
          );
        }

        if (!pullRequestParams.repo) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Repository slug (repo) must be provided'
          );
        }

        if (request.params.name === 'get_pull_request' && !pullRequestParams.pull_number) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Pull request ID (pull_number) must be provided'
          );
        }

        if (request.params.name === 'get_diff' && !pullRequestParams.prId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Pull request ID (prId) must be provided'
          );
        }

        switch (request.params.name) {
          case 'get_pull_request':
            return await this.getPullRequest(pullRequestParams);
          case 'get_diff':
            return await this.getDiff(pullRequestParams);
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

  private async getPullRequest(params: PullRequestParams) {
    const { owner, repo } = params;
    const pullRequestNumber = params.pull_number;
    
    try {
      const response = await this.api.get(
        `/repositories/${owner}/${repo}/pullrequests/${pullRequestNumber}`
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

  private async getDiff(params: PullRequestParams) {
    const { owner, repo } = params;
    const pullRequestId = params.prId;
    
    const response = await this.api.get(
      `/repositories/${owner}/${repo}/pullrequests/${pullRequestId}/diff`,
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