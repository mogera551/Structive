import { IBindText } from "./types";
/**
 * 取得したバインドテキスト(getBindTextByNodeType)を解析して、バインド情報を取得する
 * @param text バインドテキスト
 * @param defaultName デフォルト名
 * @returns {IBindText[]} バインド情報
 */
export declare function parseBindText(text: string): IBindText[];
