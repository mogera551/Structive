const globalConfig = {
    "debug": false,
    "locale": "en-US", // The locale of the component, ex. "en-US", default is "en-US"
    "enableShadowDom": true, // Whether to use Shadow DOM or not
    "enableMainWrapper": true, // Whether to use the main wrapper or not
    "enableRouter": true, // Whether to use the router or not
    "autoInsertMainWrapper": false, // Whether to automatically insert the main wrapper or not
    "autoInit": true, // Whether to automatically initialize the component or not
    "mainTagName": "app-main", // The tag name of the main wrapper, default is "app-main"
    "routerTagName": "view-router", // The tag name of the router, default is "view-router"
    "layoutPath": "", // The path to the layout file, default is ""
    "autoLoadFromImportMap": false, // Whether to automatically load the component from the import map or not
    "optimizeList": true, // Whether to optimize the list or not
    "optimizeListElements": true, // Whether to optimize the list elements or not
    "optimizeAccessor": true, // Whether to optimize the accessors or not
};
function getGlobalConfig() {
    return globalConfig;
}
const config$2 = getGlobalConfig();

function raiseError(messageOrPayload) {
    if (typeof messageOrPayload === "string") {
        throw new Error(messageOrPayload);
    }
    const { message, code, context, hint, docsUrl, severity, cause } = messageOrPayload;
    const err = new Error(message);
    // 追加情報はプロパティとして付与（メッセージは既存互換のまま）
    err.code = code;
    if (context)
        err.context = context;
    if (hint)
        err.hint = hint;
    if (docsUrl)
        err.docsUrl = docsUrl;
    if (severity)
        err.severity = severity;
    if (cause)
        err.cause = cause;
    throw err;
}

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
function optionsRequired(fnName) {
    raiseError({
        code: "FLT-202",
        message: `${fnName} requires at least one option`,
        context: { fnName },
        docsUrl: "./docs/error-codes.md#flt",
    });
}
function optionMustBeNumber(fnName) {
    raiseError({
        code: "FLT-202",
        message: `${fnName} requires a number as option`,
        context: { fnName },
        docsUrl: "./docs/error-codes.md#flt",
    });
}
function valueMustBeNumber(fnName) {
    raiseError({
        code: "FLT-202",
        message: `${fnName} requires a number value`,
        context: { fnName },
        docsUrl: "./docs/error-codes.md#flt",
    });
}
function valueMustBeBoolean(fnName) {
    raiseError({
        code: "FLT-202",
        message: `${fnName} requires a boolean value`,
        context: { fnName },
        docsUrl: "./docs/error-codes.md#flt",
    });
}
function valueMustBeDate(fnName) {
    raiseError({
        code: "FLT-202",
        message: `${fnName} requires a date value`,
        context: { fnName },
        docsUrl: "./docs/error-codes.md#flt",
    });
}

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
const config$1 = getGlobalConfig();
const eq = (options) => {
    const opt = options?.[0] ?? optionsRequired('eq');
    return (value) => {
        // 型を揃えて比較
        if (typeof value === 'number') {
            const optValue = Number(opt);
            if (isNaN(optValue))
                optionMustBeNumber('eq');
            return value === optValue;
        }
        if (typeof value === 'string') {
            return value === opt;
        }
        // その他は厳密等価
        return value === opt;
    };
};
const ne = (options) => {
    const opt = options?.[0] ?? optionsRequired('ne');
    return (value) => {
        // 型を揃えて比較
        if (typeof value === 'number') {
            const optValue = Number(opt);
            if (isNaN(optValue))
                optionMustBeNumber('ne');
            return value !== optValue;
        }
        if (typeof value === 'string') {
            return value !== opt;
        }
        // その他は厳密等価
        return value !== opt;
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
        optionMustBeNumber('fix');
    return (value) => {
        if (typeof value !== 'number')
            valueMustBeNumber('fix');
        return value.toFixed(optValue);
    };
};
const locale = (options) => {
    const opt = options?.[0] ?? config$1.locale;
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
const trim$1 = (options) => {
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
        return (value * 100).toFixed(optValue) + '%';
    };
};
const date = (options) => {
    const opt = options?.[0] ?? config$1.locale;
    return (value) => {
        if (!(value instanceof Date))
            valueMustBeDate('date');
        return value.toLocaleDateString(opt);
    };
};
const time = (options) => {
    const opt = options?.[0] ?? config$1.locale;
    return (value) => {
        if (!(value instanceof Date))
            valueMustBeDate('time');
        return value.toLocaleTimeString(opt);
    };
};
const datetime = (options) => {
    const opt = options?.[0] ?? config$1.locale;
    return (value) => {
        if (!(value instanceof Date))
            valueMustBeDate('datetime');
        return value.toLocaleString(opt);
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
    "trim": trim$1,
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
const outputBuiltinFilters = builtinFilters;
const inputBuiltinFilters = builtinFilters;

let id$2 = 0;
function generateId() {
    return ++id$2;
}

/**
 * registerStateClass.ts
 *
 * StateClassインスタンスをIDで登録・取得するための管理モジュールです。
 *
 * 主な役割:
 * - stateClassById: IDをキーにStateClassインスタンスを管理するレコード
 * - registerStateClass: 指定IDでStateClassインスタンスを登録
 * - getStateClassById: 指定IDのStateClassインスタンスを取得（未登録時はエラーを投げる）
 *
 * 設計ポイント:
 * - グローバルにStateClassインスタンスを一元管理し、ID経由で高速にアクセス可能
 * - 存在しないIDアクセス時はraiseErrorで明確な例外を発生
 */
const stateClassById = {};
function registerStateClass(id, stateClass) {
    stateClassById[id] = stateClass;
}
function getStateClassById(id) {
    return stateClassById[id] ?? raiseError({
        code: "STATE-101",
        message: `StateClass not found: ${id}`,
        context: { where: 'registerStateClass.getStateClassById', stateClassId: id },
        docsUrl: "./docs/error-codes.md#state",
    });
}

/**
 * registerStyleSheet.ts
 *
 * CSSStyleSheetインスタンスをIDで登録・取得するための管理モジュールです。
 *
 * 主な役割:
 * - styleSheetById: IDをキーにCSSStyleSheetインスタンスを管理するレコード
 * - registerStyleSheet: 指定IDでCSSStyleSheetインスタンスを登録
 * - getStyleSheetById: 指定IDのCSSStyleSheetインスタンスを取得（未登録時はエラーを投げる）
 *
 * 設計ポイント:
 * - グローバルにCSSStyleSheetインスタンスを一元管理し、ID経由で高速にアクセス可能
 * - 存在しないIDアクセス時はraiseErrorで明確な例外を発生
 */
const styleSheetById = {};
function registerStyleSheet(id, css) {
    styleSheetById[id] = css;
}
function getStyleSheetById(id) {
    return styleSheetById[id] ?? raiseError({
        code: "CSS-001",
        message: `Stylesheet not found: ${id}`,
        context: { where: 'registerStyleSheet.getStyleSheetById', styleSheetId: id },
        docsUrl: "./docs/error-codes.md#css",
    });
}

/**
 * regsiterCss.ts
 *
 * CSS文字列をCSSStyleSheetとして生成し、IDで登録するユーティリティ関数です。
 *
 * 主な役割:
 * - CSS文字列からCSSStyleSheetインスタンスを生成
 * - registerStyleSheetを利用して、指定IDでCSSStyleSheetを登録
 *
 * 設計ポイント:
 * - styleSheet.replaceSyncで同期的にCSSを適用
 * - グローバルなスタイル管理や動的スタイル適用に利用可能
 */
function registerCss(id, css) {
    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(css);
    registerStyleSheet(id, styleSheet);
}

/**
 * ルートノードとノードパス（インデックス配列）から、該当するノードを辿って取得するユーティリティ関数。
 *
 * - NodePathは各階層でのchildNodesのインデックスを表す配列
 * - ルートから順にchildNodes[index]を辿り、該当ノードを返す
 * - パスが不正な場合やノードが存在しない場合はnullを返す
 *
 * @param root  探索の起点となるルートノード
 * @param path  各階層のインデックス配列（NodePath）
 * @returns     パスで指定されたノード、またはnull
 */
function resolveNodeFromPath(root, path) {
    let node = root;
    if (path.length === 0)
        return node;
    // path.reduce()だと途中でnullになる可能性があるので、
    for (let i = 0; i < path.length; i++) {
        node = node?.childNodes[path[i]] ?? null;
        if (node === null)
            break;
    }
    return node;
}

/**
 * 指定ノードの「親からのインデックス」をルートまで辿り、絶対パス（NodePath）として返すユーティリティ関数。
 *
 * 例: ルートから見て [0, 2, 1] のような配列を返す。
 *     これは「親→子→孫…」とたどったときの各階層でのインデックスを表す。
 *
 * @param node 対象のDOMノード
 * @returns    ルートからこのノードまでのインデックス配列（NodePath）
 */
function getAbsoluteNodePath(node) {
    let routeIndexes = [];
    while (node.parentNode !== null) {
        const childNodes = Array.from(node.parentNode.childNodes);
        routeIndexes = [childNodes.indexOf(node), ...routeIndexes];
        node = node.parentNode;
    }
    return routeIndexes;
}

/**
 * フィルターテキスト（nameとoptionsを持つ）から、実際のフィルター関数（FilterFn）を生成する。
 *
 * - textToFilter: フィルターテキストから対応するフィルター関数を取得し、オプションを適用して返す。
 * - createFilters: フィルターテキスト配列からフィルター関数配列を生成し、同じ入力にはキャッシュを利用する。
 */
function textToFilter(filters, text) {
    const filter = filters[text.name];
    if (!filter) {
        raiseError({
            code: 'FLT-201',
            message: `Filter not found: ${text.name}`,
            context: { where: 'createFilters.textToFilter', name: text.name },
            docsUrl: './docs/error-codes.md#flt',
        });
    }
    return filter(text.options);
}
const cache$2 = new Map();
/**
 * フィルターテキスト配列（texts）からフィルター関数配列（Filters）を生成する。
 * すでに同じtextsがキャッシュされていればそれを返す。
 *
 * @param filters フィルター名→関数の辞書
 * @param texts   フィルターテキスト配列
 * @returns       フィルター関数配列
 */
function createFilters(filters, texts) {
    let result = cache$2.get(texts);
    if (typeof result === "undefined") {
        result = [];
        for (let i = 0; i < texts.length; i++) {
            result.push(textToFilter(filters, texts[i]));
        }
        cache$2.set(texts, result);
    }
    return result;
}

/**
 * BindingNodeクラスは、1つのバインディング対象ノード（ElementやTextなど）に対する
 * バインディング処理の基底クラスです。
 *
 * 主な役割:
 * - ノード・プロパティ名・フィルタ・デコレータ・バインディング情報の保持
 * - バインディング値の更新（update）、値の割り当て（assignValue）のインターフェース提供
 * - 複数バインド内容（bindContents）の管理
 * - サブクラスでassignValueやupdateElementsを実装し、各種ノード・プロパティごとのバインディング処理を拡張
 *
 * 設計ポイント:
 * - assignValue, updateElementsは未実装（サブクラスでオーバーライド必須）
 * - isSelectElement, value, filteredValue, isForなどはサブクラスで用途に応じて拡張
 * - フィルタやデコレータ、バインド内容の管理も柔軟に対応
 */
class BindingNode {
    #binding;
    #node;
    #name;
    #filters;
    #decorates;
    #bindContents = [];
    get node() {
        return this.#node;
    }
    get name() {
        return this.#name;
    }
    get subName() {
        return this.#name;
    }
    get binding() {
        return this.#binding;
    }
    get decorates() {
        return this.#decorates;
    }
    get filters() {
        return this.#filters;
    }
    get bindContents() {
        return this.#bindContents;
    }
    constructor(binding, node, name, filters, decorates) {
        this.#binding = binding;
        this.#node = node;
        this.#name = name;
        this.#filters = filters;
        this.#decorates = decorates;
    }
    init() {
        // サブクラスで初期化処理を実装可能
    }
    assignValue(value) {
        raiseError({
            code: 'BIND-301',
            message: 'Not implemented',
            context: { where: 'BindingNode.assignValue', name: this.name },
            docsUrl: '/docs/error-codes.md#bind',
        });
    }
    updateElements(listIndexes, values) {
        raiseError({
            code: 'BIND-301',
            message: 'Not implemented',
            context: { where: 'BindingNode.updateElements', name: this.name },
            docsUrl: '/docs/error-codes.md#bind',
        });
    }
    notifyRedraw(refs) {
        // サブクラスで親子関係を考慮してバインディングの更新を通知する実装が可能
    }
    applyChange(renderer) {
        const filteredValue = this.binding.bindingState.getFilteredValue(renderer.readonlyState, renderer.readonlyHandler);
        this.assignValue(filteredValue);
    }
    get isSelectElement() {
        return this.node instanceof HTMLSelectElement;
    }
    get value() {
        return null;
    }
    get filteredValue() {
        return null;
    }
    get isFor() {
        return false;
    }
    get isBlock() {
        return false;
    }
}

/**
 * BindingNodeAttributeクラスは、属性バインディング（例: attr.src, attr.alt など）を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - ノード属性名（subName）を抽出し、値を属性としてElementにセット
 * - null/undefined/NaNの場合は空文字列に変換してセット
 * - フィルタやデコレータにも対応
 *
 * 設計ポイント:
 * - nameから属性名（subName）を抽出（例: "attr.src" → "src"）
 * - assignValueで属性値を常に文字列として設定
 * - createBindingNodeAttributeファクトリでフィルタ適用済みインスタンスを生成
 */
class BindingNodeAttribute extends BindingNode {
    #subName;
    get subName() {
        return this.#subName;
    }
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        const [, subName] = this.name.split(".");
        this.#subName = subName;
    }
    assignValue(value) {
        if (value === null || value === undefined || Number.isNaN(value)) {
            value = "";
        }
        const element = this.node;
        element.setAttribute(this.subName, value.toString());
    }
}
/**
 * 属性バインディングノード生成用ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeAttributeインスタンスを生成
 */
const createBindingNodeAttribute = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeAttribute(binding, node, name, filterFns, decorates);
};

/**
 * チェックボックス（input[type="checkbox"]）のバインディング。
 *
 * - 値（配列）に input.value が含まれるかで checked を制御
 *
 * Throws:
 * - BIND-201 Value is not array: 配列以外が渡された
 */
class BindingNodeCheckbox extends BindingNode {
    assignValue(value) {
        if (!Array.isArray(value)) {
            raiseError({
                code: 'BIND-201',
                message: 'Value is not array',
                context: { where: 'BindingNodeCheckbox.update', receivedType: typeof value },
                docsUrl: '/docs/error-codes.md#bind',
                severity: 'error',
            });
        }
        const element = this.node;
        element.checked = value.map(_val => _val.toString()).includes(element.value);
    }
}
/**
 * チェックボックス用バインディングノード生成ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeCheckboxインスタンスを生成
 */
const createBindingNodeCheckbox = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeCheckbox(binding, node, name, filterFns, decorates);
};

/**
 * class 属性（classList）バインディング。
 *
 * - 値（配列）を空白区切りで結合して className へ反映
 *
 * Throws:
 * - BIND-201 Value is not array: 配列以外が渡された
 */
class BindingNodeClassList extends BindingNode {
    assignValue(value) {
        if (!Array.isArray(value)) {
            raiseError({
                code: 'BIND-201',
                message: 'Value is not array',
                context: { where: 'BindingNodeClassList.update', receivedType: typeof value },
                docsUrl: '/docs/error-codes.md#bind',
                severity: 'error',
            });
        }
        const element = this.node;
        element.className = value.join(" ");
    }
}
/**
 * classList用バインディングノード生成ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeClassListインスタンスを生成
 */
const createBindingNodeClassList = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeClassList(binding, node, name, filterFns, decorates);
};

/**
 * class の個別クラス名（例: class.active）に対するバインディング。
 *
 * - name から subName を抽出し、boolean 値で add/remove を切り替え
 *
 * Throws:
 * - BIND-201 Value is not boolean: boolean 以外が渡された
 */
class BindingNodeClassName extends BindingNode {
    #subName;
    get subName() {
        return this.#subName;
    }
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        const [, subName] = this.name.split(".");
        this.#subName = subName;
    }
    assignValue(value) {
        if (typeof value !== "boolean") {
            raiseError({
                code: 'BIND-201',
                message: 'Value is not boolean',
                context: { where: 'BindingNodeClassName.update', receivedType: typeof value },
                docsUrl: '/docs/error-codes.md#bind',
                severity: 'error',
            });
        }
        const element = this.node;
        element.classList.toggle(this.subName, value);
    }
}
/**
 * class名バインディングノード生成用ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeClassNameインスタンスを生成
 */
const createBindingNodeClassName = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeClassName(binding, node, name, filterFns, decorates);
};

const DATA_BIND_ATTRIBUTE = "data-bind";
const COMMENT_EMBED_MARK = "@@:"; // 埋め込み変数のマーク
const COMMENT_TEMPLATE_MARK = "@@|"; // テンプレートのマーク
const MAX_WILDCARD_DEPTH = 32; // ワイルドカードの最大深度
const WILDCARD = "*"; // ワイルドカード
const RESERVED_WORD_SET = new Set([
    "constructor", "prototype", "__proto__", "toString",
    "valueOf", "hasOwnProperty", "isPrototypeOf",
    "watch", "unwatch", "eval", "arguments",
    "let", "var", "const", "class", "function",
    "null", "true", "false", "new", "return",
]);

/**
 * getStructuredPathInfo.ts
 *
 * Stateプロパティのパス文字列から、詳細な構造化パス情報（IStructuredPathInfo）を生成・キャッシュするユーティリティです。
 *
 * 主な役割:
 * - パス文字列を分割し、各セグメントやワイルドカード（*）の位置・親子関係などを解析
 * - cumulativePaths/wildcardPaths/parentPathなど、パス階層やワイルドカード階層の情報を構造化
 * - 解析結果をIStructuredPathInfoとしてキャッシュし、再利用性とパフォーマンスを両立
 * - reservedWords（予約語）チェックで安全性を担保
 *
 * 設計ポイント:
 * - パスごとにキャッシュし、同じパスへの複数回アクセスでも高速に取得可能
 * - ワイルドカードや親子関係、階層構造を厳密に解析し、バインディングや多重ループに最適化
 * - childrenプロパティでパス階層のツリー構造も構築
 * - 予約語や危険なパスはraiseErrorで例外を発生
 */
/**
 * プロパティ名に"constructor"や"toString"などの予約語やオブジェクトのプロパティ名を
 * 上書きするような名前も指定できるように、Mapを検討したが、そもそもそのような名前を
 * 指定することはないと考え、Mapを使わないことにした。
 */
const _cache$2 = {};
/**
 * パターン情報を取得します
 * @param pattern パターン
 * @returns {IPatternInfo} パターン情報
 */
class StructuredPathInfo {
    static id = 0;
    id = ++StructuredPathInfo.id;
    sid = this.id.toString();
    pattern;
    pathSegments;
    lastSegment;
    cumulativePaths;
    cumulativePathSet;
    cumulativeInfos;
    cumulativeInfoSet;
    wildcardPaths;
    wildcardPathSet;
    wildcardInfos;
    indexByWildcardPath;
    wildcardInfoSet;
    wildcardParentPaths;
    wildcardParentPathSet;
    wildcardParentInfos;
    wildcardParentInfoSet;
    lastWildcardPath;
    lastWildcardInfo;
    parentPath;
    parentInfo;
    wildcardCount;
    children = {};
    constructor(pattern) {
        const getPattern = (_pattern) => {
            return (pattern === _pattern) ? this : getStructuredPathInfo(_pattern);
        };
        const pathSegments = pattern.split(".");
        const cumulativePaths = [];
        const cumulativeInfos = [];
        const wildcardPaths = [];
        const indexByWildcardPath = {};
        const wildcardInfos = [];
        const wildcardParentPaths = [];
        const wildcardParentInfos = [];
        let currentPatternPath = "", prevPatternPath = "";
        let wildcardCount = 0;
        for (let i = 0; i < pathSegments.length; i++) {
            currentPatternPath += pathSegments[i];
            if (pathSegments[i] === "*") {
                wildcardPaths.push(currentPatternPath);
                indexByWildcardPath[currentPatternPath] = wildcardCount;
                wildcardInfos.push(getPattern(currentPatternPath));
                wildcardParentPaths.push(prevPatternPath);
                wildcardParentInfos.push(getPattern(prevPatternPath));
                wildcardCount++;
            }
            cumulativePaths.push(currentPatternPath);
            cumulativeInfos.push(getPattern(currentPatternPath));
            prevPatternPath = currentPatternPath;
            currentPatternPath += ".";
        }
        const lastWildcardPath = wildcardPaths.length > 0 ? wildcardPaths[wildcardPaths.length - 1] : null;
        const parentPath = cumulativePaths.length > 1 ? cumulativePaths[cumulativePaths.length - 2] : null;
        this.pattern = pattern;
        this.pathSegments = pathSegments;
        this.lastSegment = pathSegments[pathSegments.length - 1];
        this.cumulativePaths = cumulativePaths;
        this.cumulativePathSet = new Set(cumulativePaths);
        this.cumulativeInfos = cumulativeInfos;
        this.cumulativeInfoSet = new Set(cumulativeInfos);
        this.wildcardPaths = wildcardPaths;
        this.wildcardPathSet = new Set(wildcardPaths);
        this.indexByWildcardPath = indexByWildcardPath;
        this.wildcardInfos = wildcardInfos;
        this.wildcardInfoSet = new Set(wildcardInfos);
        this.wildcardParentPaths = wildcardParentPaths;
        this.wildcardParentPathSet = new Set(wildcardParentPaths);
        this.wildcardParentInfos = wildcardParentInfos;
        this.wildcardParentInfoSet = new Set(wildcardParentInfos);
        this.lastWildcardPath = lastWildcardPath;
        this.lastWildcardInfo = lastWildcardPath ? getPattern(lastWildcardPath) : null;
        this.parentPath = parentPath;
        this.parentInfo = parentPath ? getPattern(parentPath) : null;
        this.wildcardCount = wildcardCount;
        if (this.parentInfo) {
            this.parentInfo.children[this.lastSegment] = this;
        }
    }
}
function getStructuredPathInfo(structuredPath) {
    if (RESERVED_WORD_SET.has(structuredPath)) {
        raiseError({
            code: 'STATE-202',
            message: `Pattern is reserved word: ${structuredPath}`,
            context: { where: 'getStructuredPathInfo', structuredPath },
            docsUrl: './docs/error-codes.md#state',
        });
    }
    const info = _cache$2[structuredPath];
    if (typeof info !== "undefined") {
        return info;
    }
    return (_cache$2[structuredPath] = new StructuredPathInfo(structuredPath));
}

class NodePath {
    parentPath;
    currentPath;
    name;
    childNodeByName;
    level;
    constructor(parentPath, name, level) {
        this.parentPath = parentPath;
        this.currentPath = parentPath ? parentPath + "." + name : name;
        this.name = name;
        this.level = level;
        this.childNodeByName = new Map();
    }
    find(segments, segIndex = 0) {
        if (segIndex >= segments.length) {
            return null;
        }
        const currentSegment = segments[segIndex];
        const childNode = this.childNodeByName.get(currentSegment);
        if (childNode) {
            if (segIndex === segments.length - 1) {
                return childNode;
            }
            return childNode.find(segments, segIndex + 1);
        }
        return null;
    }
    appendChild(childName) {
        let childNode = this.childNodeByName.get(childName);
        if (!childNode) {
            const currentPath = this.parentPath ? this.parentPath + "." + this.name : this.name;
            childNode = new NodePath(currentPath, childName, this.level + 1);
            this.childNodeByName.set(childName, childNode);
        }
        return childNode;
    }
}
function createRootNode() {
    return new NodePath("", "", 0);
}
const cache$1 = new Map();
function findPathNodeByPath(rootNode, path) {
    let nodeCache = cache$1.get(rootNode);
    if (!nodeCache) {
        nodeCache = new Map();
        cache$1.set(rootNode, nodeCache);
    }
    let cachedNode = nodeCache.get(path) ?? null;
    if (cachedNode) {
        return cachedNode;
    }
    const info = getStructuredPathInfo(path);
    cachedNode = rootNode.find(info.pathSegments);
    nodeCache.set(path, cachedNode);
    return cachedNode;
}
function addPathNode(rootNode, path) {
    const info = getStructuredPathInfo(path);
    if (info.parentPath === null) {
        return rootNode.appendChild(path);
    }
    else {
        let parentNode = findPathNodeByPath(rootNode, info.parentPath);
        if (parentNode === null) {
            parentNode = addPathNode(rootNode, info.parentPath);
        }
        return parentNode.appendChild(info.lastSegment);
    }
}

const symbolName$1 = "state";
const GetByRefSymbol = Symbol.for(`${symbolName$1}.GetByRef`);
const SetByRefSymbol = Symbol.for(`${symbolName$1}.SetByRef`);
const ConnectedCallbackSymbol = Symbol.for(`${symbolName$1}.ConnectedCallback`);
const DisconnectedCallbackSymbol = Symbol.for(`${symbolName$1}.DisconnectedCallback`);
const GetListIndexesByRefSymbol = Symbol.for(`${symbolName$1}.GetListIndexesByRef`);

/**
 * プロパティ名に"constructor"や"toString"などの予約語やオブジェクトのプロパティ名を
 * 上書きするような名前も指定できるように、Mapを検討したが、そもそもそのような名前を
 * 指定することはないと考え、Mapを使わないことにした。
 */
const _cache$1 = new Map();
class ResolvedPathInfo {
    static id = 0;
    id = ++ResolvedPathInfo.id;
    name;
    elements;
    paths;
    wildcardCount;
    wildcardType;
    wildcardIndexes;
    info;
    constructor(name) {
        const elements = name.split(".");
        const tmpPatternElements = elements.slice();
        const paths = [];
        let incompleteCount = 0;
        let completeCount = 0;
        let lastPath = "";
        let wildcardCount = 0;
        let wildcardType = "none";
        let wildcardIndexes = [];
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            if (element === "*") {
                tmpPatternElements[i] = "*";
                wildcardIndexes.push(null);
                incompleteCount++;
                wildcardCount++;
            }
            else {
                const number = Number(element);
                if (!Number.isNaN(number)) {
                    tmpPatternElements[i] = "*";
                    wildcardIndexes.push(number);
                    completeCount++;
                    wildcardCount++;
                }
            }
            lastPath += element;
            paths.push(lastPath);
            lastPath += (i < elements.length - 1 ? "." : "");
        }
        const pattern = tmpPatternElements.join(".");
        const info = getStructuredPathInfo(pattern);
        if (incompleteCount > 0 || completeCount > 0) {
            if (incompleteCount === wildcardCount) {
                wildcardType = "context";
            }
            else if (completeCount === wildcardCount) {
                wildcardType = "all";
            }
            else {
                wildcardType = "partial";
            }
        }
        this.name = name;
        this.elements = elements;
        this.paths = paths;
        this.wildcardCount = wildcardCount;
        this.wildcardType = wildcardType;
        this.wildcardIndexes = wildcardIndexes;
        this.info = info;
    }
}
function getResolvedPathInfo(name) {
    let nameInfo;
    return _cache$1.get(name) ?? (_cache$1.set(name, nameInfo = new ResolvedPathInfo(name)), nameInfo);
}

