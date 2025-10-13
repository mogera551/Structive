
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



