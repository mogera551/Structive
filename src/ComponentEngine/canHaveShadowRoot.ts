export function canHaveShadowRoot(tagName: string): boolean {
  try {
    // 一時的に要素を作成
    const element = document.createElement(tagName);
    // `attachShadow` メソッドが存在し、実行可能かを確認
    return typeof element.attachShadow === "function";
  } catch {
    // 無効なタグ名などが渡された場合は false を返す
    return false;
  }
}