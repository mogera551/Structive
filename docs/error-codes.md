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

### TMP-001 Template not found
- どこで: Template.registerTemplate 取得時/ComponentEngine 初期化時/Template.resolve
- 発生条件: 指定した templateId で登録済みテンプレートが見つからない
- message: `Template not found: ${templateId}`
- context 例: `{ where: 'Template.registerTemplate|getTemplate', templateId }`
- hint: `registerTemplate` の呼び出し順序と ID のスペルを確認。ビルド時のテンプレート取り込み漏れがないか確認

### TMP-102 SVG template conversion failed
- どこで: Template の SVG → DOM 変換処理（registerHtml / replaceTemplateTagWithComment 連携）
- 発生条件: 無効な SVG 文字列やルート要素の欠落により DOM へ変換できない
- message: `SVG template conversion failed`
- context 例: `{ where: 'Template.registerHtml', templateId }`
- hint: SVG のルート要素/名前空間を確認。無効なタグ/属性が含まれていないか検証

## BIND
DataBinding / BindContent / BindingNode 系。data-bind 未設定、ノード未解決、クリエイタ未登録など。

### BIND-101 Data-bind not registered
- どこで: BindingBuilder.registerDataBindAttributes / ComponentEngine.setup（初期スキャン）
- 発生条件: data-bind 属性に指定されたバインド名が未登録
- message: `Data-bind not registered: ${bindName}`
- context 例: `{ where: 'registerDataBindAttributes', bindName, nodePath }`
- hint: フィルタ/バインド名の登録漏れを確認。typo や命名の不一致を修正

### BIND-102 Node not found by nodePath
- どこで: BindContent.createBindings / replaceTextNodeFromComment / getAbsoluteNodePath
- 発生条件: 保存された nodePath から対象ノードを DOM 上で特定できない（テンプレート変換や差し替えの影響）
- message: `Node not found by nodePath: ${nodePath}`
- context 例: `{ where: 'BindContent.createBindings', templateId, nodePath }`
- hint: テンプレート登録後に構造を変える操作がないか確認。nodePath の保存/復元の順序を見直す

### BIND-103 Creator not found for bindText
- どこで: BindingBuilder.getBindingNodeCreator / parseBindText
- 発生条件: 解析した bindText に対応する BindingNode クリエータが未登録
- message: `Creator not found for bindText: ${bindText}`
- context 例: `{ where: 'getBindingNodeCreator', bindText }`
- hint: 対応する BindingNode 実装が export / register されているか確認

### BIND-201 bindContent is not initialized yet / Block parent node is not set
- どこで: ComponentEngine.bindContent.get / ComponentEngine.connectedCallback（Block モード）
- 発生条件: BindContent の初期化前にアクセスされた / Block の親ノードが未設定
- message 例:
  - `bindContent is not initialized yet`
  - `Block parent node is not set`
- context 例: `{ where: 'ComponentEngine.bindContent.get', componentId }`, `{ where: 'ComponentEngine.connectedCallback', mode: 'block' }`
- hint: ComponentEngine の setup 順序を確認。Block/Inline の親要素を正しく解決する

- 例（ComponentEngine 連携）
  - BIND-201 bindContent is not initialized yet
    - context: { where: 'ComponentEngine.bindContent.get', componentId }
    - docs: #bind
  - BIND-201 Block parent node is not set
    - context: { where: 'ComponentEngine.connectedCallback', mode: 'block' }
    - docs: #bind

## ENG
ComponentEngine（ライフサイクル・マウント）。

### ENG-201 Lifecycle order violation
- どこで: ComponentEngine.connectedCallback / disconnectedCallback / setup / teardown
- 発生条件: ライフサイクル手順の逆順呼び出しや重複呼び出し（例: teardown 前に setup を再実行、二重 connectedCallback 等）
- message: `Lifecycle order violation`
- context 例: `{ where: 'ComponentEngine.connectedCallback|setup|teardown', mode }`
- hint: setup → connected → （更新/描画）→ disconnected → teardown の順序を守る。多重ガードを実装/確認

### ENG-202 Mount target missing
- どこで: ComponentEngine.setup / mount 処理
- 発生条件: 指定の Block/Inline モードで親ノード（マウント先）が取得できない
- message: `Mount target missing`
- context 例: `{ where: 'ComponentEngine.setup', mode, componentId }`
- hint: 親要素のクエリ条件やテンプレート構造を見直す。Block/Inline の設定が実 DOM と一致しているか確認

## COMP
Component / WebComponents 登録・定義。

