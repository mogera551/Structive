
/**
 * リスト要素への直接操作によるリスト差分結果
 * ex.
 * swap
 * [this["list.1"], this["list.2"]] = [this["list.2"], this["list.1"]];
 * 
 * updateItemsには[
 * {info: IStructuredPathInfo("list.*"), listIndex: IListIndex2(1)} // 置き換えられた要素の情報
 * {info: IStructuredPathInfo("list.*"), listIndex: IListIndex2(2)} // 置き換えられた要素の情報
 * ]
 * 
 * replace
 * this["list.1"] = newValue;
 *
 * updateItemsには[
 * {info: IStructuredPathInfo("list.*"), listIndex: IListIndex2(1)} // 置き換えられた要素の情報
 * ]
 *
 */
