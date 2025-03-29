import axios, { AxiosInstance } from 'axios';

export class BitbucketCloudService {
  private client: AxiosInstance;

  constructor(baseURL: string = 'https://api.bitbucket.org/2.0', token: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getPullRequest(workspace: string, repoSlug: string, pullRequestId: number) {
    try {
      const response = await this.client.get(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}`
      );
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch pull request: ${message}`);
    }
  }
} 