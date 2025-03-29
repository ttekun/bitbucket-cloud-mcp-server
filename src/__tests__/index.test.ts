import request from 'supertest';
import express, { Express } from 'express';
import { BitbucketCloudService } from '../services/BitbucketCloudService';

jest.mock('../services/BitbucketCloudService');

describe('Pull Request API Endpoints', () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BITBUCKET_TOKEN = 'test-token';
    app = express();
    app.use(express.json());

    const mockBitbucketService = new BitbucketCloudService(undefined, 'test-token');
    app.get('/api/pullrequests/:workspace/:repoSlug/:pullRequestId', async (req, res) => {
      try {
        const { workspace, repoSlug, pullRequestId } = req.params;
        const pullRequest = await mockBitbucketService.getPullRequest(
          workspace,
          repoSlug,
          parseInt(pullRequestId, 10)
        );
        res.json(pullRequest);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pull request' });
      }
    });
  });

  describe('GET /api/pullrequests/:workspace/:repoSlug/:pullRequestId', () => {
    it('should return pull request data', async () => {
      const mockPRData = {
        id: 123,
        title: 'Test PR',
        description: 'Test Description',
        state: 'OPEN'
      };

      const mockGetPullRequest = jest.spyOn(BitbucketCloudService.prototype, 'getPullRequest');
      mockGetPullRequest.mockResolvedValue(mockPRData);

      const response = await request(app)
        .get('/api/pullrequests/workspace/repo/123')
        .expect(200);

      expect(response.body).toEqual(mockPRData);
      expect(mockGetPullRequest).toHaveBeenCalledWith('workspace', 'repo', 123);
    });

    it('should handle errors properly', async () => {
      const mockGetPullRequest = jest.spyOn(BitbucketCloudService.prototype, 'getPullRequest');
      mockGetPullRequest.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .get('/api/pullrequests/workspace/repo/123')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch pull request' });
    });
  });
}); 