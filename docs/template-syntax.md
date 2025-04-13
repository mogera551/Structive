# Template Syntax

Structive templates use a minimal syntax centered around structure, not control flow. Only two primary block constructs are supported: `for` and `if`.

---

## 🌀 `for` Block

Repeat a structure based on a wildcard path:

```html
{{ for:list }}
  <p>{{ list.*.name }}</p>
{{ endfor: }}
```

- `list.*.name` is the scoped path inside the loop
- `$1` is bound to the index of the `*`

Nested loops automatically bind `$2`, `$3`, etc.:

```html
{{ for:regions }}
  {{ for:regions.*.prefectures }}
    <li>{{ regions.*.prefectures.*.name }}</li>
  {{ endfor: }}
{{ endfor: }}
```

---

## 🔍 `if` Block

Render content conditionally:

```html
{{ if:user.isLoggedIn }}
  <p>Welcome back!</p>
{{ else: }}
  <p>Please log in.</p>
{{ endif: }}
```

- No `elseif` is supported
- Condition is evaluated as a truthy expression (getter path recommended)

---

## 🧩 Interpolation

Standard interpolation uses double braces:

```html
<p>{{ message }}</p>
```

Inside a loop, wildcard paths are used:

```html
<li>{{ list.*.label }}</li>
```

---

## 🔢 Index Access

Use `$1`, `$2`, etc. inside text or bound attributes:

```html
<p>No.{{ $1|inc,1 }}</p>
```

This renders `No.1`, `No.2`, etc., for each item.

---

## ⚠️ No Custom Syntax

Structive avoids introducing new syntax:
- No directives (e.g. `v-if`, `x-for`, etc.)
- No aliasing (`item in list`) — the structure is the variable
- No template logic or inline expressions — use getters instead

---

## ✅ Summary

- Only `{{ for:... }}` and `{{ if:... }}` blocks are used
- Interpolation follows `{{ path }}` with wildcard support
- Indexes auto-bind to `$1`, `$2`, etc.
- Template is declarative and purely structural

See also: [Wildcard Paths](./wildcard-paths.md), [State Class](./state-class.md)

