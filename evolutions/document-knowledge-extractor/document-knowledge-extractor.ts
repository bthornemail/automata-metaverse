#!/usr/bin/env tsx
/**
 * Document Knowledge Extractor
 * 
 * Extracts facts, rules, agents, functions, and relationships from markdown documentation
 * Extends Obsidian Frontmatter Knowledge Model with content extraction
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { ObsidianFrontmatterKnowledgeModel } from '../obsidian-frontmatter-knowledge-model/obsidian-frontmatter-knowledge-model';
import {
  KnowledgeBaseManager,
  Fact,
  Rule,
  AgentDefinition,
  FunctionDefinition,
  Relationship
} from './knowledge-base';

interface ExtractedContent {
  frontmatter: any;
  body: string;
  filePath: string;
}

/**
 * Document Knowledge Extractor
 */
export class DocumentKnowledgeExtractor {
  private knowledgeBase: KnowledgeBaseManager;
  private obsidianModel: ObsidianFrontmatterKnowledgeModel;
  private docsPath: string;

  constructor(docsPath: string) {
    this.docsPath = docsPath;
    this.knowledgeBase = new KnowledgeBaseManager();
    this.obsidianModel = new ObsidianFrontmatterKnowledgeModel(docsPath);
  }

  /**
   * Extract knowledge from all documents
   */
  async extractAll(): Promise<void> {
    console.log(`📚 Extracting knowledge from: ${this.docsPath}`);
    
    // First build Obsidian knowledge graph
    await this.obsidianModel.buildKnowledgeGraph();
    
    // Find all markdown files
    const files = this.findAllMarkdownFiles(this.docsPath);
    console.log(`   Found ${files.length} markdown files`);
    
    // Extract from each file
    for (const file of files) {
      await this.extractFromFile(file);
    }
    
    // Extract from root files (AGENTS.md, etc.)
    const rootFiles = [
      path.join(path.dirname(this.docsPath), 'AGENTS.md'),
      path.join(path.dirname(this.docsPath), 'README.md')
    ];
    
    for (const file of rootFiles) {
      if (fs.existsSync(file)) {
        await this.extractFromFile(file);
      }
    }
    
    console.log(`✅ Extraction complete:`);
    console.log(`   Facts: ${this.knowledgeBase.getKnowledgeBase().facts.length}`);
    console.log(`   Rules: ${this.knowledgeBase.getKnowledgeBase().rules.length}`);
    console.log(`   Agents: ${this.knowledgeBase.getKnowledgeBase().agents.length}`);
    console.log(`   Functions: ${this.knowledgeBase.getKnowledgeBase().functions.length}`);
    console.log(`   Relationships: ${this.knowledgeBase.getKnowledgeBase().relationships.length}`);
  }

  /**
   * Extract knowledge from a single file
   */
  private async extractFromFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const extracted = this.parseMarkdown(filePath, content);
      
      if (!extracted) return;
      
      // Extract RFC2119 rules
      this.extractRFC2119Rules(extracted);
      
      // Extract agent definitions
      this.extractAgentDefinitions(extracted);
      
      // Extract function definitions
      this.extractFunctionDefinitions(extracted);
      
      // Extract code examples
      this.extractCodeExamples(extracted);
      
