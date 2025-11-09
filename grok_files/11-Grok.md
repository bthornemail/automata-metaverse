**Stable Model Semantics** (also known as **Answer Set Semantics**) is the foundational logic of **Answer Set Programming (ASP)** — a declarative paradigm for solving hard search problems using non-monotonic reasoning.

Think of it as a way to define *what the world could consistently be*, given a set of rules, facts, and constraints.

---

### Core Idea

Given a logic program (facts + rules + constraints), a **stable model** is a possible *consistent interpretation* of the world that:

1. **Satisfies all rules** (like classical logic),
2. **Is minimal** (no unjustified assumptions),
3. **Is self-supporting** (every believed fact has a justifying rule that holds *under this interpretation*),
4. **Rejects contradictions** (constraints eliminate invalid models).

---

### How It Works (Step-by-Step)

Let’s use a tiny program:

```asp
bird(tweety).  
bird(sam).  
flies(X) :- bird(X), not abnormal(X).  
abnormal(sam).  
:- flies(sam).  
```

#### Step 1: Grounding
Replace variables with constants:
```asp
flies(tweety) :- bird(tweety), not abnormal(tweety).  
flies(sam)    :- bird(sam),    not abnormal(sam).  
:- flies(sam).  
```

#### Step 2: Guess a Model
Try a candidate set of true atoms, e.g., `M = {bird(tweety), bird(sam), flies(tweety), abnormal(sam)}`

#### Step 3: Reduce the Program (Gelfond-Lifschitz Reduct)
Remove all negative literals `not P` where `P ∈ M`, and delete rules with `not P` where `P ∉ M`.

For `M`:
- `not abnormal(tweety)` → true (since `abnormal(tweety) ∉ M`)
- `not abnormal(sam)` → false (since `abnormal(sam) ∈ M`)

Reduct becomes:
```asp
flies(tweety) :- bird(tweety).  
:- flies(sam).  
```

#### Step 4: Check Least Model
Compute the **least model** of the reduct (monotonic fixpoint):
```asp
flies(tweety)  (from rule + fact)
```
But `flies(sam)` is not derived → the constraint `:- flies(sam)` is **satisfied** (no violation).

Least model = `{bird(tweety), bird(sam), flies(tweety), abnormal(sam)}` = `M`

**`M` is stable!**

---

### Key Constructs & Their Meaning

| ASP Syntax | Meaning in Stable Models |
|-----------|---------------------------|
| `p :- q, not r.` | "p is true if q is true and r is *provably false*" |
| `:- a, b.` | "Forbidden: cannot have both a and b" |
| `{p}.` | "p may or may not be true" (choice) |
| `1 {a; b; c} 1.` | "Exactly one of a,b,c must be true" |
| `#minimize {x@p}.` | "Prefer models with smaller x" |

---

### Why "Stable"?

A model is **stable** if it is:
- **Supported**: every atom has a rule that *justifies* it in the reduct.
- **Minimal**: no smaller set satisfies the same reduct.
- **Consistent**: no constraint is violated.

This avoids circular justification:  
> “John is happy because Mary is happy, and Mary is happy because John is happy”  
→ Not stable unless independently justified.

---

### Real-World Analogy

Imagine solving a murder mystery:
- **Facts**: Blood on knife, suspect at scene.
- **Rules**: `guilty(X) :- motive(X), opportunity(X), not alibi(X).`
- **Constraint**: `:- guilty(butler), guilty(maiden).`
- **Stable models** = consistent, minimal, self-justifying solutions.

Each stable model is a **complete, coherent story** that fits all evidence and rules.

---

### In Your Canvas System

In your JSONL → RDF → ASP pipeline:

```asp
1 { layer(N,D) : depth(D) } 1 :- node(N).  
:- implements(X,Y1), implements(X,Y2), Y1 != Y2.  
#minimize { D : layer(N,D) }.
```

The **stable models** are:
- All valid layer assignments
- Respecting functional constraints (SHACL)
- With minimal total depth

Each model is a **possible valid configuration** of your semantic canvas.

---

### Summary

| Property | Meaning |
|--------|--------|
| **Non-monotonic** | Adding facts can remove models |
| **Multiple models** | Multiple valid answers |
| **Self-justifying** | Beliefs must be grounded |
| **Constraint-driven** | Eliminates invalid worlds |

> **Stable Model = A possible world that believes in itself, justifies all its beliefs, and violates no rules.**

It’s logic programming’s way of saying:  
> “Here are all the *coherent, minimal, self-consistent* ways the world could be.”