/**
 * render.ts
 *
 * DataBindingのバインディング配列を受け取り、各バインディングのrender処理を実行するユーティリティ関数です。
 *
 * 主な役割:
 * - bindings配列を走査し、isSelectElementフラグが立っているものは後回しでレンダリング
 * - それ以外のバインディングは即時renderを実行
 * - select要素のバインディングは最後にまとめてrenderを実行（依存関係や描画順序の問題を回避）
 *
 * 設計ポイント:
 * - select要素の描画順序を制御することで、option要素のバインディングや値の整合性を担保
 * - 通常のバインディングとselect要素のバインディングを分離して処理
 */
import { IBinding } from "../DataBinding/types";

export function render(bindings: IBinding[]) {
  const bindingsWithSelectElement = [];
  for(let i = 0; i < bindings.length; i++) {
    const binding = bindings[i];
    if (binding.bindingNode.isSelectElement) {
      bindingsWithSelectElement.push(binding);
    } else {
      binding.render();
    }
  }
  for(let i = 0; i < bindingsWithSelectElement.length; i++) {
    bindingsWithSelectElement[i].render();
  }
}
