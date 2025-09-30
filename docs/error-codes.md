# エラーコード体系（Draft v0.7）

Structive のエラーは「何が・どこで・なぜ・どう直す」をすぐ理解できることを目的に、接頭辞（領域）＋番号のルールで体系化します。

- 形式: `PREFIX-NNN`
- 例: `BIND-102 Node not found by nodePath`
- 番号は3桁（将来拡張可）。帯の目安は下記を参照。

## 番号帯の目安

- 0xx: 初期化/設定/起動（config, bootstrap）
- 1xx: Not Found/未登録/重複（template, node, component, route）
- 2xx: 無効値/フォーマット/整合性エラー（引数・構文・スキーマ）
- 3xx: 状態/コンテキスト不整合（readonly変更、loopContext null、依存関係）
- 4xx: 実行時失敗（描画・マウント・アンマウント・適用失敗）
- 5xx: 非同期/ロード失敗（ImportMap, SFC）
- 6xx: 環境/互換/機能不可（ShadowRoot不可、jsdom制約）
- 8xx: 廃止/互換警告
- 9xx: 警告/ソフトエラー（動作継続可能）

## 接頭辞（領域）

- TMP: Template 系
  - 例: TMP-001 Template not found / TMP-102 SVG template conversion failed
- BIND: DataBinding / BindContent / BindingNode 系
  - 例: BIND-101 Data-bind not registered / BIND-102 Node not found by nodePath / BIND-103 Creator not found for bindText
- ENG: ComponentEngine（ライフサイクル・マウント）
  - 例: ENG-201 Lifecycle order violation / ENG-202 Mount target missing
- COMP: Component / WebComponents 登録・定義
  - 例: COMP-001 Component already defined / COMP-010 ShadowRoot not allowed
- SFC: Single File Component（ロード/生成）
  - 例: SFC-201 Invalid SFC metadata / SFC-202 Parse error
- IMP: ImportMap（loadFromImportMap, lazy-load alias）
  - 例: IMP-101 Invalid route alias / IMP-201 Lazy component alias not found
- ROUTE: Router（エイリアス/パス/遷移）
  - 例: ROUTE-101 Route path invalid / ROUTE-102 Duplicate route entry
- PATH: PathManager / PathTree（ノード/経路）
  - 例: PATH-101 Path node not found / PATH-201 Path normalization failed
- LIST: ListIndex / ListDiff（差分・インデックス）
  - 例: LIST-101 Diff computation failed / LIST-201 Invalid list index
- STATE: StateClass / StateProperty / Ref
  - 例: STATE-301 Readonly property mutation / STATE-302 Unresolved state path / STATE-303 Dependency tracking inconsistency
- FLT: Filter（builtin/custom filter）
  - 例: FLT-201 Unknown filter / FLT-202 Filter argument invalid
- CSS: StyleSheet 登録系
  - 例: CSS-101 StyleSheet registration failed
- UPD: Updater / Renderer（描画・反映）
  - 例: UPD-401 Render cycle interrupted / UPD-402 Binding update failed
- CFG: Config / Bootstrap / Exports（起動・多重ガード）
  - 例: CFG-001 Invalid config value / CFG-002 Bootstrap called multiple times
- ID: GlobalId（ID生成）
  - 例: ID-101 ID collision detected
- DOM: DOM 環境/制約（jsdomやブラウザ差分）
  - 例: DOM-201 Operation not supported in current environment
- UTL: utils 共通（最後の受け皿）
  - 例: UTL-999 Unexpected internal error

## メッセージ記述ガイドライン

- 1行目は短く具体的に: 「問題 + 対象」（文末ピリオドは付けない）
  - "Node not found by nodePath"
- 2行目以降（開発時表示推奨）
  - hint: よくある原因/直し方（1–2件）
  - context: 最小限の手掛かり（component/tag, templateId/rootId, nodePath, bindText, statePath, alias 等）
  - docsUrl: 関連ドキュメントのアンカー
  - cause: 下位例外の要約（可能なら）

### 表現上の統一ルール（簡易）

