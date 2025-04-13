# $getAll and Dependency Tracking

`$getAll` is a utility provided in Structive to retrieve multiple values matching a wildcard path, while also registering proper dependencies for reactive updates.

---

## 📥 Syntax

```ts
this.$getAll(path: string, indexes?: number[]): any[]
```

- `path`: a wildcard path like `list.*.value`
- `indexes`: optional array to override implicit `$1`, `$2`, etc.

---

## 🎯 Purpose

Use `$getAll` inside a getter to:

- Access multiple nested values
- Perform aggregation (e.g. `.reduce()`)
- Register dependency tracking for all accessed values

---

## 📌 Example: Summing Populations

```ts
get "regions.*.population"() {
  return this.$getAll("regions.*.prefectures.*.population")
    .reduce((a, b) => a + b, 0);
}
```

This explicitly declares that this getter depends on all nested population values.

> 🔄 If any `population` in any `prefecture` changes, the region's `population` will re-evaluate.

---

## ⚠️ Dependency Tracking Requirement

Without `$getAll`, values accessed via raw `this[...]` are not tracked.

```ts
// ❌ Will NOT track updates
const list = this["list"];
```

Always use:
```ts
// ✅ Tracks all .value inside list
const values = this.$getAll("list.*.value");
```

---

## 🔁 Overriding Indexes

You can specify indexes manually:

```ts
const values = this.$getAll("list.*.details.*.price", [1, 2]);
```

This retrieves `list[1].details[2].price` as an array of one item, and tracks that path.

---

## 📤 Return Value

- Always returns an array
- Empty if no values found
- Stable order (based on structural order)

---

## 🧠 Use Cases

- Aggregating structured data
- Calculating share or percentage
- Getter composition from deeper paths

Example:
```ts
get "regions.*.share"() {
  const regionPop = this["regions.*.population"];
  const total = this["populationTotal"];
  return regionPop / total;
}
```

To ensure reactivity, `populationTotal` should also be defined via `$getAll`.

---

## ✅ Best Practices

- Prefer `$getAll` for any wildcard path used in computation
- Use optional index array to access specific slices structurally
- Combine with `$resolve` to build expressive and reactive logic

See also: [Wildcard Paths](./wildcard-paths.md), [State Class](./state-class.md)

