# 子コンポーネントから外部へのアクセス
親子コンポーネントバインドを行った場合

パスが親コンポーネントアクセスの対象かどうかを調べるメソッドを持つ

if (stateOutput.startsWith(path)) {
  return stateOutput.get(path);
}

if (stateOutput.startsWith(path)) {
  return stateOutput.set(path, value);
}