- “is not found” ではなく “not found” を用いる（冗長な be 動詞を避ける）
  - OK: `Template not found: 123` / NG: `Template is not found: 123`
- 形式は「対象 + not found: 具体値」を基本形にする
  - 例: `ListIndex not found: items.*`
- null/undefined は「… is null」「… is undefined」を使い分ける（意味が異なるため）。
- できるだけ現在形・能動で簡潔に（例: “Cannot set …”, “Value must be …”）

- 初期化未完了は “not initialized” を用い、be動詞を省く
  - OK: `Engine not initialized.` / NG: `Engine is not initialized.`
  - “yet” は必要に応じて付与（例: `bindContent not initialized yet`）

### 場所（識別子）の扱い方針

- 関数名・クラス名・メソッド名など「どこで」発生したかを示す識別子は、message の先頭に付けず、context.where に格納する
  - OK: `message: "Node not found: 0,1"`, `context: { where: 'BindContent.createBindings', templateId, nodePath }`
  - NG: `message: "BindContent.createBindings: Node not found: 0,1"`
- message は「対象 + 問題」を短く簡潔に（1行、先頭大文字、語尾ピリオドなし）
- 複数の呼び出し点から同じメッセージを使う場合でも、context.where で発生箇所を識別できるため、メッセージは共通化しやすい

## 代表エラー（初期セット）

- TMP-001 Template not found
- TMP-102 SVG template conversion failed
- BIND-101 Data-bind not registered
- BIND-102 Node not found by nodePath
- BIND-103 Creator not found for bindText
- ENG-201 Lifecycle order violation
- COMP-001 Component already defined
- COMP-010 ShadowRoot not allowed
- IMP-201 Lazy component alias not found
- ROUTE-101 Invalid route alias
- STATE-301 Readonly property mutation
- UPD-402 Binding update failed

## 実装方針（推奨）

- StructiveError（code, message, context, hint, docsUrl, severity, cause）を定義
- raiseError(code, message, context?, options?: { hint?, docsUrl?, cause?, severity? }) に統一
- config.debug = true のとき詳細（context/hint/docsUrl）を console.groupCollapsed で展開
- まずは BindContent / BindingBuilder / Template / ImportMap / Component 登録周りの既存 raiseError から適用開始

## TMP
Template 系。主にテンプレート未登録、取得失敗、変換エラーなど。

## BIND
DataBinding / BindContent / BindingNode 系。data-bind 未設定、ノード未解決、クリエイタ未登録など。

- 例（ComponentEngine 連携）
  - BIND-201 bindContent is not initialized yet
    - context: { where: 'ComponentEngine.bindContent.get', componentId }
    - docs: #bind
  - BIND-201 Block parent node is not set
    - context: { where: 'ComponentEngine.connectedCallback', mode: 'block' }
    - docs: #bind

## UPD
Updater / Renderer 系。エンジン未初期化、ReadonlyState 未初期化、レンダリング中断など。

## PATH
PathManager / PathTree 系。パスノード未検出、正規化失敗、ワイルドカード整合性など。

## CSS
StyleSheet 登録・取得系。スタイルシート未登録、取得失敗など。

## STATE
StateClass / StateProperty / Ref 系。Readonly 変更、パス未解決、依存関係不整合など。

- 例
  - STATE-202 Failed to parse state from dataset
    - context: { where: 'ComponentEngine.connectedCallback', datasetState }
    - docs: #state
  - STATE-202 Cannot set property ${prop} of readonly state.
    - context: { where: 'createReadonlyStateProxy.set', prop }
    - docs: #state
  - STATE-202 propRef.stateProp.parentInfo is undefined
    - context: { where: 'getByRefReadonly|getByRefWritable|setByRef', refPath }
    - docs: #state
  - STATE-202 lastWildcardPath is null / wildcardParentPattern is null / wildcardIndex is null
    - context: { where: 'getListIndex', pattern, index? }
    - docs: #state

## IMP
ImportMap / Lazy Load 系。無効なエイリアス、遅延ロードの別名未検出など。

## FLT
Filter 系。未登録フィルタ、型不一致、オプション未指定など。
