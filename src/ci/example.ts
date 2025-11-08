/**
 * CI Pipeline Adapter Usage Examples
 * 
 * Demonstrates how to use the CI Pipeline Adapter with the multi-agent system
 */

import { CIPipelineFactory, CIAgentManager, waitForPipeline, formatPipelineLogs } from './index';

/**
 * Example 1: Basic CI Pipeline Usage
 */
export async function basicExample() {
  // Create adapter from environment variables
  const ciAdapter = CIPipelineFactory.fromEnvironment();
  
  await ciAdapter.connect();
  
  // Trigger a pipeline
  const run = await ciAdapter.triggerPipeline({
    workflow: '.github/workflows/ci.yml',
    branch: 'main',
    variables: {
      NODE_VERSION: '18',
      ENVIRONMENT: 'staging',
    },
  });
  
  console.log(`Pipeline started: ${run.id}`);
  console.log(`Status: ${run.status}`);
  console.log(`URL: ${run.url}`);
  
  // Wait for completion
  const finalStatus = await waitForPipeline(ciAdapter, run.id, {
    interval: 5000,
    onStatusChange: (status) => {
      console.log(`Status changed: ${status}`);
    },
  });
  
  console.log(`Final status: ${finalStatus}`);
  
  // Get logs
  if (finalStatus === 'failure') {
    const logs = await ciAdapter.getPipelineLogs(run.id);
    console.log(formatPipelineLogs(logs));
  }
  
  await ciAdapter.disconnect();
}

/**
 * Example 2: Multi-Agent System Integration
 */
export async function agentIntegrationExample() {
  const ciAdapter = CIPipelineFactory.fromEnvironment();
  await ciAdapter.connect();
  
  const ciAgents = new CIAgentManager(ciAdapter);
  
  // 4D-Network Agent: Deploy to staging
  console.log('🚀 4D-Network Agent: Triggering staging deployment...');
  const deployment = await ciAgents.network.triggerDeployment({
    environment: 'staging',
    branch: 'main',
  });
  
  console.log(`Deployment ID: ${deployment.id}`);
  
  // Monitor deployment progress
  const deployStatus = await ciAgents.network.monitorDeployment(
    deployment.id,
    (status) => {
      console.log(`  Deployment status: ${status}`);
    }
  );
  
  if (deployStatus === 'success') {
    console.log('✅ Staging deployment successful');
    
    // 6D-Intelligence Agent: Run tests
    console.log('🧠 6D-Intelligence Agent: Running tests...');
    const testResults = await ciAgents.intelligence.runTestsAndAnalyze({
      workflow: '.github/workflows/ci.yml',
      branch: 'main',
    });
    
    console.log(`  Tests: ${testResults.analysis.passCount}/${testResults.analysis.testCount} passed`);
    console.log(`  Duration: ${testResults.analysis.duration}ms`);
    
    if (testResults.success) {
      // 5D-Consensus Agent: Request production deployment approval
      console.log('🤝 5D-Consensus Agent: Requesting production deployment approval...');
      const consensus = await ciAgents.consensus.triggerConsensusPipeline({
        workflow: '.github/workflows/deploy-production.yml',
        approvals: 2,
      });
      
      const consensusResult = await ciAgents.consensus.waitForConsensus(consensus.id);
      
      if (consensusResult.approved) {
        console.log('✅ Production deployment approved by consensus');
      } else {
        console.log('❌ Production deployment not approved');
      }
    }
  } else {
    console.log('❌ Staging deployment failed');
  }
  
  await ciAdapter.disconnect();
}

/**
 * Example 3: Workflow Management
 */
export async function workflowManagementExample() {
  const ciAdapter = CIPipelineFactory.fromEnvironment();
  await ciAdapter.connect();
  
  // List all workflows
  const workflows = await ciAdapter.listWorkflows();
  console.log('Available workflows:');
  for (const workflow of workflows) {
    console.log(`  - ${workflow.name} (${workflow.path}) [${workflow.state}]`);
  }
  
  // Create a new workflow
  const newWorkflow = await ciAdapter.createWorkflow({
    name: 'Custom CI Pipeline',
    path: '.github/workflows/custom-ci.yml',
    content: `
name: Custom CI Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run custom tests
        run: npm test
    `,
    on: {
      push: { branches: ['main', 'develop'] },
      pull_request: { branches: ['main'] },
    },
  });
  
  console.log(`Created workflow: ${newWorkflow.id}`);
  
  await ciAdapter.disconnect();
}

/**
 * Example 4: Artifact Management
 */
export async function artifactManagementExample() {
  const ciAdapter = CIPipelineFactory.fromEnvironment();
  await ciAdapter.connect();
  
  // Trigger a build pipeline
  const run = await ciAdapter.triggerPipeline({
    workflow: '.github/workflows/build.yml',
    branch: 'main',
  });
  
  // Wait for completion
  await waitForPipeline(ciAdapter, run.id);
  
  // List artifacts
  const artifacts = await ciAdapter.listArtifacts(run.id);
  console.log(`Found ${artifacts.length} artifacts:`);
  
  for (const artifact of artifacts) {
    console.log(`  - ${artifact.name} (${artifact.size} bytes)`);
    
    // Download artifact
    const data = await ciAdapter.downloadArtifact(artifact.id);
    console.log(`    Downloaded ${data.length} bytes`);
  }
  
  await ciAdapter.disconnect();
}

// Run examples if executed directly
if (require.main === module) {
  (async () => {
    try {
      console.log('=== Basic Example ===');
      await basicExample();
      
      console.log('\n=== Agent Integration Example ===');
      await agentIntegrationExample();
      
      console.log('\n=== Workflow Management Example ===');
      await workflowManagementExample();
      
      console.log('\n=== Artifact Management Example ===');
      await artifactManagementExample();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })();
}
