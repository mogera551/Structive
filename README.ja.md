
# Structive（ストラクティブ）

[English](README.md)

**Structive** は、構造そのものが意味・ロジック・データフローを定義する**構造駆動型テンプレートエンジン**です。  
構文を書くのではなく、構造を書く。ただそれだけです。

---

## ✨ 特徴

- **構造駆動レンダリング**：`list.*.value` のようなデータパスが、自動的に構造やスコープにバインドされます。
- **ワイルドカードパスアクセス**：`*` を使うことで繰り返し構造やネスト構造を自然に表現できます。
- **スコープ付きGetter**：構造パスに応じたGetterで、各ノードごとにロジックを宣言的に定義。
- **ボイラープレートゼロ**：ループも手動バインディングも不要。構造を書くだけ。
- **data-bind属性**：`data-bind="attr:path"` の形式で、DOM属性を状態に直接バインド。
- **ライフサイクル対応の状態クラス**：`$connectedCallback` や `$disconnectedCallback` など、クラス側でライフサイクルフックが記述可能。
- **シングルファイルコンポーネント（SFC）対応**：`<template>`、`<style>`、`<script>` を含むHTMLベースのコンポーネント。
- **Shadow DOMは任意**：`static $config = { enableShadowRoot: false }` を定義することで切り替え可能。

---

## 🚀 はじめかた

1. HTML内でインポートマップを定義：

```html
<script type="importmap">
{
  "imports": {
    "my-component": "./components/my-component.html"
  }
}
</script>
```

2. コンポーネントを `defineComponents()` で読み込み：

```js
import { defineComponents } from "structive";

defineComponents({
  "my-component": "my-component"
});
```

3. HTMLに記述して使用：

```html
<my-component></my-component>
```

---

## 📦 コンポーネントの構成

Structiveのコンポーネントは、テンプレート・スタイル・スクリプトを1ファイルにまとめた**シングルファイルコンポーネント**です。

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

- 各セクションの順番は自由ですが、`template → style → script` の順を推奨します。
- 状態クラスは `default export` で、`getter` も定義可能です。

---

## 🧠 設計思想

Structiveの基本理念はとてもシンプル：  
**「構造がふるまいを定義する」**

### 🔹 ループの代わりに：
```html
{{ for:items }}
  {{ items.*.label }}
{{ endfor: }}
```

### 🔹 命令的条件の代わりに：
```html
{{ if:user.isLoggedIn }}
  Welcome!
{{ else: }}
  Please log in.
{{ endif: }}
```

### 🔹 複雑なロジックの代わりに：
```ts
get "list.*.selected"() {
  return this.$1 === this.selectedIndex;
}
```

「どう描画するか」ではなく、  
「**何が存在し、どのように構造化されているか**」を記述します。  
それに応じてUIが自動的に生成されます。

→ 詳しくは [`docs/structure-philosophy.md`](docs/structure-philosophy.md) を参照。

---

## 📂 ドキュメント一覧

- [はじめに](docs/getting-started.md)
- [テンプレート構文](docs/template-syntax.md)
- [data-bind仕様](docs/data-bind.md)
- [ワイルドカードパス](docs/wildcard-paths.md)
- [状態クラスとGetter](docs/state-class.md)
- [$getAllと依存関係トラッキング](docs/get-all.md)
- [シングルファイルコンポーネント](docs/single-file-components.md)
- [ライフサイクル](docs/lifecycle.md)
- [Structiveの構造思想](docs/structure-philosophy.md)

---

## 🧪 サンプル

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

## 💬 フィードバック歓迎

Structiveは現在アクティブに開発中のプロジェクトです。  
フィードバック・改善提案・感想など、大歓迎です！

Zennの記事（[Zennで読む](https://zenn.dev/)）や、GitHubのIssueでお気軽にご連絡ください。

---

## 📝 ライセンス

MIT