class StatePropertyRef {
    info;
    #listIndexRef;
    get listIndex() {
        if (this.#listIndexRef === null)
            return null;
        return this.#listIndexRef.deref() ?? raiseError({
            code: "LIST-201",
            message: "listIndex is null",
            context: { sid: this.info.sid, key: this.key },
            docsUrl: "./docs/error-codes.md#list",
        });
    }
    key;
    constructor(info, listIndex) {
        this.info = info;
        this.#listIndexRef = listIndex !== null ? new WeakRef(listIndex) : null;
        this.key = (listIndex == null) ? info.sid : (info.sid + "#" + listIndex.sid);
    }
    get parentRef() {
        const parentInfo = this.info.parentInfo;
        if (!parentInfo)
            return null;
        const parentListIndex = (this.info.wildcardCount > parentInfo.wildcardCount ? this.listIndex?.at(-2) : this.listIndex) ?? null;
        return getStatePropertyRef(parentInfo, parentListIndex);
    }
}
const refByInfoByListIndex = new WeakMap();
const refByInfoByNull = {};
function getStatePropertyRef(info, listIndex) {
    let ref = null;
    if (listIndex !== null) {
        let refByInfo;
        if (typeof (refByInfo = refByInfoByListIndex.get(listIndex)) === "undefined") {
            ref = new StatePropertyRef(info, listIndex);
            refByInfoByListIndex.set(listIndex, { [info.pattern]: ref });
        }
        else {
            if (typeof (ref = refByInfo[info.pattern]) === "undefined") {
                return refByInfo[info.pattern] = new StatePropertyRef(info, listIndex);
            }
        }
    }
    else {
        if (typeof (ref = refByInfoByNull[info.pattern]) === "undefined") {
            return refByInfoByNull[info.pattern] = new StatePropertyRef(info, null);
        }
    }
    return ref;
}

function getContextListIndex(handler, structuredPath) {
    const ref = handler.lastRefStack;
    if (ref == null) {
        return null;
    }
    if (ref.info == null) {
        return null;
    }
    if (ref.listIndex == null) {
        return null;
    }
    const index = ref.info.indexByWildcardPath[structuredPath];
    if (typeof index !== "undefined") {
        return ref.listIndex.at(index);
    }
    return null;
}

function getListIndex(resolvedPath, receiver, handler) {
    switch (resolvedPath.wildcardType) {
        case "none":
            return null;
        case "context":
            const lastWildcardPath = resolvedPath.info.lastWildcardPath ??
                raiseError({
                    code: 'STATE-202',
                    message: 'lastWildcardPath is null',
                    context: { where: 'getListIndex', pattern: resolvedPath.info.pattern },
                    docsUrl: '/docs/error-codes.md#state',
                });
            return getContextListIndex(handler, lastWildcardPath) ??
                raiseError({
                    code: 'LIST-201',
                    message: `ListIndex not found: ${resolvedPath.info.pattern}`,
                    context: { where: 'getListIndex', pattern: resolvedPath.info.pattern },
                    docsUrl: '/docs/error-codes.md#list',
                });
        case "all":
            let parentListIndex = null;
            for (let i = 0; i < resolvedPath.info.wildcardCount; i++) {
                const wildcardParentPattern = resolvedPath.info.wildcardParentInfos[i] ??
                    raiseError({
                        code: 'STATE-202',
                        message: 'wildcardParentPattern is null',
                        context: { where: 'getListIndex', pattern: resolvedPath.info.pattern, index: i },
                        docsUrl: '/docs/error-codes.md#state',
                    });
                const wildcardRef = getStatePropertyRef(wildcardParentPattern, parentListIndex);
                const listIndexes = receiver[GetListIndexesByRefSymbol](wildcardRef) ??
                    raiseError({
                        code: 'LIST-201',
                        message: `ListIndex not found: ${wildcardParentPattern.pattern}`,
                        context: { where: 'getListIndex', wildcardParent: wildcardParentPattern.pattern },
                        docsUrl: '/docs/error-codes.md#list',
                    });
                const wildcardIndex = resolvedPath.wildcardIndexes[i] ??
                    raiseError({
                        code: 'STATE-202',
                        message: 'wildcardIndex is null',
                        context: { where: 'getListIndex', pattern: resolvedPath.info.pattern, index: i },
                        docsUrl: '/docs/error-codes.md#state',
                    });
                parentListIndex = listIndexes[wildcardIndex] ??
                    raiseError({
                        code: 'LIST-201',
                        message: `ListIndex not found: ${wildcardParentPattern.pattern}`,
                        context: { where: 'getListIndex', wildcardParent: wildcardParentPattern.pattern, wildcardIndex },
                        docsUrl: '/docs/error-codes.md#list',
                    });
            }
            return parentListIndex;
        case "partial":
            raiseError({
                code: 'STATE-202',
                message: `Partial wildcard type is not supported yet: ${resolvedPath.info.pattern}`,
                context: { where: 'getListIndex', pattern: resolvedPath.info.pattern },
                docsUrl: '/docs/error-codes.md#state',
            });
    }
}

/**
 * trackDependency.ts
 *
 * StateClassのAPIとして、getterチェーン中に参照されたパス間の
 * 依存関係を動的に登録するための関数（trackDependency）の実装です。
 *
 * 主な役割:
 * - 現在解決中のStatePropertyRef（lastRefStack）を取得
 * - pathManager.gettersに登録されているgetterの場合のみ依存を追跡
 * - 自身と同一パターンでない参照に対してaddDynamicDependencyを呼び出す
 *
 * 設計ポイント:
 * - lastRefStackが存在しない場合はSTATE-202エラーを発生させる
 * - getter同士の再帰（自己依存）は登録しない
 * - 動的依存はpathManagerに集約し、キャッシュの無効化に利用する
 */
/**
 * 現在解決中のgetterから、指定されたパスへの動的依存を登録する関数を返します。
 *
 * - pathManager.gettersに登録されているgetterのみ依存追跡を行う
 * - 自己参照は除外し、異なるパターン間の依存だけを記録
 * - 動的依存はpathManager.addDynamicDependencyで集中管理される
 *
 * @param target   プロキシ対象オブジェクト
 * @param prop     アクセスされたプロパティキー
 * @param receiver プロキシレシーバ
 * @param handler  StateClassハンドラ
 * @returns        引数pathで指定されたパターンへの依存を登録する無名関数
 */
function trackDependency(target, prop, receiver, handler) {
    return (path) => {
        const lastInfo = handler.lastRefStack?.info ?? raiseError({
            code: 'STATE-202',
            message: 'Internal error: lastRefStack is null',
            context: { where: 'trackDependency', path },
            docsUrl: '/docs/error-codes.md#state',
        });
        if (handler.engine.pathManager.getters.has(lastInfo.pattern) &&
            lastInfo.pattern !== path) {
            handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, path);
        }
    };
}

/**
 * stackIndexByIndexName
 * インデックス名からスタックインデックスへのマッピング
 * $1 => 0
 * $2 => 1
 * :
 * ${i + 1} => i
 * i < MAX_WILDCARD_DEPTH
 */
const indexByIndexName = {};
for (let i = 0; i < MAX_WILDCARD_DEPTH; i++) {
    indexByIndexName[`$${i + 1}`] = i;
}

let version = 0;
let id$1 = 0;
class ListIndex {
    #parentListIndex = null;
    #pos = 0;
    #index = 0;
    #version;
    #id = ++id$1;
    #sid = this.#id.toString();
    constructor(parentListIndex, index) {
        this.#parentListIndex = parentListIndex;
        this.#pos = parentListIndex ? parentListIndex.position + 1 : 0;
        this.#index = index;
        this.#version = version;
    }
    get parentListIndex() {
        return this.#parentListIndex;
    }
    get id() {
        return this.#id;
    }
    get sid() {
        return this.#sid;
    }
    get position() {
        return this.#pos;
    }
    get length() {
        return this.#pos + 1;
    }
    get index() {
        return this.#index;
    }
    set index(value) {
        this.#index = value;
        this.#version = ++version;
        this.indexes[this.#pos] = value;
    }
    get version() {
        return this.#version;
    }
    get dirty() {
        if (this.#parentListIndex === null) {
            return false;
        }
        else {
            return this.#parentListIndex.dirty || this.#parentListIndex.version > this.#version;
        }
    }
    #indexes;
    get indexes() {
        if (this.#parentListIndex === null) {
            if (typeof this.#indexes === "undefined") {
                this.#indexes = [this.#index];
            }
        }
        else {
            if (typeof this.#indexes === "undefined" || this.dirty) {
                this.#indexes = [...this.#parentListIndex.indexes, this.#index];
                this.#version = version;
            }
        }
        return this.#indexes;
    }
    #listIndexes;
    get listIndexes() {
        if (this.#parentListIndex === null) {
            if (typeof this.#listIndexes === "undefined") {
                this.#listIndexes = [new WeakRef(this)];
            }
        }
        else {
            if (typeof this.#listIndexes === "undefined") {
                this.#listIndexes = [...this.#parentListIndex.listIndexes, new WeakRef(this)];
            }
        }
        return this.#listIndexes;
    }
    get varName() {
        return `${this.position + 1}`;
    }
    at(pos) {
        if (pos >= 0) {
            return this.listIndexes[pos]?.deref() || null;
        }
        else {
            return this.listIndexes[this.listIndexes.length + pos]?.deref() || null;
        }
    }
}
function createListIndex(parentListIndex, index) {
    return new ListIndex(parentListIndex, index);
}

function checkDependency(handler, ref) {
    // 動的依存関係の登録
    if (handler.refIndex >= 0) {
        const lastInfo = handler.lastRefStack?.info ?? null;
        if (lastInfo !== null) {
            if (handler.engine.pathManager.onlyGetters.has(lastInfo.pattern) &&
                lastInfo.pattern !== ref.info.pattern) {
                handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, ref.info.pattern);
            }
        }
    }
}

function isSameList(oldList, newList) {
    if (oldList.length !== newList.length) {
        return false;
    }
    for (let i = 0; i < oldList.length; i++) {
        if (oldList[i] !== newList[i]) {
            return false;
        }
    }
    return true;
}
function createListIndexes(parentListIndex, oldList, newList, oldIndexes) {
    oldList = Array.isArray(oldList) ? oldList : [];
    newList = Array.isArray(newList) ? newList : [];
    const newIndexes = [];
    if (newList.length === 0) {
        return [];
    }
    if (oldList.length === 0) {
        for (let i = 0; i < newList.length; i++) {
            const newListIndex = createListIndex(parentListIndex, i);
            newIndexes.push(newListIndex);
        }
        return newIndexes;
    }
    if (isSameList(oldList, newList)) {
        return oldIndexes;
    }
    // インデックスベースのマップを使用して効率化
    const indexByValue = new Map();
    for (let i = 0; i < oldList.length; i++) {
        // 重複値の場合は最後のインデックスが優先される（既存動作を維持）
        indexByValue.set(oldList[i], i);
    }
    for (let i = 0; i < newList.length; i++) {
        const newValue = newList[i];
        const oldIndex = indexByValue.get(newValue);
        if (typeof oldIndex === "undefined") {
            // 新しい要素
            const newListIndex = createListIndex(parentListIndex, i);
            newIndexes.push(newListIndex);
        }
        else {
            // 既存要素の再利用
            const existingListIndex = oldIndexes[oldIndex];
            if (existingListIndex.index !== i) {
                existingListIndex.index = i;
            }
            newIndexes.push(existingListIndex);
        }
    }
    return newIndexes;
}

/**
 * 構造化パス情報(info, listIndex)をもとに、状態オブジェクト(target)から値を取得する。
 *
 * - 依存関係の自動登録（trackedGetters対応時はsetTrackingでラップ）
 * - キャッシュ機構（handler.cacheable時はrefKeyでキャッシュ）
 * - ネスト・ワイルドカード対応（親infoやlistIndexを辿って再帰的に値を取得）
 * - getter経由で値取得時はSetStatePropertyRefSymbolでスコープを一時設定
 *
 * @param target    状態オブジェクト
 * @param info      構造化パス情報
 * @param listIndex リストインデックス（多重ループ対応）
 * @param receiver  プロキシ
 * @param handler   状態ハンドラ
 * @returns         対象プロパティの値
 */
function getByRef(target, ref, receiver, handler) {
    checkDependency(handler, ref);
    let value;
    const listable = handler.engine.pathManager.lists.has(ref.info.pattern);
    const cacheable = ref.info.wildcardCount > 0 ||
        handler.engine.pathManager.getters.has(ref.info.pattern);
    let lastCacheEntry = null;
    if (cacheable || listable) {
        lastCacheEntry = handler.engine.getCacheEntry(ref);
        const versionRevision = handler.engine.versionRevisionByPath.get(ref.info.pattern);
        if (lastCacheEntry !== null) {
            if (typeof versionRevision === "undefined") {
                // 更新なし
                return lastCacheEntry.value;
            }
            else {
                if (lastCacheEntry.version > handler.updater.version) {
                    // これは非同期更新が発生した場合にありえる
                    return lastCacheEntry.value;
                }
                if (lastCacheEntry.version < versionRevision.version || lastCacheEntry.revision < versionRevision.revision) ;
                else {
                    return lastCacheEntry.value;
                }
            }
        }
    }
    // 親子関係のあるgetterが存在する場合は、外部依存から取得
    // ToDo: stateにgetterが存在する（パスの先頭が一致する）場合はgetter経由で取得
    if (handler.engine.stateOutput.startsWith(ref.info) && handler.engine.pathManager.getters.intersection(ref.info.cumulativePathSet).size === 0) {
        return handler.engine.stateOutput.get(ref);
    }
    // パターンがtargetに存在する場合はgetter経由で取得
    if (ref.info.pattern in target) {
        if (handler.refStack.length === 0) {
            raiseError({
                code: 'STC-002',
                message: 'handler.refStack is empty in getByRef',
            });
        }
        handler.refIndex++;
        if (handler.refIndex >= handler.refStack.length) {
            handler.refStack.push(null);
        }
        handler.refStack[handler.refIndex] = handler.lastRefStack = ref;
        try {
            return value = Reflect.get(target, ref.info.pattern, receiver);
        }
        finally {
            handler.refStack[handler.refIndex] = null;
            handler.refIndex--;
            handler.lastRefStack = handler.refIndex >= 0 ? handler.refStack[handler.refIndex] : null;
            // キャッシュへ格納
            if (cacheable || listable) {
                let newListIndexes = null;
                if (listable) {
                    // リストインデックスを計算する必要がある
                    if (handler.renderer !== null) {
                        if (!handler.renderer.lastListInfoByRef.has(ref)) {
                            const listInfo = {
                                listIndexes: lastCacheEntry?.listIndexes ?? [],
                                value: lastCacheEntry?.value,
                            };
                            handler.renderer.lastListInfoByRef.set(ref, listInfo);
                        }
                    }
                    newListIndexes = createListIndexes(ref.listIndex, lastCacheEntry?.value, value, lastCacheEntry?.listIndexes ?? []);
                }
                let cacheEntry = lastCacheEntry ?? {
                    value: null,
                    listIndexes: null,
                    version: 0,
                    revision: 0,
                };
                cacheEntry.value = value;
                cacheEntry.listIndexes = newListIndexes;
                cacheEntry.version = handler.updater.version;
                cacheEntry.revision = handler.updater.revision;
                handler.engine.setCacheEntry(ref, cacheEntry);
            }
        }
    }
    else {
        // 存在しない場合エラー
        raiseError({
            code: "STC-001",
            message: `Property "${ref.info.pattern}" does not exist in state.`,
            docsUrl: "./docs/error-codes.md#stc",
        });
    }
}

/**
 * setByRef.ts
 *
 * StateClassの内部APIとして、構造化パス情報（IStructuredPathInfo）とリストインデックス（IListIndex）を指定して
 * 状態オブジェクト（target）に値を設定するための関数（setByRef）の実装です。
 *
 * 主な役割:
 * - 指定されたパス・インデックスに対応するState値を設定（多重ループやワイルドカードにも対応）
 * - getter/setter経由で値設定時はSetStatePropertyRefSymbolでスコープを一時設定
 * - 存在しない場合は親infoやlistIndexを辿って再帰的に値を設定
 * - 設定後はengine.updater.addUpdatedStatePropertyRefValueで更新情報を登録
 *
 * 設計ポイント:
 * - ワイルドカードや多重ループにも柔軟に対応し、再帰的な値設定を実現
 * - finallyで必ず更新情報を登録し、再描画や依存解決に利用
 * - getter/setter経由のスコープ切り替えも考慮した設計
 */
function setByRef(target, ref, value, receiver, handler) {
    const isElements = handler.engine.pathManager.elements.has(ref.info.pattern);
    let parentRef = null;
    let swapInfo = null;
    // elementsの場合はswapInfoを準備
    if (isElements) {
        parentRef = ref.parentRef ?? raiseError({
            code: 'STATE-202',
            message: 'propRef.stateProp.parentInfo is undefined',
            context: { where: 'setByRef (element)', refPath: ref.info.pattern },
            docsUrl: '/docs/error-codes.md#state',
        });
        swapInfo = handler.updater.swapInfoByRef.get(parentRef) || null;
        if (swapInfo === null) {
            swapInfo = {
                value: [...(receiver[GetByRefSymbol](parentRef) ?? [])],
                listIndexes: [...(receiver[GetListIndexesByRefSymbol](parentRef) ?? [])]
            };
            handler.updater.swapInfoByRef.set(parentRef, swapInfo);
        }
    }
    try {
        // 親子関係のあるgetterが存在する場合は、外部依存を通じて値を設定
        // ToDo: stateにgetterが存在する（パスの先頭が一致する）場合はgetter経由で取得
        if (handler.engine.stateOutput.startsWith(ref.info) && handler.engine.pathManager.setters.intersection(ref.info.cumulativePathSet).size === 0) {
            return handler.engine.stateOutput.set(ref, value);
        }
        if (ref.info.pattern in target) {
            handler.refIndex++;
            if (handler.refIndex >= handler.refStack.length) {
                handler.refStack.push(null);
            }
            handler.refStack[handler.refIndex] = handler.lastRefStack = ref;
            try {
                return Reflect.set(target, ref.info.pattern, value, receiver);
            }
            finally {
                handler.refStack[handler.refIndex] = null;
                handler.refIndex--;
                handler.lastRefStack = handler.refIndex >= 0 ? handler.refStack[handler.refIndex] : null;
            }
        }
        else {
            const parentInfo = ref.info.parentInfo ?? raiseError({
                code: 'STATE-202',
                message: 'propRef.stateProp.parentInfo is undefined',
                context: { where: 'setByRef', refPath: ref.info.pattern },
                docsUrl: '/docs/error-codes.md#state',
            });
            const parentListIndex = parentInfo.wildcardCount < ref.info.wildcardCount ? (ref.listIndex?.parentListIndex ?? null) : ref.listIndex;
            const parentRef = getStatePropertyRef(parentInfo, parentListIndex);
            const parentValue = getByRef(target, parentRef, receiver, handler);
            const lastSegment = ref.info.lastSegment;
            if (lastSegment === "*") {
                const index = ref.listIndex?.index ?? raiseError({
                    code: 'STATE-202',
                    message: 'propRef.listIndex?.index is undefined',
                    context: { where: 'setByRef', refPath: ref.info.pattern },
                    docsUrl: '/docs/error-codes.md#state',
                });
                return Reflect.set(parentValue, index, value);
            }
            else {
                return Reflect.set(parentValue, lastSegment, value);
            }
        }
    }
    finally {
        handler.updater.enqueueRef(ref);
        if (isElements) {
            const index = swapInfo.value.indexOf(value);
            const currentListIndexes = receiver[GetListIndexesByRefSymbol](parentRef) ?? [];
            const curIndex = ref.listIndex.index;
            const listIndex = (index !== -1) ? swapInfo.listIndexes[index] : createListIndex(parentRef.listIndex, -1);
            currentListIndexes[curIndex] = listIndex;
            // 重複チェック
            // 重複していない場合、swapが完了したとみなし、インデックスを更新
            const listValueSet = new Set(receiver[GetByRefSymbol](parentRef) ?? []);
            if (listValueSet.size === swapInfo.value.length) {
                for (let i = 0; i < currentListIndexes.length; i++) {
                    currentListIndexes[i].index = i;
                }
                // 完了したのでswapInfoを削除
                handler.updater.swapInfoByRef.delete(parentRef);
            }
        }
    }
}

/**
 * resolve.ts
 *
 * StateClassのAPIとして、パス（path）とインデックス（indexes）を指定して
 * Stateの値を取得・設定するための関数（resolve）の実装です。
 *
 * 主な役割:
 * - 文字列パス（path）とインデックス配列（indexes）から、該当するState値の取得・設定を行う
 * - ワイルドカードや多重ループを含むパスにも対応
 * - value未指定時は取得（getByRef）、指定時は設定（setByRef）を実行
 *
 * 設計ポイント:
 * - getStructuredPathInfoでパスを解析し、ワイルドカード階層ごとにリストインデックスを解決
 * - handler.engine.getListIndexesSetで各階層のリストインデックス集合を取得
 * - getByRef/setByRefで値の取得・設定を一元的に処理
 * - 柔軟なバインディングやAPI経由での利用が可能
 */
function resolve(target, prop, receiver, handler) {
    return (path, indexes, value) => {
        const info = getStructuredPathInfo(path);
        const lastInfo = handler.lastRefStack?.info ?? null;
        if (lastInfo !== null && lastInfo.pattern !== info.pattern) {
            // gettersに含まれる場合は依存関係を登録
            if (handler.engine.pathManager.onlyGetters.has(lastInfo.pattern)) {
                handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, info.pattern);
            }
        }
        if (info.wildcardParentInfos.length > indexes.length) {
            raiseError({
                code: 'STATE-202',
                message: `indexes length is insufficient: ${path}`,
                context: { path, expected: info.wildcardParentInfos.length, received: indexes.length },
                docsUrl: '/docs/error-codes.md#state',
                severity: 'error',
            });
        }
        // ワイルドカード階層ごとにListIndexを解決していく
        let listIndex = null;
        for (let i = 0; i < info.wildcardParentInfos.length; i++) {
            const wildcardParentPattern = info.wildcardParentInfos[i];
            const wildcardRef = getStatePropertyRef(wildcardParentPattern, listIndex);
            getByRef(target, wildcardRef, receiver, handler);
            const listIndexes = receiver[GetListIndexesByRefSymbol](wildcardRef);
            if (listIndexes == null) {
                raiseError({
                    code: 'LIST-201',
                    message: `ListIndexes not found: ${wildcardParentPattern.pattern}`,
                    context: { pattern: wildcardParentPattern.pattern },
                    docsUrl: '/docs/error-codes.md#list',
                    severity: 'error',
                });
            }
            const index = indexes[i];
            listIndex = listIndexes[index] ?? raiseError({
                code: 'LIST-201',
                message: `ListIndex not found: ${wildcardParentPattern.pattern}`,
                context: { pattern: wildcardParentPattern.pattern, index },
                docsUrl: '/docs/error-codes.md#list',
                severity: 'error',
            });
        }
        // WritableかReadonlyかを判定して適切なメソッドを呼び出す
        const ref = getStatePropertyRef(info, listIndex);
        const hasSetValue = typeof value !== "undefined";
        if (SetByRefSymbol in receiver) {
            if (!hasSetValue) {
                return getByRef(target, ref, receiver, handler);
            }
            else {
                setByRef(target, ref, value, receiver, handler);
            }
        }
        else {
            if (!hasSetValue) {
                return getByRef(target, ref, receiver, handler);
            }
            else {
                // readonlyなので、setはできない
                raiseError({
                    code: 'STATE-202',
                    message: `Cannot set value on a readonly proxy: ${path}`,
                    context: { path },
                    docsUrl: '/docs/error-codes.md#state',
                    severity: 'error',
                });
            }
        }
    };
}

const CONNECTED_CALLBACK = "$connectedCallback";
async function connectedCallback(target, prop, receiver, handler) {
    const callback = Reflect.get(target, CONNECTED_CALLBACK);
    if (typeof callback === "function") {
        await callback.call(receiver);
    }
}

const DISCONNECTED_CALLBACK = "$disconnectedCallback";
async function disconnectedCallback(target, prop, receiver, handler) {
    const callback = Reflect.get(target, DISCONNECTED_CALLBACK);
    if (typeof callback === "function") {
        await callback.call(receiver);
    }
}

/**
 * getAllReadonly
 *
 * ワイルドカードを含む State パスから、対象となる全要素を配列で取得する。
 * Throws: LIST-201（インデックス未解決）、BIND-201（ワイルドカード情報不整合）
 */
