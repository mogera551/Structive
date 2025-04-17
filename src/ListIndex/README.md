
### ListIndex

変数名(string)→変数名情報(IResolvedPathInfo)

変数参照情報(IStatePropertyRef) = 変数名情報(IResolvedPathInfo)＋リストインデックス(IListIndex?)


リストインデックスは、リストに対して一意だが、ツリー構造などで親オブジェクトを持つ場合は要注意
例
aaa.*.bbb.ccc.*.dddで

aaa.0.bbb.cccとaaa.1.bbb.cccが同じリストを指す場合
aaa.0.bbb.ccc.*.ddd + ListIndex(0)
aaa.1.bbb.ccc.*.ddd + ListIndex(0)
は同じものを指してしまい、参照できない
ListIndexはリストに対して一意でかまわないが、文脈により上位と下位のListIndexをリンクさせる必要がある
あらたにリストコンテキストを導入する
ListContext
  parentRef(変数名情報+ListContext)
  listIndex

具体的な例で検討
aaa.*.bbb.ccc.*.ddd

aaa
aaa.*
aaa.*.bbb
aaa.*.bbb.ccc
aaa.*.bbb.ccc.*
aaa.*.bbb.ccc.*.ddd

リストの変数は
aaa, aaa.*.bbb.ccc
求め方は、*の一つ前

新規にツリーを作る場合
aaaから要素に対応するListIndex、ListContextを作成

aaaに対してListContextのリストを持つ
aaa.*.bbb.cccに対してListContextのリストを持つ



ツリー構造になっているリストで、