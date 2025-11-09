/**
 * CI Pipeline Factory
 * 
 * Creates appropriate CI pipeline adapter based on configuration
 */

import { CIPipelineAdapter, CIAdapterConfig } from './interface';
import { GitHubActionsAdapter } from './adapters/github-actions-adapter';

export class CIPipelineFactory {
  static create(config: CIAdapterConfig): CIPipelineAdapter {
    switch (config.type) {
      case 'github':
        if (!config.token || !config.repository) {
          throw new Error('GitHub adapter requires token and repository');
        }
        const [owner, repo] = config.repository.split('/');
        if (!owner || !repo) {
          throw new Error('Repository must be in format owner/repo');
        }
        return new GitHubActionsAdapter({
          token: config.token,
          owner,
          repo,
        });
      
      case 'gitlab':
        // TODO: Implement GitLabAdapter
        throw new Error('GitLab adapter not yet implemented');
      
      case 'jenkins':
        // TODO: Implement JenkinsAdapter
        throw new Error('Jenkins adapter not yet implemented');
      
      case 'custom':
        if (!config.adapter) {
          throw new Error('Custom adapter must be provided');
        }
        return config.adapter;
      
      default:
        throw new Error(`Unknown CI type: ${config.type}`);
    }
  }

  static fromEnvironment(): CIPipelineAdapter {
    const ciType = process.env.CI_TYPE || 'github';
    const token = process.env.GITHUB_TOKEN || process.env.CI_TOKEN;
    const repository = process.env.GITHUB_REPOSITORY || process.env.CI_REPOSITORY;
    
    return this.create({
      type: ciType as any,
      token,
      repository,
      options: {
        baseUrl: process.env.CI_BASE_URL,
      },
    });
  }
}
