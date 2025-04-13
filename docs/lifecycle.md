# Lifecycle

Structive components follow the native Custom Elements lifecycle but delegate the logic to the state class.

This cleanly separates the template/DOM layer from the reactive logic layer.

---

## 🔁 Component Lifecycle

| Phase                | Method Called                        |
|---------------------|--------------------------------------|
| Connected to DOM    | `connectedCallback()`                |
|                     | `state.$connectedCallback()`         |
| Disconnected        | `disconnectedCallback()`             |
|                     | `state.$disconnectedCallback()`      |

- Both lifecycle hooks may be `async`
- `state` is the instance of the exported class from the component’s `<script>`

---

## 🧠 Example

```ts
export default class {
  async $connectedCallback() {
    this.timestamp = Date.now();
  }

  $disconnectedCallback() {
    console.log("Component removed.");
  }
}
```

---

## ⚙️ How It Works

Structive internally attaches the state instance to the component and:

1. Invokes `connectedCallback()` on the custom element
2. Then invokes `state.$connectedCallback()` if defined

Similarly on removal:

1. Invokes `disconnectedCallback()`
2. Then `state.$disconnectedCallback()` if defined

> 🧩 This ensures lifecycle logic lives alongside the rest of the state

---

## ✅ Summary

- Use `$connectedCallback()` / `$disconnectedCallback()` in state class
- Keep component logic within the state class, not in the DOM class
- Supports both synchronous and async logic

See also: [State Class](./state-class.md), [Single-File Components](./single-file-components.md)