function getAll(target, prop, receiver, handler) {
    const resolveFn = resolve(target, prop, receiver, handler);
    return (path, indexes) => {
        const info = getStructuredPathInfo(path);
        const lastInfo = handler.lastRefStack?.info ?? null;
        if (lastInfo !== null && lastInfo.pattern !== info.pattern) {
            // gettersに含まれる場合は依存関係を登録
            if (handler.engine.pathManager.onlyGetters.has(lastInfo.pattern)) {
                handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, info.pattern);
            }
        }
        if (typeof indexes === "undefined") {
            for (let i = 0; i < info.wildcardInfos.length; i++) {
                const wildcardPattern = info.wildcardInfos[i] ?? raiseError({
                    code: 'BIND-201',
                    message: 'wildcardPattern is null',
                    context: { index: i, infoPattern: info.pattern },
                    docsUrl: '/docs/error-codes.md#bind',
                    severity: 'error',
                });
                const listIndex = getContextListIndex(handler, wildcardPattern.pattern);
                if (listIndex) {
                    indexes = listIndex.indexes;
                    break;
                }
            }
            if (typeof indexes === "undefined") {
                indexes = [];
            }
        }
        const walkWildcardPattern = (wildcardParentInfos, wildardIndexPos, listIndex, indexes, indexPos, parentIndexes, results) => {
            const wildcardParentPattern = wildcardParentInfos[wildardIndexPos] ?? null;
            if (wildcardParentPattern === null) {
                results.push(parentIndexes);
                return;
            }
            const wildcardRef = getStatePropertyRef(wildcardParentPattern, listIndex);
            getByRef(target, wildcardRef, receiver, handler);
            const listIndexes = receiver[GetListIndexesByRefSymbol](wildcardRef);
            if (listIndexes === null) {
                raiseError({
                    code: 'LIST-201',
                    message: `ListIndex not found: ${wildcardParentPattern.pattern}`,
                    context: { pattern: wildcardParentPattern.pattern },
                    docsUrl: '/docs/error-codes.md#list',
                    severity: 'error',
                });
            }
            const index = indexes[indexPos] ?? null;
            if (index === null) {
                for (let i = 0; i < listIndexes.length; i++) {
                    const listIndex = listIndexes[i];
                    walkWildcardPattern(wildcardParentInfos, wildardIndexPos + 1, listIndex, indexes, indexPos + 1, parentIndexes.concat(listIndex.index), results);
                }
            }
            else {
                const listIndex = listIndexes[index] ?? raiseError({
                    code: 'LIST-201',
                    message: `ListIndex not found: ${wildcardParentPattern.pattern}`,
                    context: { pattern: wildcardParentPattern.pattern, index },
                    docsUrl: '/docs/error-codes.md#list',
                    severity: 'error',
                });
                if ((wildardIndexPos + 1) < wildcardParentInfos.length) {
                    walkWildcardPattern(wildcardParentInfos, wildardIndexPos + 1, listIndex, indexes, indexPos + 1, parentIndexes.concat(listIndex.index), results);
                }
                else {
                    // 最終ワイルドカード層まで到達しているので、結果を確定
                    results.push(parentIndexes.concat(listIndex.index));
                }
            }
        };
        const resultIndexes = [];
        walkWildcardPattern(info.wildcardParentInfos, 0, null, indexes, 0, [], resultIndexes);
        const resultValues = [];
        for (let i = 0; i < resultIndexes.length; i++) {
            resultValues.push(resolveFn(info.pattern, resultIndexes[i]));
        }
        return resultValues;
    };
}

function getListIndexesByRef(target, ref, receiver, handler) {
    if (!handler.engine.pathManager.lists.has(ref.info.pattern)) {
        raiseError({
            code: 'LIST-201',
            message: `path is not a list: ${ref.info.pattern}`,
            context: { where: 'getListIndexesByRef', pattern: ref.info.pattern },
            docsUrl: '/docs/error-codes.md#state',
        });
    }
    if (handler.engine.stateOutput.startsWith(ref.info) && handler.engine.pathManager.getters.intersection(ref.info.cumulativePathSet).size === 0) {
        return handler.engine.stateOutput.getListIndexes(ref) ?? [];
    }
    getByRef(target, ref, receiver, handler); // キャッシュ更新を兼ねる
    const cacheEntry = handler.engine.getCacheEntry(ref);
    if (cacheEntry === null) {
        raiseError({
            code: 'LIST-202',
            message: `List cache entry not found: ${ref.info.pattern}`,
            context: { where: 'getListIndexesByRef', pattern: ref.info.pattern },
            docsUrl: '/docs/error-codes.md#state',
        });
    }
    const listIndexes = cacheEntry.listIndexes;
    if (listIndexes == null) {
        raiseError({
            code: 'LIST-203',
            message: `List indexes not found in cache entry: ${ref.info.pattern}`,
            context: { where: 'getListIndexesByRef', pattern: ref.info.pattern },
            docsUrl: '/docs/error-codes.md#state',
        });
    }
    return listIndexes;
}

/**
 * get.ts
 *
 * StateClassのProxyトラップとして、プロパティアクセス時の値取得処理を担う関数（get）の実装です。
 *
 * 主な役割:
 * - 文字列プロパティの場合、特殊プロパティ（$1〜$9, $resolve, $getAll, $navigate）に応じた値やAPIを返却
 * - 通常のプロパティはgetResolvedPathInfoでパス情報を解決し、getListIndexでリストインデックスを取得
 * - getByRefで構造化パス・リストインデックスに対応した値を取得
 * - シンボルプロパティの場合はhandler.callableApi経由でAPIを呼び出し
 * - それ以外はReflect.getで通常のプロパティアクセスを実行
 *
 * 設計ポイント:
 * - $1〜$9は直近のStatePropertyRefのリストインデックス値を返す特殊プロパティ
 * - $resolve, $getAll, $navigateはAPI関数やルーターインスタンスを返す
 * - 通常のプロパティアクセスもバインディングや多重ループに対応
 * - シンボルAPIやReflect.getで拡張性・互換性も確保
 */
function get(target, prop, receiver, handler) {
    const index = indexByIndexName[prop];
    if (typeof index !== "undefined") {
        const listIndex = handler.lastRefStack?.listIndex;
        return listIndex?.indexes[index] ?? raiseError({
            code: 'LIST-201',
            message: `ListIndex not found: ${prop.toString()}`,
            context: { prop: String(prop), indexes: listIndex?.indexes ?? null, index },
            docsUrl: '/docs/error-codes.md#list',
            severity: 'error',
        });
    }
    if (typeof prop === "string") {
        if (prop[0] === "$") {
            switch (prop) {
                case "$resolve":
                    return resolve(target, prop, receiver, handler);
                case "$getAll":
                    return getAll(target, prop, receiver, handler);
                case "$trackDependency":
                    return trackDependency(target, prop, receiver, handler);
                case "$navigate":
                    return (to) => getRouter()?.navigate(to);
                case "$component":
                    return handler.engine.owner;
            }
        }
        const resolvedInfo = getResolvedPathInfo(prop);
        const listIndex = getListIndex(resolvedInfo, receiver, handler);
        const ref = getStatePropertyRef(resolvedInfo.info, listIndex);
        return getByRef(target, ref, receiver, handler);
    }
    else if (typeof prop === "symbol") {
        if (handler.symbols.has(prop)) {
            switch (prop) {
                case GetByRefSymbol:
                    return (ref) => getByRef(target, ref, receiver, handler);
                case SetByRefSymbol:
                    return (ref, value) => setByRef(target, ref, value, receiver, handler);
                case GetListIndexesByRefSymbol:
                    return (ref) => getListIndexesByRef(target, ref, receiver, handler);
                case ConnectedCallbackSymbol:
                    return () => connectedCallback(target, prop, receiver);
                case DisconnectedCallbackSymbol:
                    return () => disconnectedCallback(target, prop, receiver);
            }
        }
        else {
            return Reflect.get(target, prop, receiver);
        }
    }
}

const STACK_DEPTH$1 = 32;
let StateHandler$1 = class StateHandler {
    engine;
    updater;
    renderer;
    refStack = Array(STACK_DEPTH$1).fill(null);
    refIndex = -1;
    lastRefStack = null;
    loopContext = null;
    symbols = new Set([GetByRefSymbol, GetListIndexesByRefSymbol]);
    apis = new Set(["$resolve", "$getAll", "$trackDependency", "$navigate", "$component"]);
    constructor(engine, updater, renderer) {
        this.engine = engine;
        this.updater = updater;
        this.renderer = renderer;
    }
    get(target, prop, receiver) {
        return get(target, prop, receiver, this);
    }
    set(target, prop, value, receiver) {
        raiseError({
            code: 'STATE-202',
            message: `Cannot set property ${String(prop)} of readonly state`,
            context: { where: 'createReadonlyStateProxy.set', prop: String(prop) },
            docsUrl: './docs/error-codes.md#state',
        });
    }
    has(target, prop) {
        return Reflect.has(target, prop) || this.symbols.has(prop) || this.apis.has(prop);
    }
};
function createReadonlyStateHandler(engine, updater, renderer) {
    return new StateHandler$1(engine, updater, renderer);
}
function createReadonlyStateProxy(state, handler) {
    return new Proxy(state, handler);
}

/**
 * set.ts
 *
 * StateClassのProxyトラップとして、プロパティ設定時の値セット処理を担う関数（set）の実装です。
 *
 * 主な役割:
 * - 文字列プロパティの場合、getResolvedPathInfoでパス情報を解決し、getListIndexでリストインデックスを取得
 * - setByRefで構造化パス・リストインデックスに対応した値設定を実行
 * - それ以外（シンボル等）の場合はReflect.setで通常のプロパティ設定を実行
 *
 * 設計ポイント:
 * - バインディングや多重ループ、ワイルドカードを含むパスにも柔軟に対応
 * - setByRefを利用することで、依存解決や再描画などの副作用も一元管理
 * - Reflect.setで標準的なプロパティ設定の互換性も確保
 */
function set(target, prop, value, receiver, handler) {
    if (typeof prop === "string") {
        const resolvedInfo = getResolvedPathInfo(prop);
        const listIndex = getListIndex(resolvedInfo, receiver, handler);
        const ref = getStatePropertyRef(resolvedInfo.info, listIndex);
        return setByRef(target, ref, value, receiver, handler);
    }
    else {
        return Reflect.set(target, prop, value, receiver);
    }
}

async function setLoopContext(handler, loopContext, callback) {
    if (handler.loopContext) {
        raiseError({
            code: 'STATE-301',
            message: 'already in loop context',
            context: { where: 'setLoopContext' },
            docsUrl: '/docs/error-codes.md#state',
        });
    }
    handler.loopContext = loopContext;
    try {
        if (loopContext) {
            if (handler.refStack.length === 0) {
                raiseError({
                    code: 'STC-002',
                    message: 'handler.refStack is empty in getByRef',
                });
            }
            handler.refIndex++;
            if (handler.refIndex >= handler.refStack.length) {
                handler.refStack.push(null);
            }
            handler.refStack[handler.refIndex] = handler.lastRefStack = loopContext.ref;
            try {
                await callback();
            }
            finally {
                handler.refStack[handler.refIndex] = null;
                handler.refIndex--;
                handler.lastRefStack = handler.refIndex >= 0 ? handler.refStack[handler.refIndex] : null;
            }
        }
        else {
            await callback();
        }
    }
    finally {
        handler.loopContext = null;
    }
}

const STACK_DEPTH = 32;
class StateHandler {
    engine;
    refStack = Array(STACK_DEPTH).fill(null);
    refIndex = -1;
    lastRefStack = null;
    loopContext = null;
    updater;
    renderer = null;
    symbols = new Set([GetByRefSymbol, SetByRefSymbol, GetListIndexesByRefSymbol, ConnectedCallbackSymbol, DisconnectedCallbackSymbol]);
    apis = new Set(["$resolve", "$getAll", "$trackDependency", "$navigate", "$component"]);
    constructor(engine, updater) {
        this.engine = engine;
        this.updater = updater;
    }
    get(target, prop, receiver) {
        return get(target, prop, receiver, this);
    }
    set(target, prop, value, receiver) {
        return set(target, prop, value, receiver, this);
    }
    has(target, prop) {
        return Reflect.has(target, prop) || this.symbols.has(prop) || this.apis.has(prop);
    }
}
async function useWritableStateProxy(engine, updater, state, loopContext, callback) {
    const handler = new StateHandler(engine, updater);
    const stateProxy = new Proxy(state, handler);
    return setLoopContext(handler, loopContext, async () => {
        await callback(stateProxy, handler);
    });
}

/**
 * Renderer は、State の変更（参照 IStatePropertyRef の集合）に対応して、
 * PathTree を辿りつつ各 Binding（IBinding）へ applyChange を委譲するコーディネータです。
 *
 * 主な役割
 * - reorderList: 要素単位の並べ替え要求を収集し、親リスト単位の差分（IListDiff）へ変換して適用
 * - render: エントリポイント。ReadonlyState を生成し、reorder → 各 ref の描画（renderItem）の順で実行
 * - renderItem: 指定 ref に紐づく Binding を更新し、静的依存（子 PathNode）と動的依存を再帰的に辿る
 *
 * コントラクト
 * - Binding#applyChange(renderer): 変更があった場合は renderer.updatedBindings に自分自身を追加すること
 * - readonlyState[GetByRefSymbol](ref): ref の新しい値（読み取り専用ビュー）を返すこと
 *
 * スレッド/再入
 * - 同期実行前提。
 *
 * 代表的な例外
 * - UPD-001/002: Engine/ReadonlyState の未初期化
 * - UPD-003/004/005/006: ListIndex/ParentInfo/OldList* の不整合や ListDiff 未生成
 * - PATH-101: PathNode が見つからない
 */
