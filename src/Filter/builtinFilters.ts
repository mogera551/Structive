/**
 * builtinFilters.ts
 *
 * Structiveで利用可能な組み込みフィルタ関数群の実装ファイルです。
 *
 * 主な役割:
 * - 数値・文字列・日付・真偽値などの変換・比較・整形・判定用フィルタを提供
 * - フィルタ名ごとにオプション付きの関数を定義し、バインディング時に柔軟に利用可能
 * - input/output両方のフィルタとして共通利用できる設計
 *
 * 設計ポイント:
 * - eq, ne, lt, gt, inc, fix, locale, uc, lc, cap, trim, slice, pad, int, float, round, date, time, ymd, falsy, truthy, defaults, boolean, number, string, null など多彩なフィルタを網羅
 * - オプション値の型チェックやエラーハンドリングも充実
 * - FilterWithOptions型でフィルタ関数群を一元管理し、拡張も容易
 * - builtinFilterFnでフィルタ名・オプションからフィルタ関数を動的に取得可能
 */
import { getGlobalConfig } from "../WebComponents/getGlobalConfig.js";
import { raiseError } from "../utils.js";
import { optionMustBeNumber, optionsRequired, valueMustBeBoolean, valueMustBeDate, valueMustBeNumber } from "./errorMessages.js";
import { FilterWithOptions } from "./types";

const config = getGlobalConfig();

const eq = (options?:string[]) => {
  const opt = options?.[0] ?? optionsRequired('eq');
  return (value: any) => {
    // 型を揃えて比較
    if (typeof value === 'number') {
      const optValue = Number(opt);
      if (isNaN(optValue)) optionMustBeNumber('eq');
      return value === optValue;
    }
    if (typeof value === 'string') {
      return value === opt;
    }
    // その他は厳密等価
    return value === opt;
  }
}

const ne = (options?:string[]) => {
  const opt = options?.[0] ?? optionsRequired('ne');
  return (value: any) => {
    // 型を揃えて比較
    if (typeof value === 'number') {
      const optValue = Number(opt);
      if (isNaN(optValue)) optionMustBeNumber('ne');
      return value !== optValue;
    }
    if (typeof value === 'string') {
      return value !== opt;
    }
    // その他は厳密等価
    return value !== opt;
  }
}

const not = (options?:string[]) => {
  return (value: any) => {
    if (typeof value !== 'boolean') valueMustBeBoolean('not');
    return !value;
  }
}

const lt = (options?:string[]) => {
  const opt = options?.[0] ?? optionsRequired('lt');
  const optValue = Number(opt);
  if (isNaN(optValue)) optionMustBeNumber('lt');
  return (value: any) => {
    if (typeof value !== 'number') valueMustBeNumber('lt');
    return value < optValue;
  }
}

const le = (options?:string[]) => {
  const opt = options?.[0] ?? optionsRequired('le');
  const optValue = Number(opt);
  if (isNaN(optValue)) optionMustBeNumber('le');
  return (value: any) => {
    if (typeof value !== 'number') valueMustBeNumber('le');
    return value <= optValue;
  }
}

const gt = (options?:string[]) => {
  const opt = options?.[0] ?? optionsRequired('gt');
  const optValue = Number(opt);
  if (isNaN(optValue)) optionMustBeNumber('gt');
  return (value: any) => {
    if (typeof value !== 'number') valueMustBeNumber('gt');
    return value > optValue;
  }
}

const ge = (options?:string[]) => {
  const opt = options?.[0] ?? optionsRequired('ge');
  const optValue = Number(opt);
  if (isNaN(optValue)) optionMustBeNumber('ge');
  return (value: any) => {
    if (typeof value !== 'number') valueMustBeNumber('ge');
    return value >= optValue;
  }
}

const inc = (options?:string[]) => {
  const opt = options?.[0] ?? optionsRequired('inc');
  const optValue = Number(opt);
  if (isNaN(optValue)) optionMustBeNumber('inc');
  return (value: any) => {
    if (typeof value !== 'number') valueMustBeNumber('inc');
    return value + optValue;
  }
}

const dec = (options?:string[]) => {
  const opt = options?.[0] ?? optionsRequired('dec');
  const optValue = Number(opt);
  if (isNaN(optValue)) optionMustBeNumber('dec');
  return (value: any) => {
    if (typeof value !== 'number') valueMustBeNumber('dec');
    return value - optValue;
  }
}

