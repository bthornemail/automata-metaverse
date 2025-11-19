---
layout: default
title: API Reference
nav_order: 4
description: "Function and macro reference"
permalink: /API_REFERENCE
---

# meta-log API Reference

Complete API reference for meta-log package.

## Core Functions

### `meta-log-initialize` (function)

Initialize the meta-log system.

**Signature**: `(meta-log-initialize)`

**Description**: Sets up all engines and loads default configurations.

### `meta-log-ask` (function)

Ask a natural language question.

**Signature**: `(meta-log-ask question)`

**Arguments**:
- `question` (string): User's question

**Returns**: Human-readable answer string

**Example**:
```elisp
(meta-log-ask "What agents are in dimension 5D?")
```

## Prolog Functions

### `meta-log-prolog-query` (function)

Execute a Prolog query.

**Signature**: `(meta-log-prolog-query goal)`

**Arguments**:
- `goal` (list): Prolog goal, e.g., `'(node ?Id ?Type)`

**Returns**: List of binding sets (alists)

**Example**:
```elisp
(meta-log-prolog-query '(node ?Id ?Type))
```

### `meta-log-prolog-add-fact` (function)

Add a fact to Prolog database.

**Signature**: `(meta-log-prolog-add-fact predicate &rest args)`

**Example**:
```elisp
(meta-log-prolog-add-fact 'node 'node1 'text)
```

### `meta-log-prolog-add-rule` (function)

Add a rule to Prolog database.

**Signature**: `(meta-log-prolog-add-rule head &rest body)`

**Example**:
```elisp
(meta-log-prolog-add-rule '(inherits ?X ?Z)
                          '(vertical ?Y ?X)
                          '(inherits ?Y ?Z))
```

## Datalog Functions

### `meta-log-datalog-query` (function)

Execute a Datalog query.

**Signature**: `(meta-log-datalog-query goal)`

**Returns**: List of matching facts

### `meta-log-datalog-add-fact` (function)

Add a fact to Datalog database.

**Signature**: `(meta-log-datalog-add-fact predicate &rest args)`

### `meta-log-datalog-add-rule` (function)

Add a rule to Datalog database.

**Signature**: `(meta-log-datalog-add-rule head &rest body)`

## R5RS Functions

### `meta-log-r5rs-eval` (function)

Evaluate an R5RS expression.

**Signature**: `(meta-log-r5rs-eval expression)`

**Arguments**:
- `expression` (string): R5RS Scheme expression

**Returns**: Evaluation result

### `meta-log-r5rs-call` (function)

Call an R5RS function.

**Signature**: `(meta-log-r5rs-call function-name &rest args)`

**Example**:
```elisp
(meta-log-r5rs-call "r5rs:church-add" 2 3)
```

### `meta-log-r5rs-load-engine` (function)

Load R5RS engine from file.

**Signature**: `(meta-log-r5rs-load-engine path)`

## M-Expression Functions

### `meta-log-m-expr-eval` (function)

Evaluate an M-expression.

**Signature**: `(meta-log-m-expr-eval m-expr)`

**Arguments**:
- `m-expr` (string or list): M-expression string or parsed S-expression

**Returns**: Evaluation result

### `meta-log-m-to-s` (function)

Convert M-expression to S-expression.

**Signature**: `(meta-log-m-to-s m-expr)`

### `meta-log-s-to-m` (function)

Convert S-expression to M-expression string.

**Signature**: `(meta-log-s-to-m s-expr)`

## Org Mode Functions

### `meta-log-org-load-blackboard` (function)

Load Org file as blackboard.

**Signature**: `(meta-log-org-load-blackboard file)`

**Arguments**:
- `file` (string): Path to Org file

### `meta-log-org-extract-facts` (function)

Extract facts from Org AST.

**Signature**: `(meta-log-org-extract-facts ast)`

## Automata Functions

### `meta-log-load-automata` (function)

Load automata from automaton-evolutions.

**Signature**: `(meta-log-load-automata path)`

**Arguments**:
- `path` (string): Path to automaton-evolutions package

### `meta-log-find-evolutions-package` (function)

Find automaton-evolutions installation.

**Signature**: `(meta-log-find-evolutions-package)`

**Returns**: Path to package or nil

