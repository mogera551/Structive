# Single-File Components (SFC)

Structive supports **single-file components (SFCs)** using plain HTML files with three main sections:

- `<template>`: structure and bindings
- `<style>`: scoped or global CSS
- `<script type="module">`: component state class

---

## 📄 File Format Example

```html
<template>
  <div class="card">
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
  </div>
</template>

<style>
.card {
  border: 1px solid #ccc;
  padding: 1rem;
  border-radius: 0.5rem;
}
</style>

<script type="module">
export default class {
  title = "Hello Structive";
  description = "This is a single-file component.";
}
</script>
```

> ✅ Recommended order: `template → style → script`

---

## 🧠 Why Use SFCs?

- Keeps template, styles, and logic together
- Human-readable and platform-native
- Works seamlessly with `fetch()` + `import()`
- Avoids build steps — suitable for native module environments

---

## ⚙️ How Structive Loads SFCs

When you call `defineComponents({ ... })`, Structive:

1. Fetches the HTML file using the alias in the import map
2. Parses out the `<template>`, `<style>`, and `<script>` sections
3. Registers the custom element with the specified tag
4. Executes the state class in the `<script>` via `import()`
5. Associates the compiled result with the custom element

---

## 🔄 Dynamic Import Strategy

To avoid relative path resolution issues with `import()`:

- You must use **import map aliases** (not relative paths)
- Avoid dynamic `import('./component.js')` inside scripts
- All dependencies should be pre-aliased in the `importmap`

> ⚠️ Relative imports in `<script>` of HTML may fail unless aliased

---

## 🧪 Component Registration Example

```js
import { defineComponents } from "structive";

defineComponents({
  "my-card": "my-card"
});
```

With import map:
```json
{
  "imports": {
    "my-card": "./components/my-card.html"
  }
}
```

---

## ✅ Summary

- Structive components are just HTML files with three sections
- No transpiler or compiler needed
- Aliased module resolution ensures correct script loading

See also: [Getting Started](./getting-started.md), [State Class](./state-class.md)

