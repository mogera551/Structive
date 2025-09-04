/**
 * 状態プロパティ参照のスコープを一時的に設定し、非同期コールバックを実行します。
 *
 * @param handler   スコープ管理用のハンドラ
 * @param info      現在の構造化パス情報
 * @param listIndex 現在のリストインデックス（ネスト対応用）
 * @param callback  スコープ内で実行する非同期処理
 *
 * スタックに info と listIndex をpushし、callback実行後に必ずpopします。
 * これにより、非同期処理中も正しいスコープ情報が維持されます。
 */
export async function asyncSetStatePropertyRef(handler, info, listIndex, callback) {
    handler.refIndex++;
    if (handler.refIndex >= handler.structuredPathInfoStack.length) {
        handler.structuredPathInfoStack.push(null);
        handler.listIndex2Stack.push(null);
    }
    handler.structuredPathInfoStack[handler.refIndex] = info;
    handler.listIndex2Stack[handler.refIndex] = listIndex;
    try {
        await callback();
    }
    finally {
        handler.structuredPathInfoStack[handler.refIndex] = null;
        handler.listIndex2Stack[handler.refIndex] = null;
        handler.refIndex--;
    }
}
