
アクセスのパターンを考える

双方向による更新
　バインド情報にループコンテキストを持つ
　プロキシにループコンテキストを設定し、prop=パターンで取得可能
  eventHandler(e) {
    const value = e.target.value;
    const [prop, listIndex] = this.binding;
    Updater.create(updater => {
      updater.getWritableState(state => {
        return state.setLoopContext(prop, listIndex, () = {
          state[prop] = value;
        })
      })
    });
  }

イベントハンドラによる更新
  eventHandler(e) {
    const handler = this.binding.handler;
    const [prop, listIndex] = this.binding;
    Updater.create(updater => {
      updater.getWritableState(state => {
        return state.setLoopContext(prop, listIndex, () = {
          return state[handler]?();
        })
      })
    })
  }

getterによるアクセス
  get "users.*.ucName"() {
    return this["users.*.name"].toUpperCase();
  }


get(target, prop, receiver) {
  prop: "users.*.name"
  prop: "users.0.name"
  

}

プロキシの機能
ループコンテキストのスタック
  パターン名
  ワイルドカードのパス
  リストインデックス
依存性トラックのスタック→ループコンテキストも兼ねる
キャッシュビルド
　値設定時にキャッシュと派生状態計算を行う
