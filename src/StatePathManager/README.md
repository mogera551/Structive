
テンプレートと状態クラスからパス情報を収集する（静的解析）
getter実行時の解析→依存関係の登録（動的解析）

class TrackGetter {
  stack = [];

  tracking(prop, callback) {
    const last = stack.at(-1);
    if (typeof last !== "undefined") {
      addDynamicDependent(prop, last)
    }
    stack.push(prop);
    try {
      callback();
    } finally {
      stack.pop();
    }

  }

}


