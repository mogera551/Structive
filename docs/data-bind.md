# data-bind Specification

The `data-bind` attribute is used to declaratively bind DOM element attributes to values in the state.

## 🔧 Syntax

```html
<input data-bind="value:form.name"> <!-- binds input's value to form.name -->
```

### 🧩 Multiple Bindings
Use semicolons to bind multiple attributes:

```html
<input data-bind="value:form.name; placeholder:form.placeholder">
```

Multiline formatting is also supported and recommended for clarity:

```html
<input
  data-bind="
    value:form.name;
    placeholder:form.placeholder;
    disabled:form.locked;
  "
/>
```

> ⚠️ Trailing semicolons are optional.

---

## 🎯 Target Attributes

You can bind to most standard DOM attributes, including:

- `value`
- `checked`
- `selected`
- `disabled`
- `style`
- `class`
- `src`, `href`
- `aria-*`, `data-*`

---

## 🔁 Two-Way Binding (e.g. value → state)

By default, binding to `value` or `checked` will establish a two-way connection using `oninput` or `onchange` events.

```html
<input type="range" data-bind="value:settings.volume">
```

> 🧠 The framework automatically listens for `input` or `change` and updates `settings.volume` accordingly.

---

## 🧠 Input Filters

You can apply input filters on binding using the `|` filter syntax:

```html
<input data-bind="value|number:settings.count">
```

In this example:
- The input's `value` is parsed as a number before updating `settings.count`

---

## ⚡ Output Filters

You can also filter values when displaying them in bound attributes:

```html
<input data-bind="value|fix,2:price">
```

This displays the value rounded to 2 decimal places.

---

## 🎯 Binding Events

You can bind event listeners via `data-bind`:

```html
<input data-bind="oninput:handleInput">
```

This is preferred over `oninput="..."` to avoid unsafe HTML evaluation.

In your state class:
```ts
handleInput(event) {
  this.message = event.target.value;
}
```

---

## 🧠 Design Goals

- Avoid introducing custom attribute syntax
- Keep `data-bind` declarative, consistent with HTML style
- Support one-way and two-way bindings
- Enable clean separation of state, logic, and template structure

See also: [Wildcard Paths](./wildcard-paths.md), [State Class](./state-class.md)

