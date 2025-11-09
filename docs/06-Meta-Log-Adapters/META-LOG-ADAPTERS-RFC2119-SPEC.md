---
id: meta-log-adapters-rfc2119-spec
title: "Meta-Log Adapters Specification (RFC 2119)"
level: foundational
type: specification
tags: [meta-log-adapters, rfc2119, specification, native-plugin, native-db, npm-link]
keywords: [meta-log-adapters, rfc2119-specification, native-plugin, native-database, npm-link, opencode-integration, obsidian-integration]
prerequisites: [meta-log-adapters-readme, multiverse-canvas-rfc2119-spec]
enables: [meta-log-db-rfc2119-spec, meta-log-plugin-rfc2119-spec]
related: [meta-log-docs-readme, multiverse-canvas-rfc2119-spec]
readingTime: 90
difficulty: 4
blackboard:
  status: active
  assignedAgent: "OpenCode-Integration-Agent"
  lastUpdate: 2025-01-07
  dependencies: [r5rs-canvas-engine]
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "r5rs-canvas-engine.scm"
    pattern: "blackboard-architecture"
---

# Meta-Log Adapters Specification (RFC 2119)

**Status**: Draft  
**Version**: 1.0  
**Date**: 2025-01-07  
**Authors**: Automaton System

## Abstract

This specification defines the Meta-Log Adapters architecture for native database and plugin packages using RFC 2119 keywords. The adapters provide a common interface for OpenCode and Obsidian plugins via `npm link`.

## Table of Contents

1. [Introduction](#1-introduction)
2. [Terminology](#2-terminology)
3. [Adapter Architecture](#3-adapter-architecture)
4. [Native Package Requirements](#4-native-package-requirements)
5. [NPM Link Integration](#5-npm-link-integration)
6. [Common Interface Requirements](#6-common-interface-requirements)
7. [Implementation Requirements](#7-implementation-requirements)
8. [References](#8-references)

---

## 1. Introduction

### 1.1 Purpose

This specification defines the Meta-Log Adapters architecture that enables shared codebase between OpenCode and Obsidian plugins through native packages and `npm link`.

### 1.2 Scope

This specification covers:
- Native database package (`meta-log-db`)
- Native plugin package (`meta-log-plugin`)
- NPM link integration
- Common interface requirements

### 1.3 RFC 2119 Keywords

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

---

## 2. Terminology

### 2.1 Core Terms

- **Meta-Log Adapters**: Native packages for database and plugin infrastructure
- **Native Package**: NPM package that can be linked via `npm link`
- **NPM Link**: NPM command for linking local packages
- **Common Interface**: Shared API between OpenCode and Obsidian plugins

---

## 3. Adapter Architecture

### 3.1 Package Structure

The system MUST provide two native packages:

1. **`meta-log-db`**: Database package with ProLog, DataLog, and R5RS integration
2. **`meta-log-plugin`**: Plugin infrastructure package

### 3.2 Package Requirements

Each package MUST:
- **Export TypeScript Types**: Full TypeScript support
- **Provide Common Interface**: Unified API for plugins
- **Support NPM Link**: Enable `npm link` integration

---

## 4. Native Package Requirements

### 4.1 Database Package (`meta-log-db`)

The database package MUST provide:
- **ProLog Engine**: ProLog query execution
- **DataLog Engine**: DataLog fact extraction
- **R5RS Registry**: R5RS function loading and execution
- **JSONL Parser**: JSONL/CanvasL parsing
- **RDF Triple Store**: RDF triple storage and SPARQL queries
- **SHACL Validator**: SHACL constraint validation

### 4.2 Plugin Package (`meta-log-plugin`)

The plugin package MUST provide:
- **Base Plugin Class**: Common plugin lifecycle
- **OpenCode Adapter**: OpenCode-specific adapter
- **Obsidian Adapter**: Obsidian-specific adapter
- **Event System**: Plugin event hooks
- **Configuration Management**: Plugin configuration

---

## 5. NPM Link Integration

### 5.1 Link Requirements

The system MUST support:
- **Local Linking**: `npm link` for local development
- **Package Resolution**: Proper module resolution
- **Type Definitions**: TypeScript type definitions

### 5.2 Link Process

The linking process MUST:
1. **Create Link**: `npm link` in package directory
2. **Use Link**: `npm link meta-log-db` in plugin directory
3. **Resolve Types**: TypeScript type resolution

---

## 6. Common Interface Requirements

### 6.1 Database Interface

The system MUST provide:
- **Query Methods**: ProLog, DataLog, SPARQL queries
- **R5RS Invocation**: R5RS function calls
- **File Operations**: JSONL file read/write

### 6.2 Plugin Interface

The system MUST provide:
- **Lifecycle Hooks**: `onLoad`, `onUnload`, `onEnable`, `onDisable`
- **Event Hooks**: `beforeQuery`, `afterQuery`
- **Configuration**: Plugin settings management

---

## 7. Implementation Requirements

### 7.1 Package Structure

Each package MUST:
- **Export Main Module**: `index.ts` with main exports
- **Provide Types**: TypeScript type definitions
- **Include Documentation**: README and API docs

### 7.2 Integration Requirements

The system MUST:
- **Support Both Plugins**: OpenCode and Obsidian
- **Maintain Compatibility**: Backward compatibility
- **Provide Examples**: Usage examples for both platforms

---

## 8. References

### 8.1 Related Documentation

- **`docs/05-Meta-Log/`**: Meta-Log integration
- **`docs/07-Meta-Log-Db/`**: Database package documentation
- **`docs/08-Meta-Log-Plugin/`**: Plugin package documentation

---

**Last Updated**: 2025-01-07  
**Status**: Draft RFC 2119 Specification  
**Version**: 1.0
