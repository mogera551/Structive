import { getGlobalConfig } from "../WebComponents/getGlobalConfig.js";
import { optionMustBeNumber, optionsRequired, valueMustBeBoolean, valueMustBeDate, valueMustBeNumber } from "./errorMessages.js";
const config = getGlobalConfig();
const eq = (options) => {
    const opt = options?.[0] ?? optionsRequired('eq');
    const optValue = Number(opt);
    if (isNaN(optValue))
        optionMustBeNumber('eq');
    return (value) => {
        if (typeof value !== 'number')
            valueMustBeNumber('eq');
        return value === optValue;
    };
};
const ne = (options) => {
    const opt = options?.[0] ?? optionsRequired('ne');
    const optValue = Number(opt);
    if (isNaN(optValue))
        optionMustBeNumber('ne');
    return (value) => {
        if (typeof value !== 'number')
            valueMustBeNumber('ne');
        return value !== optValue;
    };
};
const not = (options) => {
    return (value) => {
        if (typeof value !== 'boolean')
            valueMustBeBoolean('not');
        return !value;
    };
};
const lt = (options) => {
    const opt = options?.[0] ?? optionsRequired('lt');
    const optValue = Number(opt);
    if (isNaN(optValue))
        optionMustBeNumber('lt');
    return (value) => {
        if (typeof value !== 'number')
            valueMustBeNumber('lt');
        return value < optValue;
    };
};
const le = (options) => {
    const opt = options?.[0] ?? optionsRequired('le');
    const optValue = Number(opt);
    if (isNaN(optValue))
        optionMustBeNumber('le');
    return (value) => {
        if (typeof value !== 'number')
            valueMustBeNumber('le');
        return value <= optValue;
    };
};
const gt = (options) => {
    const opt = options?.[0] ?? optionsRequired('gt');
    const optValue = Number(opt);
    if (isNaN(optValue))
        optionMustBeNumber('gt');
    return (value) => {
        if (typeof value !== 'number')
            valueMustBeNumber('gt');
        return value > optValue;
    };
};
const ge = (options) => {
    const opt = options?.[0] ?? optionsRequired('ge');
    const optValue = Number(opt);
    if (isNaN(optValue))
        optionMustBeNumber('ge');
    return (value) => {
        if (typeof value !== 'number')
            valueMustBeNumber('ge');
        return value >= optValue;
    };
};
const inc = (options) => {
    const opt = options?.[0] ?? optionsRequired('inc');
    const optValue = Number(opt);
    if (isNaN(optValue))
        optionMustBeNumber('inc');
    return (value) => {
        if (typeof value !== 'number')
            valueMustBeNumber('inc');
        return value + optValue;
    };
};
const dec = (options) => {
    const opt = options?.[0] ?? optionsRequired('dec');
    const optValue = Number(opt);
    if (isNaN(optValue))
        optionMustBeNumber('dec');
    return (value) => {
        if (typeof value !== 'number')
            valueMustBeNumber('dec');
        return value - optValue;
    };
};
const mul = (options) => {
    const opt = options?.[0] ?? optionsRequired('mul');
    const optValue = Number(opt);
    if (isNaN(optValue))
        optionMustBeNumber('mul');
    return (value) => {
        if (typeof value !== 'number')
            valueMustBeNumber('mul');
        return value * optValue;
    };
};
const div = (options) => {
    const opt = options?.[0] ?? optionsRequired('div');
    const optValue = Number(opt);
    if (isNaN(optValue))
        optionMustBeNumber('div');
    return (value) => {
        if (typeof value !== 'number')
            valueMustBeNumber('div');
        return value / optValue;
    };
};
const fix = (options) => {
    const opt = options?.[0] ?? 0;
    const optValue = Number(opt);
    if (isNaN(optValue))
        optionMustBeNumber('div');
    return (value) => {
        if (typeof value !== 'number')
            valueMustBeNumber('div');
        return value.toFixed(optValue);
    };
};
const locale = (options) => {
    const opt = options?.[0] ?? config.locale;
    return (value) => {
        if (typeof value !== 'number')
            valueMustBeNumber('locale');
        return value.toLocaleString(opt);
    };
};
const uc = (options) => {
    return (value) => {
        return value.toString().toUpperCase();
    };
};
const lc = (options) => {
    return (value) => {
        return value.toString().toLowerCase();
    };
};
const cap = (options) => {
    return (value) => {
        const v = value.toString();
        if (v.length === 0)
            return v;
        if (v.length === 1)
            return v.toUpperCase();
        return v.charAt(0).toUpperCase() + v.slice(1);
    };
};
const trim = (options) => {
    return (value) => {
        return value.toString().trim();
    };
};
const slice = (options) => {
    const opt = options?.[0] ?? optionsRequired('slice');
    const optValue = Number(opt);
    if (isNaN(optValue))
        optionMustBeNumber('slice');
    return (value) => {
        return value.toString().slice(optValue);
    };
};
const substr = (options) => {
    const opt1 = options?.[0] ?? optionsRequired('substr');
    const opt1Value = Number(opt1);
    if (isNaN(opt1Value))
        optionMustBeNumber('substr');
    const opt2 = options?.[1] ?? optionsRequired('substr');
    const opt2Value = Number(opt2);
    if (isNaN(opt2Value))
        optionMustBeNumber('substr');
    return (value) => {
        return value.toString().substr(opt1Value, opt2Value);
    };
};
const pad = (options) => {
    const opt1 = options?.[0] ?? optionsRequired('pad');
    const opt1Value = Number(opt1);
    if (isNaN(opt1Value))
        optionMustBeNumber('pad');
    const opt2 = options?.[1] ?? '0';
    const opt2Value = opt2;
    return (value) => {
        return value.toString().padStart(opt1Value, opt2Value);
    };
};
const rep = (options) => {
    const opt = options?.[0] ?? optionsRequired('rep');
    const optValue = Number(opt);
    if (isNaN(optValue))
        optionMustBeNumber('rep');
    return (value) => {
        return value.toString().repeat(optValue);
    };
};
const rev = (options) => {
    return (value) => {
        return value.toString().split('').reverse().join('');
    };
};
const int = (options) => {
    return (value) => {
        return parseInt(value, 10);
    };
};
const float = (options) => {
    return (value) => {
        return parseFloat(value);
    };
};
const round = (options) => {
    const opt = options?.[0] ?? 0;
    const optValue = Math.pow(10, Number(opt));
    if (isNaN(optValue))
        optionMustBeNumber('round');
    return (value) => {
        if (typeof value !== 'number')
            valueMustBeNumber('round');
        return Math.round(value * optValue) / optValue;
    };
};
const floor = (options) => {
    const opt = options?.[0] ?? 0;
    const optValue = Math.pow(10, Number(opt));
    if (isNaN(optValue))
        optionMustBeNumber('floor');
    return (value) => {
        if (typeof value !== 'number')
            valueMustBeNumber('floor');
        return Math.floor(value * optValue) / optValue;
    };
};
const ceil = (options) => {
    const opt = options?.[0] ?? 0;
    const optValue = Math.pow(10, Number(opt));
    if (isNaN(optValue))
        optionMustBeNumber('ceil');
    return (value) => {
        if (typeof value !== 'number')
            valueMustBeNumber('ceil');
        return Math.ceil(value * optValue) / optValue;
    };
};
const percent = (options) => {
    const opt = options?.[0] ?? 0;
    const optValue = Number(opt);
    if (isNaN(optValue))
        optionMustBeNumber('percent');
    return (value) => {
        if (typeof value !== 'number')
            valueMustBeNumber('percent');
        return value.toFixed(optValue) + '%';
    };
};
const date = (options) => {
    const opt = options?.[0] ?? config.locale;
    return (value) => {
        if (!(value instanceof Date))
            valueMustBeDate('date');
        return value.toLocaleDateString(config.locale);
    };
};
const time = (options) => {
    const opt = options?.[0] ?? config.locale;
    return (value) => {
        if (!(value instanceof Date))
            valueMustBeDate('time');
        return value.toLocaleTimeString(config.locale);
    };
};
const datetime = (options) => {
    const opt = options?.[0] ?? config.locale;
    return (value) => {
        if (!(value instanceof Date))
            valueMustBeDate('datetime');
        return value.toLocaleString(config.locale);
    };
};
const ymd = (options) => {
    const opt = options?.[0] ?? '-';
    return (value) => {
        if (!(value instanceof Date))
            valueMustBeDate('ymd');
        const year = value.getFullYear().toString();
        const month = (value.getMonth() + 1).toString().padStart(2, '0');
        const day = value.getDate().toString().padStart(2, '0');
        return `${year}${opt}${month}${opt}${day}`;
    };
};
const falsy = (options) => {
    return (value) => value === false || value === null || value === undefined || value === 0 || value === '' || Number.isNaN(value);
};
const truthy = (options) => {
    return (value) => value !== false && value !== null && value !== undefined && value !== 0 && value !== '' && !Number.isNaN(value);
};
const defaults = (options) => {
    const opt = options?.[0] ?? optionsRequired('defaults');
    return (value) => {
        if (value === false || value === null || value === undefined || value === 0 || value === '' || Number.isNaN(value))
            return opt;
        return value;
    };
};
const boolean = (options) => {
    return (value) => {
        return Boolean(value);
    };
};
const number = (options) => {
    return (value) => {
        return Number(value);
    };
};
const string = (options) => {
    return (value) => {
        return String(value);
    };
};
const _null = (options) => {
    return (value) => {
        return (value === "") ? null : value;
    };
};
const builtinFilters = {
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
export const builtinFilterFn = (name, options) => (filters) => {
    const filter = filters[name];
    if (!filter)
        throw new Error(`outputBuiltinFiltersFn: filter not found: ${name}`);
    return filter(options);
};
