# Structive

[日本語](README.ja.md)

**Structive** is a structure-driven template engine where structure itself defines meaning, logic, and data flow. Write structure, not syntax.

---

## ✨ Features

- **Structure-Driven Rendering**: Data paths like `list.*.value` automatically bind to structure and scope.
- **Wildcard Path Access**: Use `*` to express repeated or nested structures naturally.
- **Scoped Getters with Declarative Logic**: Define logic for each node in the structure with path-aware getters.
- **Zero Boilerplate**: No loops, no manual bindings — just structure.
- **data-bind Attributes**: Bind DOM element attributes directly to state using `data-bind="attr:path"` syntax.
- **Lifecycle-Aware State**: Hooks like `$connectedCallback` and `$disconnectedCallback` on state class.
- **Component-Based with Single-File Components**: HTML-like components with `<template>`, `<style>`, and `<script>` sections.
- **Shadow DOM Optional**: Use `static $config = { enableShadowRoot: false }` to toggle.

---

## 🚀 Getting Started

1. Define your import map in HTML:

```html
<script type="importmap">
{
  "imports": {
    "structive": "path/to/cdn/structive.js",
    "@routes/root": "./components/my-component.html",
    "@components/sub-component": "./components/sub-component.html"
  }
}
</script>
```

2. Load components using `bootstrapStructive()`:

```js
import { config, bootstrapStructive } from "structive";

config.autoLoadFromImportMap = true;
bootstrapStructive();
```

3. Use it in your HTML:

```html
<app-main></app-main> <!-- default app main, attach @routes/root -->
<sub-component></sub-component>
```

---

## 📦 Component File Structure

Structive uses single-file components. Each component HTML file contains three sections:

```html
<template>
  <p>{{ message }}</p>
</template>

<style>
p {
  color: steelblue;
}
</style>

<script type="module">
export default class {
  message = "Hello, Structive!";
}
</script>
```

- Order of sections is flexible, but `template → style → script` is recommended.
- The state class should be the default export and can define getters.

---

## 🧠 Philosophy

Structive is built on a simple but powerful idea: **structure should define behavior**.

### 🔹 Instead of loops:
```html
{{ for:items }}
  {{ items.*.label }}
{{ endfor: }}
```

### 🔹 Instead of imperative conditions:
```html
{{ if:user.isLoggedIn }}
  Welcome!
{{ else: }}
  Please log in.
{{ endif: }}
```

### 🔹 Instead of complex logic:
```ts
get "list.*.selected"() {
  return this.$1 === this.selectedIndex;
}
```

You don't describe how to render. You describe the structure and let it render itself.

Learn more in [`docs/structure-philosophy.md`](docs/structure-philosophy.md)

---

## 📂 Documentation

- [Getting Started](docs/getting-started.md)
- [Template syntax](docs/template-syntax.md)
- [data-bind Specification](docs/data-bind.md)
- [Wildcard Paths](docs/wildcard-paths.md)
- [State Class and Getters](docs/state-class.md)
- [$getAll and Dependency Tracking](docs/get-all.md)
- [Single-File Components](docs/single-file-components.md)
- [Lifecycle](docs/lifecycle.md)
- [Structure Philosophy](docs/structure-philosophy.md)

---

## 🧪 Example

```ts
// state.js
export default class {
  list = [
    { value: 1 },
    { value: 2 },
    { value: 3 }
  ];

  get "list.*.double"() {
    return this["list.*.value"] * 2;
  }
}
```

```html
<!-- template -->
<ul>
  {{ for:list }}
    <li>{{ list.*.double }}</li>
  {{ endfor: }}
</ul>
```

---

## 💬 Feedback

This project is under active development. Feedback, thoughts, and contributions are welcome!

Share your thoughts on [Zenn article](https://zenn.dev/)... or open an issue right here.

---

## License

MIT

