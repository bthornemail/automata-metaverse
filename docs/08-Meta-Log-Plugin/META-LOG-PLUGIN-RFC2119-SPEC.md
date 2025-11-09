---
id: meta-log-plugin-rfc2119-spec
title: "Meta-Log Plugin Specification (RFC 2119)"
level: foundational
type: specification
tags: [meta-log-plugin, rfc2119, specification, native-plugin, opencode, obsidian]
keywords: [meta-log-plugin, rfc2119-specification, native-plugin, opencode-integration, obsidian-integration, lifecycle-management, plugin-hooks]
prerequisites: [meta-log-plugin-progress-readme, meta-log-adapters-rfc2119-spec]
enables: []
related: [meta-log-db-rfc2119-spec, meta-log-docs-readme]
readingTime: 90
difficulty: 4
blackboard:
  status: implemented
  assignedAgent: "OpenCode-Integration-Agent"
  lastUpdate: 2025-01-07
  dependencies: [meta-log-db]
  watchers: []
  r5rsEngine: "r5rs-canvas-engine.scm"
  selfBuilding:
    enabled: true
    source: "r5rs-canvas-engine.scm"
    pattern: "blackboard-architecture"
---

# Meta-Log Plugin Specification (RFC 2119)

**Status**: Draft  
**Version**: 1.0  
**Date**: 2025-01-07  
**Authors**: Automaton System

## Abstract

This specification defines the Meta-Log Plugin package implementation requirements using RFC 2119 keywords. The plugin provides common infrastructure for OpenCode and Obsidian plugins.

## Table of Contents

1. [Introduction](#1-introduction)
2. [Terminology](#2-terminology)
3. [Plugin Architecture](#3-plugin-architecture)
4. [Lifecycle Management](#4-lifecycle-management)
5. [Event System](#5-event-system)
6. [Adapter Requirements](#6-adapter-requirements)
7. [Implementation Requirements](#7-implementation-requirements)
8. [References](#8-references)

---

## 1. Introduction

### 1.1 Purpose

This specification defines the Meta-Log Plugin package that provides common plugin infrastructure for OpenCode and Obsidian plugins.

### 1.2 Scope

This specification covers:
- Base plugin class
- Lifecycle management
- Event system
- OpenCode adapter
- Obsidian adapter

### 1.3 RFC 2119 Keywords

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

---

## 2. Terminology

### 2.1 Core Terms

- **Base Plugin**: Common plugin base class
- **OpenCode Adapter**: OpenCode-specific adapter
- **Obsidian Adapter**: Obsidian-specific adapter
- **Lifecycle Hooks**: Plugin lifecycle callbacks
- **Event Hooks**: Plugin event callbacks

---

## 3. Plugin Architecture

### 3.1 Base Plugin Class

The system MUST provide `BaseMetaLogPlugin` class with:
- **Lifecycle Methods**: `onLoad`, `onUnload`, `onEnable`, `onDisable`
- **Event Methods**: `beforeQuery`, `afterQuery`
- **Configuration**: Plugin settings management

### 3.2 Plugin Interface

The plugin MUST support:
- **Initialization**: Plugin initialization
- **Configuration**: Plugin configuration
- **Event Handling**: Event hook registration

---

## 4. Lifecycle Management

### 4.1 Lifecycle Hooks

The system MUST provide:
- **`onLoad()`**: Called when plugin is loaded
- **`onUnload()`**: Called when plugin is unloaded
- **`onEnable()`**: Called when plugin is enabled
- **`onDisable()`**: Called when plugin is disabled

### 4.2 Lifecycle Requirements

The system MUST:
- **Call Hooks**: Call lifecycle hooks in order
- **Handle Errors**: Handle lifecycle errors gracefully
- **Maintain State**: Maintain plugin state across lifecycle

---

## 5. Event System

### 5.1 Event Hooks

The system MUST provide:
- **`beforeQuery()`**: Called before query execution
- **`afterQuery()`**: Called after query execution
- **Custom Events**: Support for custom events

### 5.2 Event Requirements

The system MUST:
- **Register Hooks**: Allow hook registration
- **Call Hooks**: Call hooks at appropriate times
- **Pass Context**: Pass context to hooks

---

## 6. Adapter Requirements

### 6.1 OpenCode Adapter

The system MUST provide `OpenCodeMetaLogPlugin` with:
- **Tool Registration**: Register OpenCode tools
- **Command Handling**: Handle OpenCode commands
- **Integration**: Integrate with OpenCode API

### 6.2 Obsidian Adapter

The system MUST provide `ObsidianMetaLogPlugin` with:
- **Settings Persistence**: Persist Obsidian settings
- **View Integration**: Integrate with Obsidian views
- **API Integration**: Integrate with Obsidian API

---

## 7. Implementation Requirements

### 7.1 Package Structure

The package MUST:
- **Export Base Class**: `BaseMetaLogPlugin` class
- **Export Adapters**: OpenCode and Obsidian adapters
- **Provide Types**: TypeScript type definitions

### 7.2 Integration Requirements

The system MUST:
- **Support NPM Link**: Enable `npm link` integration
- **Provide Examples**: Usage examples for both platforms
- **Maintain Compatibility**: Backward compatibility

---

## 8. References

### 8.1 Related Documentation

- **`docs/05-Meta-Log/`**: Meta-Log integration
- **`docs/06-Meta-Log-Adapters/`**: Adapter architecture
- **`docs/07-Meta-Log-Db/`**: Database package

---

**Last Updated**: 2025-01-07  
**Status**: Draft RFC 2119 Specification  
**Version**: 1.0
