"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitbucketCloudService = void 0;
const axios_1 = __importDefault(require("axios"));
const winston_1 = __importDefault(require("winston"));
class BitbucketCloudService {
    constructor(config, token) {
        this.config = {
            baseUrl: config?.baseUrl ?? 'https://api.bitbucket.org/2.0',
            token: token ?? config?.token ?? '',
            workspace: config?.workspace
        };
        if (!this.config.token) {
            throw new Error('Bitbucket token is required');
        }
        this.api = axios_1.default.create({
            baseURL: this.config.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.config.token}`,
                'Content-Type': 'application/json'
            }
        });
        this.logger = winston_1.default.createLogger({
            level: 'info',
            format: winston_1.default.format.json(),
            transports: [
                new winston_1.default.transports.File({ filename: 'bitbucket-cloud.log' })
            ]
        });
    }
    async getPullRequest(workspace, repoSlug, pullRequestId) {
        try {
            const response = await this.api.get(`/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}`);
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to get pull request', { error, workspace, repoSlug, pullRequestId });
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Failed to fetch pull request: ${error.message}`);
            }
            throw error;
        }
    }
    async getPullRequestDiff(workspace, repoSlug, pullRequestId) {
        try {
            const response = await this.api.get(`/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/diff`, {
                headers: { Accept: 'text/plain' }
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to get pull request diff', { error, workspace, repoSlug, pullRequestId });
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Failed to fetch pull request diff: ${error.message}`);
            }
            throw error;
        }
    }
}
exports.BitbucketCloudService = BitbucketCloudService;
