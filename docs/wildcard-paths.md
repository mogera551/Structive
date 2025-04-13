# Wildcard Paths

Structive introduces **wildcard paths** using `*` to represent array-like structures declaratively. These paths allow templates and logic to access deeply nested structures without explicit iteration.

---

## 🔹 Basic Concept

```ts
list.*.value
```

This path means:
- `list` is an array
- `*` refers to each item
- `value` is the property of each item

It directly corresponds to a template structure:

```html
{{ for:list }}
  {{ list.*.value }}
{{ endfor: }}
```

---

## 🔄 Nested Paths

```ts
regions.*.prefectures.*.population
```

This accesses the `population` of each prefecture in each region. It supports any depth of nesting.

---

## 🔢 Index Variables: $1, $2, ...

Each `*` in a path corresponds to an index variable:

- `$1`: index of the first `*`
- `$2`: index of the second `*`
- ...and so on

You can use these inside getters or event handlers:

```ts
get "list.*.selected"() {
  return this.$1 === this.selectedIndex;
}
```

---

## 🧠 Getter Definitions with Wildcards

```ts
get "list.*.doubleValue"() {
  return this["list.*.value"] * 2;
}
```

This defines logic that is automatically scoped for each `list[*]` item. No iteration is needed.

---

## 🧠 $resolve(path, stack)

Use `$resolve` inside getters or event handlers to access wildcard paths programmatically:

```ts
const next = this.$resolve("list.*.value", [this.$1 + 1]);
```

This will access `list[$1 + 1].value` and also register it as a tracked dependency.

You can also set values:

```ts
this.$resolve("list.*.value", [2]) = 10;
```

---

## 🧮 getAll for Aggregation

```ts
get "regions.*.population"() {
  return this.$getAll("regions.*.prefectures.*.population")
    .reduce((a, b) => a + b, 0);
}
```

This explicitly declares dependency on the nested population values.

---

## 🔁 Stack-Based Evaluation

During template rendering (e.g. inside a `{{ for:... }}` block), wildcard evaluation uses an **index stack** to resolve paths. Each nested loop contributes to the current evaluation context (`$1`, `$2`, etc).

---

## 🧠 Design Insight

Wildcard paths shift the paradigm:
- From explicit loops → to structural scoping
- From manual indexing → to automatic `$n` mapping
- From iteration code → to **structure as logic**

See also: [State Class](./state-class.md), [Structure Philosophy](./structure-philosophy.md)