class Renderer {
    #updatingRefs = [];
    #updatingRefSet = new Set();
    /**
     * このレンダリングサイクルで「変更あり」となった Binding の集合。
     * 注意: 実際に追加するのは各 binding.applyChange 実装側の責務。
     */
    #updatedBindings = new Set();
    /**
     * 二重適用を避けるために処理済みとした参照。
     * renderItem の再帰や依存関係の横断時に循環/重複を防ぐ。
     */
    #processedRefs = new Set();
    /**
     * レンダリング対象のエンジン。state, pathManager, bindings などのファサード。
     */
    #engine;
    #readonlyState = null;
    #readonlyHandler = null;
    /**
     * 親リスト参照ごとに「要素の新しい並び位置」を記録するためのインデックス配列。
     * reorderList で収集し、後段で仮の IListDiff を生成するために用いる。
     */
    #reorderIndexesByRef = new Map();
    #lastListInfoByRef = new Map();
    #updater;
    constructor(engine, updater) {
        this.#engine = engine;
        this.#updater = updater;
    }
    get updatingRefs() {
        return this.#updatingRefs;
    }
    get updatingRefSet() {
        return this.#updatingRefSet;
    }
    /**
     * このサイクル中に更新された Binding の集合を返す（読み取り専用的に使用）。
     */
    get updatedBindings() {
        return this.#updatedBindings;
    }
    /**
     * 既に処理済みの参照集合を返す。二重適用の防止に利用する。
     */
    get processedRefs() {
        return this.#processedRefs;
    }
    /**
     * 読み取り専用 State ビューを取得する。render 実行中でなければ例外。
     * Throws: UPD-002
     */
    get readonlyState() {
        if (!this.#readonlyState) {
            raiseError({
                code: "UPD-002",
                message: "ReadonlyState not initialized",
                docsUrl: "./docs/error-codes.md#upd",
            });
        }
        return this.#readonlyState;
    }
    get readonlyHandler() {
        if (!this.#readonlyHandler) {
            raiseError({
                code: "UPD-002",
                message: "ReadonlyHandler not initialized",
                docsUrl: "./docs/error-codes.md#upd",
            });
        }
        return this.#readonlyHandler;
    }
    /**
     * バッキングエンジンを取得する。未初期化の場合は例外。
     * Throws: UPD-001
     */
    get engine() {
        if (!this.#engine) {
            raiseError({
                code: "UPD-001",
                message: "Engine not initialized",
                docsUrl: "./docs/error-codes.md#upd",
            });
        }
        return this.#engine;
    }
    get lastListInfoByRef() {
        return this.#lastListInfoByRef;
    }
    /**
     * リードオンリーな状態を生成し、コールバックに渡す
     * @param callback
     * @returns
     */
    createReadonlyState(callback) {
        const handler = createReadonlyStateHandler(this.#engine, this.#updater, this);
        const stateProxy = createReadonlyStateProxy(this.#engine.state, handler);
        return callback(stateProxy, handler);
    }
    /**
     * レンダリングのエントリポイント。ReadonlyState を生成し、
     * 並べ替え処理→各参照の描画の順に処理します。
     *
     * 注意
     * - readonlyState はこのメソッドのスコープ内でのみ有効。
     * - SetCacheableSymbol により参照解決のキャッシュをまとめて有効化できる。
     */
    render(items) {
        this.#reorderIndexesByRef.clear();
        this.#processedRefs.clear();
        this.#updatedBindings.clear();
        this.#updatingRefs = [...items];
        this.#updatingRefSet = new Set(items);
        // 実際のレンダリングロジックを実装
        this.createReadonlyState((readonlyState, readonlyHandler) => {
            this.#readonlyState = readonlyState;
            this.#readonlyHandler = readonlyHandler;
            try {
                // まずはリストの並び替えを処理
                const remainItems = [];
                const itemsByListRef = new Map();
                const refSet = new Set();
                for (let i = 0; i < items.length; i++) {
                    const ref = items[i];
                    refSet.add(ref);
                    if (!this.#engine.pathManager.elements.has(ref.info.pattern)) {
                        remainItems.push(ref);
                        continue;
                    }
                    const listRef = ref.parentRef ?? raiseError({
                        code: "UPD-004",
                        message: `ParentInfo is null for ref: ${ref.key}`,
                        context: { refKey: ref.key, pattern: ref.info.pattern },
                        docsUrl: "./docs/error-codes.md#upd",
                    });
                    if (!itemsByListRef.has(listRef)) {
                        itemsByListRef.set(listRef, new Set());
                    }
                    itemsByListRef.get(listRef).add(ref);
                }
                for (const [listRef, refs] of itemsByListRef) {
                    if (refSet.has(listRef)) {
                        for (const ref of refs) {
                            this.#processedRefs.add(ref); // 終了済み
                        }
                        continue; // 親リストが存在する場合はスキップ
                    }
                    const bindings = this.#engine.getBindings(listRef);
                    for (let i = 0; i < bindings.length; i++) {
                        if (this.#updatedBindings.has(bindings[i]))
                            continue;
                        bindings[i].applyChange(this);
                    }
                    this.processedRefs.add(listRef);
                }
                for (let i = 0; i < remainItems.length; i++) {
                    const ref = remainItems[i];
                    const node = findPathNodeByPath(this.#engine.pathManager.rootNode, ref.info.pattern);
                    if (node === null) {
                        raiseError({
                            code: "PATH-101",
                            message: `PathNode not found: ${ref.info.pattern}`,
                            context: { pattern: ref.info.pattern },
                            docsUrl: "./docs/error-codes.md#path",
                        });
                    }
                    if (!this.processedRefs.has(ref)) {
                        this.renderItem(ref, node);
                    }
                }
                // 子コンポーネントへの再描画通知
                if (this.#engine.structiveChildComponents.size > 0) {
                    for (const structiveComponent of this.#engine.structiveChildComponents) {
                        const structiveComponentBindings = this.#engine.bindingsByComponent.get(structiveComponent) ?? new Set();
                        for (const binding of structiveComponentBindings) {
                            binding.notifyRedraw(remainItems);
                        }
                    }
                }
            }
            finally {
                this.#readonlyState = null;
                this.#readonlyHandler = null;
            }
        });
    }
    /**
     * 単一の参照 ref と対応する PathNode を描画します。
     *
     * - まず自身のバインディング適用
     * - 次に静的依存（ワイルドカード含む）
     * - 最後に動的依存（ワイルドカードは階層的に展開）
     *
     * 静的依存（子ノード）
     * - それ以外: 親の listIndex を引き継いで子参照を生成して再帰描画
     *
     * 動的依存
     * - pathManager.dynamicDependencies に登録されたパスを基に、ワイルドカードを展開しつつ描画を再帰
     *
     * Throws
     * - UPD-006: WILDCARD 分岐で ListDiff が未計算（null）の場合
     * - PATH-101: 動的依存の PathNode 未検出
     */
    renderItem(ref, node) {
        this.processedRefs.add(ref);
        // バインディングに変更を適用する
        // 変更があったバインディングは updatedBindings に追加する（applyChange 実装の責務）
        const bindings = this.#engine.getBindings(ref);
        for (let i = 0; i < bindings.length; i++) {
            if (this.#updatedBindings.has(bindings[i]))
                continue;
            bindings[i].applyChange(this);
        }
        let diffListIndexes = new Set();
        if (this.#engine.pathManager.lists.has(ref.info.pattern)) {
            const currentListIndexes = new Set(this.readonlyState[GetListIndexesByRefSymbol](ref) ?? []);
            const { listIndexes } = this.lastListInfoByRef.get(ref) ?? {};
            const lastListIndexSet = new Set(listIndexes ?? []);
            diffListIndexes = currentListIndexes.difference(lastListIndexSet);
        }
        // 静的な依存関係を辿る
        for (const [name, childNode] of node.childNodeByName) {
            const childInfo = getStructuredPathInfo(childNode.currentPath);
            if (name === WILDCARD) {
                for (const listIndex of diffListIndexes) {
                    const childRef = getStatePropertyRef(childInfo, listIndex);
                    if (!this.processedRefs.has(childRef)) {
                        this.renderItem(childRef, childNode);
                    }
                }
            }
            else {
                const childRef = getStatePropertyRef(childInfo, ref.listIndex);
                if (!this.processedRefs.has(childRef)) {
                    this.renderItem(childRef, childNode);
                }
            }
        }
        // 動的な依存関係を辿る
        const deps = this.#engine.pathManager.dynamicDependencies.get(ref.info.pattern);
        if (deps) {
            for (const depPath of deps) {
                const depInfo = getStructuredPathInfo(depPath);
                const depNode = findPathNodeByPath(this.#engine.pathManager.rootNode, depInfo.pattern);
                if (depNode === null) {
                    raiseError({
                        code: "PATH-101",
                        message: `PathNode not found: ${depInfo.pattern}`,
                        context: { pattern: depInfo.pattern },
                        docsUrl: "./docs/error-codes.md#path",
                    });
                }
                if (depInfo.wildcardCount > 0) {
                    const infos = depInfo.wildcardParentInfos;
                    const walk = (depRef, index, nextInfo) => {
                        const listIndexes = this.readonlyState[GetListIndexesByRefSymbol](depRef) || [];
                        if ((index + 1) < infos.length) {
                            for (let i = 0; i < listIndexes.length; i++) {
                                const nextRef = getStatePropertyRef(nextInfo, listIndexes[i]);
                                walk(nextRef, index + 1, infos[index + 1]);
                            }
                        }
                        else {
                            for (let i = 0; i < listIndexes.length; i++) {
                                const subDepRef = getStatePropertyRef(depInfo, listIndexes[i]);
                                if (!this.processedRefs.has(subDepRef)) {
                                    this.renderItem(subDepRef, depNode);
                                }
                            }
                        }
                    };
                    const startRef = getStatePropertyRef(depInfo.wildcardParentInfos[0], null);
                    walk(startRef, 0, depInfo.wildcardParentInfos[1] || null);
                }
                else {
                    const depRef = getStatePropertyRef(depInfo, null);
                    if (!this.processedRefs.has(depRef)) {
                        this.renderItem(depRef, depNode);
                    }
                }
            }
        }
    }
}
/**
 * 便宜関数。Renderer のインスタンス化と render 呼び出しをまとめて行う。
 */
function render(refs, engine, updater) {
    const renderer = new Renderer(engine, updater);
    renderer.render(refs);
}

/**
 * Updaterクラスは、状態管理と更新の中心的な役割を果たします。
 * 状態更新が必要な場合に、都度インスタンスを作成して使用します。
 * 主な機能は以下の通りです:
 */
class Updater {
    queue = [];
    #rendering = false;
    #engine;
    #version;
    #revision = 0;
    #swapInfoByRef = new Map();
    constructor(engine) {
        this.#engine = engine;
        this.#version = engine.versionUp();
    }
    get version() {
        return this.#version;
    }
    get revision() {
        return this.#revision;
    }
    get swapInfoByRef() {
        return this.#swapInfoByRef;
    }
    /**
     * 更新したRefをキューに追加し、レンダリングをスケジュールする
     * @param ref
     * @returns
     */
    enqueueRef(ref) {
        this.#revision++;
        this.queue.push(ref);
        this.collectMaybeUpdates(this.#engine, ref.info.pattern, this.#engine.versionRevisionByPath, this.#revision);
        // レンダリング中はスキップ
        if (this.#rendering)
            return;
        this.#rendering = true;
        queueMicrotask(() => {
            this.rendering();
        });
    }
    /**
     * 状態更新処理開始
     * @param loopContext
     * @param callback
     */
    async update(loopContext, callback) {
        await useWritableStateProxy(this.#engine, this, this.#engine.state, loopContext, async (state, handler) => {
            // 状態更新処理
            await callback(state, handler);
        });
    }
    /**
     * レンダリング処理
     */
    rendering() {
        try {
            while (this.queue.length > 0) {
                // キュー取得
                const queue = this.queue;
                this.queue = [];
                // レンダリング実行
                render(queue, this.#engine, this);
            }
        }
        finally {
            this.#rendering = false;
        }
    }
    /**
     * 更新したパスに対して影響があるパスを再帰的に収集する
     * @param engine
     * @param path
     * @param node
     * @param revisionByUpdatedPath
     * @param revision
     * @param visitedInfo
     * @returns
     */
    recursiveCollectMaybeUpdates(engine, path, node, visitedInfo, isSource) {
        if (visitedInfo.has(path))
            return;
        // swapの場合スキップしたい
        if (isSource && engine.pathManager.elements.has(path)) {
            return;
        }
        visitedInfo.add(path);
        for (const [name, childNode] of node.childNodeByName.entries()) {
            const childPath = childNode.currentPath;
            this.recursiveCollectMaybeUpdates(engine, childPath, childNode, visitedInfo, false);
        }
        const deps = engine.pathManager.dynamicDependencies.get(path) ?? [];
        for (const depPath of deps) {
            const depNode = findPathNodeByPath(engine.pathManager.rootNode, depPath);
            if (depNode === null) {
                raiseError({
                    code: "UPD-004",
                    message: `Path node not found for pattern: ${depPath}`,
                    docsUrl: "./docs/error-codes.md#upd",
                });
            }
            this.recursiveCollectMaybeUpdates(engine, depPath, depNode, visitedInfo, false);
        }
    }
    #cacheUpdatedPathsByPath = new Map();
    collectMaybeUpdates(engine, path, versionRevisionByPath, revision) {
        const node = findPathNodeByPath(engine.pathManager.rootNode, path);
        if (node === null) {
            raiseError({
                code: "UPD-003",
                message: `Path node not found for pattern: ${path}`,
                docsUrl: "./docs/error-codes.md#upd",
            });
        }
        // キャッシュ
        let updatedPaths = this.#cacheUpdatedPathsByPath.get(path);
        if (typeof updatedPaths === "undefined") {
            updatedPaths = new Set();
            this.recursiveCollectMaybeUpdates(engine, path, node, updatedPaths, true);
        }
        const versionRevision = {
            version: this.version,
            revision: revision,
        };
        for (const updatedPath of updatedPaths) {
            versionRevisionByPath.set(updatedPath, versionRevision);
        }
        this.#cacheUpdatedPathsByPath.set(path, updatedPaths);
    }
    /**
     * リードオンリーな状態を生成し、コールバックに渡す
     * @param callback
     * @returns
     */
    createReadonlyState(callback) {
        const handler = createReadonlyStateHandler(this.#engine, this, null);
        const stateProxy = createReadonlyStateProxy(this.#engine.state, handler);
        return callback(stateProxy, handler);
    }
}
/**
 * Updaterを生成しコールバックに渡す
 * スコープを明確にするための関数
 * @param engine
 * @param callback
 */
function createUpdater(engine, callback) {
    const updater = new Updater(engine);
    return callback(updater);
}

/**
 * BindingNodeEventクラスは、イベントバインディング（onClick, onInputなど）を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - 指定イベント（on～）に対して、バインディングされた関数をイベントリスナーとして登録
 * - デコレータ（preventDefault, stopPropagation）によるイベント制御に対応
 * - ループコンテキストやリストインデックスも引数としてイベントハンドラに渡す
 * - ハンドラ実行時はstateProxyを生成し、Updater経由で非同期的に状態を更新
 *
 * 設計ポイント:
 * - nameからイベント名（subName）を抽出し、addEventListenerで登録
 * - バインディング値が関数でない場合はエラー
 * - デコレータでpreventDefault/stopPropagationを柔軟に制御
 * - ループ内イベントにも対応し、リストインデックスを引数展開
 */
class BindingNodeEvent extends BindingNode {
    #subName;
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        this.#subName = this.name.slice(2); // on～
        const element = node;
        element.addEventListener(this.subName, (e) => this.handler(e));
    }
    get subName() {
        return this.#subName;
    }
    update() {
        // 何もしない（イベントバインディングは初期化時のみ）
    }
    async handler(e) {
        const engine = this.binding.engine;
        const loopContext = this.binding.parentBindContent.currentLoopContext;
        const indexes = loopContext?.serialize().map((context) => context.listIndex.index) ?? [];
        const options = this.decorates;
        if (options.includes("preventDefault")) {
            e.preventDefault();
        }
        if (options.includes("stopPropagation")) {
            e.stopPropagation();
        }
        await createUpdater(engine, async (updater) => {
            await updater.update(loopContext, async (state, handler) => {
                // stateProxyを生成し、バインディング値を実行
                const func = this.binding.bindingState.getValue(state, handler);
                if (typeof func !== "function") {
                    raiseError({
                        code: 'BIND-201',
                        message: `${this.name} is not a function`,
                        context: { where: 'BindingNodeEvent.handler', name: this.name, receivedType: typeof func },
                        docsUrl: '/docs/error-codes.md#bind',
                        severity: 'error',
                    });
                }
                await Reflect.apply(func, state, [e, ...indexes]);
            });
        });
    }
    applyChange(renderer) {
        // イベントバインディングは初期化時のみで、状態変更時に何もしない
    }
}
/**
 * イベントバインディングノード生成用ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeEventインスタンスを生成
 */
const createBindingNodeEvent = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeEvent(binding, node, name, filterFns, decorates);
};

const COMMENT_TEMPLATE_MARK_LEN$1 = COMMENT_TEMPLATE_MARK.length;
/**
 * BindingNodeBlock は、テンプレートブロック（コメントノードで示すテンプレート挿入部）を
 * バインディング対象とする基底クラス。
 *
 * 役割:
 * - コメントのテキストからテンプレートIDを抽出し id として保持
 * - Block 系バインディングの共通処理を提供
 *
 * Throws:
 * - BIND-201 Invalid node: コメントノードから ID を抽出できない場合
 */
class BindingNodeBlock extends BindingNode {
    #id;
    get id() {
        return this.#id;
    }
    get isBlock() {
        return true;
    }
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        const id = this.node.textContent?.slice(COMMENT_TEMPLATE_MARK_LEN$1) ?? raiseError({
            code: 'BIND-201',
            message: 'Invalid node',
            context: { where: 'BindingNodeBlock.id', textContent: this.node.textContent ?? null },
            docsUrl: '/docs/error-codes.md#bind',
            severity: 'error',
        });
        this.#id = Number(id);
    }
}

/**
 * BindingNodeIf は、if バインディング（条件付き描画）を担当するノード実装。
 *
 * 役割:
 * - boolean 値に応じて BindContent（描画内容）の mount/unmount を制御
 * - 現在表示中の BindContent 集合を bindContents で参照可能
 *
 * 例外（代表）:
 * - BIND-201 Not implemented: assignValue は未実装
 * - BIND-201 Value is not boolean: applyChange で値が boolean ではない
 * - BIND-201 ParentNode is null: マウント先の親ノードが存在しない
 * - TMP-001 Template not found: 内部で参照するテンプレート未登録
 */
class BindingNodeIf extends BindingNodeBlock {
    #bindContent;
    #trueBindContents;
    #falseBindContents = [];
    #bindContents;
    get bindContents() {
        return this.#bindContents;
    }
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        const blankInfo = getStructuredPathInfo("");
        const blankRef = getStatePropertyRef(blankInfo, null);
        this.#bindContent = createBindContent(this.binding, this.id, this.binding.engine, blankRef);
        this.#trueBindContents = this.#bindContents = [this.#bindContent];
    }
    /**
     * 値の直接代入は未実装。
     * Throws: BIND-201 Not implemented
     */
    assignValue(value) {
        raiseError({
            code: 'BIND-201',
            message: 'Not implemented',
            context: { where: 'BindingNodeIf.assignValue', name: this.name },
            docsUrl: '/docs/error-codes.md#bind',
            severity: 'error',
        });
    }
    /**
     * 値を評価して true なら mount+applyChange、false なら unmount。
     * 既に更新済みの binding はスキップ。
     *
     * Throws:
     * - BIND-201 Value is not boolean
     * - BIND-201 ParentNode is null
     */
    applyChange(renderer) {
        const filteredValue = this.binding.bindingState.getFilteredValue(renderer.readonlyState, renderer.readonlyHandler);
        if (typeof filteredValue !== "boolean") {
            raiseError({
                code: 'BIND-201',
                message: 'Value is not boolean',
                context: { where: 'BindingNodeIf.update', valueType: typeof filteredValue },
                docsUrl: '/docs/error-codes.md#bind',
                severity: 'error',
            });
        }
        const parentNode = this.node.parentNode;
        if (parentNode == null) {
            raiseError({
                code: 'BIND-201',
                message: 'ParentNode is null',
                context: { where: 'BindingNodeIf.update', nodeType: this.node.nodeType },
                docsUrl: '/docs/error-codes.md#bind',
                severity: 'error',
            });
        }
        if (filteredValue) {
            this.#bindContent.mountAfter(parentNode, this.node);
            this.#bindContent.applyChange(renderer);
            this.#bindContents = this.#trueBindContents;
        }
        else {
            this.#bindContent.unmount();
            this.#bindContents = this.#falseBindContents;
        }
    }
}
/**
 * if バインディングノード生成用ファクトリ関数。
 * name / フィルタ / デコレータ設定に従い BindingNodeIf を生成する。
 */
const createBindingNodeIf = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeIf(binding, node, name, filterFns, decorates);
};

const EMPTY_SET = new Set();
/**
 * フラグメントに追加し、一括でノードで追加するかのフラグ
 * ベンチマークの結果で判断する
 */
const USE_ALL_APPEND = globalThis.__STRUCTIVE_USE_ALL_APPEND__ === true;
/**
 * BindingNodeForクラスは、forバインディング（配列やリストの繰り返し描画）を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - リストデータの各要素ごとにBindContent（バインディングコンテキスト）を生成・管理
 * - 配列の差分検出により、必要なBindContentの生成・再利用・削除・再描画を最適化
 * - DOM上での要素の並び替えや再利用、アンマウント・マウント処理を効率的に行う
 * - プール機構によりBindContentの再利用を促進し、パフォーマンスを向上
 *
 * 設計ポイント:
 * - applyChangeでリストの差分を検出し、BindContentの生成・削除・再利用を管理
 * - 追加・削除が無い場合はリオーダー（並べ替え）のみをDOM移動で処理し、再描画を抑制
 * - 上書き（overwrites）は同位置の内容変化のため、applyChangeを再実行
 * - BindContentのプール・インデックス管理でGCやDOM操作の最小化を図る
 * - バインディング状態やリストインデックス情報をエンジンに保存し、再描画や依存解決を容易にする
 *
 * Throws（代表例）:
 * - BIND-201 ParentNode is null / BindContent not found など applyChange 実行時の不整合
 * - BIND-202 Length is negative: プール長の不正設定
 * - BIND-301 Not implemented. Use update or applyChange: assignValue は未実装
 *
 * ファクトリ関数 createBindingNodeFor でフィルタ・デコレータ適用済みインスタンスを生成
 */
class BindingNodeFor extends BindingNodeBlock {
    #bindContents = [];
    #bindContentByListIndex = new WeakMap();
    #bindContentPool = [];
    #bindContentLastIndex = 0;
    #loopInfo = undefined;
    #oldList = undefined;
    #oldListIndexes = [];
    #oldListIndexSet = new Set();
    get bindContents() {
        return this.#bindContents;
    }
    get isFor() {
        return true;
    }
    init() {
    }
    createBindContent(listIndex) {
        let bindContent;
        if (this.#bindContentLastIndex >= 0) {
            // プールの最後の要素を取得して、プールの長さをあとで縮減する
            // 作るたびにプールを縮減すると、パフォーマンスが悪化するため
            // プールの長さを縮減するのは、全ての要素を作った後に行う
            bindContent = this.#bindContentPool[this.#bindContentLastIndex];
            this.#bindContentLastIndex--;
            bindContent.assignListIndex(listIndex);
        }
        else {
            const loopRef = getStatePropertyRef(this.loopInfo, listIndex);
            bindContent = createBindContent(this.binding, this.id, this.binding.engine, loopRef);
        }
        // 登録
        this.#bindContentByListIndex.set(listIndex, bindContent);
        return bindContent;
    }
    /**
     * BindContent を削除（アンマウント）し、ループ文脈のインデックスもクリアする。
     */
    deleteBindContent(bindContent) {
        bindContent.unmount();
        bindContent.loopContext?.clearListIndex();
    }
    get bindContentLastIndex() {
        return this.#bindContentLastIndex;
    }
    set bindContentLastIndex(value) {
        this.#bindContentLastIndex = value;
    }
    get poolLength() {
        return this.#bindContentPool.length;
    }
    set poolLength(length) {
        if (length < 0) {
            raiseError({
                code: 'BIND-202',
                message: 'Length is negative',
                context: { where: 'BindingNodeFor.setPoolLength', length },
                docsUrl: './docs/error-codes.md#bind',
            });
        }
        this.#bindContentPool.length = length;
    }
    get loopInfo() {
        if (typeof this.#loopInfo === "undefined") {
            const loopPath = this.binding.bindingState.pattern + ".*";
            this.#loopInfo = getStructuredPathInfo(loopPath);
        }
        return this.#loopInfo;
    }
    assignValue(value) {
        raiseError({
            code: 'BIND-301',
            message: 'Not implemented. Use update or applyChange',
            context: { where: 'BindingNodeFor.assignValue' },
            docsUrl: './docs/error-codes.md#bind',
        });
    }
    /**
     * リストの差分を適用して DOM とバインディングを更新する中核メソッド。
     *
     * - 追加/削除がある場合: add は生成+mount+applyChange、reuse は位置調整のみ
     * - 追加/削除が無い場合: changeIndexes はDOM移動のみ（再描画なし）、overwrites は applyChange を呼ぶ
     * - 全削除/全追加はフラグメント最適化を適用
     */
    applyChange(renderer) {
        let newBindContents = [];
        const newList = renderer.readonlyState[GetByRefSymbol](this.binding.bindingState.ref);
        const newListIndexes = renderer.readonlyState[GetListIndexesByRefSymbol](this.binding.bindingState.ref) ?? [];
        const newListIndexesSet = new Set(newListIndexes);
        new Set(this.#oldList ?? EMPTY_SET);
        const oldListLength = this.#oldList?.length ?? 0;
        const removesSet = newListIndexesSet.size === 0 ? this.#oldListIndexSet : this.#oldListIndexSet.difference(newListIndexesSet);
        const addsSet = this.#oldListIndexSet.size === 0 ? newListIndexesSet : newListIndexesSet.difference(this.#oldListIndexSet);
        const newListLength = newList?.length ?? 0;
        const changeIndexesSet = new Set();
        const overwritesSet = new Set();
        const elementsPath = this.binding.bindingState.info.pattern + ".*";
        for (let i = 0; i < renderer.updatingRefs.length; i++) {
            const updatingRef = renderer.updatingRefs[i];
            if (updatingRef.info.pattern !== elementsPath)
                continue;
            if (renderer.processedRefs.has(updatingRef))
                continue;
            const listIndex = updatingRef.listIndex;
            if (listIndex === null) {
                raiseError({
                    code: 'BIND-201',
                    message: 'ListIndex is null',
                    context: { where: 'BindingNodeFor.applyChange', ref: updatingRef },
                    docsUrl: './docs/error-codes.md#bind',
                });
            }
            if (this.#oldListIndexSet.has(listIndex)) {
                changeIndexesSet.add(listIndex);
            }
            else {
                overwritesSet.add(listIndex);
            }
            renderer.processedRefs.add(updatingRef);
        }
        const parentNode = this.node.parentNode ?? raiseError({
            code: 'BIND-201',
            message: 'ParentNode is null',
            context: { where: 'BindingNodeFor.applyChange' },
            docsUrl: './docs/error-codes.md#bind',
        });
        // 削除を先にする
        const removeBindContentsSet = new Set();
        // 全削除最適化のフラグ
        const isAllRemove = (oldListLength === removesSet.size && oldListLength > 0);
        // 親ノードこのノードだけ持つかのチェック
        let isParentNodeHasOnlyThisNode = false;
        if (isAllRemove) {
            const parentChildNodes = Array.from(parentNode.childNodes);
            const lastContent = this.#bindContents.at(-1) ?? raiseError({
                code: 'BIND-201',
                message: 'Last content is null',
                context: { where: 'BindingNodeFor.applyChange' },
                docsUrl: '/docs/error-codes.md#bind',
            });
            // ブランクノードを飛ばす
            let firstNode = parentChildNodes[0];
            while (firstNode && firstNode.nodeType === Node.TEXT_NODE && firstNode.textContent?.trim() === "") {
                firstNode = firstNode.nextSibling;
            }
            let lastNode = parentChildNodes.at(-1) ?? null;
            while (lastNode && lastNode.nodeType === Node.TEXT_NODE && lastNode.textContent?.trim() === "") {
                lastNode = lastNode.previousSibling;
            }
            if (firstNode === this.node && lastNode === lastContent.getLastNode(parentNode)) {
                isParentNodeHasOnlyThisNode = true;
            }
        }
        if (isAllRemove && isParentNodeHasOnlyThisNode) {
            // 全削除最適化
            parentNode.textContent = "";
            parentNode.append(this.node);
            for (let i = 0; i < this.#bindContents.length; i++) {
                const bindContent = this.#bindContents[i];
                bindContent.loopContext?.clearListIndex();
            }
            this.#bindContentPool.push(...this.#bindContents);
        }
        else {
            if (removesSet.size > 0) {
                for (const listIndex of removesSet) {
                    const bindContent = this.#bindContentByListIndex.get(listIndex);
                    if (typeof bindContent === "undefined") {
                        raiseError({
                            code: 'BIND-201',
                            message: 'BindContent not found',
                            context: { where: 'BindingNodeFor.applyChange', when: 'removes' },
                            docsUrl: './docs/error-codes.md#bind',
                        });
                    }
                    this.deleteBindContent(bindContent);
                    removeBindContentsSet.add(bindContent);
                }
                this.#bindContentPool.push(...removeBindContentsSet);
            }
        }
        let lastBindContent = null;
        const firstNode = this.node;
        this.bindContentLastIndex = this.poolLength - 1;
        const isAllAppend = USE_ALL_APPEND && (newListLength === addsSet.size && newListLength > 0);
        // リオーダー判定: 追加・削除がなく、並び替え（changeIndexes）または上書き（overwrites）のみの場合
        const isReorder = addsSet.size === 0 && removesSet.size === 0 &&
            (changeIndexesSet.size > 0 || overwritesSet.size > 0);
        if (!isReorder) {
            const oldIndexByListIndex = new Map();
            for (let i = 0; i < this.#oldListIndexes.length; i++) {
                oldIndexByListIndex.set(this.#oldListIndexes[i], i);
            }
            // 全追加の場合、バッファリングしてから一括追加する
            const fragmentParentNode = isAllAppend ? document.createDocumentFragment() : parentNode;
            const fragmentFirstNode = isAllAppend ? null : firstNode;
            const changeListIndexes = [];
            for (let i = 0; i < newListIndexes.length; i++) {
                const listIndex = newListIndexes[i];
                const lastNode = lastBindContent?.getLastNode(fragmentParentNode) ?? fragmentFirstNode;
                let bindContent;
                if (addsSet.has(listIndex)) {
                    bindContent = this.createBindContent(listIndex);
                    bindContent.mountAfter(fragmentParentNode, lastNode);
                    bindContent.applyChange(renderer);
                }
                else {
                    bindContent = this.#bindContentByListIndex.get(listIndex);
                    if (typeof bindContent === "undefined") {
                        raiseError({
                            code: 'BIND-201',
                            message: 'BindContent not found',
                            context: { where: 'BindingNodeFor.applyChange', when: 'reuse' },
                            docsUrl: './docs/error-codes.md#bind',
                        });
                    }
                    if (lastNode?.nextSibling !== bindContent.firstChildNode) {
                        bindContent.mountAfter(fragmentParentNode, lastNode);
                    }
                    const oldIndex = oldIndexByListIndex.get(listIndex);
                    if (typeof oldIndex !== "undefined" && oldIndex !== i) {
                        changeListIndexes.push(listIndex);
                    }
                }
                newBindContents.push(bindContent);
                lastBindContent = bindContent;
            }
            // 全追加最適化
            if (isAllAppend) {
                const beforeNode = firstNode.nextSibling;
                parentNode.insertBefore(fragmentParentNode, beforeNode);
            }
            for (const listIndex of changeListIndexes) {
                const bindings = this.binding.bindingsByListIndex.get(listIndex) ?? [];
                for (const binding of bindings) {
                    if (renderer.updatedBindings.has(binding))
                        continue;
                    binding.applyChange(renderer);
                }
            }
        }
        else {
            // リオーダー処理: 要素の追加・削除がない場合の最適化処理
            // 並び替え処理: インデックスの変更のみなので、要素の再描画は不要
            // DOM位置の調整のみ行い、BindContentの内容は再利用する
            if (changeIndexesSet.size > 0) {
                const bindContents = Array.from(this.#bindContents);
                const changeIndexes = Array.from(changeIndexesSet);
                changeIndexes.sort((a, b) => a.index - b.index);
                for (const listIndex of changeIndexes) {
                    const bindContent = this.#bindContentByListIndex.get(listIndex);
                    if (typeof bindContent === "undefined") {
                        raiseError({
                            code: 'BIND-201',
                            message: 'BindContent not found',
                            context: { where: 'BindingNodeFor.applyChange', when: 'reorder' },
                            docsUrl: '/docs/error-codes.md#bind',
                        });
                    }
                    bindContents[listIndex.index] = bindContent;
                    const lastNode = bindContents[listIndex.index - 1]?.getLastNode(parentNode) ?? firstNode;
                    bindContent.mountAfter(parentNode, lastNode);
                }
                newBindContents = bindContents;
            }
            // 上書き処理: 同じ位置の要素が異なる値に変更された場合の再描画
            if (overwritesSet.size > 0) {
                for (const listIndex of overwritesSet) {
                    const bindContent = this.#bindContentByListIndex.get(listIndex);
                    if (typeof bindContent === "undefined") {
                        raiseError({
                            code: 'BIND-201',
                            message: 'BindContent not found',
                            context: { where: 'BindingNodeFor.applyChange', when: 'overwrites' },
                            docsUrl: './docs/error-codes.md#bind',
                        });
                    }
                    bindContent.applyChange(renderer);
                }
            }
        }
        // プールの長さを更新する
        // プールの長さは、プールの最後の要素のインデックス+1であるため、
        this.poolLength = this.bindContentLastIndex + 1;
        this.#bindContents = newBindContents;
        this.#oldList = [...newList];
        this.#oldListIndexes = [...newListIndexes];
        this.#oldListIndexSet = newListIndexesSet;
    }
}
const createBindingNodeFor = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeFor(binding, node, name, filterFns, decorates);
};

function isTwoWayBindable(element) {
    return element instanceof HTMLInputElement
        || element instanceof HTMLTextAreaElement
        || element instanceof HTMLSelectElement;
}
const defaultEventByName = {
    value: "input",
    valueAsNumber: "input",
    valueAsDate: "input",
    checked: "change",
    selected: "change",
};
const twoWayPropertyByElementType = {
    radio: new Set(["checked"]),
    checkbox: new Set(["checked"]),
};
const VALUES_SET = new Set(["value", "valueAsNumber", "valueAsDate"]);
const BLANK_SET = new Set();
/**
 * HTML要素のデフォルトプロパティを取得
 */
const getTwoWayPropertiesHTMLElement = (node) => node instanceof HTMLSelectElement || node instanceof HTMLTextAreaElement || node instanceof HTMLOptionElement
    ? VALUES_SET
    : node instanceof HTMLInputElement
        ? (twoWayPropertyByElementType[node.type] ?? VALUES_SET)
        : BLANK_SET;
/**
 * BindingNodePropertyクラスは、ノードのプロパティ（value, checked, selected など）への
 * バインディング処理を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - ノードプロパティへの値の割り当て・取得
 * - 双方向バインディング（input, changeイベント等）に対応
 * - フィルタやデコレータにも対応
 *
 * 設計ポイント:
 * - デフォルトプロパティ名と一致し、かつ双方向バインディング可能な要素の場合のみイベントリスナーを登録
 * - デコレータでイベント名を指定可能（onInput, onChangeなど）
 * - イベント発火時はUpdater経由でstateを非同期的に更新
 * - assignValueでnull/undefined/NaNは空文字列に変換してセット
 */
class BindingNodeProperty extends BindingNode {
    get value() {
        // @ts-ignore
        return this.node[this.name];
    }
    get filteredValue() {
        let value = this.value;
        for (let i = 0; i < this.filters.length; i++) {
            value = this.filters[i](value);
        }
        return value;
    }
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        const isElement = this.node instanceof HTMLElement;
        if (!isElement)
            return;
        if (!isTwoWayBindable(this.node))
            return;
        const defaultNames = getTwoWayPropertiesHTMLElement(this.node);
        if (!defaultNames.has(this.name))
            return;
        if (decorates.length > 1) {
            raiseError({
                code: "BIND-201",
                message: "Has multiple decorators",
                context: { where: "BindingNodeProperty.constructor", name: this.name, decoratesCount: decorates.length },
                docsUrl: "/docs/error-codes.md#bind",
                severity: "error",
            });
        }
        const event = (decorates[0]?.startsWith("on") ? decorates[0]?.slice(2) : decorates[0]) ?? null;
        const eventName = event ?? defaultEventByName[this.name] ?? "readonly";
        if (eventName === "readonly" || eventName === "ro")
            return;
        // 双方向バインディング: イベント発火時にstateを更新
        const engine = this.binding.engine;
        this.node.addEventListener(eventName, async () => {
            const loopContext = this.binding.parentBindContent.currentLoopContext;
            const value = this.filteredValue;
            await createUpdater(engine, async (updater) => {
                await updater.update(loopContext, async (state, handler) => {
                    binding.updateStateValue(state, handler, value);
                });
            });
        });
    }
    init() {
        // サブクラスで初期化処理を実装可能
    }
    assignValue(value) {
        if (value === null || value === undefined || Number.isNaN(value)) {
            value = "";
        }
        // @ts-ignore
        this.node[this.name] = value;
    }
}
/**
 * プロパティバインディングノード生成用ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodePropertyインスタンスを生成
 */
const createBindingNodeProperty = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeProperty(binding, node, name, filterFns, decorates);
};

/**
 * BindingNodeRadioクラスは、ラジオボタン（input[type="radio"]）の
 * バインディング処理を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - バインディング値とinput要素のvalueが一致していればchecked=trueにする
 * - null/undefined/NaNの場合は空文字列に変換して比較
 * - フィルタやデコレータにも対応
 *
 * 設計ポイント:
 * - assignValueで値を文字列化し、input要素のvalueと比較してcheckedを制御
 * - 柔軟なバインディング記法・フィルタ適用に対応
 */
class BindingNodeRadio extends BindingNode {
    assignValue(value) {
        if (value === null || value === undefined || Number.isNaN(value)) {
            value = "";
        }
        const element = this.node;
        element.checked = value.toString() === element.value.toString();
    }
}
/**
 * ラジオボタン用バインディングノード生成ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeRadioインスタンスを生成
 */
const createBindingNodeRadio = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeRadio(binding, node, name, filterFns, decorates);
};

/**
 * BindingNodeStyleクラスは、style属性（インラインスタイル）のバインディング処理を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - バインディング値を指定のCSSプロパティ（subName）としてHTMLElementにセット
 * - null/undefined/NaNの場合は空文字列に変換してセット
 * - フィルタやデコレータにも対応
 *
 * 設計ポイント:
 * - nameからCSSプロパティ名（subName）を抽出（例: "style.color" → "color"）
 * - assignValueで値を文字列化し、style.setPropertyで反映
 * - 柔軟なバインディング記法・フィルタ適用に対応
 */
class BindingNodeStyle extends BindingNode {
    #subName;
    get subName() {
        return this.#subName;
    }
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        const [, subName] = this.name.split(".");
        this.#subName = subName;
    }
    assignValue(value) {
        if (value === null || value === undefined || Number.isNaN(value)) {
            value = "";
        }
        const element = this.node;
        element.style.setProperty(this.subName, value.toString());
    }
}
/**
 * style属性バインディングノード生成用ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeStyleインスタンスを生成
 */
const createBindingNodeStyle = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeStyle(binding, node, name, filterFns, decorates);
};

const symbolName = "component-state-input";
const AssignStateSymbol = Symbol.for(`${symbolName}.AssignState`);
const NotifyRedrawSymbol = Symbol.for(`${symbolName}.NotifyRedraw`);

const parentStructiveComponentByStructiveComponent = new WeakMap();
function findStructiveParent(el) {
    return parentStructiveComponentByStructiveComponent.get(el) ?? null;
}
function registerStructiveComponent(parentComponent, component) {
    parentStructiveComponentByStructiveComponent.set(component, parentComponent);
}

