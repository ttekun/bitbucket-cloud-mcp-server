export interface BitbucketConfig {
  baseUrl: string;
  token: string;
  workspace?: string;
}

export interface RepositoryParams {
  workspace: string;
  repo_slug: string;
}

export interface PullRequestParams extends RepositoryParams {
  pull_request_id: number;
}

export interface PullRequestData {
  id: number;
  title: string;
  description: string;
  state: string;
  author: {
    display_name: string;
    uuid: string;
  };
  source: {
    branch: {
      name: string;
    };
    commit: {
      hash: string;
    };
  };
  destination: {
    branch: {
      name: string;
    };
  };
  created_on: string;
  updated_on: string;
  [key: string]: any;
}