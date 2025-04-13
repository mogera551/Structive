# Getting Started

This guide walks you through setting up your first Structive component using a single-file component (SFC) and registering it in your app.

## 1. Setup Import Map

Structive loads components via `import()` from HTML files. To resolve paths, define aliases using an import map:

```html
<script type="importmap">
{
  "imports": {
    "my-component": "./components/my-component.html"
  }
}
</script>
```

> 🔍 Structive expects the component to be an HTML file containing `<template>`, `<style>`, and `<script>`.

---

## 2. Load Components

Use the `defineComponents()` function provided by the framework to register your components:

```js
import { defineComponents } from "structive";

defineComponents({
  "my-component": "my-component"
});
```

This call:
- fetches `my-component.html`
- extracts its `<template>`, `<style>`, and `<script>` sections
- registers `<my-component>` as a custom element

You can register multiple components at once:

```js
defineComponents({
  "my-component": "my-component",
  "another-component": "another-component"
});
```

---

## 3. Create the Component

Save a file like `components/my-component.html` with the following contents:

```html
<template>
  <p>{{ message }}</p>
</template>

<style>
p {
  font-weight: bold;
  color: darkcyan;
}
</style>

<script type="module">
export default class {
  message = "Hello from Structive!";
}
</script>
```

> ✅ Recommended order: `template → style → script`

---

## 4. Use the Component

In your HTML:

```html
<body>
  <my-component></my-component>
</body>
```

Once the script runs and components are defined, the content will render:

```html
<p>Hello from Structive!</p>
```

---

## ✅ That’s it!

You’ve now:
- Defined a Structive single-file component
- Registered it declaratively with `defineComponents()`
- Rendered it using structure-only syntax

Next steps:
- Try using `data-bind` to bind attributes
- Add `getter` to derive structured values
- Explore structural loops and conditions in your template

See [Structure Philosophy](./structure-philosophy.md) for deeper insights!