/**
 * BindingNodeComponentクラスは、StructiveComponent（カスタムコンポーネント）への
 * バインディング処理を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - バインディング対象のコンポーネントのstateプロパティ（subName）に値を反映
 * - バインディング情報をコンポーネント単位で管理（bindingsByComponentに登録）
 * - フィルタやデコレータにも対応
 *
 * 設計ポイント:
 * - nameからstateプロパティ名（subName）を抽出（例: "state.foo" → "foo"）
 * - assignValueでコンポーネントのstateに値をセット（RenderSymbol経由で反映）
 * - 初期化時にbindingsByComponentへバインディング情報を登録
 * - 柔軟なバインディング記法・フィルタ適用に対応
 */
class BindingNodeComponent extends BindingNode {
    #subName;
    get subName() {
        return this.#subName;
    }
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        const [, subName] = this.name.split(".");
        this.#subName = subName;
    }
    init() {
        const engine = this.binding.engine;
        registerStructiveComponent(engine.owner, this.node);
        let bindings = engine.bindingsByComponent.get(this.node);
        if (typeof bindings === "undefined") {
            engine.bindingsByComponent.set(this.node, bindings = new Set());
        }
        bindings.add(this.binding);
    }
    _notifyRedraw(refs) {
        const component = this.node;
        // コンポーネントが定義されるのを待ち、初期化完了後に notifyRedraw を呼び出す
        const tagName = component.tagName.toLowerCase();
        customElements.whenDefined(tagName).then(() => {
            component.waitForInitialize.promise.then(() => {
                component.state[NotifyRedrawSymbol](refs);
            });
        });
    }
    applyChange(renderer) {
        this._notifyRedraw([this.binding.bindingState.ref]);
    }
    notifyRedraw(refs) {
        const notifyRefs = [];
        const compRef = this.binding.bindingState.ref;
        const listIndex = compRef.listIndex;
        const atIndex = (listIndex?.length ?? 0) - 1;
        for (const ref of refs) {
            if (ref.info.pattern === compRef.info.pattern) {
                // applyChangeで処理済みなのでスキップ
                continue;
            }
            if (!ref.info.cumulativePathSet.has(compRef.info.pattern)) {
                continue;
            }
            if (atIndex >= 0) {
                if (ref.listIndex?.at(atIndex) !== listIndex) {
                    continue;
                }
            }
            notifyRefs.push(ref);
        }
        if (notifyRefs.length === 0) {
            return;
        }
        this._notifyRedraw(notifyRefs);
    }
}
/**
 * コンポーネント用バインディングノード生成ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeComponentインスタンスを生成
 */
const createBindingNodeComponent = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeComponent(binding, node, name, filterFns, decorates);
};

const nodePropertyConstructorByNameByIsComment = {
    0: {
        "class": createBindingNodeClassList,
        "checkbox": createBindingNodeCheckbox,
        "radio": createBindingNodeRadio,
    },
    1: {
        "if": createBindingNodeIf,
    },
};
const nodePropertyConstructorByFirstName = {
    "class": createBindingNodeClassName,
    "attr": createBindingNodeAttribute,
    "style": createBindingNodeStyle,
    "state": createBindingNodeComponent,
    //  "popover": PopoverTarget,
    //  "commandfor": CommandForTarget,
};
/**
 * バインディング対象ノードのプロパティ名やノード種別（Element/Comment）に応じて、
 * 適切なバインディングノード生成関数（CreateBindingNodeFn）を返すユーティリティ。
 *
 * - ノード種別やプロパティ名ごとに専用の生成関数をマッピング
 * - コメントノードや特殊プロパティ（for/if等）にも対応
 * - プロパティ名の先頭や"on"でイベントバインディングも判別
 * - 一度判定した組み合わせはキャッシュし、パフォーマンス向上
 *
 * これにより、テンプレートのdata-bindやコメントバインディングの各種ケースに柔軟に対応できる。
 */
function _getBindingNodeCreator(isComment, isElement, propertyName) {
    // コメント/エレメント種別とプロパティ名で専用の生成関数を優先的に取得
    const bindingNodeCreatorByName = nodePropertyConstructorByNameByIsComment[isComment ? 1 : 0][propertyName];
    if (typeof bindingNodeCreatorByName !== "undefined") {
        return bindingNodeCreatorByName;
    }
    // コメントノードでforの場合は専用関数
    if (isComment && propertyName === "for") {
        return createBindingNodeFor;
    }
    // コメントノードで未対応プロパティはエラー
    if (isComment) {
        raiseError(`getBindingNodeCreator: unknown node property ${propertyName}`);
    }
    // プロパティ名の先頭で判別（class.attr.style.state等）
    const nameElements = propertyName.split(".");
    const bindingNodeCreatorByFirstName = nodePropertyConstructorByFirstName[nameElements[0]];
    if (typeof bindingNodeCreatorByFirstName !== "undefined") {
        return bindingNodeCreatorByFirstName;
    }
    // エレメントノードでonから始まる場合はイベントバインディング
    if (isElement) {
        if (propertyName.startsWith("on")) {
            return createBindingNodeEvent;
        }
        else {
            return createBindingNodeProperty;
        }
    }
    else {
        // それ以外は汎用プロパティバインディング
        return createBindingNodeProperty;
    }
}
const _cache = {};
/**
 * ノード・プロパティ名・フィルタ・デコレータ情報から
 * 適切なバインディングノード生成関数を取得し、呼び出すファクトリ関数。
 *
 * @param node         バインディング対象ノード
 * @param propertyName バインディングプロパティ名
 * @param filterTexts  フィルタ情報
 * @param decorates    デコレータ情報
 * @returns            バインディングノード生成関数の実行結果
 */
function getBindingNodeCreator(node, propertyName, filterTexts, decorates) {
    const isComment = node instanceof Comment;
    const isElement = node instanceof Element;
    const key = isComment + "\t" + isElement + "\t" + propertyName;
    // キャッシュを利用して生成関数を取得
    const fn = _cache[key] ?? (_cache[key] = _getBindingNodeCreator(isComment, isElement, propertyName));
    return fn(propertyName, filterTexts, decorates);
}

/**
 * BindingStateクラスは、バインディング対象の状態（State）プロパティへのアクセス・更新・フィルタ適用を担当する実装です。
 *
 * 主な役割:
 * - バインディング対象の状態プロパティ（pattern, info）やリストインデックス（listIndex）を管理
 * - get valueで現在の値を取得し、get filteredValueでフィルタ適用後の値を取得
 * - initでリストバインディング時のループコンテキストやインデックス参照を初期化
 * - assignValueで状態プロキシに値を書き込む（双方向バインディング対応）
 * - バインディング情報をエンジンに登録し、依存解決や再描画を効率化
 *
 * 設計ポイント:
 * - ワイルドカードパス（配列バインディング等）にも対応し、ループごとのインデックス管理が可能
 * - フィルタ適用は配列で柔軟に対応
 * - createBindingStateファクトリでフィルタ適用済みインスタンスを生成
 */
class BindingState {
    #binding;
    #pattern;
    #info;
    #filters;
    #loopContext = null;
    #nullRef = null;
    #ref = null;
    get pattern() {
        return this.#pattern;
    }
    get info() {
        return this.#info;
    }
    get listIndex() {
        return this.ref.listIndex;
    }
    get ref() {
        if (this.#loopContext !== null) {
            if (this.#ref === null) {
                this.#ref = getStatePropertyRef(this.#info, this.#loopContext.listIndex);
            }
            return this.#ref;
        }
        else {
            return this.#nullRef ?? raiseError({
                code: 'BIND-201',
                message: 'ref is null',
                context: { pattern: this.#pattern },
                docsUrl: '/docs/error-codes.md#bind',
                severity: 'error',
            });
        }
    }
    get filters() {
        return this.#filters;
    }
    get binding() {
        return this.#binding;
    }
    get isLoopIndex() {
        return false;
    }
    constructor(binding, pattern, filters) {
        this.#binding = binding;
        this.#pattern = pattern;
        this.#info = getStructuredPathInfo(pattern);
        this.#nullRef = (this.#info.wildcardCount === 0) ? getStatePropertyRef(this.#info, null) : null;
        this.#filters = filters;
    }
    getValue(state, handler) {
        return getByRef(this.binding.engine.state, this.ref, state, handler);
    }
    getFilteredValue(state, handler) {
        let value = getByRef(this.binding.engine.state, this.ref, state, handler);
        for (let i = 0; i < this.#filters.length; i++) {
            value = this.#filters[i](value);
        }
        return value;
    }
    init() {
        if (this.info.wildcardCount > 0) {
            const lastWildcardPath = this.info.lastWildcardPath ??
                raiseError({
                    code: 'BIND-201',
                    message: 'Wildcard last parentPath is null',
                    context: { where: 'BindingState.init', pattern: this.#pattern },
                    docsUrl: '/docs/error-codes.md#bind',
                    severity: 'error',
                });
            this.#loopContext = this.binding.parentBindContent.currentLoopContext?.find(lastWildcardPath) ??
                raiseError({
                    code: 'BIND-201',
                    message: 'LoopContext is null',
                    context: { where: 'BindingState.init', lastWildcardPath },
                    docsUrl: '/docs/error-codes.md#bind',
                    severity: 'error',
                });
            this.#ref = null;
        }
        this.binding.engine.saveBinding(this.ref, this.binding);
    }
    assignValue(writeState, handler, value) {
        setByRef(this.binding.engine.state, this.ref, value, writeState, handler);
        //    writeState[SetByRefSymbol](this.ref, value);
    }
}
const createBindingState = (name, filterTexts) => (binding, filters) => {
    const filterFns = createFilters(filters, filterTexts); // ToDo:ここは、メモ化できる
    return new BindingState(binding, name, filterFns);
};

/**
 * BindingStateIndexクラスは、forバインディング等のループ内で利用される
 * インデックス値（$1, $2, ...）のバインディング状態を管理する実装です。
 *
 * 主な役割:
 * - ループコンテキストからインデックス値を取得し、value/filteredValueで参照可能にする
 * - バインディング時にbindingsByListIndexへ自身を登録し、依存解決や再描画を効率化
 * - フィルタ適用にも対応
 *
 * 設計ポイント:
 * - pattern（例: "$1"）からインデックス番号を抽出し、ループコンテキストから該当インデックスを取得
 * - initでループコンテキストやlistIndexRefを初期化し、バインディング情報をエンジンに登録
 * - assignValueは未実装（インデックスは書き換え不可のため）
 * - createBindingStateIndexファクトリでフィルタ適用済みインスタンスを生成
 */
class BindingStateIndex {
    #binding;
    #indexNumber;
    #filters;
    #loopContext = null;
    get pattern() {
        return raiseError({
            code: 'BIND-301',
            message: 'Not implemented',
            context: { where: 'BindingStateIndex.pattern' },
            docsUrl: '/docs/error-codes.md#bind',
        });
    }
    get info() {
        return raiseError({
            code: 'BIND-301',
            message: 'Not implemented',
            context: { where: 'BindingStateIndex.info' },
            docsUrl: '/docs/error-codes.md#bind',
        });
    }
    get listIndex() {
        return this.#loopContext?.listIndex ?? raiseError({
            code: 'LIST-201',
            message: 'listIndex is null',
            context: { where: 'BindingStateIndex.listIndex' },
            docsUrl: '/docs/error-codes.md#list',
        });
    }
    get ref() {
        return this.#loopContext?.ref ?? raiseError({
            code: 'STATE-202',
            message: 'ref is null',
            context: { where: 'BindingStateIndex.ref' },
            docsUrl: '/docs/error-codes.md#state',
        });
    }
    get filters() {
        return this.#filters;
    }
    get binding() {
        return this.#binding;
    }
    get isLoopIndex() {
        return true;
    }
    constructor(binding, pattern, filters) {
        this.#binding = binding;
        const indexNumber = Number(pattern.slice(1));
        if (isNaN(indexNumber)) {
            raiseError({
                code: 'BIND-202',
                message: 'Pattern is not a number',
                context: { where: 'BindingStateIndex.constructor', pattern },
                docsUrl: '/docs/error-codes.md#bind',
            });
        }
        this.#indexNumber = indexNumber;
        this.#filters = filters;
    }
    getValue(state, handler) {
        return this.listIndex?.index ?? raiseError({
            code: 'LIST-201',
            message: 'listIndex is null',
            context: { where: 'BindingStateIndex.getValue' },
            docsUrl: '/docs/error-codes.md#list',
        });
    }
    getFilteredValue(state, handler) {
        let value = this.listIndex?.index ?? raiseError({
            code: 'LIST-201',
            message: 'listIndex is null',
            context: { where: 'BindingStateIndex.getFilteredValue' },
            docsUrl: '/docs/error-codes.md#list',
        });
        for (let i = 0; i < this.#filters.length; i++) {
            value = this.#filters[i](value);
        }
        return value;
    }
    init() {
        const loopContext = this.binding.parentBindContent.currentLoopContext ??
            raiseError({
                code: 'BIND-201',
                message: 'LoopContext is null',
                context: { where: 'BindingStateIndex.init' },
                docsUrl: '/docs/error-codes.md#bind',
            });
        const loopContexts = loopContext.serialize();
        this.#loopContext = loopContexts[this.#indexNumber - 1] ??
            raiseError({
                code: 'BIND-201',
                message: 'Current loopContext is null',
                context: { where: 'BindingStateIndex.init', indexNumber: this.#indexNumber },
                docsUrl: '/docs/error-codes.md#bind',
            });
        const bindingForList = this.#loopContext.bindContent.parentBinding;
        if (bindingForList == null) {
            raiseError({
                code: 'BIND-201',
                message: 'Binding for list is null',
                context: { where: 'BindingStateIndex.init' },
                docsUrl: '/docs/error-codes.md#bind',
            });
        }
        const bindings = bindingForList.bindingsByListIndex.get(this.listIndex);
        if (typeof bindings === "undefined") {
            bindingForList.bindingsByListIndex.set(this.listIndex, new Set([this.binding]));
        }
        else {
            bindings.add(this.binding);
        }
    }
    assignValue(writeState, handler, value) {
        raiseError({
            code: 'BIND-301',
            message: 'Not implemented',
            context: { where: 'BindingStateIndex.assignValue' },
            docsUrl: '/docs/error-codes.md#bind',
        });
    }
}
const createBindingStateIndex = (name, filterTexts) => (binding, filters) => {
    const filterFns = createFilters(filters, filterTexts); // ToDo:ここは、メモ化できる
    return new BindingStateIndex(binding, name, filterFns);
};

const ereg = new RegExp(/^\$\d+$/);
/**
 * バインディング対象の状態プロパティ名とフィルタ情報から、
 * 適切なバインディング状態生成関数（CreateBindingStateByStateFn）を返すユーティリティ。
 *
 * - プロパティ名が "$数字"（例: "$1"）の場合は createBindingStateIndex を使用（インデックスバインディング用）
 * - それ以外は通常の createBindingState を使用
 *
 * @param name        バインディング対象の状態プロパティ名
 * @param filterTexts フィルタ情報
 * @returns           バインディング状態生成関数
 */
function getBindingStateCreator(name, filterTexts) {
    if (ereg.test(name)) {
        // "$数字"形式の場合はインデックスバインディング用の生成関数を返す
        return createBindingStateIndex(name, filterTexts);
    }
    else {
        // 通常のプロパティ名の場合は標準の生成関数を返す
        return createBindingState(name, filterTexts);
    }
}

const COMMENT_EMBED_MARK_LEN = COMMENT_EMBED_MARK.length;
const COMMENT_TEMPLATE_MARK_LEN = COMMENT_TEMPLATE_MARK.length;
/**
 * ノード種別ごとにdata-bindテキスト（バインディング定義文字列）を取得するユーティリティ関数。
 *
 * - Textノード: コメントマーク以降のテキストを取得し、"textContent:"を付与
 * - HTMLElement: data-bind属性値を取得
 * - Templateノード: コメントマーク以降のIDからテンプレートを取得し、そのdata-bind属性値を取得
 * - SVGElement: data-bind属性値を取得
 *
 * @param nodeType ノード種別（"Text" | "HTMLElement" | "Template" | "SVGElement"）
 * @param node     対象ノード
 * @returns        バインディング定義文字列
 */
function getDataBindText(nodeType, node) {
    switch (nodeType) {
        case "Text": {
            const text = node.textContent?.slice(COMMENT_EMBED_MARK_LEN).trim() ?? "";
            return "textContent:" + text;
        }
        case "HTMLElement": {
            return node.getAttribute(DATA_BIND_ATTRIBUTE) ?? "";
        }
        case "Template": {
            const text = node.textContent?.slice(COMMENT_TEMPLATE_MARK_LEN).trim();
            const id = Number(text);
            const template = getTemplateById(id) ?? raiseError(`Template not found: ${text}`);
            return template.getAttribute(DATA_BIND_ATTRIBUTE) ?? "";
        }
        case "SVGElement": {
            return node.getAttribute(DATA_BIND_ATTRIBUTE) ?? "";
        }
        default:
            return "";
    }
}

const createNodeKey = (node) => node.constructor.name + "\t" + ((node instanceof Comment) ? (node.textContent?.[2] ?? "") : "");
const nodeTypeByNodeKey = {};
const getNodeTypeByNode = (node) => (node instanceof Comment && node.textContent?.[2] === ":") ? "Text" :
    (node instanceof HTMLElement) ? "HTMLElement" :
        (node instanceof Comment && node.textContent?.[2] === "|") ? "Template" :
            (node instanceof SVGElement) ? "SVGElement" : raiseError(`Unknown NodeType: ${node.nodeType}`);
/**
 * ノードのタイプ（"Text" | "HTMLElement" | "Template" | "SVGElement"）を判定・キャッシュするユーティリティ関数。
 *
 * - コメントノードの場合、3文字目が ":" なら "Text"、"|" なら "Template" と判定
 * - HTMLElement, SVGElement もそれぞれ判定
 * - 未知のノード型はエラー
 * - ノードごとに一意なキー（constructor名＋コメント種別）でキャッシュし、再判定を省略
 *
 * @param node    判定対象のノード
 * @param nodeKey キャッシュ用のノードキー（省略時は自動生成）
 * @returns       ノードタイプ（NodeType）
 */
function getNodeType(node, nodeKey = createNodeKey(node)) {
    return nodeTypeByNodeKey[nodeKey] ?? (nodeTypeByNodeKey[nodeKey] = getNodeTypeByNode(node));
}

const trim = (s) => s.trim();
const has = (s) => s.length > 0; // check length
const re = new RegExp(/^#(.*)#$/);
const decode = (s) => {
    const m = re.exec(s);
    return m ? decodeURIComponent(m[1]) : s;
};
/**
 * parse filter part
 * "eq,100|falsey" ---> [Filter(eq, [100]), Filter(falsey)]
 */
const parseFilter = (text) => {
    const [name, ...options] = text.split(",").map(trim);
    return { name, options: options.map(decode) };
};
/**
 * parse expression
 * "value|eq,100|falsey" ---> ["value", Filter[]]
 */
const parseProperty = (text) => {
    const [property, ...filterTexts] = text.split("|").map(trim);
    return { property, filters: filterTexts.map(parseFilter) };
};
/**
 * parse expressions
 * "textContent:value|eq,100|falsey" ---> ["textContent", "value", Filter[eq, falsey]]
 */
const parseExpression = (expression) => {
    const [bindExpression, decoratesExpression = null] = expression.split("@").map(trim);
    const decorates = decoratesExpression ? decoratesExpression.split(",").map(trim) : [];
    const [nodePropertyText, statePropertyText] = bindExpression.split(":").map(trim);
    const { property: nodeProperty, filters: inputFilterTexts } = parseProperty(nodePropertyText);
    const { property: stateProperty, filters: outputFilterTexts } = parseProperty(statePropertyText);
    return { nodeProperty, stateProperty, inputFilterTexts, outputFilterTexts, decorates };
};
/**
 * parse bind text and return BindText[]
 */
const parseExpressions = (text) => {
    return text.split(";").map(trim).filter(has).map(s => parseExpression(s));
};
const cache = {};
/**
 * バインドテキスト（data-bind属性やコメント等から取得した文字列）を解析し、
 * バインディング情報（IBindText[]）に変換するユーティリティ関数群。
 *
 * - フィルターやデコレータ、プロパティ名などをパースし、構造化データとして返す
 * - "textContent:value|eq,100|falsey@decorate1,decorate2" のような複雑な記法にも対応
 * - セミコロン区切りで複数バインドもサポート
 * - パース結果はキャッシュし、同じ入力の再解析を防止
 *
 * @param text バインドテキスト
 * @returns    解析済みバインディング情報（IBindText[]）
 */
function parseBindText(text) {
    if (text.trim() === "") {
        return [];
    }
    return cache[text] ?? (cache[text] = parseExpressions(text));
}

const DATASET_BIND_PROPERTY = 'data-bind';
const removeAttributeFromElement = (node) => {
    const element = node;
    element.removeAttribute(DATASET_BIND_PROPERTY);
};
const removeAttributeByNodeType = {
    HTMLElement: removeAttributeFromElement,
    SVGElement: removeAttributeFromElement,
    Text: undefined,
    Template: undefined,
};
/**
 * 指定ノードから data-bind 属性を削除するユーティリティ関数。
 *
 * - ノードタイプ（HTMLElement, SVGElement）の場合のみ data-bind 属性を削除
 * - Text, Template ノードは対象外
 *
 * @param node     対象ノード
 * @param nodeType ノードタイプ（"HTMLElement" | "SVGElement" | "Text" | "Template"）
 * @returns        なし
 */
function removeDataBindAttribute(node, nodeType) {
    return removeAttributeByNodeType[nodeType]?.(node);
}

const replaceTextNodeText = (node) => {
    const textNode = document.createTextNode("");
    node.parentNode?.replaceChild(textNode, node);
    return textNode;
};
const replaceTextNodeFn = {
    Text: replaceTextNodeText,
    HTMLElement: undefined,
    Template: undefined,
    SVGElement: undefined
};
/**
 * コメントノードをテキストノードに置き換えるユーティリティ関数。
 *
 * - ノードタイプが "Text" の場合のみ、コメントノードを空のテキストノードに置換する
 * - それ以外のノードタイプ（HTMLElement, Template, SVGElement）は何もしない
 *
 * @param node     対象ノード
 * @param nodeType ノードタイプ（"Text" | "HTMLElement" | "Template" | "SVGElement"）
 * @returns        置換後のノード（または元のノード）
 */
function replaceTextNodeFromComment(node, nodeType) {
    return replaceTextNodeFn[nodeType]?.(node) ?? node;
}

/**
 * DataBindAttributesクラスは、DOMノードからバインディング情報を抽出・解析し、
 * バインディング生成に必要な情報（ノード種別・パス・バインドテキスト・クリエイター）を管理します。
 *
 * - ノード種別やパスを特定
 * - data-bind属性やコメントノードからバインドテキストを取得・解析
 * - バインドテキストごとにバインディング生成関数（ノード用・状態用）を用意
 * - data-bind属性やコメントノードはパース後に削除・置換
 *
 * これにより、テンプレート内のバインディング定義を一元的に管理し、後続のバインディング構築処理を効率化します。
 */
class DataBindAttributes {
    nodeType; // ノードの種別
    nodePath; // ノードのルート
    bindTexts; // BINDテキストの解析結果
    creatorByText = new Map(); // BINDテキストからバインディングクリエイターを取得
    constructor(node) {
        this.nodeType = getNodeType(node);
        const text = getDataBindText(this.nodeType, node);
        // コメントノードの場合はTextノードに置換（template.contentが書き換わる点に注意）
        node = replaceTextNodeFromComment(node, this.nodeType);
        // data-bind属性を削除（パース後は不要なため）
        removeDataBindAttribute(node, this.nodeType);
        this.nodePath = getAbsoluteNodePath(node);
        this.bindTexts = parseBindText(text);
        // 各バインドテキストごとにバインディング生成関数を用意
        for (let i = 0; i < this.bindTexts.length; i++) {
            const bindText = this.bindTexts[i];
            const creator = {
                createBindingNode: getBindingNodeCreator(node, bindText.nodeProperty, bindText.inputFilterTexts, bindText.decorates),
                createBindingState: getBindingStateCreator(bindText.stateProperty, bindText.outputFilterTexts),
            };
            this.creatorByText.set(bindText, creator);
        }
    }
}
/**
 * 指定ノードからDataBindAttributesインスタンスを生成するファクトリ関数。
 */
function createDataBindAttributes(node) {
    return new DataBindAttributes(node);
}

/**
 * "@@:"もしくは"@@|"で始まるコメントノードを取得する
 */
function isCommentNode(node) {
    return node instanceof Comment && ((node.textContent?.indexOf(COMMENT_EMBED_MARK) === 0) || (node.textContent?.indexOf(COMMENT_TEMPLATE_MARK) === 0));
}
/**
 * 指定ノード以下のツリーから「data-bind属性を持つ要素」または
 * 「特定のマーク（@@: または @@|）で始まるコメントノード」をすべて取得するユーティリティ関数。
 *
 * - Elementノードの場合: data-bind属性があるものだけを抽出
 * - Commentノードの場合: COMMENT_EMBED_MARK または COMMENT_TEMPLATE_MARK で始まるものだけを抽出
 * - DOMツリー全体をTreeWalkerで効率的に走査
 *
 * @param root 探索の起点となるノード
 * @returns    条件に合致したノードの配列
 */
function getNodesHavingDataBind(root) {
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT, {
        acceptNode(node) {
            return (node instanceof Element) ?
                (node.hasAttribute(DATA_BIND_ATTRIBUTE) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP)
                : (isCommentNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP);
        }
    });
    while (walker.nextNode()) {
        nodes.push(walker.currentNode);
    }
    return nodes;
}

const listDataBindAttributesById = {};
const listPathsSetById = {};
const pathsSetById = {};
/**
 * テンプレートの DocumentFragment から data-bind 対象ノードを抽出し、
 * IDataBindAttributes の配列へ変換するユーティリティ。
 */
function getDataBindAttributesFromTemplate(content) {
    const nodes = getNodesHavingDataBind(content);
    return nodes.map(node => createDataBindAttributes(node));
}
/**
 * テンプレート内のバインディング情報（data-bind 属性やコメント）を解析・登録し、
 * テンプレート ID ごとに属性リストと状態パス集合をキャッシュする。
 *
 * - getNodesHavingDataBind → createDataBindAttributes の順で解析
 * - for バインディングの stateProperty は listPaths にも登録
 *
 * @param id      テンプレート ID
 * @param content テンプレートの DocumentFragment
 * @param rootId  ルートテンプレート ID（省略時は id と同じ）
 * @returns       解析済みバインディング属性リスト
 */
