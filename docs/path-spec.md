# Path Syntax Specification

> **Status:** Draft (v0.1 – 2025‑04‑29)
>
> This document defines the canonical lexical and semantic rules for *Structive* path strings such as `list.*.value` or `users.$1.name`.  All official tooling (parser, VS Code extension, ESLint rule set, etc.) **MUST** conform to this specification.

---

## 1  Scope and Goals

* Provide a **single source of truth** for what constitutes a legal path in Structive templates, state getters, and runtime APIs.
* Be **simple enough** to implement with a small hand‑written lexer (≈ 30 LOC).
* Guarantee that a single regular expression can unambiguously validate a path as either *accepted* or *illegal*.
* Reserve escape and quoting mechanisms for future Unicode / whitespace support without breaking existing code.

---

## 2  Lexical Grammar

```
path        ::= segment *( "." segment )
segment     ::= wildcard | indexToken | identifier | escapedChar
identifier  ::= [_A-Za-z] [_A-Za-z0-9-]*
wildcard    ::= "*"
indexToken  ::= "$" [1-9] [0-9]*        ; $1, $2, … (no leading zeros)
escapedChar ::= "\\" ( "." | "*" | "$" )
```

### 2.1  Token Table

| Token        | Regex pattern                   | Example      | Notes |
|--------------|---------------------------------|--------------|-------|
| **identifier** | `[A-Za-z_][A-Za-z0-9_-]*`        | `userName`   | Dash (`-`) allowed for CSS parity. |
| **wildcard**   | `\*`                            | `*`          | Matches exactly **one** segment when resolving. |
| **indexToken** | `\$[1-9][0-9]*`                 | `$2`         | Provided implicitly inside loop / event scopes. |
| **escapedChar**| `\\[.*$]`                      | `\.meta`    | Escapes reserved chars so they become part of identifier. |

> **Canonical Regex**  – the entire path string **MUST** match this expression:
>
> ```js
> /^(?:[*]|\$[1-9][0-9]*|[A-Za-z_][A-Za-z0-9_-]*|\\[.*$])(?:\.(?:[*]|\$[1-9][0-9]*|[A-Za-z_][A-Za-z0-9_-]*|\\[.*$]))*$/
> ```

---

## 3  Semantics

### 3.1  Wildcards (`*`)
* In a *for* block, `*` binds to the element currently iterated.
* Outside loops it designates **all** direct children of the parent segment.
* Nested wildcards are allowed (`regions.*.prefectures.*.name`).

### 3.2  Index Tokens (`$1`, `$2`, …)
* Valid **only inside** loop or event handler contexts that implicitly supply index values.
* `$1` is the first (outer‑most) loop index, `$2` the next inner, etc.
* Reading an index token outside a valid scope is a runtime error.

### 3.3  Escaped Characters (`\.` `\*` `\$`)
* Represent literal `.`, `*`, or `$` within an identifier.
* Escapes apply **only** to the immediately following character.

---

## 4  Reserved Characters and Future Extensions

| Char | Current meaning | Reservation reason |
|------|-----------------|--------------------|
| `` ` `` (back‑tick) | *Unassigned* | Reserved for quoting identifiers with spaces / unicode. |
| `[` `]` | *Unassigned* | Potential array‑slice syntax. |
| `#`     | *Unassigned* | Potential fragment / hash sub‑path. |

All appearances of the above **MUST** raise a *ParseError* in the current version.

---

## 5  Error Handling

| Scenario | Error type | Example |
|----------|------------|---------|
| Empty segment (`..`) | `ParseError` | `foo..bar` |
| Leading zero in index token | `ParseError` | `$01.name` |
| Escape at end of path | `ParseError` | `items.\\` |
| Index token out of scope | `RuntimeError` | Getter executed outside loop referencing `$1` |

---

## 6  Examples

| Path | Description |
|------|-------------|
| `users.*.name` | Names of **all** users. |
| `users.$1.address.city` | City of the *currently iterated* user inside the outer loop. |
| `config\.debug.level` | Accesses property `config.debug.level` (dot is literal). |
| `stats.*.values.$2` | Second‑level index (`$2`) inside nested loop of values arrays. |

---

## 7  Conformance Requirements

1. A compliant lexer **MUST** reject any path string that fails the canonical regex (Section 2).
2. Runtime evaluators **MUST** raise a `RuntimeError` when index tokens are unresolved.
3. Tooling (IDE, linter) **SHOULD** share a single source of grammar (code‑gen or dependency injection) to avoid drift.
4. Backward compatibility: any future extension **MUST NOT** alter the interpretation of paths that are valid under this version.

---

## 8  Revision History

| Version | Date | Notes |
|---------|------|-------|
| 0.1 (Draft) | 2025‑04‑29 | Initial public draft. |

---

© 2025 Structive Project Contributors. Licensed under MIT.

