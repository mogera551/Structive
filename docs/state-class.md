# State Class and Getters

The state class in Structive holds reactive data, computed values, and event logic. It acts as the core logic behind a component’s structure.

---

## 🧱 Basic State Structure

Each component exports a **default anonymous class** as its state. This keeps the framework’s consumption consistent:

```ts
export default class {
  count = 0;
  message = "Hello";
}
```

---

## 🧠 Getter Definitions

You can define computed values using `get "path"()` syntax:

```ts
get "list.*.double"() {
  return this["list.*.value"] * 2;
}
```

### ✔ Getter Characteristics:
- Declared using `get "path"()`
- Reactive: re-evaluates when dependent values change
- Scoped automatically (`$1`, `$2`, etc.)
- Tracked via `$resolve()` and `$getAll()`

---

## 🧩 Dependency Awareness

Accessing state through wildcard paths inside getters must be done via `$resolve()` or `$getAll()` to track dependencies properly.

```ts
get "regions.*.population"() {
  return this.$getAll("regions.*.prefectures.*.population")
    .reduce((a, b) => a + b, 0);
}
```

> ✅ This enables automatic re-evaluation when population values change.

---

## 📦 Static Configuration

Each state class can define component options via a static `$config` field:

```ts
static $config = {
  enableShadowRoot: false
};
```

This controls runtime features like shadow DOM.

---

## 🔁 Lifecycle Hooks

The following lifecycle methods can be defined in the state class:

```ts
async $connectedCallback() {
  // Called when component is attached
}

async $disconnectedCallback() {
  // Called when component is detached
}
```

These behave like the native `connectedCallback()` / `disconnectedCallback()` on the Web Component class but live in the state layer.

---

## ⚡ Event Handlers

Handlers defined in the state class are callable via `data-bind`:

```html
<input data-bind="oninput:handleInput">
```

```ts
handleInput(event) {
  this.message = event.target.value;
}
```

They may also be defined as `async` functions.

---

## ✅ Summary

- The **state class** defines both static and dynamic data
- **Getters** compute values reactively from structure
- **Lifecycle hooks** and **event handlers** live alongside state
- Structive separates **component structure** from **behavior**, while maintaining structural alignment

See also: [Wildcard Paths](./wildcard-paths.md), [Lifecycle](./lifecycle.md)

