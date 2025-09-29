# 開発ガイド（Developer Guide）

Structive の開発に参加するためのセットアップ、テスト、そして Set 拡張メソッドのポリフィル運用（備忘録）をまとめます。

---

## 開発環境

- Node.js: 22 LTS 系（例: 22.20.0）
  - Windows は nvm-windows を推奨。
  - 例（PowerShell）:
    ```powershell
    nvm install 22.20.0
    nvm use 22.20.0
    node -v
    ```
  - 備考（管理者権限）:
    - `nvm use` は既定で `C:\\Program Files\\nodejs\\` のシンボリックリンクを書き換えます。管理者 PowerShell が必要。
    - 管理者が使えない場合は `%APPDATA%\\nvm\\settings.txt` に `path: %LOCALAPPDATA%\\nodejs` を追記し、ユーザー配下をリンク先に設定してから `nvm use` を実行します。

- パッケージマネージャ: npm（同梱 v10.x）

---

## セットアップ

```powershell
npm ci
```

- テストとカバレッジ:
  ```powershell
  npm run test            # 対話実行
  npm run test:coverage   # CI 向け一括実行 + カバレッジ
  ```

- 主要ツールのバージョン指針
  - Vitest: v3
  - jsdom: ^27（Node 22 と相性良好）
    - 参考: 旧構成では Node 20 + jsdom@27 の相性問題（`DONT_CONTEXTIFY`）があったため、当時は jsdom@22 を使用。Node 22 では ^27 で問題ありません。

---

## Polyfill の方針（備忘録）

以下の Set 拡張メソッド（現時点で標準未実装）は「開発（テスト）時のみ」ポリフィルします。プロダクションには含めません。

- `Set.prototype.union`
- `Set.prototype.intersection`
- `Set.prototype.difference`
- `Set.prototype.symmetricDifference`
- `Set.prototype.isSubsetOf`
- `Set.prototype.isSupersetOf`

構成:
- 型定義: `src/@types/polyfill.d.ts`
- ランタイム実装（テスト用）: `src/polyfills.ts`
- 読み込み: `vitest.config.ts` の `test.setupFiles` で自動読み込み（= 開発/テスト時のみ）
- プロダクション: エントリーポイント（`src/exports.ts`）からは import していないため、バンドルに含まれません。

開発者への注意:
- 本番コードで上記メソッドを直接前提にしないでください。
  - 代替: ユーティリティ関数（例: `setUnion(a,b)`）に置換して、環境差を吸収する。
  - どうしても本番で必要な場合のみ、`src/exports.ts` で `import './polyfills.js'` を追加して配布に含める方針へ切替（現方針では非推奨）。
- 将来 Node/V8 が標準実装を提供した場合は、`typeof Set.prototype.union === 'function'` のような feature detection でポリフィルを自動無効化可能。

---

## トラブルシューティング

- Node のバージョンが切り替わらない
  - 管理者 PowerShell で `nvm on; nvm use 22.20.0` を実行。
  - もしくは `%APPDATA%\\nvm\\settings.txt` に `path:` を設定してユーザー配下をリンク先に。

- jsdom 関連のエラー
  - Node 22 を利用しているか確認。
  - 依存が古い場合は `npm ci` を実行。

---

## コミット前チェック

- ユニットテスト: `npm run test`
- カバレッジ: `npm run test:coverage`
- 変更で Set 拡張メソッドを新規に（本番コードで）使っていないか確認

---

## 補足

- Rollup の入力は `src/exports.ts`。ポリフィルはここからは読み込んでいないため、本番バンドルに含まれません。
- ドキュメントは `docs/` 配下にあります。改善歓迎です。
