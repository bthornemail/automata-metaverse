# AGENTS.md File Index

This document provides a map of all AGENTS.md files in the project and what each one covers.

## Purpose

AGENTS.md files provide context and instructions for AI coding agents (like Claude Code, GitHub Copilot, Cursor, etc.) to work effectively with different parts of the codebase.

## File Locations

### 1. Root Vault Level
**Location**: `/home/main/universal-life-vault/AGENTS.md`

**Audience**: AI agents working with vault content (documents, knowledge graph)

**Contents**:
- Vault structure overview
- Epistemic node format (frontmatter schema)
- Knowledge levels and document types
- Reading/updating documents (Python & JavaScript examples)
- Building knowledge graphs
- Canvas integration
- Content processing patterns
- Validation patterns
- Best practices for content agents

**When to read**: Working with vault documents, analyzing knowledge graph, processing content

---

### 2. Plugin Root Level
**Location**: `.obsidian/plugins/universal-life-protocol-plugin/AGENTS.md`

**Audience**: AI agents developing the Obsidian plugin

**Contents**:
- Plugin architecture overview
- Development environment setup
- Build commands and workflows
- Code style guidelines
- Testing instructions
- Working with frontmatter
- Working with canvas
- Common patterns
- Security considerations
- Performance tips
- PR instructions

**When to read**: Developing plugin features, fixing bugs, integrating with Obsidian API

---

### 3. Blackboard Core Level
**Location**: `.obsidian/plugins/universal-life-protocol-plugin/src/blackboard/AGENTS.md`

**Audience**: AI agents working on blackboard core architecture

**Contents**:
- Blackboard architecture deep dive
- Understanding types.ts
- Understanding Blackboard.ts
- Understanding BlackboardManager.ts
- Common modifications (adding fields, changing logic)
- Development patterns
- Testing changes
- Performance considerations
- Debugging techniques

**When to read**: Modifying blackboard core, adding new capabilities, optimizing performance

---

### 4. Agents Directory Level
**Location**: `.obsidian/plugins/universal-life-protocol-plugin/src/agents/AGENTS.md`

**Audience**: AI agents creating or modifying blackboard agents

**Contents**:
- Agent concept and architecture
- Step-by-step agent creation guide
- Agent priority system
- Common agent patterns (analyzers, validators, relationship builders)
- Working with blackboard API
- Logging and debugging
- Testing agents
- 15+ agent ideas
- Best practices
- Performance considerations

**When to read**: Creating new agents, modifying existing agents, understanding agent system

---

## Quick Navigation

**I want to...**

### Work with Vault Content
→ Read `/AGENTS.md` (vault root)
- Processing documents
- Building knowledge graphs
- Validating content

### Develop Plugin Features
→ Read `.obsidian/plugins/.../AGENTS.md` (plugin root)
- Adding commands
- Integrating with Obsidian
- Building and testing

### Modify Blackboard Core
→ Read `.obsidian/plugins/.../src/blackboard/AGENTS.md`
- Adding new capabilities
- Changing data structures
- Optimizing performance

### Create New Agents
→ Read `.obsidian/plugins/.../src/agents/AGENTS.md`
- Agent creation template
- Common patterns
- Testing approach

## File Hierarchy

```
universal-life-vault/
├── AGENTS.md                           # Vault-level (content processing)
└── .obsidian/plugins/universal-life-protocol-plugin/
    ├── AGENTS.md                       # Plugin-level (development)
    ├── src/
    │   ├── blackboard/
    │   │   └── AGENTS.md              # Blackboard core
    │   └── agents/
    │       └── AGENTS.md              # Agent development
    └── [documentation files]
```

## Reading Order for New Contributors

### If you're new to the project:

1. **Start here**: `universal-life-vault/AGENTS.md`
   - Understand the vault structure
   - Learn about epistemic nodes
   - See content examples

2. **Then read**: `.obsidian/plugins/.../AGENTS.md`
   - Understand plugin architecture
   - Learn development workflow
   - See code style guidelines

3. **Deep dive**: `.obsidian/plugins/.../src/blackboard/AGENTS.md`
   - Understand blackboard pattern
   - Learn core APIs
   - See data flow

4. **Specialize**: `.obsidian/plugins/.../src/agents/AGENTS.md`
   - Create your first agent
   - Follow patterns
   - Test thoroughly

### If you're experienced:

Jump directly to the relevant AGENTS.md for your task.

## Additional Documentation

Besides AGENTS.md files, also read:

### Plugin Documentation
- `BLACKBOARD_ARCHITECTURE_GUIDE.md` - Complete architectural guide
- `QUICKSTART_BLACKBOARD.md` - Integration instructions
- `EXAMPLE_WORKFLOW.md` - Real-world scenarios
- `IMPLEMENTATION_SUMMARY.md` - High-level overview

### Vault Documentation
- `EPISTEMIC_NODE_CONVERSION_SUMMARY.md` - Frontmatter conversion history
- `thesis/` - Academic foundation
- `architecture/` - System design documents

## Contributing New AGENTS.md Files

If you create a new subsystem that would benefit from AI agent instructions:

1. **Create** `AGENTS.md` in the relevant directory
2. **Include**:
   - Overview of the subsystem
   - Common operations
   - Code examples
   - Best practices
   - Testing approach
3. **Update** this index file
4. **Link** from parent AGENTS.md if appropriate

## Templates

### Minimal AGENTS.md Template

```markdown
# [Component Name] - Agent Instructions

## Overview
Brief description of what this component does.

## Common Operations
Examples of common tasks.

## Best Practices
Guidelines for working with this component.

## Testing
How to test changes.

## Questions?
Where to get help.
```

### Full AGENTS.md Template

See any existing AGENTS.md file for structure.

## Maintenance

These AGENTS.md files should be updated when:
- Architecture changes
- New patterns emerge
- Common issues are discovered
- Development workflow changes
- New tools are added

Keep them concise but comprehensive!

---

**Last Updated**: January 2025
