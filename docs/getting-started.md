# Getting Started

This guide walks you through setting up your first Structive component using a single-file component (SFC). You can choose between automatic or manual component registration.

## 1. Setup Import Map

Structive loads components via `import()` from HTML files. To resolve paths, define aliases using an import map.

### Automatic Registration (Recommended)

Use the `@components/` prefix for automatic component registration:

```html
<script type="importmap">
{
  "imports": {
    "@components/my-component": "./components/my-component.html",
    "@components/another-component": "./components/another-component.html"
  }
}
</script>
```

Components with `@components/` prefix are automatically registered as custom elements. The tag name will be the part after `@components/` (e.g., `@components/my-component` becomes `<my-component>`).

### Manual Registration

For manual control, use regular aliases:

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

### Automatic Registration

When using `@components/` prefixed aliases, components are automatically registered. Load autoloader.

```html
<script type="module" src="path/to/cdn/autoloader"></script>
```


### Manual Registration

Use the `defineComponents()` function to register your components:

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

Once the script runs and components are defined (automatically or manually), the content will render:

```html
<p>Hello from Structive!</p>
```

---

## Routing Components

For routing-enabled applications, use the `@routes/` prefix:

```html
<script type="importmap">
{
  "imports": {
    "@routes/home": "./pages/home.html",
    "@routes/about": "./pages/about.html"
  }
}
</script>
```

Components with `@routes/` prefix are automatically registered as both components and routing paths (when router is enabled).

---

## ✅ That's it!

You've now:
- Learned about automatic vs manual component registration
- Defined a Structive single-file component
- Registered it using importmap aliases
- Rendered it using structure-only syntax

**Recommendation**: Use automatic registration with `@components/` prefix for simpler setup and cleaner code.

Next steps:
- Try using `data-bind` to bind attributes
- Add `getter` to derive structured values
- Explore structural loops and conditions in your template
- Set up routing with `@routes/` prefix

See [Structure Philosophy](./structure-philosophy.md) for deeper insights!