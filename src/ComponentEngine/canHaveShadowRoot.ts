/**
 * 指定したタグ名の要素がShadowRootを持てるかどうかを判定するユーティリティ関数。
 *
 * - 指定タグ名で要素を生成し、attachShadowメソッドが存在するかどうかで判定
 * - 無効なタグ名やattachShadow未対応の場合はfalseを返す
 *
 * @param tagName 判定したい要素のタグ名（例: "div", "span", "input" など）
 * @returns       ShadowRootを持てる場合はtrue、持てない場合はfalse
 */
export function canHaveShadowRoot(tagName: string): boolean {
  try {
    // 一時的に要素を作成
    const element = document.createElement(tagName);
    // `attachShadow` メソッドが存在し、実行可能かを確認
    if (typeof element.attachShadow !== "function") {
      return false;
    }
    // 一時的にShadowRootをアタッチしてみる
    const shadowRoot = element.attachShadow({ mode: 'open' });
    return true;
  } catch {
    // 無効なタグ名などが渡された場合は false を返す
    return false;
  }
}