      // Extract relationships from frontmatter
      this.extractFrontmatterRelationships(extracted);
      
    } catch (error) {
      console.warn(`⚠️  Failed to extract from ${filePath}:`, error);
    }
  }

  /**
   * Parse markdown file
   */
  private parseMarkdown(filePath: string, content: string): ExtractedContent | null {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (frontmatterMatch) {
      try {
        const frontmatterYaml = frontmatterMatch[1];
        const body = frontmatterMatch[2] || '';
        
        // Debug: Check YAML parsing for AGENTS.md (only if needed)
        // if (filePath.includes('AGENTS.md')) {
        //   console.log(`🔍 Debug: Parsing AGENTS.md frontmatter...`);
        //   console.log(`   Frontmatter length: ${frontmatterYaml.length} chars`);
        // }
        
        let frontmatter: any;
        try {
          if (!frontmatterYaml) {
            return { frontmatter: null, body: content, filePath };
          }
          frontmatter = yaml.load(frontmatterYaml, {
            schema: yaml.DEFAULT_SCHEMA,
            onWarning: (warning: any) => {
              if (filePath.includes('AGENTS.md')) {
                console.warn(`⚠️  YAML warning in ${filePath}:`, warning);
              }
            }
          }) as any;
          
          // Workaround: If agentTypes is missing but should be there, try parsing it separately
          if (filePath.includes('AGENTS.md') && !frontmatter?.agentTypes && frontmatterYaml && frontmatterYaml.includes('agentTypes:')) {
            console.log(`⚠️  agentTypes missing from parsed frontmatter, attempting workaround...`);
            // Extract agentTypes section manually by finding the section and parsing it
            const lines = frontmatterYaml.split('\n');
            let agentTypesStart = -1;
            let agentTypesEnd = lines.length;
            
            // Find where agentTypes starts
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              if (!line) continue;
              if (line.trim() === 'agentTypes:' || line.trim().startsWith('agentTypes:')) {
                agentTypesStart = i;
                break;
              }
            }
            
            // Find where agentTypes ends (next root-level key or end of file)
            if (agentTypesStart >= 0) {
              for (let i = agentTypesStart + 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line) continue;
                // Check if this is a root-level key (no indentation or same level as agentTypes)
                if (line.trim() && !line.startsWith(' ') && line.includes(':')) {
                  agentTypesEnd = i;
                  break;
                }
              }
              
              // Extract and parse agentTypes section
              const agentTypesLines = lines.slice(agentTypesStart, agentTypesEnd);
              const agentTypesYaml = agentTypesLines.join('\n');
              
              try {
                const agentTypesParsed = yaml.load(agentTypesYaml) as any;
                if (agentTypesParsed?.agentTypes) {
                  frontmatter.agentTypes = agentTypesParsed.agentTypes;
                  console.log(`✅ Successfully extracted agentTypes via workaround (${Object.keys(agentTypesParsed.agentTypes).length} groups)`);
                }
              } catch (e) {
                console.warn(`⚠️  Failed to parse agentTypes separately:`, e);
              }
            }
          }
        } catch (parseError: any) {
          // If parsing fails, try to extract what we can
          // Only log errors for important files or if verbose mode
          if (filePath.includes('AGENTS.md') || process.env.VERBOSE === 'true') {
            console.warn(`⚠️  YAML parse error in ${filePath}:`, parseError.message || parseError.reason);
          }
          
          // Try parsing just the first part (before the error)
          if (!frontmatterYaml) {
            return { frontmatter: null, body: content, filePath };
          }
          const lines = frontmatterYaml.split('\n');
          const errorLine = parseError.mark?.line || lines.length;
          
          // Try parsing up to the error line
          for (let i = Math.min(errorLine - 1, lines.length); i > 0; i--) {
            try {
              const partialYaml = lines.slice(0, i).join('\n');
              frontmatter = yaml.load(partialYaml) as any;
              if (Object.keys(frontmatter || {}).length > 0) {
                // Successfully parsed at least some frontmatter
                break;
              }
            } catch (e) {
              // Continue trying shorter sections
            }
          }
          
          // If still no frontmatter, use empty object
          if (!frontmatter) {
            frontmatter = {};
          }
        }
        
        // Debug: Check parsed frontmatter (only if needed)
        // if (filePath.includes('AGENTS.md')) {
        //   console.log(`   Parsed frontmatter keys: ${Object.keys(frontmatter || {}).join(', ')}`);
        //   console.log(`   Has agentTypes: ${!!frontmatter?.agentTypes}`);
        // }
        
        return { frontmatter, body, filePath };
      } catch (error) {
        // Log error for AGENTS.md to debug
        if (filePath.includes('AGENTS.md')) {
          console.error(`❌ YAML parsing error in ${filePath}:`, error);
        }
        // No frontmatter, treat entire content as body
        return { frontmatter: {}, body: content, filePath };
      }
    } else {
      // No frontmatter, treat entire content as body
      return { frontmatter: {}, body: content, filePath };
    }
  }

  /**
   * Extract RFC2119 rules (MUST, SHOULD, MAY, etc.)
   */
  private extractRFC2119Rules(extracted: ExtractedContent): void {
    const rfc2119Keywords = ['MUST', 'SHOULD', 'MAY', 'MUST NOT', 'SHOULD NOT', 'REQUIRED', 'RECOMMENDED', 'OPTIONAL'];
    const lines = extracted.body.split('\n');
    
    lines.forEach((line, index) => {
      for (const keyword of rfc2119Keywords) {
        // Match patterns like "MUST implement", "SHOULD use", etc.
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(line)) {
          // Extract the rule statement
          const match = line.match(new RegExp(`\\b${keyword}\\b[^.!?]*[.!?]`, 'i'));
          if (match) {
            const statement = match[0].trim();
            const context = this.extractContext(lines, index, 3);
            
            // Map keywords to standard RFC2119 keywords
            let rfc2119Keyword: Rule['rfc2119Keyword'] = 'MUST';
            if (keyword.toUpperCase() === 'SHOULD' || keyword.toUpperCase() === 'RECOMMENDED') {
              rfc2119Keyword = 'SHOULD';
            } else if (keyword.toUpperCase() === 'MAY' || keyword.toUpperCase() === 'OPTIONAL') {
              rfc2119Keyword = 'MAY';
            } else if (keyword.toUpperCase() === 'MUST NOT' || keyword.toUpperCase() === 'REQUIRED') {
              rfc2119Keyword = 'MUST NOT';
            } else if (keyword.toUpperCase() === 'SHOULD NOT') {
              rfc2119Keyword = 'SHOULD NOT';
            }
            
            this.knowledgeBase.addRule({
              source: extracted.filePath,
              rfc2119Keyword,
              statement,
              context,
              lineNumber: index + 1
            });
          }
        }
      }
    });
  }

  /**
   * Extract agent definitions from AGENTS.md or other docs
   */
  private extractAgentDefinitions(extracted: ExtractedContent): void {
    // Look for agent definitions in AGENTS.md format
    if (extracted.filePath.includes('AGENTS.md') || extracted.body.includes('Agent')) {
      // Debug logging removed - workaround handles agentTypes extraction automatically
      
      // Extract from frontmatter agentTypes
      if (extracted.frontmatter?.agentTypes) {
        console.log(`📋 Extracting agents from frontmatter: ${extracted.filePath}`);
        const agentCountBefore = this.knowledgeBase.getKnowledgeBase().agents.length;
        this.extractAgentsFromFrontmatter(extracted);
        const agentCountAfter = this.knowledgeBase.getKnowledgeBase().agents.length;
        console.log(`   Extracted ${agentCountAfter - agentCountBefore} agents from frontmatter`);
      } else {
        console.log(`⚠️  No agentTypes in frontmatter for ${extracted.filePath}`);
      }
      
      // Extract from markdown sections
      this.extractAgentsFromMarkdown(extracted);
    }
  }

  /**
   * Extract agents from frontmatter
   */
  private extractAgentsFromFrontmatter(extracted: ExtractedContent): void {
    const agentTypes = extracted.frontmatter?.agentTypes;
    
    if (!agentTypes) {
      console.warn(`⚠️  No agentTypes found in frontmatter for ${extracted.filePath}`);
      return;
    }
    
    const extractAgentGroup = (group: any, groupName: string) => {
      if (!group) return;
      
      // Handle both array and single object cases
      const agents = Array.isArray(group) ? group : [group];
      
      if (!Array.isArray(agents)) {
        console.warn(`⚠️  agentTypes.${groupName} is not an array in ${extracted.filePath}`);
        return;
      }
      
      agents.forEach((agent: any) => {
        if (!agent) return;
        
        const agentDef: Omit<AgentDefinition, 'id'> = {
          name: agent.id || agent.name || 'Unknown',
          dimension: agent.dimension,
          purpose: agent.purpose || '',
          capabilities: Array.isArray(agent.capabilities) ? agent.capabilities : [],
          dependencies: Array.isArray(agent.dependencies) ? agent.dependencies : [],
          churchEncoding: agent.churchEncoding,
          requirements: agent.requirements ? (Array.isArray(agent.requirements) ? agent.requirements : [agent.requirements]) : [],
          ciIntegration: agent.ciIntegration,
          source: extracted.filePath,
          metadata: {
            group: groupName,
            ...agent
          }
        };
        
        this.knowledgeBase.addAgent(agentDef);
      });
    };
    
    // Extract all agent groups
    if (agentTypes.foundationAgents) {
      extractAgentGroup(agentTypes.foundationAgents, 'foundation');
    }
    if (agentTypes.operationalAgents) {
      extractAgentGroup(agentTypes.operationalAgents, 'operational');
    }
    if (agentTypes.advancedAgents) {
      extractAgentGroup(agentTypes.advancedAgents, 'advanced');
    }
    if (agentTypes.interfaceAgents) {
      extractAgentGroup(agentTypes.interfaceAgents, 'interface');
    }
    if (agentTypes.collaborativeAgents) {
      extractAgentGroup(agentTypes.collaborativeAgents, 'collaborative');
    }
    if (agentTypes.evolutionaryAgents) {
      extractAgentGroup(agentTypes.evolutionaryAgents, 'evolutionary');
    }
    if (agentTypes.opencodeAgent) {
      extractAgentGroup(agentTypes.opencodeAgent, 'opencode');
    }
  }

  /**
   * Extract agents from markdown content
   */
  private extractAgentsFromMarkdown(extracted: ExtractedContent): void {
    // Look for patterns like "### Agent Name" or "**Agent Name**"
    const agentPattern = /(?:^|\n)(?:#{1,4}\s+)?(\d+D-[\w-]+-Agent|[\w-]+-Agent)/g;
    const matches = Array.from(extracted.body.matchAll(agentPattern));
    
    matches.forEach(match => {
      const agentName = match[1];
      const startIndex = match.index!;
      const lines = extracted.body.split('\n');
      const lineIndex = extracted.body.substring(0, startIndex).split('\n').length - 1;
      
      // Extract purpose and capabilities from following lines
      let purpose = '';
      const capabilities: string[] = [];
      const dependencies: string[] = [];
      
      for (let i = lineIndex + 1; i < Math.min(lineIndex + 20, lines.length); i++) {
        const line = lines[i];
        if (!line) continue;
        
        if (line.match(/^#{1,4}\s/)) break; // Stop at next heading
        
        if (line.includes('Purpose:') || line.includes('purpose:')) {
          purpose = line.split(/[:\-]/).slice(1).join(':').trim();
        }
        
        if (line.includes('Capabilities:') || line.includes('capabilities:')) {
          const caps = line.split(/[:\-]/).slice(1).join(':').trim();
          capabilities.push(...caps.split(',').map(c => c.trim()));
        }
        
        if (line.includes('Dependencies:') || line.includes('dependencies:')) {
          const deps = line.split(/[:\-]/).slice(1).join(':').trim();
          dependencies.push(...deps.split(',').map(d => d.trim()));
        }
      }
      
      // Extract dimension from agent name
      const dimensionMatch = agentName?.match(/^(\d+D)/);
      const dimension = dimensionMatch ? dimensionMatch[1] : undefined;
      
      if (!agentName) return;
      this.knowledgeBase.addAgent({
        name: agentName,
        dimension,
        purpose: purpose || `Agent for ${agentName}`,
        capabilities,
        dependencies,
        source: extracted.filePath,
        metadata: {
          lineNumber: lineIndex + 1
        }
      });
    });
  }

  /**
   * Extract function definitions (R5RS functions, etc.)
   */
  private extractFunctionDefinitions(extracted: ExtractedContent): void {
    // Look for R5RS function patterns: r5rs:function-name
    const r5rsPattern = /r5rs:([\w-]+)/g;
    const matches = Array.from(extracted.body.matchAll(r5rsPattern));
    
    const functions = new Set<string>();
    matches.forEach(match => {
      if (match[1]) {
        functions.add(match[1]);
      }
    });
    
    functions.forEach(funcName => {
      // Try to find function description
      const funcPattern = new RegExp(`(?:^|\\n).*${funcName}[^\\n]*`, 'gi');
      const funcMatches = Array.from(extracted.body.matchAll(funcPattern));
      
      let description = '';
      const examples: string[] = [];
      
      funcMatches.forEach(match => {
        const line = match[0];
        if (line.includes('Purpose:') || line.includes('description:')) {
          description = line.split(/[:\-]/).slice(1).join(':').trim();
        }
      });
      
      // Extract code examples containing this function
      const codeBlocks = this.extractCodeBlocks(extracted.body);
      codeBlocks.forEach(block => {
        if (block.code.includes(funcName)) {
          examples.push(block.code);
        }
      });
      
      this.knowledgeBase.addFunction({
        name: `r5rs:${funcName}`,
        description: description || `R5RS function: ${funcName}`,
        examples,
        source: extracted.filePath,
        metadata: {}
      });
    });
    
    // Extract function signatures from code blocks
    const codeBlocks = this.extractCodeBlocks(extracted.body);
    codeBlocks.forEach(block => {
      // Look for function signatures
      const signaturePattern = /(?:function|const|let)\s+([\w-]+)\s*[=:]?\s*(?:\([^)]*\)|async\s*\([^)]*\))/g;
      const sigMatches = Array.from(block.code.matchAll(signaturePattern));
      
      sigMatches.forEach(match => {
        const funcName = match[1];
        const signature = match[0];
        if (!funcName || !signature) return;
        
        this.knowledgeBase.addFunction({
          name: funcName,
          signature,
          description: `Function from ${extracted.filePath}`,
          examples: [block.code],
          source: extracted.filePath,
          metadata: {
            language: block.language
          }
        });
      });
    });
  }

  /**
   * Extract code examples
   */
  private extractCodeExamples(extracted: ExtractedContent): void {
    const codeBlocks = this.extractCodeBlocks(extracted.body);
    
    codeBlocks.forEach((block, index) => {
      this.knowledgeBase.addFact({
        source: extracted.filePath,
        content: block.code,
        type: 'example',
        metadata: {
          language: block.language,
          blockIndex: index
        }
      });
    });
  }

  /**
   * Extract code blocks from markdown
   */
  private extractCodeBlocks(content: string): Array<{ code: string; language: string }> {
    const blocks: Array<{ code: string; language: string }> = [];
    
    // Match code blocks: ```language\ncode\n```
    const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g;
    const matches = Array.from(content.matchAll(codeBlockPattern));
    
    matches.forEach(match => {
      const language = match[1] || 'text';
      const code = match[2];
      if (!code) return;
      blocks.push({
        language,
        code
      });
    });
    
    return blocks;
  }

  /**
   * Extract relationships from frontmatter
   */
  private extractFrontmatterRelationships(extracted: ExtractedContent): void {
    const frontmatter = extracted.frontmatter;
    if (!frontmatter || !frontmatter.id) return;
    
    const sourceId = frontmatter.id;
    
    // Extract prerequisites
    if (Array.isArray(frontmatter.prerequisites)) {
      frontmatter.prerequisites.forEach((prereq: string) => {
        this.knowledgeBase.addRelationship({
          from: sourceId,
          to: prereq,
          type: 'prerequisite',
          source: extracted.filePath
        });
      });
    }
    
    // Extract enables
    if (Array.isArray(frontmatter.enables)) {
      frontmatter.enables.forEach((enable: string) => {
        this.knowledgeBase.addRelationship({
          from: sourceId,
          to: enable,
          type: 'enables',
          source: extracted.filePath
        });
      });
    }
    
    // Extract related
    if (Array.isArray(frontmatter.related)) {
      frontmatter.related.forEach((related: string) => {
        this.knowledgeBase.addRelationship({
          from: sourceId,
          to: related,
          type: 'related',
          source: extracted.filePath
        });
      });
    }
  }

  /**
   * Extract context around a line
   */
  private extractContext(lines: string[], lineIndex: number, contextLines: number): string {
    const start = Math.max(0, lineIndex - contextLines);
    const end = Math.min(lines.length, lineIndex + contextLines + 1);
    return lines.slice(start, end).join('\n');
  }

  /**
   * Find all markdown files recursively
   */
  private findAllMarkdownFiles(dir: string): string[] {
    const files: string[] = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules and other common directories
          if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
            files.push(...this.findAllMarkdownFiles(fullPath));
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Failed to read directory ${dir}:`, error);
    }
    
    return files;
  }

  /**
   * Get knowledge base
   */
  getKnowledgeBase(): KnowledgeBaseManager {
    return this.knowledgeBase;
  }
}
