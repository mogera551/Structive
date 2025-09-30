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
import { raiseError } from "../utils";

export function optionsRequired(fnName:string): never {
  raiseError({
    code: "FLT-202",
    message: `${fnName} requires at least one option`,
    context: { fnName },
    docsUrl: "./docs/error-codes.md#flt",
  });
}

export function optionMustBeNumber(fnName:string): never {
  raiseError({
    code: "FLT-202",
    message: `${fnName} requires a number as option`,
    context: { fnName },
    docsUrl: "./docs/error-codes.md#flt",
  });
}

export function valueMustBeNumber(fnName:string): never {
  raiseError({
    code: "FLT-202",
    message: `${fnName} requires a number value`,
    context: { fnName },
    docsUrl: "./docs/error-codes.md#flt",
  });
}

export function valueMustBeBoolean(fnName:string): never {
  raiseError({
    code: "FLT-202",
    message: `${fnName} requires a boolean value`,
    context: { fnName },
    docsUrl: "./docs/error-codes.md#flt",
  });
}

export function valueMustBeDate(fnName:string): never {
  raiseError({
    code: "FLT-202",
    message: `${fnName} requires a date value`,
    context: { fnName },
    docsUrl: "./docs/error-codes.md#flt",
  });
}