import express from 'express';
import { BitbucketCloudService } from './services/BitbucketCloudService';

const app = express();
const port = process.env.PORT || 3000;
const bitbucketToken = process.env.BITBUCKET_TOKEN;

if (!bitbucketToken) {
  throw new Error('BITBUCKET_TOKEN is required');
}

const bitbucketService = new BitbucketCloudService(undefined, bitbucketToken);

app.use(express.json());

app.get('/api/pullrequests/:workspace/:repoSlug/:pullRequestId', async (req, res) => {
  try {
    const { workspace, repoSlug, pullRequestId } = req.params;
    const pullRequest = await bitbucketService.getPullRequest(
      workspace,
      repoSlug,
      parseInt(pullRequestId, 10)
    );
    res.json(pullRequest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pull request' });
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`MCP Server is running on port ${port}`);
  });
}

export default app; 