function registerDataBindAttributes(id, content, rootId = id) {
    const dataBindAttributes = getDataBindAttributesFromTemplate(content);
    const paths = pathsSetById[rootId] ?? (pathsSetById[rootId] = new Set());
    const listPaths = listPathsSetById[rootId] ?? (listPathsSetById[rootId] = new Set());
    for (let i = 0; i < dataBindAttributes.length; i++) {
        const attribute = dataBindAttributes[i];
        for (let j = 0; j < attribute.bindTexts.length; j++) {
            const bindText = attribute.bindTexts[j];
            paths.add(bindText.stateProperty);
            if (bindText.nodeProperty === "for") {
                listPaths.add(bindText.stateProperty);
            }
        }
    }
    return listDataBindAttributesById[id] = dataBindAttributes;
}
/** テンプレート ID からバインディング属性リストを取得 */
const getDataBindAttributesById = (id) => {
    return listDataBindAttributesById[id];
};
/** テンプレート ID から for バインディングの stateProperty 集合を取得 */
const getListPathsSetById = (id) => {
    return listPathsSetById[id] ?? [];
};
/** テンプレート ID から全バインディングの stateProperty 集合を取得 */
const getPathsSetById = (id) => {
    return pathsSetById[id] ?? [];
};

/**
 * removeEmptyTextNodes.ts
 *
 * DocumentFragment内の空テキストノードを削除するユーティリティ関数です。
 *
 * 主な役割:
 * - content（DocumentFragment）の直下にある空白のみのテキストノードを検出し、削除する
 *
 * 設計ポイント:
 * - childNodesをArray.fromで配列化し、forEachで全ノードを走査
 * - nodeTypeがTEXT_NODEかつ、nodeValueが空白のみの場合にremoveChildで削除
 * - テンプレート処理やクリーンなDOM生成時に利用
 */
function removeEmptyTextNodes(content) {
    Array.from(content.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && !(node.nodeValue ?? "").trim()) {
            content.removeChild(node);
        }
    });
}

/**
 * HTMLTemplateElement を ID で登録・取得するための管理モジュール。
 *
 * 役割:
 * - registerTemplate: 指定 ID でテンプレートを登録（空テキスト除去と data-bind 解析を実行）
 * - getTemplateById: 指定 ID のテンプレートを取得（未登録時はエラー）
 *
 * Throws（getTemplateById）:
 * - TMP-001 Template not found: 未登録のテンプレート ID を要求
 */
const templateById = {};
/**
 * テンプレートを ID で登録し、内部インデックスと data-bind 情報を構築する。
 *
 * @param id       テンプレート ID
 * @param template HTMLTemplateElement
 * @param rootId   ルートテンプレート ID（ネスト解析用）
 * @returns       登録した ID
 */
function registerTemplate(id, template, rootId) {
    removeEmptyTextNodes(template.content);
    registerDataBindAttributes(id, template.content, rootId);
    templateById[id] = template;
    return id;
}
/**
 * 登録済みテンプレートを取得する。
 *
 * @throws TMP-001 Template not found
 */
function getTemplateById(id) {
    return templateById[id] ?? raiseError({
        code: "TMP-001",
        message: `Template not found: ${id}`,
        context: { where: 'registerTemplate.getTemplateById', templateId: id },
        docsUrl: "./docs/error-codes.md#tmp",
    });
}

/**
 * Bindingクラスは、1つのバインディング（ノードと状態の対応）を管理する中核的な実装です。
 *
 * 主な役割:
 * - DOMノードと状態（State）を結びつけるバインディングノード（bindingNode）とバインディング状態（bindingState）の生成・管理
 * - バインディングの初期化（init）、再描画（render）、状態値の更新（updateStateValue）などの処理を提供
 * - バージョン管理により、不要な再描画を防止
 *
 * 設計ポイント:
 * - createBindingNode, createBindingStateファクトリで柔軟なバインディング構造に対応
 * - renderでバージョン差分がある場合のみバインディングノードを更新
 * - 双方向バインディング時はupdateStateValueで状態プロキシに値を反映
 * - createBinding関数で一貫したバインディング生成を提供
 */
class Binding {
    parentBindContent;
    node;
    engine;
    bindingNode;
    bindingState;
    version;
    bindingsByListIndex = new WeakMap();
    constructor(parentBindContent, node, engine, createBindingNode, createBindingState) {
        this.parentBindContent = parentBindContent;
        this.node = node;
        this.engine = engine;
        this.bindingNode = createBindingNode(this, node, engine.inputFilters);
        this.bindingState = createBindingState(this, engine.outputFilters);
    }
    get bindContents() {
        return this.bindingNode.bindContents;
    }
    init() {
        this.bindingNode.init();
        this.bindingState.init();
    }
    updateStateValue(writeState, handler, value) {
        return this.bindingState.assignValue(writeState, handler, value);
    }
    notifyRedraw(refs) {
        this.bindingNode.notifyRedraw(refs);
    }
    applyChange(renderer) {
        if (renderer.updatedBindings.has(this))
            return;
        renderer.updatedBindings.add(this);
        this.bindingNode.applyChange(renderer);
        const ref = this.bindingState.ref;
        if (!this.bindingState.isLoopIndex && !this.engine.pathManager.dynamicDependencies.has(ref.info.pattern)) {
            const bindings = this.engine.getBindings(ref);
            if (bindings.length === 1) {
                renderer.processedRefs.add(ref);
            }
        }
    }
}
/**
 * バインディング生成用ファクトリ関数
 * - 各種ファクトリ・エンジン・ノード情報からBindingインスタンスを生成
 */
function createBinding(parentBindContent, node, engine, createBindingNode, createBindingState) {
    return new Binding(parentBindContent, node, engine, createBindingNode, createBindingState);
}

