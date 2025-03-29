import axios from 'axios';
import { BitbucketCloudService } from '../BitbucketCloudService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BitbucketCloudService', () => {
  let service: BitbucketCloudService;
  const mockToken = 'test-token';
  const mockAxiosInstance = {
    get: jest.fn()
  };

  beforeEach(() => {
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    service = new BitbucketCloudService(undefined, mockToken);
    jest.clearAllMocks();
  });

  describe('getPullRequest', () => {
    const mockWorkspace = 'test-workspace';
    const mockRepoSlug = 'test-repo';
    const mockPullRequestId = 123;
    const mockResponse = {
      data: {
        id: mockPullRequestId,
        title: 'Test PR',
        description: 'Test Description',
        state: 'OPEN'
      }
    };

    it('should successfully fetch a pull request', async () => {
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getPullRequest(mockWorkspace, mockRepoSlug, mockPullRequestId);

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/repositories/${mockWorkspace}/${mockRepoSlug}/pullrequests/${mockPullRequestId}`
      );
    });

    it('should throw an error when API call fails', async () => {
      const error = new Error('API Error');
      (error as any).isAxiosError = true;
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(
        service.getPullRequest(mockWorkspace, mockRepoSlug, mockPullRequestId)
      ).rejects.toThrow(`Failed to fetch pull request: API Error`);
    });
  });
}); 