import axios, { AxiosInstance } from 'axios';
import winston from 'winston';
import { BitbucketConfig, PullRequestData } from '../types';

export class BitbucketCloudService {
  private readonly api: AxiosInstance;
  private readonly logger: winston.Logger;
  private readonly config: BitbucketConfig;

  constructor(config?: Partial<BitbucketConfig>, token?: string) {
    this.config = {
      baseUrl: config?.baseUrl ?? 'https://api.bitbucket.org/2.0',
      token: token ?? config?.token ?? '',
      workspace: config?.workspace
    };

    if (!this.config.token) {
      throw new Error('Bitbucket token is required');
    }

    this.api = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Content-Type': 'application/json'
      }
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'bitbucket-cloud.log' })
      ]
    });
  }

  async getPullRequest(workspace: string, repoSlug: string, pullRequestId: number): Promise<PullRequestData> {
    try {
      const response = await this.api.get(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}`
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get pull request', { error, workspace, repoSlug, pullRequestId });
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch pull request: ${error.message}`);
      }
      throw error;
    }
  }

  async getPullRequestDiff(workspace: string, repoSlug: string, pullRequestId: number): Promise<string> {
    try {
      const response = await this.api.get(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/diff`,
        {
          headers: { Accept: 'text/plain' }
        }
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get pull request diff', { error, workspace, repoSlug, pullRequestId });
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch pull request diff: ${error.message}`);
      }
      throw error;
    }
  }
}