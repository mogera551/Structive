
// Stateの更新パターンを列挙
// 1.入力イベント -> バインド情報取得 -> State更新(Stateのプロパティ名とLoopContext取れる)
// 2.State更新内で、ワイルドカードで指定（"list.*.address.*.city"）
// 3.State更新内で、直接インデックス指定（"list.0.address.1.city"）
// 4.State更新内で、展開指定（"@list.*.address.*.city"）
// 5.State更新で関連バインド情報の更新、LoopContextを指定
