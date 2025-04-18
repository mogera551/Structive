import { getGlobalConfig } from "../WebComponents/getGlobalConfig";
import { optionMustBeNumber, optionsRequired, valueMustBeBoolean, valueMustBeDate, valueMustBeNumber } from "./errorMessages";
import { FilterWithOptions } from "./types";

const config = getGlobalConfig();

const eq = (options?:string[]) => {
  const opt = options?.[0] ?? optionsRequired('eq');
  const optValue = Number(opt);
  if (isNaN(optValue)) optionMustBeNumber('eq');
  return (value: any) => {
    if (typeof value !== 'number') valueMustBeNumber('eq');
    return value === optValue;
  }
}

const ne = (options?:string[]) => {
  const opt = options?.[0] ?? optionsRequired('ne');
  const optValue = Number(opt);
  if (isNaN(optValue)) optionMustBeNumber('ne');
  return (value: any) => {
    if (typeof value !== 'number') valueMustBeNumber('ne');
    return value !== optValue;
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
  if (isNaN(optValue)) optionMustBeNumber('div');
  return (value: any) => {
    if (typeof value !== 'number') valueMustBeNumber('div');
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
    return value.toFixed(optValue) + '%';
  }
}

const date = (options?:string[]) => {
  const opt = options?.[0] ?? config.locale;
  return (value: any) => {
    if (!(value instanceof Date))  valueMustBeDate('date');
    return value.toLocaleDateString(config.locale);
  }
}

const time = (options?:string[]) => {
  const opt = options?.[0] ?? config.locale;
  return (value: any) => {
    if (!(value instanceof Date)) valueMustBeDate('time');
    return value.toLocaleTimeString(config.locale);
  }
}

const datetime = (options?:string[]) => {
  const opt = options?.[0] ?? config.locale;
  return (value: any) => {
    if (!(value instanceof Date)) valueMustBeDate('datetime');
    return value.toLocaleString(config.locale);
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
  eq,
  ne,
  not,
  
  lt,
  le,
  gt,
  ge,

  inc,
  dec,
  mul,
  div,

  fix,
  locale,
  uc,
  lc,
  cap,
  trim,
  slice,
  substr,
  pad,
  rep,
  rev,

  int,
  float,
  round,
  floor,
  ceil,
  percent,

  date,
  time,
  datetime,
  ymd,

  falsy,
  truthy,
  defaults,

  boolean,
  number,
  string,
  "null": _null,
};

export const outputBuiltinFilters = builtinFilters;
export const inputBuiltinFilters = builtinFilters;

export const builtinFilterFn = (name:string, options: string[]) => (filters: FilterWithOptions) => {
  const filter = filters[name];
  if (!filter) throw new Error(`outputBuiltinFiltersFn: filter not found: ${name}`);
  return filter(options);
}

