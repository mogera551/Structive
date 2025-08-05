
新しいプロキシーの責務
プリミティブなプロパティの値を返す
getterの実行

getByRef("xxx.*.value", 0) -> setLoopContext(0) -> Reflect.get(target, "xxx.*.value", receiver)

state[xxx] -> get(target, "xxx", receiver) -> Reflect.get(target, "xxx", receiver)

state[xxx.*.name] -> cloneLoopContext

内部からのアクセス
GetRaw
　スタックからリストインデックスを取得する

GetFromInternal
  構造パスとリストインデックスでアクセス
  リストインデックスをスタックしてGetRawを呼び出す

GetFromState
  構造パスもしくはインデックス済構造パス
　リストインデックスを解決し、
　　リストインデックスをスタックしてGetRawを呼び出す
　構造パス
　　構造パスをもとにリストインデックスのスタックよりリストインデックスを解決
　インデックス済構造パス
　　パスに記載されているインデックスからリストインデックスを解決

リストインデックスのスタックの仕方
　リストインデックスをスタック
　構造パスからワイルドカードパスの最後尾のパスをスタック
　　stackListIndex.push(listIndex);
  　stackStructuredPathInfo.push(info.wildcardInfos.at(-1))
　