const mul = (options?:string[]) => {
  const opt = options?.[0] ?? optionsRequired('mul');
  const optValue = Number(opt);
  if (isNaN(optValue)) optionMustBeNumber('mul');
  return (value: any) => {
    if (typeof value !== 'number') valueMustBeNumber('mul');
    return value * optValue;
  }
}

const div = (options?:string[]) => {
  const opt = options?.[0] ?? optionsRequired('div');
  const optValue = Number(opt);
  if (isNaN(optValue)) optionMustBeNumber('div');
  return (value: any) => {
    if (typeof value !== 'number') valueMustBeNumber('div');
    return value / optValue;
  }
}

const fix = (options?:string[]) => {
  const opt = options?.[0] ?? 0;
  const optValue = Number(opt);
  if (isNaN(optValue)) optionMustBeNumber('fix');
  return (value: any) => {
    if (typeof value !== 'number') valueMustBeNumber('fix');
    return value.toFixed(optValue);
  }
}

const locale = (options?:string[]) => {
  const opt = options?.[0] ?? config.locale;
  return (value: any) => {
    if (typeof value !== 'number') valueMustBeNumber('locale');
    return value.toLocaleString(opt);
  }
}

const uc = (options?:string[]) => {
  return (value: any) => {
    return value.toString().toUpperCase();
  }
}

const lc = (options?:string[]) => {
  return (value: any) => {
    return value.toString().toLowerCase();
  }
}

const cap = (options?:string[]) => {
  return (value: any) => {
    const v = value.toString();
    if (v.length === 0) return v;
    if (v.length === 1) return v.toUpperCase();
    return v.charAt(0).toUpperCase() + v.slice(1);
  }
}

const trim = (options?:string[]) => {
  return (value: any) => {
    return value.toString().trim();
  }
}

const slice = (options?:string[]) => {
  const opt = options?.[0] ?? optionsRequired('slice');
  const optValue = Number(opt);
  if (isNaN(optValue)) optionMustBeNumber('slice');
  return (value: any) => {
    return value.toString().slice(optValue);
  }
}

const substr = (options?:string[]) => {
  const opt1 = options?.[0] ?? optionsRequired('substr');
  const opt1Value = Number(opt1);
  if (isNaN(opt1Value)) optionMustBeNumber('substr');
  const opt2 = options?.[1] ?? optionsRequired('substr');
  const opt2Value = Number(opt2);
  if (isNaN(opt2Value)) optionMustBeNumber('substr');
  return (value: any) => {
    return value.toString().substr(opt1Value, opt2Value);
  }
}

const pad = (options?:string[]) => {
  const opt1 = options?.[0] ?? optionsRequired('pad');
  const opt1Value = Number(opt1);
  if (isNaN(opt1Value)) optionMustBeNumber('pad');
  const opt2 = options?.[1] ?? '0';
  const opt2Value = opt2;
  return (value: any) => {
    return value.toString().padStart(opt1Value, opt2Value);
  }
}

const rep = (options?:string[]) => {
  const opt = options?.[0] ?? optionsRequired('rep');
  const optValue = Number(opt);
  if (isNaN(optValue)) optionMustBeNumber('rep');
  return (value: any) => {
    return value.toString().repeat(optValue);
  }
}

const rev = (options?:string[]) => {
  return (value: any) => {
    return value.toString().split('').reverse().join('');
  }
}

const int = (options?:string[]) => {
  return (value: any) => {
    return parseInt(value, 10);
  }
}

const float = (options?:string[]) => {
  return (value: any) => {
    return parseFloat(value);
  }
}

const round = (options?:string[]) => {
  const opt = options?.[0] ?? 0;
  const optValue = Math.pow(10, Number(opt));
  if (isNaN(optValue)) optionMustBeNumber('round');
  return (value: any) => {
    if (typeof value !== 'number') valueMustBeNumber('round');
    return Math.round(value * optValue) / optValue;
  }
}

const floor = (options?:string[]) => {
  const opt = options?.[0] ?? 0;
  const optValue = Math.pow(10, Number(opt));
  if (isNaN(optValue)) optionMustBeNumber('floor');
  return (value: any) => {
    if (typeof value !== 'number') valueMustBeNumber('floor');
    return Math.floor(value * optValue) / optValue;
  }
}

