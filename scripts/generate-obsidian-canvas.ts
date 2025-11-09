#!/usr/bin/env tsx
/**
 * Generate Obsidian Canvas from Knowledge Base
 * 
 * Creates a comprehensive canvas visualization of the knowledge base
 * as an Obsidian-compatible canvas file
 */

import * as fs from 'fs';
import * as path from 'path';
import { DocumentKnowledgeExtractor } from '../evolutions/document-knowledge-extractor/document-knowledge-extractor';

interface KnowledgeBase {
  facts: any[];
  rules: any[];
  agents: any[];
  functions: any[];
  relationships: any[];
  metadata: any;
}

interface CanvasNode {
  id: string;
  type: 'text' | 'file' | 'group';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  file?: string;
  color?: string;
  label?: string;
}

interface CanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: string;
  toSide?: string;
  label?: string;
  color?: string;
}

interface Canvas {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

function generateCanvas(knowledgeBase: KnowledgeBase, outputPath: string): void {
  const canvas: Canvas = {
    nodes: [],
    edges: []
  };

  let x = 0;
  let y = 0;
  const nodeWidth = 400;
  const nodeHeight = 200;
  const spacingX = 500;
  const spacingY = 300;
  const startX = -2000;
  const startY = -1500;

  // Color scheme
  const colors = {
    header: '6',      // Purple
    agent: '1',       // Red
    function: '2',    // Orange
    fact: '3',       // Yellow
    rule: '4',       // Green
    relationship: '5' // Cyan
  };

  // Header
  const headerId = 'header-knowledge-base';
  canvas.nodes.push({
    id: headerId,
    type: 'text',
    x: startX,
    y: startY - 400,
    width: 2000,
    height: 300,
    color: colors.header,
    text: `# Universal Life Vault Knowledge Base\n\n**Extracted**: ${new Date().toLocaleString()}\n\n**Statistics**:\n- Facts: ${knowledgeBase.facts.length}\n- Rules: ${knowledgeBase.rules.length}\n- Agents: ${knowledgeBase.agents.length}\n- Functions: ${knowledgeBase.functions.length}\n- Relationships: ${knowledgeBase.relationships.length}\n\n**Source**: ${knowledgeBase.metadata.sources.length} documents`
  });

  // Agents Section
  x = startX;
  y = startY;
  const agentsGroupId = 'group-agents';
  canvas.nodes.push({
    id: agentsGroupId,
    type: 'group',
    x: x - 100,
    y: y - 100,
    width: 2400,
    height: Math.max(400, knowledgeBase.agents.length * 250 + 200),
    color: colors.agent,
    label: 'Agents'
  });

  const agentsHeaderId = 'header-agents';
  canvas.nodes.push({
    id: agentsHeaderId,
    type: 'text',
    x: x,
    y: y,
    width: 2200,
    height: 150,
    color: colors.agent,
    text: `## Agents (${knowledgeBase.agents.length})\n\nMulti-agent system components`
  });
  canvas.edges.push({
    id: 'edge-header-to-agents',
    fromNode: headerId,
    toNode: agentsHeaderId,
    label: 'Contains'
  });

  y += 200;
  knowledgeBase.agents.forEach((agent, idx) => {
    const agentId = `agent-${agent.id || idx}`;
    canvas.nodes.push({
      id: agentId,
      type: 'text',
      x: x,
      y: y + idx * 250,
      width: nodeWidth,
      height: nodeHeight,
      color: colors.agent,
      text: `### ${agent.name}\n\n**Purpose**: ${agent.purpose}\n\n**Dimension**: ${agent.dimension || 'N/A'}\n\n**Capabilities**:\n${agent.capabilities?.slice(0, 3).map((c: string) => `- ${c}`).join('\n') || 'None'}\n\n**Dependencies**: ${agent.dependencies?.length || 0}`
    });
    canvas.edges.push({
      id: `edge-agents-header-to-${agentId}`,
      fromNode: agentsHeaderId,
      toNode: agentId,
      label: 'Contains'
    });
  });

  // Functions Section
  x = startX + 2500;
  y = startY;
  const functionsGroupId = 'group-functions';
  const functionsToShow = knowledgeBase.functions.slice(0, 20); // Limit to 20 for readability
  canvas.nodes.push({
    id: functionsGroupId,
    type: 'group',
    x: x - 100,
    y: y - 100,
    width: 2400,
    height: Math.max(400, functionsToShow.length * 200 + 200),
    color: colors.function,
    label: 'Functions'
  });

  const functionsHeaderId = 'header-functions';
  canvas.nodes.push({
    id: functionsHeaderId,
    type: 'text',
    x: x,
    y: y,
    width: 2200,
    height: 150,
    color: colors.function,
    text: `## Functions (${knowledgeBase.functions.length}, showing ${functionsToShow.length})\n\nR5RS and system functions`
  });
  canvas.edges.push({
    id: 'edge-header-to-functions',
    fromNode: headerId,
    toNode: functionsHeaderId,
    label: 'Contains'
  });

  y += 200;
  functionsToShow.forEach((func, idx) => {
    const funcId = `function-${func.id || idx}`;
    canvas.nodes.push({
      id: funcId,
      type: 'text',
      x: x,
      y: y + idx * 200,
      width: nodeWidth,
      height: 180,
      color: colors.function,
      text: `### ${func.name}\n\n**Module**: ${func.module || 'N/A'}\n\n**Description**: ${func.description?.substring(0, 100) || 'No description'}...\n\n**Examples**: ${func.examples?.length || 0}`
    });
    canvas.edges.push({
      id: `edge-functions-header-to-${funcId}`,
      fromNode: functionsHeaderId,
      toNode: funcId,
      label: 'Contains'
    });
  });

  // Key Facts Section
  x = startX;
  y = startY + Math.max(400, knowledgeBase.agents.length * 250) + 500;
  const factsGroupId = 'group-facts';
  const keyFacts = knowledgeBase.facts
    .filter(f => f.type === 'definition' || f.type === 'requirement')
    .slice(0, 15);
  
  canvas.nodes.push({
    id: factsGroupId,
    type: 'group',
    x: x - 100,
    y: y - 100,
    width: 2400,
    height: Math.max(400, keyFacts.length * 200 + 200),
    color: colors.fact,
    label: 'Key Facts'
  });

  const factsHeaderId = 'header-facts';
  canvas.nodes.push({
    id: factsHeaderId,
    type: 'text',
    x: x,
    y: y,
    width: 2200,
    height: 150,
    color: colors.fact,
    text: `## Key Facts (${knowledgeBase.facts.length} total, showing ${keyFacts.length})\n\nImportant definitions and requirements`
  });
  canvas.edges.push({
    id: 'edge-header-to-facts',
    fromNode: headerId,
    toNode: factsHeaderId,
    label: 'Contains'
  });

  y += 200;
  keyFacts.forEach((fact, idx) => {
    const factId = `fact-${fact.id || idx}`;
    const content = fact.content?.substring(0, 150) || 'No content';
    canvas.nodes.push({
      id: factId,
      type: 'text',
      x: x,
      y: y + idx * 200,
      width: nodeWidth,
      height: 180,
      color: colors.fact,
      text: `### ${fact.type.toUpperCase()}\n\n${content}...\n\n*Source: ${path.basename(fact.source)}*`
    });
    canvas.edges.push({
      id: `edge-facts-header-to-${factId}`,
      fromNode: factsHeaderId,
      toNode: factId,
      label: 'Contains'
    });
  });

  // Rules Section
  x = startX + 2500;
  y = startY + Math.max(400, knowledgeBase.functions.length * 200) + 500;
  const rulesGroupId = 'group-rules';
  const keyRules = knowledgeBase.rules.slice(0, 15);
  
  canvas.nodes.push({
    id: rulesGroupId,
    type: 'group',
    x: x - 100,
    y: y - 100,
    width: 2400,
    height: Math.max(400, keyRules.length * 200 + 200),
    color: colors.rule,
    label: 'Rules'
  });

  const rulesHeaderId = 'header-rules';
  canvas.nodes.push({
    id: rulesHeaderId,
    type: 'text',
    x: x,
    y: y,
    width: 2200,
    height: 150,
    color: colors.rule,
    text: `## RFC2119 Rules (${knowledgeBase.rules.length} total, showing ${keyRules.length})\n\nImplementation requirements and constraints`
  });
  canvas.edges.push({
    id: 'edge-header-to-rules',
    fromNode: headerId,
    toNode: rulesHeaderId,
    label: 'Contains'
  });

  y += 200;
  keyRules.forEach((rule, idx) => {
    const ruleId = `rule-${rule.id || idx}`;
    canvas.nodes.push({
      id: ruleId,
      type: 'text',
      x: x,
      y: y + idx * 200,
      width: nodeWidth,
      height: 180,
      color: colors.rule,
      text: `### ${rule.rfc2119Keyword}\n\n**Statement**: ${rule.statement?.substring(0, 120) || 'No statement'}...\n\n**Context**: ${rule.context?.substring(0, 50) || 'N/A'}...`
    });
    canvas.edges.push({
      id: `edge-rules-header-to-${ruleId}`,
      fromNode: rulesHeaderId,
      toNode: ruleId,
      label: 'Contains'
    });
  });

  // Relationships Section
  x = startX;
  y = y + Math.max(400, keyRules.length * 200) + 500;
  const relationshipsGroupId = 'group-relationships';
  const keyRelationships = knowledgeBase.relationships.slice(0, 20);
  
  canvas.nodes.push({
    id: relationshipsGroupId,
    type: 'group',
    x: x - 100,
    y: y - 100,
    width: 5000,
    height: 800,
    color: colors.relationship,
    label: 'Relationships'
  });

  const relationshipsHeaderId = 'header-relationships';
  canvas.nodes.push({
    id: relationshipsHeaderId,
    type: 'text',
    x: x,
    y: y,
    width: 4800,
    height: 150,
    color: colors.relationship,
    text: `## Relationships (${knowledgeBase.relationships.length} total, showing ${keyRelationships.length})\n\nKnowledge graph connections: prerequisites, enables, related, depends, uses, implements`
  });
  canvas.edges.push({
    id: 'edge-header-to-relationships',
    fromNode: headerId,
    toNode: relationshipsHeaderId,
    label: 'Contains'
  });

  // Create relationship nodes
  const relationshipNodes = new Map<string, string>();
  let relX = x;
  let relY = y + 200;
  const cols = 5;
  
  keyRelationships.forEach((rel, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    
    // Create from node if not exists
    if (!relationshipNodes.has(rel.from)) {
      const fromId = `rel-node-${rel.from}`;
      relationshipNodes.set(rel.from, fromId);
      canvas.nodes.push({
        id: fromId,
        type: 'text',
        x: relX + col * 900,
        y: relY + row * 250,
        width: 350,
        height: 120,
        color: colors.relationship,
        text: `**From**: ${rel.from.substring(0, 30)}...`
      });
    }
    
    // Create to node if not exists
    if (!relationshipNodes.has(rel.to)) {
      const toId = `rel-node-${rel.to}`;
      relationshipNodes.set(rel.to, toId);
      canvas.nodes.push({
        id: toId,
        type: 'text',
        x: relX + col * 900 + 400,
        y: relY + row * 250,
        width: 350,
        height: 120,
        color: colors.relationship,
        text: `**To**: ${rel.to.substring(0, 30)}...`
      });
    }
    
    // Create edge
    const fromNodeId = relationshipNodes.get(rel.from)!;
    const toNodeId = relationshipNodes.get(rel.to)!;
    canvas.edges.push({
      id: `rel-edge-${idx}`,
      fromNode: fromNodeId,
      toNode: toNodeId,
      label: rel.type,
      color: colors.relationship
    });
  });

  // Connect agents to their relationships
  knowledgeBase.agents.forEach((agent, idx) => {
    const agentId = `agent-${agent.id || idx}`;
    const agentRelationships = knowledgeBase.relationships.filter(
      r => r.from === agent.id || r.to === agent.id
    );
    
    agentRelationships.slice(0, 3).forEach((rel, relIdx) => {
      const targetId = rel.from === agent.id ? rel.to : rel.from;
      const targetNode = canvas.nodes.find(n => 
        n.id.includes(targetId) || 
        (n.text && n.text.includes(targetId.substring(0, 20)))
      );
      
      if (targetNode) {
        canvas.edges.push({
          id: `edge-agent-${agentId}-to-${targetNode.id}`,
          fromNode: agentId,
          toNode: targetNode.id,
          label: rel.type,
          color: colors.relationship
        });
      }
    });
  });

  // Write canvas file
  fs.writeFileSync(outputPath, JSON.stringify(canvas, null, 2));
  console.log(`✅ Canvas generated: ${outputPath}`);
  console.log(`   Nodes: ${canvas.nodes.length}`);
  console.log(`   Edges: ${canvas.edges.length}`);
}

// Main
async function main() {
  const docsPath = process.argv[2] || '/home/main/universal-life-vault';
  const outputPath = process.argv[3] || '/home/main/universal-life-vault/00-Canvas/Universal-Life-Vault-Knowledge-Base.canvas';

  console.log(`📚 Extracting knowledge from: ${docsPath}`);
  const extractor = new DocumentKnowledgeExtractor(docsPath);
  await extractor.extractAll();

  const knowledgeBaseManager = extractor.getKnowledgeBase();
  const knowledgeBase: KnowledgeBase = knowledgeBaseManager.getKnowledgeBase();

  console.log(`✅ Knowledge extracted:`);
  console.log(`   Facts: ${knowledgeBase.facts.length}`);
  console.log(`   Rules: ${knowledgeBase.rules.length}`);
  console.log(`   Agents: ${knowledgeBase.agents.length}`);
  console.log(`   Functions: ${knowledgeBase.functions.length}`);
  console.log(`   Relationships: ${knowledgeBase.relationships.length}`);

  generateCanvas(knowledgeBase, outputPath);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