class LoopContext {
    #ref;
    #info;
    #bindContent;
    constructor(ref, bindContent) {
        this.#ref = ref;
        this.#info = ref.info;
        this.#bindContent = bindContent;
    }
    get ref() {
        return this.#ref ?? raiseError({
            code: 'STATE-202',
            message: 'ref is null',
            context: { where: 'LoopContext.ref', path: this.#info.pattern },
            docsUrl: '/docs/error-codes.md#state',
        });
    }
    get path() {
        return this.ref.info.pattern;
    }
    get info() {
        return this.ref.info;
    }
    get listIndex() {
        return this.ref.listIndex ?? raiseError({
            code: 'LIST-201',
            message: 'listIndex is required',
            context: { where: 'LoopContext.listIndex', path: this.#info.pattern },
            docsUrl: '/docs/error-codes.md#list',
        });
    }
    assignListIndex(listIndex) {
        this.#ref = getStatePropertyRef(this.#info, listIndex);
        // 構造は変わらないので、#parentLoopContext、#cacheはクリアする必要はない
    }
    clearListIndex() {
        this.#ref = null;
    }
    get bindContent() {
        return this.#bindContent;
    }
    #parentLoopContext;
    get parentLoopContext() {
        if (typeof this.#parentLoopContext === "undefined") {
            let currentBindContent = this.bindContent;
            while (currentBindContent !== null) {
                if (currentBindContent.loopContext !== null && currentBindContent.loopContext !== this) {
                    this.#parentLoopContext = currentBindContent.loopContext;
                    break;
                }
                currentBindContent = currentBindContent.parentBinding?.parentBindContent ?? null;
            }
            if (typeof this.#parentLoopContext === "undefined")
                this.#parentLoopContext = null;
        }
        return this.#parentLoopContext;
    }
    #cache = {};
    find(name) {
        let loopContext = this.#cache[name];
        if (typeof loopContext === "undefined") {
            let currentLoopContext = this;
            while (currentLoopContext !== null) {
                if (currentLoopContext.path === name)
                    break;
                currentLoopContext = currentLoopContext.parentLoopContext;
            }
            loopContext = this.#cache[name] = currentLoopContext;
        }
        return loopContext;
    }
    walk(callback) {
        let currentLoopContext = this;
        while (currentLoopContext !== null) {
            callback(currentLoopContext);
            currentLoopContext = currentLoopContext.parentLoopContext;
        }
    }
    serialize() {
        const results = [];
        this.walk((loopContext) => {
            results.unshift(loopContext);
        });
        return results;
    }
}
// 生成されたあと、IBindContentのloopContextに登録される
// IBindContentにずっと保持される
function createLoopContext(ref, bindContent) {
    return new LoopContext(ref, bindContent);
}

/**
 * 指定テンプレートIDから DocumentFragment を生成するヘルパー。
 *
 * Params:
 * - id: 登録済みテンプレートID
 *
 * Returns:
 * - テンプレート内容を複製した DocumentFragment
 *
 * Throws:
 * - BIND-101 Template not found: 未登録IDが指定された場合
 */
function createContent(id) {
    const template = getTemplateById(id) ??
        raiseError({
            code: "BIND-101",
            message: `Template not found: ${id}`,
            context: { where: 'BindContent.createContent', templateId: id },
            docsUrl: "./docs/error-codes.md#bind",
        });
    const fragment = document.importNode(template.content, true);
    if (hasLazyLoadComponents()) {
        const lazyLoadElements = fragment.querySelectorAll(":not(:defined)");
        for (let i = 0; i < lazyLoadElements.length; i++) {
            const tagName = lazyLoadElements[i].tagName.toLowerCase();
            loadLazyLoadComponent(tagName);
        }
    }
    return fragment;
}
/**
 * テンプレート内の data-bind 情報から IBinding 配列を構築する。
 *
 * Params:
 * - bindContent: 親 BindContent
 * - id: テンプレートID
 * - engine: コンポーネントエンジン
 * - content: テンプレートから複製したフラグメント
 *
 * Returns:
 * - 生成された IBinding の配列
 *
 * Throws:
 * - BIND-101 Data-bind is not set: テンプレートに data-bind 情報が未登録
 * - BIND-102 Node not found: パスで指すノードが見つからない
 * - BIND-103 Creator not found: 対応する BindingCreator が未登録
 */
function createBindings(bindContent, id, engine, content) {
    const attributes = getDataBindAttributesById(id) ??
        raiseError({
            code: "BIND-101",
            message: "Data-bind is not set",
            context: { where: 'BindContent.createBindings', templateId: id },
            docsUrl: "./docs/error-codes.md#bind",
        });
    const bindings = [];
    const blockBindings = [];
    for (let i = 0; i < attributes.length; i++) {
        const attribute = attributes[i];
        const node = resolveNodeFromPath(content, attribute.nodePath) ??
            raiseError({
                code: "BIND-102",
                message: `Node not found: ${attribute.nodePath}`,
                context: { where: 'BindContent.createBindings', templateId: id, nodePath: attribute.nodePath },
                docsUrl: "./docs/error-codes.md#bind",
            });
        for (let j = 0; j < attribute.bindTexts.length; j++) {
            const bindText = attribute.bindTexts[j];
            const creator = attribute.creatorByText.get(bindText) ??
                raiseError({
                    code: "BIND-103",
                    message: `Creator not found: ${bindText}`,
                    context: { where: 'BindContent.createBindings', templateId: id, bindText },
                    docsUrl: "./docs/error-codes.md#bind",
                });
            const binding = createBinding(bindContent, node, engine, creator.createBindingNode, creator.createBindingState);
            if (binding.bindingNode.isBlock) {
                blockBindings.push(binding);
            }
            bindings.push(binding);
        }
    }
    return [bindings, blockBindings];
}
/**
 * BindContent は、テンプレートから生成された DOM 断片（DocumentFragment）と
 * そのバインディング情報（IBinding[]）を管理する実装です。
 *
 * 主な役割:
 * - テンプレートIDから DOM 断片を生成し、バインディング情報を構築
 * - mount/mountBefore/mountAfter/unmount で DOM への挿入・削除を制御
 * - applyChange で各 IBinding に更新を委譲
 * - ループ時の LoopContext やリストインデックス管理にも対応
 * - getLastNode で再帰的に最後のノードを取得
 * - assignListIndex でループ内のリストインデックスを再割り当て
 *
 * Throws（代表例）:
 * - BIND-101 Template not found: createContent 内で未登録テンプレートID
 * - BIND-101/102/103: createBindings 内の data-bind 情報不足/不整合
 * - BIND-104 Child bindContent not found: getLastNode の子探索で不整合
 * - BIND-201 LoopContext is null: assignListIndex 実行時に LoopContext 未初期化
 */
class BindContent {
    loopContext;
    parentBinding;
    childNodes;
    fragment;
    engine;
    bindings = [];
    blockBindings = [];
    #id;
    get id() {
        return this.#id;
    }
    /**
     * この BindContent が既に DOM にマウントされているかどうか。
     * 判定は childNodes[0] の親が fragment 以外かで行う。
     */
    get isMounted() {
        return this.childNodes.length > 0 && this.childNodes[0].parentNode !== this.fragment;
    }
    /**
     * 先頭の子ノードを返す。存在しなければ null。
     */
    get firstChildNode() {
        return this.childNodes[0] ?? null;
    }
    /**
     * 末尾の子ノードを返す。存在しなければ null。
     */
    get lastChildNode() {
        return this.childNodes[this.childNodes.length - 1] ?? null;
    }
    get hasBlockBinding() {
        return this.blockBindings.length > 0;
    }
    /**
     * 再帰的に最終ノード（末尾のバインディング配下も含む）を取得する。
     *
     * Params:
     * - parentNode: 検証対象の親ノード（このノード配下にあることを期待）
     *
     * Returns:
     * - 最終ノード（Node）または null（親子関係が崩れている場合）
     *
     * Throws:
     * - BIND-104 子 BindContent が見つからない（不整合）
     */
    getLastNode(parentNode) {
        const lastBinding = this.bindings[this.bindings.length - 1];
        const lastChildNode = this.lastChildNode;
        if (typeof lastBinding !== "undefined" && lastBinding.node === lastChildNode) {
            if (lastBinding.bindContents.length > 0) {
                const childBindContent = lastBinding.bindContents.at(-1) ?? raiseError({
                    code: "BIND-104",
                    message: "Child bindContent not found",
                    context: { where: 'BindContent.getLastNode', templateId: this.#id },
                    docsUrl: "./docs/error-codes.md#bind",
                });
                const lastNode = childBindContent.getLastNode(parentNode);
                if (lastNode !== null) {
                    return lastNode;
                }
            }
        }
        if (parentNode !== lastChildNode?.parentNode) {
            return null;
        }
        return lastChildNode;
    }
    #currentLoopContext;
    /**
     * 現在のループ文脈（LoopContext）を返す。自身に無ければ親方向へ遡って探索し、
     * 一度解決した値はフィールドにキャッシュする。
     */
    get currentLoopContext() {
        if (typeof this.#currentLoopContext === "undefined") {
            let bindContent = this;
            while (bindContent !== null) {
                if (bindContent.loopContext !== null)
                    break;
                bindContent = bindContent.parentBinding?.parentBindContent ?? null;
            }
            this.#currentLoopContext = bindContent?.loopContext ?? null;
        }
        return this.#currentLoopContext;
    }
    /**
     * コンストラクタ。
     * - テンプレートから DocumentFragment と childNodes を構築
     * - ループ参照（loopRef.listIndex）がある場合に LoopContext を生成
     * - テンプレートに基づき Bindings を生成
     */
    constructor(parentBinding, id, engine, loopRef) {
        this.parentBinding = parentBinding;
        this.#id = id;
        this.fragment = createContent(id);
        this.childNodes = Array.from(this.fragment.childNodes);
        this.engine = engine;
        this.loopContext = (loopRef.listIndex !== null) ? createLoopContext(loopRef, this) : null;
        const [bindings, blockBindings] = createBindings(this, id, engine, this.fragment);
        this.bindings = bindings;
        this.blockBindings = blockBindings;
    }
    /**
     * 末尾にマウント（appendChild）。
     * 注意: idempotent ではないため、重複マウントは呼び出し側で避けること。
     */
    mount(parentNode) {
        for (let i = 0; i < this.childNodes.length; i++) {
            parentNode.appendChild(this.childNodes[i]);
        }
    }
    /**
     * 指定ノードの直前にマウント（insertBefore）。
     */
    mountBefore(parentNode, beforeNode) {
        for (let i = 0; i < this.childNodes.length; i++) {
            parentNode.insertBefore(this.childNodes[i], beforeNode);
        }
    }
    /**
     * 指定ノードの直後にマウント（afterNode.nextSibling を before にして insertBefore）。
     */
    mountAfter(parentNode, afterNode) {
        const beforeNode = afterNode?.nextSibling ?? null;
        for (let i = 0; i < this.childNodes.length; i++) {
            parentNode.insertBefore(this.childNodes[i], beforeNode);
        }
    }
    /**
     * アンマウント（親から childNodes を一括で取り外す）。
     * コメント/テキストノードにも対応するため parentNode を使用。
     * 親が既に無い場合は no-op。
     */
    unmount() {
        // コメント/テキストノードでも確実に取得できるよう parentNode を使用する
        const parentNode = this.childNodes[0]?.parentNode ?? null;
        if (parentNode === null) {
            return; // すでにDOMから削除されている場合は何もしない
        }
        for (let i = 0; i < this.childNodes.length; i++) {
            parentNode.removeChild(this.childNodes[i]);
        }
    }
    /**
     * 生成済みの全 Binding を初期化。
     * createBindContent 直後および assignListIndex 後に呼び出される。
     */
    init() {
        for (let i = 0; i < this.bindings.length; i++) {
            this.bindings[i].init();
        }
    }
    /**
     * ループ中の ListIndex を再割当てし、Bindings を再初期化する。
     * Throws:
     * - BIND-201 LoopContext が未初期化
     */
    assignListIndex(listIndex) {
        if (this.loopContext == null)
            raiseError({
                code: "BIND-201",
                message: "LoopContext is null",
                context: { where: 'BindContent.assignListIndex', templateId: this.#id },
                docsUrl: "./docs/error-codes.md#bind",
            });
        this.loopContext.assignListIndex(listIndex);
        this.init();
    }
    /**
     * 変更適用エントリポイント。
     * Renderer から呼ばれ、各 Binding に applyChange を委譲する。
     * renderer.updatedBindings に載っているものは二重適用を避ける。
     */
    applyChange(renderer) {
        for (let i = 0; i < this.bindings.length; i++) {
            const binding = this.bindings[i];
            if (renderer.updatedBindings.has(binding))
                continue;
            binding.applyChange(renderer);
        }
    }
}
/**
 * BindContent を生成して初期化（bindings.init）までを行うファクトリ関数。
 *
 * Params:
 * - parentBinding: 親の IBinding（なければ null）
 * - id: テンプレートID
 * - engine: コンポーネントエンジン
 * - loopRef: ループ用の StatePropertyRef（listIndex を含む場合に LoopContext を構築）
 *
 * Returns:
 * - 初期化済みの IBindContent
 */
function createBindContent(parentBinding, id, engine, loopRef) {
    const bindContent = new BindContent(parentBinding, id, engine, loopRef);
    bindContent.init();
    return bindContent;
}

/**
 * 指定したタグ名の要素がShadowRootを持てるかどうかを判定するユーティリティ関数。
 *
 * - 指定タグ名で要素を生成し、attachShadowメソッドが存在するかどうかで判定
 * - 無効なタグ名やattachShadow未対応の場合はfalseを返す
 *
 * @param tagName 判定したい要素のタグ名（例: "div", "span", "input" など）
 * @returns       ShadowRootを持てる場合はtrue、持てない場合はfalse
 */
function canHaveShadowRoot(tagName) {
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
    }
    catch {
        // 無効なタグ名などが渡された場合は false を返す
        return false;
    }
}

function getParentShadowRoot(parentNode) {
    let node = parentNode;
    while (node) {
        if (node instanceof ShadowRoot) {
            return node;
        }
        node = node.parentNode;
    }
}
/**
 * 指定したHTMLElementにShadow DOMをアタッチし、スタイルシートを適用するユーティリティ関数。
 *
 * - config.enableShadowDomがtrueの場合は、ShadowRootを生成し、adoptedStyleSheetsでスタイルを適用
 * - extends指定がある場合はcanHaveShadowRootで拡張可能かチェック
 * - Shadow DOMを使わない場合は、親のShadowRootまたはdocumentにスタイルシートを追加
 * - すでに同じスタイルシートが含まれていれば重複追加しない
 *
 * @param element    対象のHTMLElement
 * @param config     コンポーネント設定
 * @param styleSheet 適用するCSSStyleSheet
 * @throws           Shadow DOM非対応の組み込み要素を拡張しようとした場合はエラー
 */
function attachShadow(element, config, styleSheet) {
    if (config.enableShadowDom) {
        if (config.extends === null || canHaveShadowRoot(config.extends)) {
            if (!element.shadowRoot) {
                const shadowRoot = element.attachShadow({ mode: 'open' });
                shadowRoot.adoptedStyleSheets = [styleSheet];
            }
        }
        else {
            raiseError(`ComponentEngine: Shadow DOM not supported for builtin components that extend ${config.extends}`);
        }
    }
    else {
        const shadowRootOrDocument = getParentShadowRoot(element.parentNode) || document;
        const styleSheets = shadowRootOrDocument.adoptedStyleSheets;
        if (!styleSheets.includes(styleSheet)) {
            shadowRootOrDocument.adoptedStyleSheets = [...styleSheets, styleSheet];
        }
    }
}

/**
 * ComponentStateBinding
 *
 * 目的:
 * - 親コンポーネントの状態パスと子コンポーネント側のサブパスを一対一で関連付け、
 *   双方向にパス変換・参照できるようにする（親->子/子->親）。
 *
 * 制約:
 * - 親パス/子パスは 1:1 のみ（重複登録は STATE-303）
 * - 最長一致でのパス変換を行い、下位セグメントはそのまま連結
 */
class ComponentStateBinding {
    parentPaths = new Set();
    childPaths = new Set();
    childPathByParentPath = new Map();
    parentPathByChildPath = new Map();
    bindingByParentPath = new Map();
    bindingByChildPath = new Map();
    bindings = new WeakSet();
    addBinding(binding) {
        if (this.bindings.has(binding)) {
            return; // 既にバインディングが追加されている場合は何もしない
        }
        const parentPath = binding.bindingState.pattern;
        const childPath = binding.bindingNode.subName;
        if (this.childPathByParentPath.has(parentPath)) {
            raiseError({
                code: "STATE-303",
                message: `Parent path "${parentPath}" already has a child path`,
                context: { parentPath, existingChildPath: this.childPathByParentPath.get(parentPath) },
                docsUrl: "./docs/error-codes.md#state",
            });
        }
        if (this.parentPathByChildPath.has(childPath)) {
            raiseError({
                code: "STATE-303",
                message: `Child path "${childPath}" already has a parent path`,
                context: { childPath, existingParentPath: this.parentPathByChildPath.get(childPath) },
                docsUrl: "./docs/error-codes.md#state",
            });
        }
        this.childPathByParentPath.set(parentPath, childPath);
        this.parentPathByChildPath.set(childPath, parentPath);
        this.parentPaths.add(parentPath);
        this.childPaths.add(childPath);
        this.bindingByParentPath.set(parentPath, binding);
        this.bindingByChildPath.set(childPath, binding);
        this.bindings.add(binding);
    }
    getChildPath(parentPath) {
        return this.childPathByParentPath.get(parentPath);
    }
    getParentPath(childPath) {
        return this.parentPathByChildPath.get(childPath);
    }
    toParentPathFromChildPath(childPath) {
        // 子から親へ: 最長一致する childPaths のエントリを探し、残差のセグメントを親に連結
        const childPathInfo = getStructuredPathInfo(childPath);
        const matchPaths = childPathInfo.cumulativePathSet.intersection(this.childPaths);
        if (matchPaths.size === 0) {
            raiseError({
                code: "STATE-302",
                message: `No parent path found for child path "${childPath}"`,
                context: { childPath },
                docsUrl: "./docs/error-codes.md#state",
            });
        }
        const matchPathArray = Array.from(matchPaths);
        const longestMatchPath = matchPathArray[matchPathArray.length - 1];
        const remainPath = childPath.slice(longestMatchPath.length); // include the dot
        const matchParentPath = this.parentPathByChildPath.get(longestMatchPath);
        if (typeof matchParentPath === "undefined") {
            raiseError({
                code: "STATE-302",
                message: `No parent path found for child path "${childPath}"`,
                context: { childPath, longestMatchPath },
                docsUrl: "./docs/error-codes.md#state",
            });
        }
        return matchParentPath + remainPath;
    }
    toChildPathFromParentPath(parentPath) {
        // 親から子へ: 最長一致する parentPaths のエントリを探し、残差のセグメントを子に連結
        const parentPathInfo = getStructuredPathInfo(parentPath);
        const matchPaths = parentPathInfo.cumulativePathSet.intersection(this.parentPaths);
        if (matchPaths.size === 0) {
            raiseError({
                code: "STATE-302",
                message: `No child path found for parent path "${parentPath}"`,
                context: { parentPath },
                docsUrl: "./docs/error-codes.md#state",
            });
        }
        const matchPathArray = Array.from(matchPaths);
        const longestMatchPath = matchPathArray[matchPathArray.length - 1];
        const remainPath = parentPath.slice(longestMatchPath.length); // include the dot
        const matchChildPath = this.childPathByParentPath.get(longestMatchPath);
        if (typeof matchChildPath === "undefined") {
            raiseError({
                code: "STATE-302",
                message: `No child path found for parent path "${parentPath}"`,
                context: { parentPath, longestMatchPath },
                docsUrl: "./docs/error-codes.md#state",
            });
        }
        return matchChildPath + remainPath;
    }
    startsWithByChildPath(childPathInfo) {
        if (this.childPaths.size === 0) {
            return null;
        }
        const matchPaths = childPathInfo.cumulativePathSet.intersection(this.childPaths);
        if (matchPaths.size === 0) {
            return null;
        }
        else {
            const matches = Array.from(matchPaths);
            const longestMatchPath = matches[matches.length - 1];
            return longestMatchPath;
        }
    }
    bind(parentComponent, childComponent) {
        // bindParentComponent
        const bindings = parentComponent.getBindingsFromChild(childComponent);
        for (const binding of bindings ?? []) {
            this.addBinding(binding);
        }
    }
}
function createComponentStateBinding() {
    return new ComponentStateBinding();
}

class ComponentStateInputHandler {
    componentStateBinding;
    engine;
    constructor(engine, componentStateBinding) {
        this.componentStateBinding = componentStateBinding;
        this.engine = engine;
    }
    assignState(object) {
        createUpdater(this.engine, (updater) => {
            updater.update(null, (stateProxy, handler) => {
                for (const [key, value] of Object.entries(object)) {
                    const childPathInfo = getStructuredPathInfo(key);
                    const childRef = getStatePropertyRef(childPathInfo, null);
                    stateProxy[SetByRefSymbol](childRef, value);
                }
            });
        });
    }
    /**
     * listindexに一致するかどうかは事前にスクリーニングしておく
     * @param refs
     */
    notifyRedraw(refs) {
        createUpdater(this.engine, (updater) => {
            for (const parentPathRef of refs) {
                let childPath;
                try {
                    childPath = this.componentStateBinding.toChildPathFromParentPath(parentPathRef.info.pattern);
                }
                catch (e) {
                    // 対象でないものは何もしない
                    continue;
                }
                const childPathInfo = getStructuredPathInfo(childPath);
                const atIndex = childPathInfo.wildcardCount - 1;
                const childListIndex = (atIndex >= 0) ? (parentPathRef.listIndex?.at(atIndex) ?? null) : null;
                if (atIndex >= 0 && childListIndex === null) {
                    raiseError({
                        code: 'LIST-201',
                        message: `ListIndex not found for parent ref: ${parentPathRef.info.pattern}`,
                        context: {
                            where: 'ComponentStateInput.notifyRedraw',
                            parentPattern: parentPathRef.info.pattern,
                            childPattern: childPathInfo.pattern,
                        },
                        docsUrl: '/docs/error-codes.md#list',
                    });
                }
                const childRef = getStatePropertyRef(childPathInfo, childListIndex);
                this.engine.getPropertyValue(childRef);
                // Ref情報をもとに状態更新キューに追加
                updater.enqueueRef(childRef);
            }
        });
    }
    get(target, prop, receiver) {
        if (prop === AssignStateSymbol) {
            return this.assignState.bind(this);
        }
        else if (prop === NotifyRedrawSymbol) {
            return this.notifyRedraw.bind(this);
        }
        else if (typeof prop === "string") {
            const ref = getStatePropertyRef(getStructuredPathInfo(prop), null);
            return this.engine.getPropertyValue(ref);
        }
        raiseError(`Property "${String(prop)}" is not supported in ComponentStateInput.`);
    }
    set(target, prop, value, receiver) {
        if (typeof prop === "string") {
            const ref = getStatePropertyRef(getStructuredPathInfo(prop), null);
            this.engine.setPropertyValue(ref, value);
            return true;
        }
        raiseError(`Property "${String(prop)}" is not supported in ComponentStateInput.`);
    }
}
function createComponentStateInput(engine, componentStateBinding) {
    const handler = new ComponentStateInputHandler(engine, componentStateBinding);
    return new Proxy({}, handler);
}

class ComponentStateOutput {
    binding;
    childEngine;
    #parentPaths = new Set();
    constructor(binding, childEngine) {
        this.binding = binding;
        this.childEngine = childEngine;
    }
    get(ref) {
        const childPath = this.binding.startsWithByChildPath(ref.info);
        if (childPath === null) {
            raiseError(`No child path found for path "${ref.info.toString()}".`);
        }
        const parentBinding = this.binding.bindingByChildPath.get(childPath);
        if (typeof parentBinding === "undefined") {
            raiseError(`No binding found for child path "${childPath}".`);
        }
        const parentPath = this.binding.toParentPathFromChildPath(ref.info.pattern);
        const parentInfo = getStructuredPathInfo(parentPath);
        const parentRef = getStatePropertyRef(parentInfo, ref.listIndex ?? parentBinding.bindingState.listIndex);
        if (!this.#parentPaths.has(parentRef.info.pattern)) {
            const isList = this.childEngine.pathManager.lists.has(ref.info.pattern);
            parentBinding.engine.pathManager.addPath(parentRef.info.pattern, isList);
            this.#parentPaths.add(parentRef.info.pattern);
        }
        return parentBinding.engine.getPropertyValue(parentRef);
    }
    set(ref, value) {
        const childPath = this.binding.startsWithByChildPath(ref.info);
        if (childPath === null) {
            raiseError(`No child path found for path "${ref.info.toString()}".`);
        }
        const parentBinding = this.binding.bindingByChildPath.get(childPath);
        if (typeof parentBinding === "undefined") {
            raiseError(`No binding found for child path "${childPath}".`);
        }
        const parentPath = this.binding.toParentPathFromChildPath(ref.info.pattern);
        const parentInfo = getStructuredPathInfo(parentPath);
        const parentRef = getStatePropertyRef(parentInfo, ref.listIndex ?? parentBinding.bindingState.listIndex);
        if (!this.#parentPaths.has(parentRef.info.pattern)) {
            const isList = this.childEngine.pathManager.lists.has(ref.info.pattern);
            parentBinding.engine.pathManager.addPath(parentRef.info.pattern, isList);
            this.#parentPaths.add(parentRef.info.pattern);
        }
        parentBinding.engine.setPropertyValue(parentRef, value);
        return true;
    }
    startsWith(pathInfo) {
        return this.binding.startsWithByChildPath(pathInfo) !== null;
    }
    getListIndexes(ref) {
        const childPath = this.binding.startsWithByChildPath(ref.info);
        if (childPath === null) {
            raiseError(`No child path found for path "${ref.info.toString()}".`);
        }
        const binding = this.binding.bindingByChildPath.get(childPath);
        if (typeof binding === "undefined") {
            raiseError(`No binding found for child path "${childPath}".`);
        }
        const parentPathInfo = getStructuredPathInfo(this.binding.toParentPathFromChildPath(ref.info.pattern));
        const parentRef = getStatePropertyRef(parentPathInfo, ref.listIndex);
        return binding.engine.getListIndexes(parentRef);
    }
}
function createComponentStateOutput(binding, childEngine) {
    return new ComponentStateOutput(binding, childEngine);
}

/**
 * ComponentEngine は、Structive コンポーネントの状態・依存関係・
 * バインディング・ライフサイクル・レンダリングを統合する中核エンジンです。
 *
 * 主な役割:
 * - 状態インスタンスやプロキシの生成・管理
 * - テンプレート/スタイルシート/フィルター/バインディングの管理
 * - 依存関係グラフ（PathTree）の構築と管理
 * - バインディング情報やリスト情報の保存・取得
 * - ライフサイクル（connected/disconnected）処理
 * - Shadow DOM の適用、またはブロックモードのプレースホルダー運用
 * - 状態プロパティの取得・設定
 * - バインディングの追加・存在判定・リスト管理
 *
 * Throws（代表例）:
 * - BIND-201 bindContent not initialized yet / Block parent node is not set
 * - STATE-202 Failed to parse state from dataset
 *
 * 備考:
 * - 非同期初期化（waitForInitialize）と切断待機（waitForDisconnected）を提供
 * - Updater と連携したバッチ更新で効率的なレンダリングを実現
 */
class ComponentEngine {
    type = 'autonomous';
    config;
    template;
    styleSheet;
    stateClass;
    state;
    inputFilters;
    outputFilters;
    #bindContent = null;
    get bindContent() {
        if (this.#bindContent === null) {
            raiseError({
                code: 'BIND-201',
                message: 'bindContent not initialized yet',
                context: { where: 'ComponentEngine.bindContent.get', componentId: this.owner.constructor.id },
                docsUrl: './docs/error-codes.md#bind',
            });
        }
        return this.#bindContent;
    }
    baseClass = HTMLElement;
    owner;
    bindingsByComponent = new WeakMap();
    structiveChildComponents = new Set();
    #waitForInitialize = Promise.withResolvers();
    #waitForDisconnected = null;
    #stateBinding = createComponentStateBinding();
    stateInput;
    stateOutput;
    #blockPlaceholder = null; // ブロックプレースホルダー
    #blockParentNode = null; // ブロックプレースホルダーの親ノード
    #ignoreDissconnectedCallback = false; // disconnectedCallbackを無視するフラグ
    #currentVersion = 0;
    get currentVersion() {
        return this.#currentVersion;
    }
    versionUp() {
        return ++this.#currentVersion;
    }
    versionRevisionByPath = new Map();
    constructor(config, owner) {
        this.config = config;
        if (this.config.extends) {
            this.type = 'builtin';
        }
        const componentClass = owner.constructor;
        this.template = componentClass.template;
        this.styleSheet = componentClass.styleSheet;
        this.stateClass = componentClass.stateClass;
        this.state = new this.stateClass();
        this.inputFilters = componentClass.inputFilters;
        this.outputFilters = componentClass.outputFilters;
        this.owner = owner;
        this.stateInput = createComponentStateInput(this, this.#stateBinding);
        this.stateOutput = createComponentStateOutput(this.#stateBinding, this);
    }
    get pathManager() {
        return this.owner.constructor.pathManager;
    }
    setup() {
        // 実体化された state オブジェクトのプロパティをすべて PathManager に登録する
        // ToDo:prototypeを遡ったほうが良い
        for (const path in this.state) {
            if (RESERVED_WORD_SET.has(path) || this.pathManager.alls.has(path)) {
                continue;
            }
            this.pathManager.alls.add(path);
            addPathNode(this.pathManager.rootNode, path);
        }
        const componentClass = this.owner.constructor;
        const rootRef = getStatePropertyRef(getStructuredPathInfo(''), null);
        this.#bindContent = createBindContent(null, componentClass.id, this, rootRef); // this.stateArrayPropertyNamePatternsが変更になる可能性がある
    }
    get waitForInitialize() {
        return this.#waitForInitialize;
    }
    async connectedCallback() {
        await this.#waitForDisconnected?.promise; // disconnectedCallbackが呼ばれている場合は待つ
        await this.owner.parentStructiveComponent?.waitForInitialize.promise;
        // コンポーネントの状態を初期化する
        if (this.owner.dataset.state) {
            // data-state属性から状態を取得する
            try {
                const json = JSON.parse(this.owner.dataset.state);
                this.stateInput[AssignStateSymbol](json);
            }
            catch (e) {
                raiseError({
                    code: 'STATE-202',
                    message: 'Failed to parse state from dataset',
                    context: { where: 'ComponentEngine.connectedCallback', datasetState: this.owner.dataset.state },
                    docsUrl: './docs/error-codes.md#state',
                    cause: e,
                });
            }
        }
        const parentComponent = this.owner.parentStructiveComponent;
        if (parentComponent) {
            // 親コンポーネントの状態をバインドする
            parentComponent.registerChildComponent(this.owner);
            // 親コンポーネントの状態を子コンポーネントにバインドする
            this.#stateBinding.bind(parentComponent, this.owner);
        }
        if (this.config.enableWebComponents) {
            attachShadow(this.owner, this.config, this.styleSheet);
        }
        else {
            this.#blockParentNode = this.owner.parentNode;
            this.#blockPlaceholder = document.createComment("Structive block placeholder");
            try {
                this.#ignoreDissconnectedCallback = true; // disconnectedCallbackを無視するフラグを立てる
                this.owner.replaceWith(this.#blockPlaceholder); // disconnectCallbackが呼ばれてしまう
            }
            finally {
                this.#ignoreDissconnectedCallback = false;
            }
        }
        if (this.config.enableWebComponents) {
            // Shadow DOMにバインドコンテンツをマウントする
            this.bindContent.mount(this.owner.shadowRoot ?? this.owner);
        }
        else {
            // ブロックプレースホルダーの親ノードにバインドコンテンツをマウントする
            const parentNode = this.#blockParentNode ?? raiseError({
                code: 'BIND-201',
                message: 'Block parent node is not set',
                context: { where: 'ComponentEngine.connectedCallback', mode: 'block' },
                docsUrl: './docs/error-codes.md#bind',
            });
            this.bindContent.mountAfter(parentNode, this.#blockPlaceholder);
        }
        await createUpdater(this, async (updater) => {
            await updater.update(null, async (stateProxy, handler) => {
                // 状態の初期レンダリングを行う
                for (const path of this.pathManager.alls) {
                    const info = getStructuredPathInfo(path);
                    if (info.pathSegments.length !== 1)
                        continue; // ルートプロパティのみ
                    if (this.pathManager.funcs.has(path))
                        continue; // 関数は除外
                    const ref = getStatePropertyRef(info, null);
                    updater.enqueueRef(ref);
                }
                await stateProxy[ConnectedCallbackSymbol]();
            });
        });
        // レンダリングが終わってから実行する
        queueMicrotask(() => {
            this.#waitForInitialize.resolve();
        });
    }
    async disconnectedCallback() {
        this.#waitForDisconnected = Promise.withResolvers();
        try {
            if (this.#ignoreDissconnectedCallback)
                return; // disconnectedCallbackを無視するフラグが立っている場合は何もしない
            await createUpdater(this, async (updater) => {
                await updater.update(null, async (stateProxy, handler) => {
                    await stateProxy[DisconnectedCallbackSymbol]();
                });
            });
            // 親コンポーネントから登録を解除する
            this.owner.parentStructiveComponent?.unregisterChildComponent(this.owner);
            if (!this.config.enableWebComponents) {
                this.#blockPlaceholder?.remove();
                this.#blockPlaceholder = null;
                this.#blockParentNode = null;
            }
        }
        finally {
            this.#waitForDisconnected.resolve(); // disconnectedCallbackが呼ばれたことを通知   
        }
    }
    getListIndexes(ref) {
        if (this.stateOutput.startsWith(ref.info)) {
            return this.stateOutput.getListIndexes(ref);
        }
        let value = null;
        createUpdater(this, (updater) => {
            value = updater.createReadonlyState((stateProxy, handler) => {
                return stateProxy[GetListIndexesByRefSymbol](ref);
            });
        });
        return value;
    }
    getPropertyValue(ref) {
        // プロパティの値を取得する
        let value;
        createUpdater(this, (updater) => {
            value = updater.createReadonlyState((stateProxy, handler) => {
                return stateProxy[GetByRefSymbol](ref);
            });
        });
        return value;
    }
    setPropertyValue(ref, value) {
        // プロパティの値を設定する
        createUpdater(this, (updater) => {
            updater.update(null, (stateProxy, handler) => {
                stateProxy[SetByRefSymbol](ref, value);
            });
        });
    }
    // Structive子コンポーネントを登録する
    registerChildComponent(component) {
        this.structiveChildComponents.add(component);
    }
    unregisterChildComponent(component) {
        this.structiveChildComponents.delete(component);
    }
    #propertyRefInfoByRef = new WeakMap();
    getCacheEntry(ref) {
        return this.#propertyRefInfoByRef.get(ref)?.cacheEntry ?? null;
    }
    setCacheEntry(ref, entry) {
        let info = this.#propertyRefInfoByRef.get(ref);
        if (typeof info === "undefined") {
            this.#propertyRefInfoByRef.set(ref, { bindings: [], cacheEntry: entry });
        }
        else {
            info.cacheEntry = entry;
        }
    }
    getBindings(ref) {
        return this.#propertyRefInfoByRef.get(ref)?.bindings ?? [];
    }
    saveBinding(ref, binding) {
        const info = this.#propertyRefInfoByRef.get(ref);
        if (typeof info === "undefined") {
            this.#propertyRefInfoByRef.set(ref, { bindings: [binding], cacheEntry: null });
        }
        else {
            info.bindings.push(binding);
        }
    }
}
function createComponentEngine(config, component) {
    return new ComponentEngine(config, component);
}

/**
 * replaceMustacheWithTemplateTag.ts
 *
 * Mustache構文（{{if:条件}}, {{for:式}}, {{endif}}, {{endfor}}, {{elseif:条件}}, {{else}} など）を
 * <template>タグやコメントノードに変換するユーティリティ関数です。
 *
 * 主な役割:
 * - HTML文字列内のMustache構文を正規表現で検出し、<template data-bind="...">やコメントノードに変換
 * - if/for/endif/endfor/elseif/elseなどの制御構文をネスト対応で<template>タグに変換
 * - 通常の埋め込み式（{{expr}}）はコメントノード（<!--embed:expr-->）に変換
 *
 * 設計ポイント:
 * - stackでネスト構造を管理し、endif/endfor/elseif/elseの対応関係を厳密にチェック
 * - 不正なネストや対応しない構文にはraiseErrorで例外を発生
 * - elseif/elseはnot条件のtemplateを自動生成し、条件分岐を表現
 * - コメントノードへの変換で埋め込み式の安全なDOM挿入を実現
 */
const MUSTACHE_REGEXP = /\{\{([^\}]+)\}\}/g;
const MUSTACHE_TYPES = new Set(['if', 'for', 'endif', 'endfor', 'elseif', 'else']);
function replaceMustacheWithTemplateTag(html) {
    const stack = [];
    return html.replaceAll(MUSTACHE_REGEXP, (match, expr) => {
        expr = expr.trim();
        const [type] = expr.split(':');
        if (!MUSTACHE_TYPES.has(type)) {
            // embed
            return `<!--${COMMENT_EMBED_MARK}${expr}-->`;
        }
        const remain = expr.slice(type.length + 1).trim();
        const currentInfo = { type, expr, remain };
        if (type === 'if' || type === 'for') {
            stack.push(currentInfo);
            return `<template data-bind="${expr}">`;
        }
        else if (type === 'endif') {
            const endTags = [];
            do {
                const info = stack.pop() ?? raiseError({
                    code: 'TMP-102',
                    message: 'Endif without if',
                    context: { where: 'replaceMustacheWithTemplateTag', expr, stackDepth: stack.length },
                    docsUrl: './docs/error-codes.md#tmp',
                });
                if (info.type === 'if') {
                    endTags.push('</template>');
                    break;
                }
                else if (info.type === 'elseif') {
                    endTags.push('</template>');
                }
                else {
                    raiseError({
                        code: 'TMP-102',
                        message: 'Endif without if',
                        context: { where: 'replaceMustacheWithTemplateTag', got: info.type, expr },
                        docsUrl: './docs/error-codes.md#tmp',
                    });
                }
            } while (true);
            return endTags.join('');
        }
        else if (type === 'endfor') {
            const info = stack.pop() ?? raiseError({
                code: 'TMP-102',
                message: 'Endfor without for',
                context: { where: 'replaceMustacheWithTemplateTag', expr, stackDepth: stack.length },
                docsUrl: './docs/error-codes.md#tmp',
            });
            if (info.type === 'for') {
                return '</template>';
            }
            else {
                raiseError({
                    code: 'TMP-102',
                    message: 'Endfor without for',
                    context: { where: 'replaceMustacheWithTemplateTag', got: info.type, expr },
                    docsUrl: './docs/error-codes.md#tmp',
                });
            }
        }
        else if (type === 'elseif') {
            const lastInfo = stack.at(-1) ?? raiseError({
                code: 'TMP-102',
                message: 'Elseif without if',
                context: { where: 'replaceMustacheWithTemplateTag', expr, stackDepth: stack.length },
                docsUrl: './docs/error-codes.md#tmp',
            });
            if (lastInfo.type === 'if' || lastInfo.type === 'elseif') {
                stack.push(currentInfo);
                return `</template><template data-bind="if:${lastInfo.remain}|not"><template data-bind="if:${remain}">`;
            }
            else {
                raiseError({
                    code: 'TMP-102',
                    message: 'Elseif without if',
                    context: { where: 'replaceMustacheWithTemplateTag', got: lastInfo.type, expr },
                    docsUrl: './docs/error-codes.md#tmp',
                });
            }
        }
        else if (type === 'else') {
            const lastInfo = stack.at(-1) ?? raiseError({
                code: 'TMP-102',
                message: 'Else without if',
                context: { where: 'replaceMustacheWithTemplateTag', expr, stackDepth: stack.length },
                docsUrl: './docs/error-codes.md#tmp',
            });
            if (lastInfo.type === 'if') {
                return `</template><template data-bind="if:${lastInfo.remain}|not">`;
            }
            else {
                raiseError({
                    code: 'TMP-102',
                    message: 'Else without if',
                    context: { where: 'replaceMustacheWithTemplateTag', got: lastInfo.type, expr },
                    docsUrl: './docs/error-codes.md#tmp',
                });
            }
        }
        else {
            raiseError({
                code: 'TMP-102',
                message: 'Unknown type',
                context: { where: 'replaceMustacheWithTemplateTag', type, expr },
                docsUrl: './docs/error-codes.md#tmp',
            });
        }
    });
}

/**
 * replaceTemplateTagWithComment.ts
 *
 * <template>タグをコメントノードに置換し、テンプレートを再帰的に登録するユーティリティ関数です。
 *
 * 主な役割:
 * - 指定したHTMLTemplateElementをコメントノード（<!--template:id-->）に置換
 * - SVG内のtemplateタグは通常のtemplate要素に変換し、属性や子ノードを引き継ぐ
 * - テンプレート内の入れ子templateも再帰的に置換・登録
 * - registerTemplateでテンプレートをID付きで管理
 *
 * 設計ポイント:
 * - テンプレートの階層構造を維持しつつ、DOM上はコメントノードでマーク
 * - SVG対応や属性引き継ぎなど、汎用的なテンプレート処理に対応
 * - generateIdでユニークIDを割り当て、テンプレート管理を一元化
 */
const SVG_NS = "http://www.w3.org/2000/svg";
function replaceTemplateTagWithComment(id, template, rootId = id) {
    // テンプレートの親ノードが存在する場合は、テンプレートをコメントノードに置き換える
    template.parentNode?.replaceChild(document.createComment(`${COMMENT_TEMPLATE_MARK}${id}`), template);
    if (template.namespaceURI === SVG_NS) {
        // SVGタグ内のtemplateタグを想定
        const newTemplate = document.createElement("template");
        const childNodes = Array.from(template.childNodes);
        for (let i = 0; i < childNodes.length; i++) {
            const childNode = childNodes[i];
            newTemplate.content.appendChild(childNode);
        }
        const bindText = template.getAttribute(DATA_BIND_ATTRIBUTE);
        newTemplate.setAttribute(DATA_BIND_ATTRIBUTE, bindText ?? "");
        template = newTemplate;
    }
    template.content.querySelectorAll("template").forEach(template => {
        replaceTemplateTagWithComment(generateId(), template, rootId);
    });
    registerTemplate(id, template, rootId);
    return id;
}

/**
 * registerHtml.ts
 *
 * HTML文字列をテンプレートとして登録するユーティリティ関数です。
 *
 * 主な役割:
 * - 指定IDでHTMLテンプレートを生成し、data-id属性を付与
 * - Mustache構文（{{ }})をテンプレートタグに変換（replaceMustacheWithTemplateTagを利用）
 * - テンプレートタグをコメントに置換（replaceTemplateTagWithCommentを利用）
 *
 * 設計ポイント:
 * - テンプレートの動的生成・管理や、構文変換による柔軟なテンプレート処理に対応
 * - テンプレートはdocument.createElement("template")で生成し、data-idで識別
 */
function registerHtml(id, html) {
    const template = document.createElement("template");
    template.dataset.id = id.toString();
    template.innerHTML = replaceMustacheWithTemplateTag(html);
    replaceTemplateTagWithComment(id, template);
}

function getBaseClass(extendTagName) {
    return extendTagName ? document.createElement(extendTagName).constructor : HTMLElement;
}

/**
 * getComponentConfig.ts
 *
 * ユーザー設定（IUserConfig）とグローバル設定を統合し、コンポーネントの設定（IComponentConfig）を生成するユーティリティ関数です。
 *
 * 主な役割:
 * - getGlobalConfigでグローバル設定を取得
 * - ユーザー設定が優先され、未指定の場合はグローバル設定値を利用
 * - enableShadowDomやextendsなどの設定値を一元的に返却
 *
 * 設計ポイント:
 * - ユーザーごとの個別設定と全体のデフォルト設定を柔軟に統合
 * - 設定値のデフォルト化や拡張性を考慮した設計
 */
function getComponentConfig(userConfig) {
    const globalConfig = getGlobalConfig();
    return {
        enableWebComponents: typeof userConfig.enableWebComponents === "undefined" ? true : userConfig.enableWebComponents,
        enableShadowDom: userConfig.enableShadowDom ?? globalConfig.enableShadowDom,
        extends: userConfig.extends ?? null,
    };
}

/**
 * createAccessorFunctions.ts
 *
 * Stateプロパティのパス情報（IStructuredPathInfo）から、動的なgetter/setter関数を生成するユーティリティです。
 *
 * 主な役割:
 * - パス情報とgetter集合から、最適なアクセサ関数（get/set）を動的に生成
 * - ワイルドカード（*）やネストしたプロパティパスにも対応
 * - パスやセグメントのバリデーションも実施
 *
 * 設計ポイント:
 * - matchPathsから最長一致のgetterパスを探索し、そこからの相対パスでアクセサを構築
 * - パスが一致しない場合はinfo.pathSegmentsから直接アクセサを生成
 * - new Functionで高速なgetter/setterを動的生成
 * - パスやセグメント名は正規表現で厳密にチェックし、安全性を担保
 */
const checkSegmentRegexp = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
const checkPathRegexp = /^[a-zA-Z_$][0-9a-zA-Z_$]*(\.[a-zA-Z_$][0-9a-zA-Z_$]*|\.\*)*$/;
function createAccessorFunctions(info, getters) {
    const matchPaths = new Set(info.cumulativePaths).intersection(getters);
    let len = -1;
    let matchPath = '';
    for (const curPath of matchPaths) {
        const pathSegments = curPath.split('.');
        if (pathSegments.length === 1) {
            continue;
        }
        if (pathSegments.length > len) {
            len = pathSegments.length;
            matchPath = curPath;
        }
    }
    if (matchPath.length > 0) {
        if (!checkPathRegexp.test(matchPath)) {
            raiseError({
                code: "STATE-202",
                message: `Invalid path: ${matchPath}`,
                context: { matchPath },
                docsUrl: "./docs/error-codes.md#state",
            });
        }
        const matchInfo = getStructuredPathInfo(matchPath);
        const segments = [];
        let count = matchInfo.wildcardCount;
        for (let i = matchInfo.pathSegments.length; i < info.pathSegments.length; i++) {
            const segment = info.pathSegments[i];
            if (segment === '*') {
                segments.push("[this.$" + (count + 1) + "]");
                count++;
            }
            else {
                if (!checkSegmentRegexp.test(segment)) {
                    raiseError({
                        code: "STATE-202",
                        message: `Invalid segment name: ${segment}`,
                        context: { segment, matchPath },
                        docsUrl: "./docs/error-codes.md#state",
                    });
                }
                segments.push("." + segment);
            }
        }
        const path = segments.join('');
        const getterFuncText = `return this["${matchPath}"]${path};`;
        const setterFuncText = `this["${matchPath}"]${path} = value;`;
        //console.log('path/getter/setter:', info.pattern, getterFuncText, setterFuncText);
        return {
            get: new Function('', getterFuncText),
            set: new Function('value', setterFuncText),
        };
    }
    else {
        const segments = [];
        let count = 0;
        for (let i = 0; i < info.pathSegments.length; i++) {
            const segment = info.pathSegments[i];
            if (segment === '*') {
                segments.push("[this.$" + (count + 1) + "]");
                count++;
            }
            else {
                if (!checkSegmentRegexp.test(segment)) {
                    raiseError({
                        code: "STATE-202",
                        message: `Invalid segment name: ${segment}`,
                        context: { segment },
                        docsUrl: "./docs/error-codes.md#state",
                    });
                }
                segments.push((segments.length > 0 ? "." : "") + segment);
            }
        }
        const path = segments.join('');
        const getterFuncText = `return this.${path};`;
        const setterFuncText = `this.${path} = value;`;
        //console.log('path/getter/setter:', info.pattern, getterFuncText, setterFuncText);
        return {
            get: new Function('', getterFuncText),
            set: new Function('value', setterFuncText),
        };
    }
}

class PathManager {
    alls = new Set();
    lists = new Set();
    elements = new Set();
    funcs = new Set();
    getters = new Set();
    onlyGetters = new Set();
    setters = new Set();
    getterSetters = new Set();
    optimizes = new Set();
    staticDependencies = new Map();
    dynamicDependencies = new Map();
    rootNode = createRootNode();
    #id;
    #stateClass;
    constructor(componentClass) {
        this.#id = componentClass.id;
        this.#stateClass = componentClass.stateClass;
        const alls = getPathsSetById(this.#id);
        for (const path of alls) {
            const info = getStructuredPathInfo(path);
            this.alls = this.alls.union(info.cumulativePathSet);
        }
        const lists = getListPathsSetById(this.#id);
        this.lists = this.lists.union(lists);
        for (const listPath of lists) {
            const elementPath = listPath + ".*";
            this.elements.add(elementPath);
        }
        let currentProto = this.#stateClass.prototype;
        while (currentProto && currentProto !== Object.prototype) {
            const getters = Object.getOwnPropertyDescriptors(currentProto);
            if (getters) {
                for (const [key, desc] of Object.entries(getters)) {
                    if (RESERVED_WORD_SET.has(key)) {
                        continue;
                    }
                    if (typeof desc.value === "function") {
                        this.funcs.add(key);
                        continue;
                    }
                    const hasGetter = desc.get !== undefined;
                    const hasSetter = desc.set !== undefined;
                    const info = getStructuredPathInfo(key);
                    this.alls = this.alls.union(info.cumulativePathSet);
                    if (hasGetter) {
                        this.getters.add(key);
                    }
                    if (hasSetter) {
                        this.setters.add(key);
                    }
                    if (hasGetter && !hasSetter) {
                        this.onlyGetters.add(key);
                    }
                    if (hasGetter && hasSetter) {
                        this.getterSetters.add(key);
                    }
                }
            }
            currentProto = Object.getPrototypeOf(currentProto);
        }
        // 最適化対象のパスを決定し、最適化する
        for (const path of this.alls) {
            if (this.getters.has(path)) {
                continue;
            }
            if (this.setters.has(path)) {
                continue;
            }
            const info = getStructuredPathInfo(path);
            if (info.pathSegments.length === 1) {
                continue;
            }
            const funcs = createAccessorFunctions(info, this.getters);
            Object.defineProperty(this.#stateClass.prototype, path, {
                get: funcs.get,
                set: funcs.set,
                enumerable: true,
                configurable: true,
            });
            this.optimizes.add(path);
        }
        // 静的依存関係の設定
        for (const path of this.alls) {
            addPathNode(this.rootNode, path);
            const info = getStructuredPathInfo(path);
            if (info.parentPath) {
                this.staticDependencies.get(info.parentPath)?.add(path) ??
                    this.staticDependencies.set(info.parentPath, new Set([path]));
            }
        }
    }
    addPath(addPath, isList = false) {
        const info = getStructuredPathInfo(addPath);
        if (isList && !this.lists.has(addPath)) {
            this.lists.add(addPath);
            const elementPath = addPath + ".*";
            this.elements.add(elementPath);
        }
        for (const path of info.cumulativePathSet) {
            if (this.alls.has(path))
                continue;
            this.alls.add(path);
            addPathNode(this.rootNode, path);
            const pathInfo = getStructuredPathInfo(path);
            if (pathInfo.pathSegments.length > 1) {
                const funcs = createAccessorFunctions(pathInfo, this.getters);
                Object.defineProperty(this.#stateClass.prototype, path, {
                    get: funcs.get,
                    set: funcs.set,
                    enumerable: true,
                    configurable: true,
                });
                this.optimizes.add(path);
            }
            if (pathInfo.parentPath) {
                this.staticDependencies.get(pathInfo.parentPath)?.add(path) ??
                    this.staticDependencies.set(pathInfo.parentPath, new Set([path]));
            }
        }
    }
    #dynamicDependencyKeys = new Set();
    addDynamicDependency(target, source) {
        const key = source + "=>" + target;
        if (this.#dynamicDependencyKeys.has(key)) {
            return;
        }
        if (!this.alls.has(source)) {
            this.addPath(source);
        }
        this.#dynamicDependencyKeys.add(key);
        this.dynamicDependencies.get(source)?.add(target) ??
            this.dynamicDependencies.set(source, new Set([target]));
    }
}
function createPathManager(componentClass) {
    return new PathManager(componentClass);
}

/**
 * createComponentClass.ts
 *
 * StructiveのWeb Components用カスタム要素クラスを動的に生成するユーティリティです。
 *
 * 主な役割:
 * - ユーザー定義のcomponentData（stateClass, html, css等）からWeb Componentsクラスを生成
 * - StateClass/テンプレート/CSS/バインディング情報などをIDで一元管理・登録
 * - 独自のget/setトラップやバインディング、親子コンポーネント探索、フィルター拡張など多機能な基盤を提供
 * - 静的プロパティでテンプレート・スタイル・StateClass・フィルター・getter情報などにアクセス可能
 * - defineメソッドでカスタム要素として登録
 *
 * 設計ポイント:
 * - findStructiveParentで親Structiveコンポーネントを探索し、階層的な状態管理を実現
 * - getter/setter/バインディング最適化やアクセサ自動生成（optimizeAccessor）に対応
 * - テンプレート・CSS・StateClass・バインディング情報をIDで一元管理し、再利用性・拡張性を確保
 * - フィルターやバインディング情報も静的プロパティで柔軟に拡張可能
 */
function createComponentClass(componentData) {
    const config = (componentData.stateClass.$config ?? {});
    const componentConfig = getComponentConfig(config);
    const id = generateId();
    const { html, css, stateClass } = componentData;
    const inputFilters = Object.assign({}, inputBuiltinFilters);
    const outputFilters = Object.assign({}, outputBuiltinFilters);
    stateClass.$isStructive = true;
    registerHtml(id, html);
    registerCss(id, css);
    registerStateClass(id, stateClass);
    const baseClass = getBaseClass(componentConfig.extends);
    const extendTagName = componentConfig.extends;
    return class extends baseClass {
        #engine;
        constructor() {
            super();
            this.#engine = createComponentEngine(componentConfig, this);
            this.#engine.setup();
        }
        connectedCallback() {
            this.#engine.connectedCallback();
        }
        disconnectedCallback() {
            this.#engine.disconnectedCallback();
        }
        #parentStructiveComponent;
        get parentStructiveComponent() {
            if (typeof this.#parentStructiveComponent === "undefined") {
                this.#parentStructiveComponent = findStructiveParent(this);
            }
            return this.#parentStructiveComponent;
        }
        get state() {
            return this.#engine.stateInput;
        }
        get isStructive() {
            return this.#engine.stateClass.$isStructive ?? false;
        }
        get waitForInitialize() {
            return this.#engine.waitForInitialize;
        }
        getBindingsFromChild(component) {
            return this.#engine.bindingsByComponent.get(component) ?? null;
        }
        registerChildComponent(component) {
            this.#engine.registerChildComponent(component);
        }
        unregisterChildComponent(component) {
            this.#engine.unregisterChildComponent(component);
        }
        static define(tagName) {
            if (extendTagName) {
                customElements.define(tagName, this, { extends: extendTagName });
            }
            else {
                customElements.define(tagName, this);
            }
        }
        static get id() {
            return id;
        }
        static #html = html;
        static get html() {
            return this.#html;
        }
        static set html(value) {
            this.#html = value;
            registerHtml(this.id, value);
            this.#template = null;
            this.#pathManager = null; // パス情報をリセット
        }
        static #css = css;
        static get css() {
            return this.#css;
        }
        static set css(value) {
            this.#css = value;
            registerCss(this.id, value);
            this.#styleSheet = null;
        }
        static #template = null;
        static get template() {
            if (!this.#template) {
                this.#template = getTemplateById(this.id);
            }
            return this.#template;
        }
        static #styleSheet = null;
        static get styleSheet() {
            if (!this.#styleSheet) {
                this.#styleSheet = getStyleSheetById(this.id);
            }
            return this.#styleSheet;
        }
        static #stateClass = null;
        static get stateClass() {
            if (!this.#stateClass) {
                this.#stateClass = getStateClassById(this.id);
            }
            return this.#stateClass;
        }
        static #inputFilters = inputFilters;
        static get inputFilters() {
            return this.#inputFilters;
        }
        static #outputFilters = outputFilters;
        static get outputFilters() {
            return this.#outputFilters;
        }
        static #pathManager = null;
        static get pathManager() {
            if (!this.#pathManager) {
                this.#pathManager = createPathManager(this);
            }
            return this.#pathManager;
        }
    };
}

function loadImportmap() {
    const importmap = {};
    document.querySelectorAll("script[type='importmap']").forEach(script => {
        const scriptImportmap = JSON.parse(script.innerHTML);
        if (scriptImportmap.imports) {
            importmap.imports = Object.assign(importmap.imports || {}, scriptImportmap.imports);
        }
    });
    return importmap;
}

function escapeEmbed(html) {
    return html.replaceAll(/\{\{([^\}]+)\}\}/g, (match, expr) => {
        return `<!--{{${expr}}}-->`;
    });
}
function unescapeEmbed(html) {
    return html.replaceAll(/<!--\{\{([^\}]+)\}\}-->/g, (match, expr) => {
        return `{{${expr}}}`;
    });
}
let id = 0;
async function createSingleFileComponent(text) {
    const template = document.createElement("template");
    template.innerHTML = escapeEmbed(text);
    const html = template.content.querySelector("template");
    html?.remove();
    const script = template.content.querySelector("script[type=module]");
    let scriptModule = {};
    if (script) {
        const uniq_comment = `\r\n/*__UNIQ_ID_${id++}__*/`;
        const b64 = btoa(String.fromCodePoint(...new TextEncoder().encode(script.text + uniq_comment)));
        scriptModule = await import("data:application/javascript;base64," + b64);
    }
    //  const scriptModule = script ? await import("data:text/javascript;charset=utf-8," + script.text) : {};
    script?.remove();
    const style = template.content.querySelector("style");
    style?.remove();
    const stateClass = (scriptModule.default ?? class {
    });
    return {
        text,
        html: unescapeEmbed(html?.innerHTML ?? "").trim(),
        css: style?.textContent ?? "",
        stateClass,
    };
}

/**
 * loadSingleFileComponent.ts
 *
 * 指定パスのシングルファイルコンポーネント（SFC）をfetchし、パースしてIUserComponentDataとして返すユーティリティ関数です。
 *
 * 主な役割:
 * - fetchで指定パスのSFCファイルを取得
 * - テキストとして読み込み、createSingleFileComponentでパース
 * - パース結果（IUserComponentData）を返却
 *
 * 設計ポイント:
 * - import.meta.resolveを利用し、パス解決の柔軟性を確保
 * - 非同期処理で動的なコンポーネントロードに対応
 */
async function loadSingleFileComponent(path) {
    // Node/Vitest 等の SSR 環境では import.meta.resolve が存在しない場合があるためフォールバック
    const resolved = import.meta.resolve ? import.meta.resolve(path) : path;
    const response = await fetch(resolved);
    const text = await response.text();
    return createSingleFileComponent(text);
}

function registerComponentClass(tagName, componentClass) {
    componentClass.define(tagName);
}

/**
 * loadFromImportMap
 *
 * importmap のエイリアスを走査し、ルート/コンポーネントを自動登録する。
 * - @routes/*: entryRoute でルーティング登録（/root → / に正規化）
 * - @components/*: SFC を読み込み、ComponentClass を生成して registerComponentClass
 * - #lazy サフィックスが付与されている場合は遅延ロード用に保持
 *
 * 戻り値: Promise<void>
 * Throws: 重大な例外は基本なし（見つからないエイリアスは warn として扱う）
 */
const ROUTES_KEY = "@routes/";
const COMPONENTS_KEY = "@components/";
const LAZY_LOAD_SUFFIX = "#lazy";
const LAZY_LOAD_SUFFIX_LEN = LAZY_LOAD_SUFFIX.length;
const lazyLoadComponentAliasByTagName = {};
async function loadFromImportMap() {
    const importmap = loadImportmap();
    if (importmap.imports) {
        const loadAliasByTagName = new Map();
        for (const [alias, value] of Object.entries(importmap.imports)) {
            let tagName, isLazyLoad;
            if (alias.startsWith(ROUTES_KEY)) {
                isLazyLoad = alias.endsWith(LAZY_LOAD_SUFFIX);
                // remove the prefix '@routes' and the suffix '#lazy' if it exists
                const path = alias.slice(ROUTES_KEY.length - 1, isLazyLoad ? -LAZY_LOAD_SUFFIX_LEN : undefined);
                const pathWithoutParams = path.replace(/:[^\s/]+/g, ""); // remove the params
                tagName = "routes" + pathWithoutParams.replace(/\//g, "-"); // replace '/' with '-'
                entryRoute(tagName, path === "/root" ? "/" : path); // routing
            }
            if (alias.startsWith(COMPONENTS_KEY)) {
                isLazyLoad = alias.endsWith(LAZY_LOAD_SUFFIX);
                // remove the prefix '@components/' and the suffix '#lazy' if it exists
                tagName = alias.slice(COMPONENTS_KEY.length, isLazyLoad ? -LAZY_LOAD_SUFFIX_LEN : undefined);
            }
            if (!tagName) {
                continue;
            }
            if (isLazyLoad) {
                // Lazy Load用のコンポーネントのエイリアスを格納
                lazyLoadComponentAliasByTagName[tagName] = alias;
                continue; // Lazy Loadの場合はここでスキップ
            }
            loadAliasByTagName.set(tagName, alias);
        }
        for (const [tagName, alias] of loadAliasByTagName.entries()) {
            // 非Lazy Loadのコンポーネントはここで登録
            const componentData = await loadSingleFileComponent(alias);
            const componentClass = createComponentClass(componentData);
            registerComponentClass(tagName, componentClass);
        }
    }
}
function hasLazyLoadComponents() {
    return Object.keys(lazyLoadComponentAliasByTagName).length > 0;
}
function isLazyLoadComponent(tagName) {
    return lazyLoadComponentAliasByTagName.hasOwnProperty(tagName);
}
function loadLazyLoadComponent(tagName) {
    const alias = lazyLoadComponentAliasByTagName[tagName];
    if (!alias) {
        // 警告として扱うが、構造化メタ情報を付加
        const err = {
            code: "IMP-201",
            message: `Alias not found for tagName: ${tagName}`,
            context: { where: 'loadFromImportMap.loadLazyLoadComponent', tagName },
            docsUrl: "./docs/error-codes.md#imp",
            severity: "warn",
        };
        // 既存挙動は warn + return のため、throw はせず console.warn にメタを付与
        console.warn(err.message, { code: err.code, context: err.context, docsUrl: err.docsUrl, severity: err.severity });
        return;
    }
    delete lazyLoadComponentAliasByTagName[tagName]; // 一度ロードしたら削除
    queueMicrotask(async () => {
        const componentData = await loadSingleFileComponent(alias);
        const componentClass = createComponentClass(componentData);
        registerComponentClass(tagName, componentClass);
    });
}

/**
 * Router.ts
 *
 * シングルページアプリケーション（SPA）向けのカスタムエレメント Router の実装です。
 *
 * 主な役割:
 * - ルート定義（entryRoute）に基づき、URLパスに応じてカスタム要素を動的に生成・表示
 * - pushState/popstateイベントを利用した履歴管理とルーティング制御
 * - ルートパラメータの抽出とカスタム要素への受け渡し
 * - 404ページ（未定義ルート時）の表示
 *
 * 設計ポイント:
 * - entryRouteでルートパスとカスタム要素タグ名のペアを登録
 * - popstateイベントでURL変更時に自動で再描画
 * - ルートパスのパラメータ（:id等）も正規表現で抽出し、data-state属性で渡す
 * - getRouterでグローバルなRouterインスタンスを取得可能
 */
const DEFAULT_ROUTE_PATH = '/'; // Default route path
const ROUTE_PATH_PREFIX = 'routes:'; // Prefix for route paths
/**
 * example:
 * ```ts
 * entryRoute('my-view', '/my-view/:id');
 */
const routeEntries = [];
let globalRouter = null;
class Router extends HTMLElement {
    originalPathName = window.location.pathname; // Store the original path name
    originalFileName = window.location.pathname.split('/').pop() || ''; // Store the original file name
    basePath = document.querySelector('base')?.href.replace(window.location.origin, "") || DEFAULT_ROUTE_PATH;
    _popstateHandler;
    constructor() {
        super();
        this._popstateHandler = this.popstateHandler.bind(this);
    }
    connectedCallback() {
        globalRouter = this;
        this.innerHTML = '<slot name="content"></slot>';
        window.addEventListener('popstate', this._popstateHandler);
        window.dispatchEvent(new Event("popstate")); // Dispatch popstate event to trigger the initial render
    }
    disconnectedCallback() {
        window.removeEventListener('popstate', this._popstateHandler);
        globalRouter = null;
    }
    popstateHandler(event) {
        event.preventDefault();
        this.render();
    }
    navigate(to) {
        const toPath = to[0] === '/' ? (this.basePath + to.slice(1)) : to; // Ensure the path starts with '/'
        history.pushState({}, '', toPath);
        this.render();
    }
    render() {
        // スロットコンテントをクリア
        const slotChildren = Array.from(this.childNodes).filter(n => n.getAttribute?.('slot') === 'content');
        slotChildren.forEach(n => this.removeChild(n));
        const paths = window.location.pathname.split('/');
        if (paths.at(-1) === this.originalFileName) {
            paths[paths.length - 1] = ''; // Ensure the last path is empty for root
        }
        const pathName = paths.join('/');
        const replacedPath = pathName.replace(this.basePath, ''); // Remove base path and ensure default route
        const currentPath = replacedPath[0] !== '/' ? '/' + replacedPath : replacedPath; // Ensure the path starts with '/'
        let tagName = undefined;
        let params = {};
        // Check if the routePath matches any of the defined routes
        for (const [path, tag] of routeEntries) {
            const regex = new RegExp("^" + path.replace(/:[^\s/]+/g, '([^/]+)') + "$");
            if (regex.test(currentPath)) {
                tagName = tag;
                // Extract the parameters from the routePath
                const matches = currentPath.match(regex);
                if (matches) {
                    const keys = path.match(/:[^\s/]+/g) || [];
                    keys.forEach((key, index) => {
                        params[key.substring(1)] = matches[index + 1]; // +1 to skip the full match
                    });
                }
                break;
            }
        }
        if (tagName) {
            // If a route matches, create the custom element and set its state
            // Create the custom element with the tag name
            // project the custom element into the router slot
            const customElement = document.createElement(tagName);
            customElement.setAttribute('data-state', JSON.stringify(params));
            customElement.setAttribute('slot', 'content');
            this.appendChild(customElement);
            if (isLazyLoadComponent(tagName)) {
                loadLazyLoadComponent(tagName); // Load lazy load component if necessary
            }
        }
        else {
            // If no route matches, show 404 content
            const messageElement = document.createElement('h1');
            messageElement.setAttribute('slot', 'content');
            messageElement.textContent = '404 Not Found';
            this.appendChild(messageElement);
        }
    }
}
function entryRoute(tagName, routePath) {
    if (routePath.startsWith(ROUTE_PATH_PREFIX)) {
        routePath = routePath.substring(ROUTE_PATH_PREFIX.length); // Remove 'routes:' prefix
    }
    routeEntries.push([routePath, tagName]);
}
function getRouter() {
    return globalRouter;
}

/**
 * registerSingleFileComponents.ts
 *
 * 複数のシングルファイルコンポーネント（SFC）をまとめてStructiveのWeb Componentsとして登録するユーティリティ関数です。
 *
 * 主な役割:
 * - singleFileComponents（tagNameとパスのマップ）を走査し、各SFCを非同期で取得・パース
 * - enableRouterが有効な場合はentryRouteでルーティング情報も登録
 * - createComponentClassでWeb Componentsクラスを生成し、registerComponentClassでカスタム要素として登録
 *
 * 設計ポイント:
 * - SFCのロードからWeb Components登録、ルーティング登録までを一括で自動化
 * - 非同期処理で複数コンポーネントの動的登録に対応
 * - ルートパス"/root"の正規化や、@routesプレフィックスの除去など柔軟なパス処理
 */
async function registerSingleFileComponents(singleFileComponents) {
    for (const [tagName, path] of Object.entries(singleFileComponents)) {
        let componentData = null;
        if (config$2.enableRouter) {
            const routePath = path.startsWith("@routes") ? path.slice(7) : path; // remove the prefix 'routes:'
            entryRoute(tagName, routePath === "/root" ? "/" : routePath); // routing
        }
        componentData = await loadSingleFileComponent(path);
        const componentClass = createComponentClass(componentData);
        registerComponentClass(tagName, componentClass);
    }
}

/**
 * MainWrapper.ts
 *
 * アプリ全体のレイアウトやルーティングを管理するカスタムエレメント MainWrapper の実装です。
 *
 * 主な役割:
 * - Shadow DOMの有効化やレイアウトテンプレートの動的読み込み
 * - レイアウトテンプレートやスタイルの適用
 * - ルーター要素（routerTagName）の動的追加
 *
 * 設計ポイント:
 * - config.enableShadowDom でShadow DOMの有効/無効を切り替え
 * - config.layoutPath が指定されていればfetchでレイアウトHTMLを取得し、テンプレート・スタイルを適用
 * - スタイルはadoptedStyleSheetsでShadowRootまたはdocumentに適用
 * - レイアウトが指定されていない場合はデフォルトのslotを挿入
 * - config.enableRouter が有効な場合はrouter要素をslotに追加
 */
const SLOT_KEY = "router";
const DEFAULT_LAYOUT = `<slot name="${SLOT_KEY}"></slot>`;
class MainWrapper extends HTMLElement {
    constructor() {
        super();
        if (config$2.enableShadowDom) {
            this.attachShadow({ mode: 'open' });
        }
    }
    async connectedCallback() {
        await this.loadLayout();
        this.render();
    }
    get root() {
        return this.shadowRoot ?? this;
    }
    async loadLayout() {
        if (config$2.layoutPath) {
            const response = await fetch(config$2.layoutPath);
            if (response.ok) {
                const layoutText = await response.text();
                const workTemplate = document.createElement("template");
                workTemplate.innerHTML = layoutText;
                const template = workTemplate.content.querySelector("template");
                const style = workTemplate.content.querySelector("style");
                this.root.appendChild(template?.content ?? document.createDocumentFragment());
                if (style) {
                    const shadowRootOrDocument = this.shadowRoot ?? document;
                    const styleSheets = shadowRootOrDocument.adoptedStyleSheets;
                    if (!styleSheets.includes(style)) {
                        shadowRootOrDocument.adoptedStyleSheets = [...styleSheets, style];
                    }
                }
            }
            else {
                raiseError({
                    code: 'TMP-101',
                    message: `Failed to load layout from ${config$2.layoutPath}`,
                    context: { layoutPath: config$2.layoutPath },
                    docsUrl: '/docs/error-codes.md#tmp',
                    severity: 'error',
                });
            }
        }
        else {
            this.root.innerHTML = DEFAULT_LAYOUT;
        }
    }
    render() {
        // add router
        if (config$2.enableRouter) {
            const router = document.createElement(config$2.routerTagName);
            router.setAttribute('slot', SLOT_KEY);
            this.root.appendChild(router);
        }
    }
}

/**
 * bootstrap.ts
 *
 * Structiveアプリケーションの初期化処理を行うエントリーポイントです。
 *
 * 主な役割:
 * - グローバル設定(config)に従い、必要なコンポーネントやルーター、メインラッパーを登録・初期化
 * - autoLoadFromImportMapが有効な場合はimportmapからルートやコンポーネントを動的ロード
 * - enableRouterが有効な場合はRouterコンポーネントをカスタム要素として登録
 * - enableMainWrapperが有効な場合はMainWrapperをカスタム要素として登録し、autoInsertMainWrapperが有効ならbodyに自動挿入
 *
 * 設計ポイント:
 * - 設定値に応じて初期化処理を柔軟に制御
 * - importmapやカスタム要素の登録、DOMへの自動挿入など、Structiveの起動に必要な処理を一元化
 */
async function bootstrap() {
    if (config$2.autoLoadFromImportMap) {
        await loadFromImportMap();
    }
    if (config$2.enableRouter) {
        customElements.define(config$2.routerTagName, Router);
    }
    if (config$2.enableMainWrapper) {
        customElements.define(config$2.mainTagName, MainWrapper);
        if (config$2.autoInsertMainWrapper) {
            const mainWrapper = document.createElement(config$2.mainTagName);
            document.body.appendChild(mainWrapper);
        }
    }
}

/**
 * exports.ts
 *
 * Structiveの主要なエントリーポイント・APIを外部公開するモジュールです。
 *
 * 主な役割:
 * - registerSingleFileComponents, bootstrap, config などの主要APIをエクスポート
 * - defineComponents: SFC群をまとめて登録し、autoInitが有効なら自動で初期化
 * - bootstrapStructive: 初期化処理を一度だけ実行
 *
 * 設計ポイント:
 * - グローバル設定(config)を外部から参照・変更可能
 * - 初期化処理の多重実行を防止し、安全な起動を保証
 */
const config = config$2;
let initialized = false;
async function defineComponents(singleFileComponents) {
    await registerSingleFileComponents(singleFileComponents);
    if (config.autoInit) {
        await bootstrapStructive();
    }
}
async function bootstrapStructive() {
    if (!initialized) {
        await bootstrap();
        initialized = true;
    }
}

export { bootstrapStructive, config, defineComponents };
//# sourceMappingURL=structive.js.map
