
# キャッシュ問題

## 書き込み時キャッシュが効かない
## そもそも更新した値をノードへ反映させるのだからキャッシュがほぼ効かないのでは？

# キャッシュ方針を変更する

## キャッシュするのは、ユーザー定義のgetterのみとする

# getterが更新されるとはどういうことか？

## 依存関係にある状態が更新された。
### 依存関係にある状態にはユーザー定義のgetterも含む

```js
class {
  get "user.profile.fullName"() {
    return this["user.profile.firstName"] + " " + this["user.profile.familyName"]
  }
  get "user.profile.openingMessage"() {
    return "welcome, " + this["user.profile.fullName"]
  }
}

```

```
// 依存元→依存先
user.profile.fullName => [user.profile.firtsName, user.profile.familyName]
user.profile.openningMessage => [user.profile.fullName] 

// 動的依存関係では下記パターンのみ
依存元（getter）→依存先（primitive）
依存元（getter）→依存先（getter）


```

# 書き込みを考える
```js
class {
  // 単純な場合
  change1(e) {
    this["user.profile.firtstName"] = e.target.value;
    // 代入後、依存ツリー（静的・動的）をたどって、getterがあれば、getterにダーティをマーク
    // ダーティマークはどこに持たせるか
    // インデックスツリーをたどりながら
  }

}


```

依存関係トラバース

パスツリー
root -> "users" -> "*" -> "name"

静的トラバース
代入されたリストについては、差分リストを求める
新規の要素に対して巡回する
代入されていないリストについては、巡回されたらそれは新規なので全部の要素が巡回対象
いちいち差分を求めない

動的トラバース
依存先→依存元へ巡回
依存先と依存元でインデックスを共有する場合、インデックスを引き継ぐ
インデックスを引き継げない場合、インデックスをすべて展開する
静的トラバースを全部行ったあとで、動的トラバースを行う

トラバース処理
　静的トラバース→依存先のトラバース処理
　動的トラバース→依存先のトラバース処理
　この処理では、静的トラバース中に動的トラバースが行う可能性がある
　動的トラバースの依存先だけ取得しておいて、トラバース処理後に動的トラバース処理を行う
