/**
 * errorMessages.ts
 *
 * フィルタ関数などで利用するエラーメッセージ生成ユーティリティです。
 *
 * 主な役割:
 * - フィルタのオプションや値の型チェックで条件を満たさない場合に、分かりやすいエラーメッセージを投げる
 * - 関数名を引数に取り、どのフィルタでエラーが発生したかを明示
 *
 * 設計ポイント:
 * - optionsRequired: オプションが必須なフィルタで未指定時にエラー
 * - optionMustBeNumber: オプション値が数値でない場合にエラー
 * - valueMustBeNumber: 値が数値でない場合にエラー
 * - valueMustBeBoolean: 値がbooleanでない場合にエラー
 * - valueMustBeDate: 値がDateでない場合にエラー
 */
export function optionsRequired(fnName:string): never {
  throw new Error(`${fnName} requires at least one option`);
}

export function optionMustBeNumber(fnName:string): never {
  throw new Error(`${fnName} requires a number as option`);
}

export function valueMustBeNumber(fnName:string): never {
  throw new Error(`${fnName} requires a number value`);
}

export function valueMustBeBoolean(fnName:string): never {
  throw new Error(`${fnName} requires a boolean value`);
}

export function valueMustBeDate(fnName:string): never {
  throw new Error(`${fnName} requires a date value`);
}