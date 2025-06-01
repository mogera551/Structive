# 外部からのアクセスを担当するクラス

## 親コンポーネントから直接アクセス

subComponent = document.querySelector("sub-component");
subComponent.state.name = "Alice";

## data-state属性の設定(ルーティング時の値渡し)

<sub-component data-state-json="{ name:'Alice' }"></sub-component>

## 親子コンポーネントのバインド

親コンポーネント

<sub-component data-bind="state.name:user.name"

user = { name: "Alice" }

Proxyベースとすることで
subComponent.state.name = "Alice";
を実現する

下記のような書き方は見送る
subComponent.state = user;