### COMP-001 Component already defined
- どこで: WebComponents.registerComponentClass / customElements.define
- 発生条件: 既に同じタグ名で定義済みのコンポーネントを再登録しようとした
- message: `Component already defined: ${tagName}`
- context 例: `{ where: 'registerComponentClass', tagName }`
- hint: 重複定義を避けるため、定義済みチェックやタグ名の一意性を担保。ビルド/バンドルの重複読込を確認

### COMP-010 ShadowRoot not allowed
- どこで: WebComponents.createComponentClass（Shadow DOM オプション適用時）
- 発生条件: 設定や環境ポリシーにより ShadowRoot の作成が許可されていないのに使用しようとした
- message: `ShadowRoot not allowed`
- context 例: `{ where: 'createComponentClass', tagName, shadow: true }`
- hint: Shadow DOM オプションを無効化するか、対応ブラウザ/設定でのみ有効にする。スタイルのスコープ化戦略を再検討

## UPD
Updater / Renderer 系。エンジン未初期化、ReadonlyState 未初期化、レンダリング中断など。

### UPD-001 Engine not initialized
- どこで: Renderer.engine getter
- 発生条件: Renderer がエンジン未保持の状態で engine アクセスが行われたとき（通常は発生しないガード）
- message: `Engine not initialized`
- context 例: `{ where: 'Renderer.engine' }`
- hint: Renderer を new する際に IComponentEngine を必ず渡すこと

### UPD-002 ReadonlyState not initialized
- どこで: Renderer.readonlyState getter
- 発生条件: render() 実行スコープ外で readonlyState にアクセスしたとき / SetCacheableSymbol ブロック外から参照したとき
- message: `ReadonlyState not initialized`
- context 例: `{ where: 'Renderer.readonlyState' }`
- hint: readonlyState は render() 内部のみで有効。Binding 実装は applyChange(renderer) 内でのみ参照すること

### UPD-003 ListIndex is null for ref
- どこで: Renderer.reorderList
- 発生条件: 並べ替え対象として渡された要素 ref が listIndex を保持していない（リスト要素参照ではない）
- message: `ListIndex is null for ref: ${ref.key}`
- context 例: `{ refKey, pattern }`
- hint: reorderList に渡すのはリストの「要素」参照（items.* のようなワイルドカード展開済み）に限定すること

### UPD-004 ParentInfo/ListIndex inconsistency
- どこで: Renderer.reorderList
- 発生条件:
  - A: `parentInfo === null` の要素参照が渡された（親リストが特定できない）
  - B: 旧リスト上で値に対応する ListIndex が見つからない
- message:
  - A: `ParentInfo is null for ref: ${ref.key}`
  - B: `ListIndex not found for value: ${elementValue}`
- context 例: `{ refKey, pattern }` / `{ refKey: listRef.key, pattern: listRef.info.pattern }`
- hint: 親情報を保持する適切な参照を渡すこと。リスト値の同一性が保たれているか確認すること

### UPD-005 OldListValue or OldListIndexes is null
- どこで: Renderer.reorderList
- 発生条件: engine.getListAndListIndexes(listRef) が旧リスト値/旧インデックスのいずれかを返さなかった
- message: `OldListValue or OldListIndexes is null for ref: ${listRef.key}`
- context 例: `{ refKey: listRef.key, pattern: listRef.info.pattern }`
- hint: エンジン側で親リストの保存状態を正しく管理すること（初期化時に saveListAndListIndexes が呼ばれているか確認）

### UPD-006 ListDiff is null during renderItem
- どこで: Renderer.renderItem（静的依存で WILDCARD を辿る分岐）
- 発生条件: calcListDiff の再入保護（null 一時格納）状態が解消されないまま参照された場合など、ListDiff が未確定
- message: `ListDiff is null during renderItem`
- context 例: `{ refKey: ref.key, pattern: ref.info.pattern }`
- hint: 同期実行・一括キャッシュ（SetCacheableSymbol）内で処理されているか確認。Binding 側での過剰な再入を避ける

## PATH
PathManager / PathTree 系。パスノード未検出、正規化失敗、ワイルドカード整合性など。

### PATH-101 PathNode not found
- どこで: Renderer.reorderList / Renderer.render / Renderer.renderItem（動的依存）
- 発生条件:
  - 親リストの PathNode を `findPathNodeByPath(rootNode, listRef.info.pattern)` で解決できない
  - 個々の ref の PathNode を `findPathNodeByPath(rootNode, ref.info.pattern)` で解決できない
  - 動的依存の PathNode を `findPathNodeByPath(rootNode, depInfo.pattern)` で解決できない
- message: `PathNode not found: ${pattern}`
- context 例: `{ pattern }`
- hint: pattern が PathTree に登録済みか確認。PathManager の初期化順序、wildcard 展開の親パス登録漏れを点検

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