const ceil = (options?:string[]) => {
  const opt = options?.[0] ?? 0;
  const optValue = Math.pow(10, Number(opt));
  if (isNaN(optValue)) optionMustBeNumber('ceil');
  return (value: any) => {
    if (typeof value !== 'number') valueMustBeNumber('ceil');
    return Math.ceil(value * optValue) / optValue;
  }
}

const percent = (options?:string[]) => {
  const opt = options?.[0] ?? 0;
  const optValue = Number(opt);
  if (isNaN(optValue)) optionMustBeNumber('percent');
  return (value: any) => {
    if (typeof value !== 'number') valueMustBeNumber('percent');
    return (value * 100).toFixed(optValue) + '%';
  }
}

const date = (options?:string[]) => {
  const opt = options?.[0] ?? config.locale;
  return (value: any) => {
    if (!(value instanceof Date))  valueMustBeDate('date');
    return value.toLocaleDateString(opt);
  }
}

const time = (options?:string[]) => {
  const opt = options?.[0] ?? config.locale;
  return (value: any) => {
    if (!(value instanceof Date)) valueMustBeDate('time');
    return value.toLocaleTimeString(opt);
  }
}

const datetime = (options?:string[]) => {
  const opt = options?.[0] ?? config.locale;
  return (value: any) => {
    if (!(value instanceof Date)) valueMustBeDate('datetime');
    return value.toLocaleString(opt);
  }
}

const ymd = (options?:string[]) => {
  const opt = options?.[0] ?? '-';
  return (value: any) => {
    if (!(value instanceof Date)) valueMustBeDate('ymd');
    const year = value.getFullYear().toString();
    const month = (value.getMonth() + 1).toString().padStart(2, '0');
    const day = value.getDate().toString().padStart(2, '0');
    return `${year}${opt}${month}${opt}${day}`;
  }
}

const falsy = (options?:string[]) => {
  return (value: any) => value === false || value === null || value === undefined || value === 0 || value === '' || Number.isNaN(value);
}

const truthy = (options?:string[]) => {
  return (value: any) =>value !== false && value !== null && value !== undefined && value !== 0 && value !== '' && !Number.isNaN(value);
}

const defaults = (options?:string[]) => {
  const opt = options?.[0] ?? optionsRequired('defaults');
  return (value: any) => {
    if (value === false || value === null || value === undefined || value === 0 || value === '' || Number.isNaN(value)) return opt;
    return value;
  }
}

const boolean = (options?:string[]) => {
  return (value: any) => {
    return Boolean(value);
  }
}

const number = (options?:string[]) => {
  return (value: any) => {
    return Number(value);
  }
}

const string = (options?:string[]) => {
  return (value: any) => {
    return String(value);
  }
}

const _null = (options?:string[]) => {
  return (value: any) => {
    return (value === "") ? null : value;
  } 
}

const builtinFilters: FilterWithOptions = {
  "eq": eq,
  "ne": ne,
  "not": not,

  "lt": lt,
  "le": le,
  "gt": gt,
  "ge": ge,

  "inc": inc,
  "dec": dec,
  "mul": mul,
  "div": div,

  "fix": fix,
  "locale": locale,
  "uc": uc,
  "lc": lc,
  "cap": cap,
  "trim": trim,
  "slice": slice,
  "substr": substr,
  "pad": pad,
  "rep": rep,
  "rev": rev,

  "int": int,
  "float": float,
  "round": round,
  "floor": floor,
  "ceil": ceil,
  "percent": percent,

  "date": date,
  "time": time,
  "datetime": datetime,
  "ymd": ymd,

  "falsy": falsy,
  "truthy": truthy,
  "defaults": defaults,

  "boolean": boolean,
  "number": number,
  "string": string,
  "null": _null,
};

export const outputBuiltinFilters = builtinFilters;
export const inputBuiltinFilters = builtinFilters;

export const builtinFilterFn = (name:string, options: string[]) => (filters: FilterWithOptions) => {
  const filter = filters[name];
  if (!filter) {
    raiseError({
      code: "FLT-201",
      message: `Filter not found: ${name}`,
      context: { where: 'builtinFilterFn', name },
      docsUrl: "./docs/error-codes.md#flt",
    });
  }
  return filter(options);
}

