# Structure Philosophy

Structive is based on a central idea:

> **Structure is meaning.**

In a Structive template, data paths are more than accessors — they are declarations of intent, shape, and scope.

---

## 📐 From Syntax to Structure

Traditional template engines require you to describe how things render:

```html
<ul>
  {{ for:item in list }}
    <li>{{ item.label }}</li>
  {{ endfor }}
</ul>
```

In Structive:

```html
<ul>
  {{ for:list }}
    <li>{{ list.*.label }}</li>
  {{ endfor: }}
</ul>
```

There is no alias, no intermediate variable. The structure itself describes the logic:
- `list.*.label` means "each item's label"
- `*` indicates repeat
- The depth of nesting defines scope

---

## 🧠 Structure as Logic

With `get` declarations like:

```ts
get "list.*.double"() {
  return this["list.*.value"] * 2;
}
```

You're not looping. You're stating that "every item in list has a `double` equal to its `value * 2`."

The path is the function. The scope is the structure. The logic is declarative.

---

## 🔢 Index-Aware Semantics

Each `*` binds an index:
- `$1` → first wildcard
- `$2` → second

You can use this for comparisons:

```ts
get "list.*.selected"() {
  return this.$1 === this.selectedIndex;
}
```

Or for data lookup:

```ts
get "list.*.nextValue"() {
  return this.$resolve("list.*.value", [this.$1 + 1]);
}
```

---

## 🧩 Aggregation with $getAll

Structure allows scope-wide logic too:

```ts
get "regions.*.population"() {
  return this.$getAll("regions.*.prefectures.*.population")
    .reduce((a, b) => a + b, 0);
}
```

You're not iterating — you're declaring scope.

---

## ✨ Structure as API

What used to be helper functions, mapping chains, imperative loops, or event handlers can now be written as structured expressions:

```ts
get "user.loggedIn"() {
  return Boolean(this["user.token"]);
}
```

```ts
get "list.*.isEven"() {
  return this.$1 % 2 === 0;
}
```

You don't write functions anymore. You define selectors.

---

## ✅ Benefits

- Declarative, not imperative
- Structural, not procedural
- Unified across view + logic
- Fully traceable + reactive

Structive is not just a framework — it's a shift in how UI logic is described.

See also: [Wildcard Paths](./wildcard-paths.md), [State Class](./state-class.md)

