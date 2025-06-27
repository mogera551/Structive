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
    throw new Error(`${fnName} requires at least one option`);
}
function optionMustBeNumber(fnName) {
    throw new Error(`${fnName} requires a number as option`);
}
function valueMustBeNumber(fnName) {
    throw new Error(`${fnName} requires a number value`);
}
function valueMustBeBoolean(fnName) {
    throw new Error(`${fnName} requires a boolean value`);
}
function valueMustBeDate(fnName) {
    throw new Error(`${fnName} requires a date value`);
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
                optionMustBeNumber('eq');
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
        optionMustBeNumber('div');
    return (value) => {
        if (typeof value !== 'number')
            valueMustBeNumber('div');
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
        return value.toFixed(optValue) + '%';
    };
};
const date = (options) => {
    options?.[0] ?? config$1.locale;
    return (value) => {
        if (!(value instanceof Date))
            valueMustBeDate('date');
        return value.toLocaleDateString(config$1.locale);
    };
};
const time = (options) => {
    options?.[0] ?? config$1.locale;
    return (value) => {
        if (!(value instanceof Date))
            valueMustBeDate('time');
        return value.toLocaleTimeString(config$1.locale);
    };
};
const datetime = (options) => {
    options?.[0] ?? config$1.locale;
    return (value) => {
        if (!(value instanceof Date))
            valueMustBeDate('datetime');
        return value.toLocaleString(config$1.locale);
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

let id = 0;
function generateId() {
    return ++id;
}

function raiseError(message) {
    throw new Error(message);
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
    return stateClassById[id] ?? raiseError(`getStateClassById: stateClass not found: ${id}`);
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
    return styleSheetById[id] ?? raiseError(`getStyleSheetById: stylesheet not found: ${id}`);
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
    return path.reduce((node, index) => node?.childNodes[index] ?? null, root);
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
    if (!filter)
        raiseError(`outputBuiltinFiltersFn: filter not found: ${name}`);
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
    #bindContents = new Set();
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
    update() {
        this.assignValue(this.binding.bindingState.filteredValue);
    }
    assignValue(value) {
        raiseError(`BindingNode: assignValue not implemented`);
    }
    updateElements(listIndexes, values) {
        raiseError(`BindingNode: updateElements not implemented`);
    }
    notifyRedraw(refs) {
        // サブクラスで親子関係を考慮してバインディングの更新を通知する実装が可能
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
 * BindingNodeCheckboxクラスは、チェックボックス（input[type="checkbox"]）の
 * バインディング処理を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - バインディング値（配列）に現在のvalueが含まれているかどうかでchecked状態を制御
 * - 値が配列でない場合はエラーを投げる
 * - フィルタやデコレータにも対応
 *
 * 設計ポイント:
 * - assignValueで配列内にvalueが含まれていればchecked=true
 * - 柔軟なバインディング記法・フィルタ適用に対応
 */
class BindingNodeCheckbox extends BindingNode {
    assignValue(value) {
        if (!Array.isArray(value)) {
            raiseError(`BindingNodeCheckbox.update: value is not array`);
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
 * BindingNodeClassListクラスは、class属性（classList）のバインディング処理を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - バインディング値（配列）を空白区切りのclass属性値としてElementにセット
 * - 値が配列でない場合はエラーを投げる
 * - フィルタやデコレータにも対応
 *
 * 設計ポイント:
 * - assignValueで配列を受け取り、join(" ")でclassNameに反映
 * - 柔軟なバインディング記法・フィルタ適用に対応
 */
class BindingNodeClassList extends BindingNode {
    assignValue(value) {
        if (!Array.isArray(value)) {
            raiseError(`BindingNodeClassList.update: value is not array`);
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
 * BindingNodeClassNameクラスは、class属性の個別クラス名（例: class.active など）の
 * バインディング処理を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - バインディング値（boolean）に応じて、指定クラス名（subName）をElementに追加・削除
 * - フィルタやデコレータにも対応
 *
 * 設計ポイント:
 * - nameからクラス名（subName）を抽出（例: "class.active" → "active"）
 * - assignValueでboolean値のみ許容し、型が異なる場合はエラー
 * - trueならclassList.add、falseならclassList.removeでクラス操作
 * - ファクトリ関数でフィルタ適用済みインスタンスを生成
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
            raiseError(`BindingNodeClassName.update: value is not boolean`);
        }
        const element = this.node;
        if (value) {
            element.classList.add(this.subName);
        }
        else {
            element.classList.remove(this.subName);
        }
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
        const value = this.binding.bindingState.value;
        const typeOfValue = typeof value;
        if (typeOfValue !== "function") {
            raiseError(`BindingNodeEvent: ${this.name} is not a function.`);
        }
        if (options.includes("preventDefault")) {
            e.preventDefault();
        }
        if (options.includes("stopPropagation")) {
            e.stopPropagation();
        }
        await engine.useWritableStateProxy(loopContext, async (stateProxy) => {
            // stateProxyを生成し、バインディング値を実行
            await Reflect.apply(value, stateProxy, [e, ...indexes]);
        });
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

const DATA_BIND_ATTRIBUTE = "data-bind";
const COMMENT_EMBED_MARK = "@@:"; // 埋め込み変数のマーク
const COMMENT_TEMPLATE_MARK = "@@|"; // テンプレートのマーク

const COMMENT_TEMPLATE_MARK_LEN$1 = COMMENT_TEMPLATE_MARK.length;
/**
 * BindingNodeBlockクラスは、テンプレートブロック（コメントノードによるテンプレート挿入部）を
 * バインディング対象とするためのバインディングノード実装です。
 *
 * 主な役割:
 * - コメントノード内のテンプレートIDを抽出し、idプロパティとして保持
 * - テンプレートブロックのバインディング処理の基盤となる
 *
 * 設計ポイント:
 * - コメントノードのテキストからテンプレートIDを抽出（COMMENT_TEMPLATE_MARK以降を数値変換）
 * - IDが取得できない場合はエラーを投げる
 * - 他のBindingNode系クラスと同様、フィルタやデコレータにも対応
 */
class BindingNodeBlock extends BindingNode {
    #id;
    get id() {
        return this.#id;
    }
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        const id = this.node.textContent?.slice(COMMENT_TEMPLATE_MARK_LEN$1) ?? raiseError("BindingNodeBlock.id: invalid node");
        this.#id = Number(id);
    }
}

/**
 * BindingNodeIfクラスは、ifバインディング（条件付き描画）を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - バインディング値（boolean）に応じて、BindContent（描画内容）のマウント・アンマウントを制御
 * - true/false時のBindContent集合を管理し、現在の描画状態をbindContentsで取得可能
 *
 * 設計ポイント:
 * - assignValueでboolean型以外が渡された場合はエラー
 * - trueならBindContentをrender・mount、falseならunmount
 * - 柔軟なバインディング記法・フィルタ適用に対応
 */
class BindingNodeIf extends BindingNodeBlock {
    #bindContent;
    #trueBindContents;
    #falseBindContents = new Set();
    #bindContents;
    get bindContents() {
        return this.#bindContents;
    }
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        this.#bindContent = createBindContent(this.binding, this.id, this.binding.engine, "", null);
        this.#trueBindContents = this.#bindContents = new Set([this.#bindContent]);
    }
    assignValue(value) {
        if (typeof value !== "boolean") {
            raiseError(`BindingNodeIf.update: value is not boolean`);
        }
        const parentNode = this.node.parentNode;
        if (parentNode == null) {
            raiseError(`BindingNodeIf.update: parentNode is null`);
        }
        if (value) {
            this.#bindContent.render();
            this.#bindContent.mountAfter(parentNode, this.node);
            this.#bindContents = this.#trueBindContents;
        }
        else {
            this.#bindContent.unmount();
            this.#bindContents = this.#falseBindContents;
        }
    }
}
/**
 * ifバインディングノード生成用ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeIfインスタンスを生成
 */
const createBindingNodeIf = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeIf(binding, node, name, filterFns, decorates);
};

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
 * - assignValueでリストの差分を検出し、BindContentの生成・削除・再利用を管理
 * - updateElementsでリストの並び替えやSWAP処理にも対応
 * - BindContentのプール・インデックス管理でGCやDOM操作の最小化を図る
 * - バインディング状態やリストインデックス情報をエンジンに保存し、再描画や依存解決を容易にする
 *
 * ファクトリ関数 createBindingNodeFor でフィルタ・デコレータ適用済みインスタンスを生成
 */
class BindingNodeFor extends BindingNodeBlock {
    #bindContentsSet = new Set();
    #bindContentByListIndex = new WeakMap();
    #bindContentPool = [];
    #bindContentLastIndex = 0;
    #lastListIndexSet = new Set();
    get bindContents() {
        return this.#bindContentsSet;
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
            bindContent = createBindContent(this.binding, this.id, this.binding.engine, this.binding.bindingState.pattern + ".*", listIndex);
        }
        // 登録
        this.#bindContentByListIndex.set(listIndex, bindContent);
        return bindContent;
    }
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
            raiseError(`BindingNodeFor.setPoolLength: length is negative`);
        }
        this.#bindContentPool.length = length;
    }
    assignValue(value) {
        if (!Array.isArray(value)) {
            raiseError(`BindingNodeFor.assignValue: value is not array`);
        }
        const listIndexesSet = this.binding.engine.getListIndexesSet(this.binding.bindingState.info, this.binding.bindingState.listIndex);
        if (listIndexesSet === null) {
            raiseError(`BindingNodeFor.assignValue: listIndexes is not found`);
        }
        const newBindContensSet = new Set();
        let lastBindContent = null;
        // 削除を先にする
        const removeBindContentsSet = new Set();
        const diff = this.#lastListIndexSet.difference(listIndexesSet);
        for (const listIndex of diff) {
            const bindContent = this.#bindContentByListIndex.get(listIndex);
            if (bindContent) {
                this.deleteBindContent(bindContent);
                removeBindContentsSet.add(bindContent);
            }
        }
        this.#bindContentPool.push(...removeBindContentsSet);
        const parentNode = this.node.parentNode ?? raiseError(`BindingNodeFor.update: parentNode is null`);
        const firstNode = this.node;
        this.bindContentLastIndex = this.poolLength - 1;
        for (const listIndex of listIndexesSet) {
            const lastNode = lastBindContent?.getLastNode(parentNode) ?? firstNode;
            let bindContent = this.#bindContentByListIndex.get(listIndex);
            if (typeof bindContent === "undefined") {
                bindContent = this.createBindContent(listIndex);
                bindContent.render();
                bindContent.mountAfter(parentNode, lastNode);
            }
            else {
                if (lastNode?.nextSibling !== bindContent.firstChildNode) {
                    bindContent.mountAfter(parentNode, lastNode);
                }
            }
            newBindContensSet.add(bindContent);
            lastBindContent = bindContent;
        }
        // プールの長さを更新する
        // プールの長さは、プールの最後の要素のインデックス+1であるため、
        this.poolLength = this.bindContentLastIndex + 1;
        this.#bindContentsSet = newBindContensSet;
        this.#lastListIndexSet = new Set(listIndexesSet);
    }
    /**
     * SWAP処理を想定
     *
     * @param listIndexes
     * @param values
     * @returns
     */
    updateElements(listIndexes, values) {
        if (typeof values[0] !== "object")
            return;
        const engine = this.binding.engine;
        const oldListValues = engine.getList(this.binding.bindingState.info, this.binding.bindingState.listIndex) ?? raiseError(`BindingNodeFor.updateElements: oldValues is not found`);
        const parentNode = this.node.parentNode ?? raiseError(`BindingNodeFor.update: parentNode is null`);
        // DOMから削除
        const currentBindContents = Array.from(this.#bindContentsSet);
        const targetBindContents = [];
        for (let i = 0; i < listIndexes.length; i++) {
            const listIndex = listIndexes[i];
            const bindContent = currentBindContents[listIndex.index];
            bindContent.unmount();
            targetBindContents.push(bindContent);
        }
        // DOMに追加、listIndexを更新
        for (let i = 0; i < listIndexes.length; i++) {
            const listIndex = listIndexes[i];
            const index = listIndex.index;
            const lastBindContent = currentBindContents[index - 1] ?? null;
            const lastNode = lastBindContent?.lastChildNode ?? this.node;
            const oldValue = oldListValues[index];
            const targetIndex = values.indexOf(oldValue);
            const prevBindContent = targetBindContents[targetIndex];
            if (typeof prevBindContent === "undefined") {
                // 入れ替えるBindContentがない場合は再描画
                const bindContent = targetBindContents[index];
                bindContent.render();
                bindContent.mountAfter(parentNode, lastNode);
            }
            else {
                prevBindContent.assignListIndex(listIndex);
                prevBindContent.mountAfter(parentNode, lastNode);
                this.#bindContentByListIndex.set(listIndex, prevBindContent);
                currentBindContents[index] = prevBindContent;
            }
            if (targetIndex >= 0) {
                values[targetIndex] = -1;
            }
        }
        this.#bindContentsSet = new Set(currentBindContents);
        engine.saveList(this.binding.bindingState.info, this.binding.bindingState.listIndex, this.binding.bindingState.value.slice(0));
    }
}
const createBindingNodeFor = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeFor(binding, node, name, filterFns, decorates);
};

const DEFAULT_PROPERTY = "textContent";
const defaultPropertyByElementType = {
    "radio": "checked",
    "checkbox": "checked",
    "button": "onclick",
};
/**
 * HTML要素のデフォルトプロパティを取得
 */
const getDefaultPropertyHTMLElement = (node) => node instanceof HTMLSelectElement || node instanceof HTMLTextAreaElement || node instanceof HTMLOptionElement ? "value" :
    node instanceof HTMLButtonElement ? "onclick" :
        node instanceof HTMLAnchorElement ? "onclick" :
            node instanceof HTMLFormElement ? "onsubmit" :
                node instanceof HTMLInputElement ? (defaultPropertyByElementType[node.type] ?? "value") :
                    DEFAULT_PROPERTY;
const _cache$3 = {};
const textContentProperty = (node) => DEFAULT_PROPERTY;
const getDefaultPropertyByNodeType = {
    HTMLElement: getDefaultPropertyHTMLElement,
    SVGElement: undefined,
    Text: textContentProperty,
    Template: undefined,
};
/**
 * バインド情報でノードプロパティが省略された場合に、ノード種別・要素タイプごとに
 * 適切なデフォルトプロパティ名（例: textContent, value, checked, onclick など）を返すユーティリティ関数。
 *
 * - HTMLInputElementやHTMLSelectElementなど、要素ごとに最適なプロパティを判定
 * - input要素はtype属性（radio, checkboxなど）も考慮
 * - 一度判定した組み合わせはキャッシュし、パフォーマンス向上
 *
 * @param node     対象ノード
 * @param nodeType ノードタイプ（"HTMLElement" | "SVGElement" | "Text" | "Template"）
 * @returns        デフォルトのプロパティ名（例: "value", "checked", "textContent" など）
 */
function getDefaultName(node, nodeType) {
    const key = node.constructor.name + "\t" + (node.type ?? ""); // type attribute
    return _cache$3[key] ?? (_cache$3[key] = getDefaultPropertyByNodeType[nodeType]?.(node));
}

function isTwoWayBindable(element) {
    return element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement;
}
const defaultEventByName = {
    "value": "input",
    "checked": "change",
    "selected": "change",
};
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
        const defaultName = getDefaultName(this.node, "HTMLElement");
        if (defaultName !== this.name)
            return;
        if (decorates.length > 1)
            raiseError(`BindingNodeProperty: ${this.name} has multiple decorators`);
        const event = (decorates[0]?.startsWith("on") ? decorates[0]?.slice(2) : decorates[0]) ?? null;
        const eventName = event ?? defaultEventByName[this.name] ?? "readonly";
        if (eventName === "readonly" || eventName === "ro")
            return;
        // 双方向バインディング: イベント発火時にstateを更新
        const engine = this.binding.engine;
        this.node.addEventListener(eventName, async () => {
            const loopContext = this.binding.parentBindContent.currentLoopContext;
            const value = this.filteredValue;
            await engine.useWritableStateProxy(loopContext, async (stateProxy) => {
                // stateProxyを生成し、バインディング値を更新
                binding.updateStateValue(stateProxy, value);
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

const symbolName$1 = "component-state-input";
const AssignStateSymbol = Symbol.for(`${symbolName$1}.AssignState`);
const NotifyRedrawSymbol = Symbol.for(`${symbolName$1}.NotifyRedraw`);

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
    assignValue(value) {
    }
    notifyRedraw(refs) {
        const notifyRefs = [];
        const info = this.binding.bindingState.info;
        const listIndex = this.binding.bindingState.listIndex?.at(info.wildcardCount - 1) ?? null;
        const at = (listIndex?.length ?? 0) - 1;
        for (const ref of refs) {
            if (listIndex !== null && ref.listIndex?.at(at) !== listIndex) {
                continue;
            }
            if (!ref.info.cumulativePathSet.has(info.pattern)) {
                continue;
            }
            notifyRefs.push(ref);
        }
        if (notifyRefs.length === 0) {
            return;
        }
        const component = this.node;
        component.state[NotifyRedrawSymbol](notifyRefs);
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
const _cache$2 = {};
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
    const fn = _cache$2[key] ?? (_cache$2[key] = _getBindingNodeCreator(isComment, isElement, propertyName));
    return fn(propertyName, filterTexts, decorates);
}

const symbolName = "state";
const GetByRefSymbol = Symbol.for(`${symbolName}.GetByRef`);
const SetByRefSymbol = Symbol.for(`${symbolName}.SetByRef`);
const SetCacheableSymbol = Symbol.for(`${symbolName}.SetCacheable`);
const ConnectedCallbackSymbol = Symbol.for(`${symbolName}.ConnectedCallback`);
const DisconnectedCallbackSymbol = Symbol.for(`${symbolName}.DisconnectedCallback`);

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
const _cache$1 = {};
//const _cache: Map<string, IStructuredPathInfo> = new Map();
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
const reservedWords = new Set([
    "constructor", "prototype", "__proto__", "toString",
    "valueOf", "hasOwnProperty", "isPrototypeOf",
    "watch", "unwatch", "eval", "arguments",
    "let", "var", "const", "class", "function",
    "null", "true", "false", "new", "return",
]);
function getStructuredPathInfo(structuredPath) {
    let info;
    info = _cache$1[structuredPath];
    if (typeof info !== "undefined") {
        return info;
    }
    if (reservedWords.has(structuredPath)) {
        raiseError(`getStructuredPathInfo: pattern is reserved word: ${structuredPath}`);
    }
    return (_cache$1[structuredPath] = new StructuredPathInfo(structuredPath));
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
    #listIndexRef = null;
    #state;
    #filters;
    get pattern() {
        return this.#pattern;
    }
    get info() {
        return this.#info;
    }
    get listIndex() {
        if (this.#listIndexRef === null)
            return null;
        return this.#listIndexRef.deref() ?? raiseError("listIndex is null");
    }
    get state() {
        return this.#state;
    }
    get filters() {
        return this.#filters;
    }
    get binding() {
        return this.#binding;
    }
    constructor(binding, state, pattern, filters) {
        this.#binding = binding;
        this.#pattern = pattern;
        this.#info = getStructuredPathInfo(pattern);
        this.#state = state;
        this.#filters = filters;
    }
    get value() {
        return this.#state[GetByRefSymbol](this.info, this.listIndex);
    }
    get filteredValue() {
        let value = this.value;
        for (let i = 0; i < this.#filters.length; i++) {
            value = this.#filters[i](value);
        }
        return value;
    }
    init() {
        if (this.info.wildcardCount > 0) {
            const lastWildcardPath = this.info.lastWildcardPath ??
                raiseError(`BindingState.init: wildcardLastParentPath is null`);
            const loopContext = this.binding.parentBindContent.currentLoopContext?.find(lastWildcardPath) ??
                raiseError(`BindingState.init: loopContext is null`);
            this.#listIndexRef = loopContext.listIndexRef;
        }
        this.binding.engine.saveBinding(this.info, this.listIndex, this.binding);
    }
    assignValue(writeState, value) {
        writeState[SetByRefSymbol](this.info, this.listIndex, value);
    }
}
const createBindingState = (name, filterTexts) => (binding, state, filters) => {
    const filterFns = createFilters(filters, filterTexts); // ToDo:ここは、メモ化できる
    return new BindingState(binding, state, name, filterFns);
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
    #listIndexRef = null;
    #state;
    #filters;
    get pattern() {
        return raiseError("Not implemented");
    }
    get info() {
        return raiseError("Not implemented");
    }
    get listIndex() {
        if (this.#listIndexRef === null)
            return null;
        return this.#listIndexRef.deref() ?? raiseError("listIndex is null");
    }
    get state() {
        return this.#state;
    }
    get filters() {
        return this.#filters;
    }
    get binding() {
        return this.#binding;
    }
    constructor(binding, state, pattern, filters) {
        this.#binding = binding;
        const indexNumber = Number(pattern.slice(1));
        if (isNaN(indexNumber)) {
            raiseError("BindingStateIndex: pattern is not a number");
        }
        this.#indexNumber = indexNumber;
        this.#state = state;
        this.#filters = filters;
    }
    get value() {
        return this.listIndex?.index ?? raiseError("listIndex is null");
    }
    get filteredValue() {
        let value = this.value;
        for (let i = 0; i < this.#filters.length; i++) {
            value = this.#filters[i](value);
        }
        return value;
    }
    init() {
        const loopContext = this.binding.parentBindContent.currentLoopContext ??
            raiseError(`BindingState.init: loopContext is null`);
        const loopContexts = loopContext.serialize();
        this.#listIndexRef = loopContexts[this.#indexNumber - 1].listIndexRef ??
            raiseError(`BindingState.init: listIndexRef is null`);
        const listIndex = this.listIndex ?? raiseError("listIndex is null");
        const bindings = this.binding.engine.bindingsByListIndex.get(listIndex);
        if (bindings === undefined) {
            this.binding.engine.bindingsByListIndex.set(listIndex, new Set([this.binding]));
        }
        else {
            bindings.add(this.binding);
        }
    }
    assignValue(writeState, value) {
        raiseError("BindingStateIndex: assignValue is not implemented");
    }
}
const createBindingStateIndex = (name, filterTexts) => (binding, state, filters) => {
    const filterFns = createFilters(filters, filterTexts); // ToDo:ここは、メモ化できる
    return new BindingStateIndex(binding, state, name, filterFns);
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
const cache$1 = {};
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
    return cache$1[text] ?? (cache$1[text] = parseExpressions(text));
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
function getDataBindAttributesFromTemplate(content) {
    const nodes = getNodesHavingDataBind(content);
    return nodes.map(node => createDataBindAttributes(node));
}
/**
 * テンプレート（DocumentFragment）内のバインディング情報（data-bind属性やコメント）を解析・登録し、
 * 各テンプレートIDごとにバインディング属性情報・状態パス集合を管理するユーティリティ。
 *
 * - getNodesHavingDataBindで対象ノードを抽出し、createDataBindAttributesで解析
 * - 各テンプレートIDごとにバインディング属性リスト・状態パス集合・リストパス集合をキャッシュ
 * - forバインディング（ループ）のstatePropertyはlistPathsにも登録
 *
 * @param id      テンプレートID
 * @param content テンプレートのDocumentFragment
 * @param rootId  ルートテンプレートID（省略時はidと同じ）
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
/**
 * テンプレートIDからバインディング属性リストを取得
 */
const getDataBindAttributesById = (id) => {
    return listDataBindAttributesById[id];
};
/**
 * テンプレートIDからforバインディングのstateProperty集合を取得
 */
const getListPathsSetById = (id) => {
    return listPathsSetById[id] ?? [];
};
/**
 * テンプレートIDから全バインディングのstateProperty集合を取得
 */
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
 * registerTemplate.ts
 *
 * HTMLTemplateElementをIDで登録・取得するための管理モジュールです。
 *
 * 主な役割:
 * - templateById: IDをキーにHTMLTemplateElementを管理するレコード
 * - registerTemplate: 指定IDでテンプレートを登録し、空テキストノード除去やデータバインド属性の登録も実行
 * - getTemplateById: 指定IDのテンプレートを取得（未登録時はエラーを投げる）
 *
 * 設計ポイント:
 * - テンプレート登録時にremoveEmptyTextNodesで空テキストノードを除去し、クリーンなDOMを維持
 * - registerDataBindAttributesでデータバインド属性を自動付与
 * - グローバルにテンプレートを一元管理し、ID経由で高速にアクセス可能
 * - 存在しないIDアクセス時はraiseErrorで明確な例外を発生
 */
const templateById = {};
function registerTemplate(id, template, rootId) {
    removeEmptyTextNodes(template.content);
    registerDataBindAttributes(id, template.content, rootId);
    templateById[id] = template;
    return id;
}
function getTemplateById(id) {
    return templateById[id] ?? raiseError(`getTemplateById: template not found: ${id}`);
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
    constructor(parentBindContent, node, engine, createBindingNode, createBindingState) {
        this.parentBindContent = parentBindContent;
        this.node = node;
        this.engine = engine;
        this.bindingNode = createBindingNode(this, node, engine.inputFilters);
        this.bindingState = createBindingState(this, engine.readonlyState, engine.outputFilters);
    }
    get bindContents() {
        return this.bindingNode.bindContents;
    }
    init() {
        this.bindingNode.init();
        this.bindingState.init();
    }
    render() {
        if (this.version !== this.engine.updater.version) {
            try {
                this.bindingNode.update();
            }
            finally {
                this.version = this.engine.updater.version;
            }
        }
    }
    updateStateValue(writeState, value) {
        return this.bindingState.assignValue(writeState, value);
    }
    notifyRedraw(refs) {
        this.bindingNode.notifyRedraw(refs);
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
    #path;
    #info;
    #listIndexRef;
    #bindContent;
    constructor(path, listIndex, bindContent) {
        this.#path = path ?? raiseError("name is required");
        this.#info = getStructuredPathInfo(this.#path);
        this.#listIndexRef = new WeakRef(listIndex);
        this.#bindContent = bindContent;
    }
    get path() {
        return this.#path;
    }
    get info() {
        return this.#info;
    }
    get listIndex() {
        return this.#listIndexRef?.deref() ?? raiseError("listIndex is null");
    }
    get listIndexRef() {
        return this.#listIndexRef ?? raiseError("listIndexRef is null");
    }
    assignListIndex(listIndex) {
        this.#listIndexRef = new WeakRef(listIndex);
        // 構造は変わらないので、#parentLoopContext、#cacheはクリアする必要はない
    }
    clearListIndex() {
        this.#listIndexRef = null;
    }
    get bindContent() {
        return this.#bindContent;
    }
    #parentLoopContext;
    get parentLoopContext() {
        if (typeof this.#parentLoopContext === "undefined") {
            let currentBinding = this.bindContent;
            while (currentBinding !== null) {
                if (currentBinding.loopContext !== null && currentBinding.loopContext !== this) {
                    this.#parentLoopContext = currentBinding.loopContext;
                    break;
                }
                currentBinding = currentBinding.parentBinding?.parentBindContent ?? null;
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
function createLoopContext(pattern, listIndex, bindContent) {
    return new LoopContext(pattern, listIndex, bindContent);
}

function render(bindings) {
    const bindingsWithSelectElement = [];
    for (let i = 0; i < bindings.length; i++) {
        const binding = bindings[i];
        if (binding.bindingNode.isSelectElement) {
            bindingsWithSelectElement.push(binding);
        }
        else {
            binding.render();
        }
    }
    for (let i = 0; i < bindingsWithSelectElement.length; i++) {
        bindingsWithSelectElement[i].render();
    }
}

function createContent(id) {
    const template = getTemplateById(id) ??
        raiseError(`BindContent: template is not found: ${id}`);
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
function createBindings(bindContent, id, engine, content) {
    const attributes = getDataBindAttributesById(id) ??
        raiseError(`BindContent: data-bind is not set`);
    const bindings = [];
    for (let i = 0; i < attributes.length; i++) {
        const attribute = attributes[i];
        const node = resolveNodeFromPath(content, attribute.nodePath) ??
            raiseError(`BindContent: node is not found: ${attribute.nodePath}`);
        for (let j = 0; j < attribute.bindTexts.length; j++) {
            const bindText = attribute.bindTexts[j];
            const creator = attribute.creatorByText.get(bindText) ??
                raiseError(`BindContent: creator is not found: ${bindText}`);
            const binding = createBinding(bindContent, node, engine, creator.createBindingNode, creator.createBindingState);
            bindings.push(binding);
        }
    }
    return bindings;
}
/**
 * BindContentクラスは、テンプレートから生成されたDOM断片（DocumentFragment）と
 * そのバインディング情報（IBinding配列）を管理するための実装です。
 *
 * 主な役割:
 * - テンプレートIDからDOM断片を生成し、バインディング情報を構築
 * - mount/mountBefore/mountAfter/unmountでDOMへの挿入・削除を制御
 * - renderでバインディングの再描画、initで初期化処理を実行
 * - ループバインディング時のLoopContextやリストインデックス管理にも対応
 * - getLastNodeで再帰的に最後のノードを取得し、リスト描画や差し替えに利用
 * - assignListIndexでループ内のリストインデックスを再割り当てし、再初期化
 *
 * 設計ポイント:
 * - fragmentとchildNodesの両方を管理し、効率的なDOM操作を実現
 * - バインディング情報はテンプレートごとに動的に生成され、各ノードに紐付く
 * - ループや条件分岐など複雑なバインディング構造にも柔軟に対応
 * - createBindContentファクトリ関数で一貫した生成・初期化を提供
 */
class BindContent {
    loopContext;
    parentBinding;
    childNodes;
    fragment;
    engine;
    #id;
    get id() {
        return this.#id;
    }
    get isMounted() {
        return this.childNodes.length > 0 && this.childNodes[0].parentNode !== this.fragment;
    }
    get firstChildNode() {
        return this.childNodes[0] ?? null;
    }
    get lastChildNode() {
        return this.childNodes[this.childNodes.length - 1] ?? null;
    }
    getLastNode(parentNode) {
        const lastBinding = this.bindings[this.bindings.length - 1];
        const lastChildNode = this.lastChildNode;
        if (typeof lastBinding !== "undefined" && lastBinding.node === lastChildNode) {
            if (lastBinding.bindContents.size > 0) {
                const childBindContent = Array.from(lastBinding.bindContents).at(-1) ?? raiseError(`BindContent: childBindContent is not found`);
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
    constructor(parentBinding, id, engine, loopContext, listIndex) {
        this.parentBinding = parentBinding;
        this.#id = id;
        this.fragment = createContent(id);
        this.childNodes = Array.from(this.fragment.childNodes);
        this.engine = engine;
        this.loopContext = (listIndex !== null) ? createLoopContext(loopContext, listIndex, this) : null;
        this.bindings = createBindings(this, id, engine, this.fragment);
    }
    mount(parentNode) {
        if (this.fragment.childNodes.length === 0) {
            for (let i = 0; i < this.childNodes.length; i++) {
                parentNode.appendChild(this.childNodes[i]);
            }
        }
        else {
            parentNode.appendChild(this.fragment);
        }
    }
    mountBefore(parentNode, beforeNode) {
        if (this.fragment.childNodes.length === 0) {
            for (let i = 0; i < this.childNodes.length; i++) {
                parentNode.insertBefore(this.childNodes[i], beforeNode);
            }
        }
        else {
            parentNode.insertBefore(this.fragment, beforeNode);
        }
    }
    mountAfter(parentNode, afterNode) {
        const beforeNode = afterNode?.nextSibling ?? null;
        if (this.fragment.childNodes.length === 0) {
            for (let i = 0; i < this.childNodes.length; i++) {
                parentNode.insertBefore(this.childNodes[i], beforeNode);
            }
        }
        else {
            parentNode.insertBefore(this.fragment, beforeNode);
        }
    }
    unmount() {
        for (let i = 0; i < this.childNodes.length; i++) {
            this.fragment.appendChild(this.childNodes[i]);
        }
    }
    bindings = [];
    render() {
        render(this.bindings);
    }
    init() {
        this.bindings.forEach(binding => binding.init());
    }
    assignListIndex(listIndex) {
        if (this.loopContext == null)
            raiseError(`BindContent: loopContext is null`);
        this.loopContext.assignListIndex(listIndex);
        this.init();
    }
}
function createBindContent(parentBinding, id, engine, loopContext, listIndex) {
    const bindContent = new BindContent(parentBinding, id, engine, loopContext, listIndex);
    bindContent.init();
    return bindContent;
}

/**
 * infoとtypeから依存関係エッジの一意キーを生成
 */
function createDependencyKey(info, type) {
    return `${info.pattern}@${type}`;
}
const cache = {};
/**
 * 依存関係エッジ（IDependencyEdge）を生成・キャッシュして返す
 */
function createDependencyEdge(info, type) {
    const key = createDependencyKey(info, type);
    return cache[key] ?? (cache[key] = { info, type });
}

class dependencyWalker {
    engine;
    entryRef;
    traced = new Set();
    constructor(engine, entryRef) {
        this.engine = engine;
        this.entryRef = entryRef;
    }
    walkSub(info, type, callback) {
        const key = createDependencyKey(info, type);
        if (this.traced.has(key)) {
            return;
        }
        this.traced.add(key);
        callback(this.entryRef, info, type);
        const edges = this.engine.dependentTree.get(info) ?? [];
        for (const edge of edges) {
            const overridedType = edge.type === "structured" ? type : edge.type;
            this.walkSub(edge.info, overridedType, callback);
        }
    }
    walk(callback) {
        this.walkSub(this.entryRef.info, "structured", callback);
    }
}
function createDependencyWalker(engine, entryRef) {
    return new dependencyWalker(engine, entryRef);
}

class ListIndex {
    static id = 0;
    id = ++ListIndex.id;
    sid = this.id.toString();
    #parentListIndex = null;
    get parentListIndex() {
        return this.#parentListIndex;
    }
    index;
    get indexes() {
        const indexes = this.parentListIndex?.indexes ?? [];
        indexes.push(this.index);
        return indexes;
    }
    get position() {
        return (this.parentListIndex?.position ?? -1) + 1;
    }
    get length() {
        return (this.parentListIndex?.length ?? 0) + 1;
    }
    constructor(parentListIndex, index) {
        this.#parentListIndex = parentListIndex;
        this.index = index;
    }
    truncate(length) {
        let listIndex = this;
        while (listIndex !== null) {
            if (listIndex.position < length)
                return listIndex;
            listIndex = listIndex.parentListIndex;
        }
        return null;
    }
    add(value) {
        return new ListIndex(this, value);
    }
    *reverseIterator() {
        yield this;
        if (this.parentListIndex !== null) {
            yield* this.parentListIndex.reverseIterator();
        }
        return;
    }
    *iterator() {
        if (this.parentListIndex !== null) {
            yield* this.parentListIndex.iterator();
        }
        yield this;
        return;
    }
    toString() {
        const parentListIndex = this.parentListIndex?.toString();
        return (parentListIndex !== null) ? parentListIndex + "," + this.index.toString() : this.index.toString();
    }
    #atcache = {};
    at(position) {
        const value = this.#atcache[position];
        if (typeof value !== "undefined") {
            return value ? (value.deref() ?? null) : null;
        }
        let listIndex = null;
        if (position >= 0) {
            let count = this.length - position - 1;
            listIndex = this;
            while (count > 0 && listIndex !== null) {
                listIndex = listIndex.parentListIndex;
                count--;
            }
        }
        else {
            let iterator;
            position = -position - 1;
            iterator = this.reverseIterator();
            let next;
            while (position >= 0) {
                next = iterator.next();
                position--;
            }
            listIndex = next?.value ?? null;
        }
        this.#atcache[position] = listIndex ? new WeakRef(listIndex) : null;
        return listIndex;
    }
}
function createListIndex(parentListIndex, index) {
    return new ListIndex(parentListIndex, index);
}

function listWalkerSub(engine, info, listIndex, callback) {
    const listIndexLen = listIndex?.length ?? 0;
    if (info.wildcardCount === listIndexLen) {
        callback(info, listIndex);
    }
    else {
        const parentInfo = info.wildcardParentInfos[listIndexLen] ?? raiseError("Invalid state property info");
        const listIndexes = engine.getListIndexesSet(parentInfo, listIndex);
        for (const subListIndex of listIndexes ?? []) {
            listWalkerSub(engine, info, subListIndex, callback);
        }
    }
}
function listWalker(engine, info, listIndex, callback) {
    listWalkerSub(engine, info, listIndex, callback);
}

function createRefKey(info, listIndex) {
    return (listIndex == null) ? info.sid : (info.sid + "#" + listIndex.sid);
}

const BLANK_LISTINDEXES_SET$1 = new Set();
function buildListIndexTree$1(engine, info, listIndex, value) {
    const oldValue = engine.getList(info, listIndex) ?? [];
    if (oldValue === value) {
        return;
    }
    const newListIndexesSet = new Set();
    const oldListIndexesSet = engine.getListIndexesSet(info, listIndex) ?? BLANK_LISTINDEXES_SET$1;
    const oldListIndexesByItem = Map.groupBy(oldListIndexesSet, listIndex => oldValue[listIndex.index]);
    for (let i = 0; i < value.length; i++) {
        // リスト要素から古いリストインデックスを取得して、リストインデックスを更新する
        // もし古いリストインデックスがなければ、新しいリストインデックスを作成する
        let curListIndex = oldListIndexesByItem.get(value[i])?.shift() ?? createListIndex(listIndex, i);
        if (curListIndex.index !== i) {
            curListIndex.index = i;
            // リストインデックスのインデックスを更新したので、リストインデックスを登録する
            engine.updater.addUpdatedListIndex(curListIndex);
        }
        // リストインデックスを新しいリストインデックスセットに追加する
        newListIndexesSet.add(curListIndex);
    }
    // 新しいリストインデックスセットを保存する
    engine.saveListIndexesSet(info, listIndex, newListIndexesSet);
    engine.saveList(info, listIndex, value.slice(0)); // コピーを保存
}
function restructListIndexes(infos, engine, updateValues, refKeys, cache) {
    for (const { info, listIndex } of infos) {
        if (config$2.optimizeListElements && engine.elementInfoSet.has(info)) {
            // スワップ処理のためスキップ
            continue;
        }
        const dependentWalker = createDependencyWalker(engine, { info, listIndex });
        const nowOnList = config$2.optimizeList && engine.listInfoSet.has(info);
        // 依存関係を辿る
        dependentWalker.walk((ref, refInfo, type) => {
            if (nowOnList && type === "structured" && ref.info !== refInfo) {
                if (refInfo.cumulativeInfoSet.has(ref.info)) {
                    return;
                }
            }
            const wildcardMatchPaths = Array.from(ref.info.wildcardInfoSet.intersection(refInfo.wildcardInfoSet));
            const longestMatchAt = (wildcardMatchPaths.at(-1)?.wildcardCount ?? 0) - 1;
            const listIndex = (longestMatchAt >= 0) ? (ref.listIndex?.at(longestMatchAt) ?? null) : null;
            // リストインデックスを展開する
            listWalker(engine, refInfo, listIndex, (_info, _listIndex) => {
                const refKey = createRefKey(_info, _listIndex);
                if (refKeys.has(refKey)) {
                    return;
                }
                let cacheListIndexSet = cache.get(_info);
                if (!cacheListIndexSet) {
                    cacheListIndexSet = new Set();
                    cache.set(_info, cacheListIndexSet);
                }
                cacheListIndexSet.add(_listIndex);
                if (!engine.existsBindingsByInfo(_info)) {
                    return;
                }
                refKeys.add(refKey);
                if (engine.listInfoSet.has(_info)) {
                    const values = updateValues[refKey] ?? engine.readonlyState[GetByRefSymbol](_info, _listIndex);
                    buildListIndexTree$1(engine, _info, _listIndex, values);
                }
            });
        });
    }
}

class Updater {
    updatedProperties = new Set;
    updatedValues = {};
    engine;
    #version = 0;
    constructor(engine) {
        this.engine = engine;
    }
    get version() {
        return this.#version;
    }
    addProcess(process) {
        queueMicrotask(process);
    }
    addUpdatedStatePropertyRefValue(info, listIndex, value) {
        const refKey = createRefKey(info, listIndex);
        this.updatedProperties.add({ info, listIndex });
        this.updatedValues[refKey] = value;
        this.entryRender();
    }
    addUpdatedListIndex(listIndex) {
        this.updatedProperties.add(listIndex);
        this.entryRender();
    }
    #isEntryRender = false;
    entryRender() {
        if (this.#isEntryRender)
            return;
        this.#isEntryRender = true;
        const engine = this.engine;
        queueMicrotask(() => {
            try {
                const { bindings, arrayElementBindings, properties } = this.rebuild();
                // スワップ処理
                for (const arrayElementBinding of arrayElementBindings) {
                    arrayElementBinding.binding.bindingNode.updateElements(arrayElementBinding.listIndexes, arrayElementBinding.values);
                }
                // レンダリング
                if (bindings.length > 0) {
                    this.render(bindings);
                }
                // 子コンポーネントへの再描画通知
                if (engine.structiveChildComponents.size > 0) {
                    for (const structiveComponent of engine.structiveChildComponents) {
                        const structiveComponentBindings = engine.bindingsByComponent.get(structiveComponent) ?? new Set();
                        for (const binding of structiveComponentBindings) {
                            binding.notifyRedraw(properties);
                        }
                    }
                }
            }
            finally {
                this.#isEntryRender = false;
            }
        });
    }
    rebuild() {
        const retArrayElementBindings = [];
        const retBindings = [];
        const retProperties = [];
        const engine = this.engine;
        const hasChildComponent = engine.structiveChildComponents.size > 0;
        while (this.updatedProperties.size > 0) {
            const updatedProiperties = Array.from(this.updatedProperties.values());
            this.updatedProperties.clear();
            const bindingsByListIndex = [];
            const updatedRefs = []; // 更新されたプロパティ参照のリスト
            const arrayElementBindingByParentRefKey = new Map();
            for (let i = 0; i < updatedProiperties.length; i++) {
                const item = updatedProiperties[i];
                if ("index" in item) {
                    const bindings = engine.bindingsByListIndex.get(item) ?? [];
                    bindingsByListIndex.push(...bindings);
                }
                else {
                    updatedRefs.push(item);
                    if (engine.elementInfoSet.has(item.info)) {
                        const parentInfo = item.info.parentInfo ?? raiseError("info is null"); // リストのパス情報
                        const parentListIndex = item.listIndex?.at(-2) ?? null; // リストのインデックス
                        const parentRef = { info: parentInfo, listIndex: parentListIndex };
                        const parentRefKey = createRefKey(parentInfo, parentListIndex);
                        let info = arrayElementBindingByParentRefKey.get(parentRefKey);
                        if (!info) {
                            info = {
                                parentRef,
                                listIndexes: [],
                                values: []
                            };
                            arrayElementBindingByParentRefKey.set(parentRefKey, info);
                        }
                        const refKey = createRefKey(item.info, item.listIndex);
                        const value = this.updatedValues[refKey] ?? null;
                        info.values?.push(value);
                        info.listIndexes?.push(item.listIndex);
                    }
                }
            }
            // リストインデックスの構築
            const builtStatePropertyRefKeySet = new Set();
            const affectedRefs = new Map();
            restructListIndexes(updatedRefs, engine, this.updatedValues, builtStatePropertyRefKeySet, affectedRefs);
            // スワップの場合の情報を構築する
            for (const [parentRefKey, info] of arrayElementBindingByParentRefKey) {
                const parentInfo = info.parentRef?.info ?? raiseError("parentInfo is null");
                const parentListIndex = info.parentRef?.listIndex ?? null;
                const bindings = engine.getBindings(parentInfo, parentListIndex);
                for (const binding of bindings) {
                    if (!binding.bindingNode.isFor) {
                        continue;
                    }
                    const bindingInfo = Object.assign({}, info, { binding });
                    retArrayElementBindings.push(bindingInfo);
                }
            }
            // 影響する全てのバインド情報を取得する
            for (const [info, listIndexes] of affectedRefs.entries()) {
                for (const listIndex of listIndexes) {
                    const bindings = engine.getBindings(info, listIndex);
                    retBindings.push(...bindings ?? []);
                    if (hasChildComponent) {
                        retProperties.push({ info, listIndex });
                    }
                }
            }
            retBindings.push(...bindingsByListIndex);
        }
        this.updatedValues = {};
        return {
            bindings: retBindings,
            arrayElementBindings: retArrayElementBindings,
            properties: retProperties
        };
    }
    render(bindings) {
        this.#version++;
        this.engine.readonlyState[SetCacheableSymbol](() => {
            return render(bindings);
        });
    }
}
function createUpdater(engine) {
    return new Updater(engine);
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
        return typeof element.attachShadow === "function";
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
            const shadowRoot = element.attachShadow({ mode: 'open' });
            shadowRoot.adoptedStyleSheets = [styleSheet];
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

const BLANK_LISTINDEXES_SET = new Set();
function buildListIndexTreeSub(engine, listInfos, info, listIndex, value) {
    const oldValue = engine.getList(info, listIndex) ?? [];
    if (oldValue === value) {
        return;
    }
    const newListIndexesSet = new Set();
    const oldListIndexesSet = engine.getListIndexesSet(info, listIndex) ?? BLANK_LISTINDEXES_SET;
    const oldListIndexesByItem = Map.groupBy(oldListIndexesSet, listIndex => oldValue[listIndex.index]);
    for (let i = 0; i < value.length; i++) {
        // リスト要素から古いリストインデックスを取得して、リストインデックスを更新する
        // もし古いリストインデックスがなければ、新しいリストインデックスを作成する
        let curListIndex = oldListIndexesByItem.get(value[i])?.shift() ?? createListIndex(listIndex, i);
        if (curListIndex.index !== i) {
            curListIndex.index = i;
            // リストインデックスのインデックスを更新したので、リストインデックスを登録する
            engine.updater.addUpdatedListIndex(curListIndex);
        }
        // リストインデックスを新しいリストインデックスセットに追加する
        newListIndexesSet.add(curListIndex);
    }
    // 新しいリストインデックスセットを保存する
    engine.saveListIndexesSet(info, listIndex, newListIndexesSet);
    engine.saveList(info, listIndex, value.slice(0)); // コピーを保存
    // サブ要素のリストインデックスを構築する
    const searchPath = info.pattern + ".*";
    for (const info of listInfos) {
        if (searchPath !== info.lastWildcardPath) {
            continue;
        }
        for (const subListIndex of newListIndexesSet) {
            const subValue = engine.readonlyState[GetByRefSymbol](info, subListIndex);
            buildListIndexTreeSub(engine, listInfos, info, subListIndex, subValue ?? []);
        }
    }
}
function buildListIndexTree(engine, info, listIndex, value) {
    engine.listInfoSet;
    // 配列じゃなければ何もしない
    if (!engine.listInfoSet.has(info)) {
        return;
    }
    const values = (value ?? []);
    buildListIndexTreeSub(engine, engine.listInfoSet, info, listIndex, values);
}

/**
 * プロパティ名に"constructor"や"toString"などの予約語やオブジェクトのプロパティ名を
 * 上書きするような名前も指定できるように、Mapを検討したが、そもそもそのような名前を
 * 指定することはないと考え、Mapを使わないことにした。
 */
const _cache = {};
//const _cache: Map<string, IResolvedPathInfo> = new Map();
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
    //  return _cache.get(name) ?? (_cache.set(name, nameInfo = new ResolvedPathInfo(name)), nameInfo);
    return _cache[name] ?? (_cache[name] = new ResolvedPathInfo(name));
}

function getContextListIndex(handler, structuredPath) {
    const info = handler.structuredPathInfoStack[handler.refIndex];
    if (typeof info === "undefined" || info === null) {
        return null;
    }
    const index = info.indexByWildcardPath[structuredPath];
    if (index >= 0) {
        const listIndex = handler.listIndexStack[handler.refIndex];
        if (typeof listIndex === "undefined") {
            return null;
        }
        return listIndex?.at(index) ?? null;
    }
    return null;
}

function getListIndex(info, receiver, handler) {
    switch (info.wildcardType) {
        case "none":
            return null;
        case "context":
            const lastWildcardPath = info.info.lastWildcardPath ??
                raiseError(`lastWildcardPath is null`);
            return getContextListIndex(handler, lastWildcardPath) ??
                raiseError(`ListIndex not found: ${info.info.pattern}`);
        case "all":
            let parentListIndex = null;
            for (let i = 0; i < info.info.wildcardCount; i++) {
                const wildcardParentPattern = info.info.wildcardParentInfos[i] ?? raiseError(`wildcardParentPattern is null`);
                const listIndexes = Array.from(handler.engine.getListIndexesSet(wildcardParentPattern, parentListIndex) ?? []);
                const wildcardIndex = info.wildcardIndexes[i] ?? raiseError(`wildcardIndex is null`);
                parentListIndex = listIndexes[wildcardIndex] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
            }
            return parentListIndex;
        case "partial":
            raiseError(`Partial wildcard type is not supported yet: ${info.info.pattern}`);
    }
}

function setStatePropertyRef(handler, info, listIndex, callback) {
    handler.refIndex++;
    if (handler.refIndex >= handler.structuredPathInfoStack.length) {
        handler.structuredPathInfoStack.push(null);
        handler.listIndexStack.push(null);
    }
    handler.structuredPathInfoStack[handler.refIndex] = info;
    handler.listIndexStack[handler.refIndex] = listIndex;
    try {
        return callback();
    }
    finally {
        handler.structuredPathInfoStack[handler.refIndex] = null;
        handler.listIndexStack[handler.refIndex] = null;
        handler.refIndex--;
    }
}

function setTracking(info, handler, callback) {
    // 依存関係の自動登録
    const lastTrackingStack = handler.trackingStack[handler.trackingIndex] ?? null;
    if (lastTrackingStack != null) {
        // trackedGettersに含まれる場合はsetTrackingで依存追跡を有効化
        if (handler.engine.trackedGetters.has(lastTrackingStack.pattern)) {
            handler.engine.addDependentProp(lastTrackingStack, info, "reference");
        }
    }
    handler.trackingIndex++;
    if (handler.trackingIndex >= handler.trackingStack.length) {
        handler.trackingStack.push(null);
    }
    handler.trackingStack[handler.trackingIndex] = info;
    handler.lastTrackingStack = handler.trackingStack[handler.trackingIndex] ?? null;
    try {
        return callback();
    }
    finally {
        handler.trackingStack[handler.trackingIndex] = null;
        handler.trackingIndex--;
        handler.lastTrackingStack = handler.trackingStack[handler.trackingIndex] ?? null;
    }
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
function _getByRef$1(target, info, listIndex, receiver, handler) {
    // キャッシュが有効な場合はrefKeyで値をキャッシュ
    let refKey = '';
    if (handler.cacheable) {
        const key = (listIndex === null) ? info.sid : (info.sid + "#" + listIndex.sid);
        const value = handler.cache[key];
        if (typeof value !== "undefined") {
            return value;
        }
        if (key in handler.cache) {
            return undefined;
        }
        refKey = key;
    }
    let value;
    try {
        // 親子関係のあるgetterが存在する場合は、外部依存から取得
        // ToDo: stateにgetterが存在する（パスの先頭が一致する）場合はgetter経由で取得
        if (handler.engine.stateOutput.startsWith(info) && handler.engine.getters.intersection(info.cumulativePathSet).size === 0) {
            return value = handler.engine.stateOutput.get(info, listIndex);
        }
        // パターンがtargetに存在する場合はgetter経由で取得
        if (info.pattern in target) {
            return (value = setStatePropertyRef(handler, info, listIndex, () => {
                return Reflect.get(target, info.pattern, receiver);
            }));
        }
        else {
            // 存在しない場合は親infoを辿って再帰的に取得
            const parentInfo = info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
            const parentListIndex = parentInfo.wildcardCount < info.wildcardCount ? (listIndex?.parentListIndex ?? null) : listIndex;
            const parentValue = getByRefReadonly(target, parentInfo, parentListIndex, receiver, handler);
            const lastSegment = info.lastSegment;
            if (lastSegment === "*") {
                // ワイルドカードの場合はlistIndexのindexでアクセス
                const index = listIndex?.index ?? raiseError(`propRef.listIndex?.index is undefined`);
                return (value = Reflect.get(parentValue, index));
            }
            else {
                // 通常のプロパティアクセス
                return (value = Reflect.get(parentValue, lastSegment));
            }
        }
    }
    finally {
        // キャッシュが有効な場合は取得値をキャッシュ
        if (handler.cacheable && !(refKey in handler.cache)) {
            handler.cache[refKey] = value;
        }
    }
}
/**
 * trackedGettersに含まれる場合は依存追跡(setTracking)を有効化し、値取得を行う。
 * それ以外は通常の_getByRefで取得。
 */
function getByRefReadonly(target, info, listIndex, receiver, handler) {
    return setTracking(info, handler, () => {
        return _getByRef$1(target, info, listIndex, receiver, handler);
    });
}

function resolveReadonly(target, prop, receiver, handler) {
    return (path, indexes, value) => {
        const info = getStructuredPathInfo(path);
        if (handler.lastTrackingStack != null) {
            // trackedGettersに含まれる場合はsetTrackingで依存追跡を有効化
            if (handler.engine.trackedGetters.has(handler.lastTrackingStack.pattern)) {
                handler.engine.addDependentProp(handler.lastTrackingStack, info, "reference");
            }
        }
        let listIndex = null;
        for (let i = 0; i < info.wildcardParentInfos.length; i++) {
            const wildcardParentPattern = info.wildcardParentInfos[i] ?? raiseError(`wildcardParentPath is null`);
            const listIndexes = Array.from(handler.engine.getListIndexesSet(wildcardParentPattern, listIndex) ?? []);
            const index = indexes[i] ?? raiseError(`index is null`);
            listIndex = listIndexes[index] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
        }
        if (typeof value === "undefined") {
            return getByRefReadonly(target, info, listIndex, receiver, handler);
        }
        else {
            raiseError(`Cannot set value on a readonly proxy: ${path}`);
        }
    };
}

function setCacheable(handler, callback) {
    handler.cacheable = true;
    handler.cache = {};
    try {
        callback();
    }
    finally {
        handler.cacheable = false;
    }
}

function getAllReadonly(target, prop, receiver, handler) {
    const resolve = resolveReadonly(target, prop, receiver, handler);
    return (path, indexes) => {
        const info = getStructuredPathInfo(path);
        if (handler.lastTrackingStack != null) {
            // trackedGettersに含まれる場合はsetTrackingで依存追跡を有効化
            if (handler.engine.trackedGetters.has(handler.lastTrackingStack.pattern)) {
                handler.engine.addDependentProp(handler.lastTrackingStack, info, "reference");
            }
        }
        if (typeof indexes === "undefined") {
            for (let i = 0; i < info.wildcardInfos.length; i++) {
                const wildcardPattern = info.wildcardInfos[i] ?? raiseError(`wildcardPattern is null`);
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
            const listIndexSet = handler.engine.getListIndexesSet(wildcardParentPattern, listIndex) ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
            const listIndexes = Array.from(listIndexSet);
            const index = indexes[indexPos] ?? null;
            if (index === null) {
                for (let i = 0; i < listIndexes.length; i++) {
                    const listIndex = listIndexes[i];
                    walkWildcardPattern(wildcardParentInfos, wildardIndexPos + 1, listIndex, indexes, indexPos + 1, parentIndexes.concat(listIndex.index), results);
                }
            }
            else {
                const listIndex = listIndexes[index] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
                if ((wildardIndexPos + 1) < wildcardParentInfos.length) {
                    walkWildcardPattern(wildcardParentInfos, wildardIndexPos + 1, listIndex, indexes, indexPos + 1, parentIndexes.concat(listIndex.index), results);
                }
            }
        };
        const resultIndexes = [];
        walkWildcardPattern(info.wildcardParentInfos, 0, null, indexes, 0, [], resultIndexes);
        const resultValues = [];
        for (let i = 0; i < resultIndexes.length; i++) {
            resultValues.push(resolve(info.pattern, resultIndexes[i]));
        }
        return resultValues;
    };
}

function trackDependency(target, prop, receiver, handler) {
    return (path) => {
        const info = getStructuredPathInfo(path);
        if (handler.lastTrackingStack != null) {
            // trackedGettersに含まれる場合はsetTrackingで依存追跡を有効化
            if (handler.engine.trackedGetters.has(handler.lastTrackingStack.pattern)) {
                handler.engine.addDependentProp(handler.lastTrackingStack, info, "reference");
            }
        }
    };
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
function getReadonly(target, prop, receiver, handler) {
    if (typeof prop === "string") {
        if (prop.charCodeAt(0) === 36) {
            if (prop.length === 2) {
                const d = prop.charCodeAt(1) - 48;
                if (d >= 1 && d <= 9) {
                    const listIndex = handler.listIndexStack[handler.refIndex];
                    return listIndex?.at(d - 1)?.index ?? raiseError(`ListIndex not found: ${prop}`);
                }
            }
            switch (prop) {
                case "$resolve":
                    return resolveReadonly(target, prop, receiver, handler);
                case "$getAll":
                    return getAllReadonly(target, prop, receiver, handler);
                case "$trackDependency":
                    return trackDependency(target, prop, receiver, handler);
                case "$navigate":
                    return (to) => getRouter()?.navigate(to);
            }
        }
        const resolvedInfo = getResolvedPathInfo(prop);
        const listIndex = getListIndex(resolvedInfo, receiver, handler);
        return getByRefReadonly(target, resolvedInfo.info, listIndex, receiver, handler);
    }
    else if (typeof prop === "symbol") {
        switch (prop) {
            case GetByRefSymbol:
                return (info, listIndex) => getByRefReadonly(target, info, listIndex, receiver, handler);
            case SetCacheableSymbol:
                return (callback) => setCacheable(handler, callback);
            default:
                return Reflect.get(target, prop, receiver);
        }
    }
}

const STACK_DEPTH$1 = 32;
let StateHandler$1 = class StateHandler {
    engine;
    cacheable = false;
    cache = {};
    lastTrackingStack = null;
    trackingStack = Array(STACK_DEPTH$1).fill(null);
    trackingIndex = -1;
    structuredPathInfoStack = Array(STACK_DEPTH$1).fill(null);
    listIndexStack = Array(STACK_DEPTH$1).fill(null);
    refIndex = -1;
    loopContext = null;
    constructor(engine) {
        this.engine = engine;
    }
    get(target, prop, receiver) {
        return getReadonly(target, prop, receiver, this);
    }
    set(target, prop, value, receiver) {
        raiseError(`Cannot set property ${String(prop)} of readonly state.`);
    }
};
function createReadonlyStateProxy(engine, state) {
    return new Proxy(state, new StateHandler$1(engine));
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
function _getByRef(target, info, listIndex, receiver, handler) {
    // 親子関係のあるgetterが存在する場合は、外部依存から取得
    // ToDo: stateにgetterが存在する（パスの先頭が一致する）場合はgetter経由で取得
    if (handler.engine.stateOutput.startsWith(info) && handler.engine.getters.intersection(info.cumulativePathSet).size === 0) {
        return handler.engine.stateOutput.get(info, listIndex);
    }
    // パターンがtargetに存在する場合はgetter経由で取得
    if (info.pattern in target) {
        return setStatePropertyRef(handler, info, listIndex, () => {
            return Reflect.get(target, info.pattern, receiver);
        });
    }
    else {
        // 存在しない場合は親infoを辿って再帰的に取得
        const parentInfo = info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
        const parentListIndex = parentInfo.wildcardCount < info.wildcardCount ? (listIndex?.parentListIndex ?? null) : listIndex;
        const parentValue = getByRefWritable(target, parentInfo, parentListIndex, receiver, handler);
        const lastSegment = info.lastSegment;
        if (lastSegment === "*") {
            // ワイルドカードの場合はlistIndexのindexでアクセス
            const index = listIndex?.index ?? raiseError(`propRef.listIndex?.index is undefined`);
            return Reflect.get(parentValue, index);
        }
        else {
            // 通常のプロパティアクセス
            return Reflect.get(parentValue, lastSegment);
        }
    }
}
/**
 * trackedGettersに含まれる場合は依存追跡(setTracking)を有効化し、値取得を行う。
 * それ以外は通常の_getByRefで取得。
 */
function getByRefWritable(target, info, listIndex, receiver, handler) {
    return setTracking(info, handler, () => {
        return _getByRef(target, info, listIndex, receiver, handler);
    });
}

function setByRef(target, info, listIndex, value, receiver, handler) {
    try {
        // 親子関係のあるgetterが存在する場合は、外部依存を通じて値を設定
        // ToDo: stateにgetterが存在する（パスの先頭が一致する）場合はgetter経由で取得
        if (handler.engine.stateOutput.startsWith(info) && handler.engine.setters.intersection(info.cumulativePathSet).size === 0) {
            return handler.engine.stateOutput.set(info, listIndex, value);
        }
        if (info.pattern in target) {
            return setStatePropertyRef(handler, info, listIndex, () => {
                return Reflect.set(target, info.pattern, value, receiver);
            });
        }
        else {
            const parentInfo = info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
            const parentListIndex = parentInfo.wildcardCount < info.wildcardCount ? (listIndex?.parentListIndex ?? null) : listIndex;
            const parentValue = getByRefWritable(target, parentInfo, parentListIndex, receiver, handler);
            const lastSegment = info.lastSegment;
            if (lastSegment === "*") {
                const index = listIndex?.index ?? raiseError(`propRef.listIndex?.index is undefined`);
                return Reflect.set(parentValue, index, value);
            }
            else {
                return Reflect.set(parentValue, lastSegment, value);
            }
        }
    }
    finally {
        handler.engine.updater.addUpdatedStatePropertyRefValue(info, listIndex, value);
    }
}

function resolveWritable(target, prop, receiver, handler) {
    return (path, indexes, value) => {
        const info = getStructuredPathInfo(path);
        if (handler.lastTrackingStack != null) {
            // trackedGettersに含まれる場合はsetTrackingで依存追跡を有効化
            if (handler.engine.trackedGetters.has(handler.lastTrackingStack.pattern)) {
                handler.engine.addDependentProp(handler.lastTrackingStack, info, "reference");
            }
        }
        let listIndex = null;
        for (let i = 0; i < info.wildcardParentInfos.length; i++) {
            const wildcardParentPattern = info.wildcardParentInfos[i] ?? raiseError(`wildcardParentPath is null`);
            const listIndexes = Array.from(handler.engine.getListIndexesSet(wildcardParentPattern, listIndex) ?? []);
            const index = indexes[i] ?? raiseError(`index is null`);
            listIndex = listIndexes[index] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
        }
        if (typeof value === "undefined") {
            return getByRefWritable(target, info, listIndex, receiver, handler);
        }
        else {
            return setByRef(target, info, listIndex, value, receiver, handler);
        }
    };
}

function getAllWritable(target, prop, receiver, handler) {
    const resolve = resolveWritable(target, prop, receiver, handler);
    return (path, indexes) => {
        const info = getStructuredPathInfo(path);
        if (handler.lastTrackingStack != null) {
            // trackedGettersに含まれる場合はsetTrackingで依存追跡を有効化
            if (handler.engine.trackedGetters.has(handler.lastTrackingStack.pattern)) {
                handler.engine.addDependentProp(handler.lastTrackingStack, info, "reference");
            }
        }
        if (typeof indexes === "undefined") {
            for (let i = 0; i < info.wildcardInfos.length; i++) {
                const wildcardPattern = info.wildcardInfos[i] ?? raiseError(`wildcardPattern is null`);
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
            const listIndexSet = handler.engine.getListIndexesSet(wildcardParentPattern, listIndex) ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
            const listIndexes = Array.from(listIndexSet);
            const index = indexes[indexPos] ?? null;
            if (index === null) {
                for (let i = 0; i < listIndexes.length; i++) {
                    const listIndex = listIndexes[i];
                    walkWildcardPattern(wildcardParentInfos, wildardIndexPos + 1, listIndex, indexes, indexPos + 1, parentIndexes.concat(listIndex.index), results);
                }
            }
            else {
                const listIndex = listIndexes[index] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
                if ((wildardIndexPos + 1) < wildcardParentInfos.length) {
                    walkWildcardPattern(wildcardParentInfos, wildardIndexPos + 1, listIndex, indexes, indexPos + 1, parentIndexes.concat(listIndex.index), results);
                }
            }
        };
        const resultIndexes = [];
        walkWildcardPattern(info.wildcardParentInfos, 0, null, indexes, 0, [], resultIndexes);
        const resultValues = [];
        for (let i = 0; i < resultIndexes.length; i++) {
            resultValues.push(resolve(info.pattern, resultIndexes[i]));
        }
        return resultValues;
    };
}

const CONNECTED_CALLBACK = "$connectedCallback";
function connectedCallback(target, prop, receiver, handler) {
    return async () => {
        const callback = Reflect.get(target, CONNECTED_CALLBACK);
        if (typeof callback === "function") {
            await callback.call(target, receiver);
        }
    };
}

const DISCONNECTED_CALLBACK = "$disconnectedCallback";
function disconnectedCallback(target, prop, receiver, handler) {
    return async () => {
        const callback = Reflect.get(target, DISCONNECTED_CALLBACK);
        if (typeof callback === "function") {
            await callback.call(target, receiver);
        }
    };
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
function getWritable(target, prop, receiver, handler) {
    if (typeof prop === "string") {
        if (prop.charCodeAt(0) === 36) {
            if (prop.length === 2) {
                const d = prop.charCodeAt(1) - 48;
                if (d >= 1 && d <= 9) {
                    const listIndex = handler.listIndexStack[handler.refIndex];
                    return listIndex?.at(d - 1)?.index ?? raiseError(`ListIndex not found: ${prop}`);
                }
            }
            switch (prop) {
                case "$resolve":
                    return resolveWritable(target, prop, receiver, handler);
                case "$getAll":
                    return getAllWritable(target, prop, receiver, handler);
                case "$trackDependency":
                    return trackDependency(target, prop, receiver, handler);
                case "$navigate":
                    return (to) => getRouter()?.navigate(to);
            }
        }
        const resolvedInfo = getResolvedPathInfo(prop);
        const listIndex = getListIndex(resolvedInfo, receiver, handler);
        return getByRefWritable(target, resolvedInfo.info, listIndex, receiver, handler);
    }
    else if (typeof prop === "symbol") {
        switch (prop) {
            case GetByRefSymbol:
                return (info, listIndex) => getByRefWritable(target, info, listIndex, receiver, handler);
            case SetByRefSymbol:
                return (info, listIndex, value) => setByRef(target, info, listIndex, value, receiver, handler);
            case ConnectedCallbackSymbol:
                return () => connectedCallback(target, prop, receiver);
            case DisconnectedCallbackSymbol:
                return () => disconnectedCallback(target, prop, receiver);
            default:
                return Reflect.get(target, prop, receiver);
        }
    }
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
        return setByRef(target, resolvedInfo.info, listIndex, value, receiver, handler);
    }
    else {
        return Reflect.set(target, prop, value, receiver);
    }
}

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
async function asyncSetStatePropertyRef(handler, info, listIndex, callback) {
    handler.refIndex++;
    if (handler.refIndex >= handler.structuredPathInfoStack.length) {
        handler.structuredPathInfoStack.push(null);
        handler.listIndexStack.push(null);
    }
    handler.structuredPathInfoStack[handler.refIndex] = info;
    handler.listIndexStack[handler.refIndex] = listIndex;
    try {
        await callback();
    }
    finally {
        handler.structuredPathInfoStack[handler.refIndex] = null;
        handler.listIndexStack[handler.refIndex] = null;
        handler.refIndex--;
    }
}

async function setLoopContext(handler, loopContext, callback) {
    if (handler.loopContext) {
        raiseError('already in loop context');
    }
    handler.loopContext = loopContext;
    try {
        if (loopContext) {
            await asyncSetStatePropertyRef(handler, loopContext.info, loopContext.listIndex, callback);
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
    lastTrackingStack = null;
    trackingStack = Array(STACK_DEPTH).fill(null);
    trackingIndex = -1;
    structuredPathInfoStack = Array(STACK_DEPTH).fill(null);
    listIndexStack = Array(STACK_DEPTH).fill(null);
    refIndex = -1;
    loopContext = null;
    constructor(engine) {
        this.engine = engine;
    }
    get(target, prop, receiver) {
        return getWritable(target, prop, receiver, this);
    }
    set(target, prop, value, receiver) {
        return set(target, prop, value, receiver, this);
    }
}
async function useWritableStateProxy(engine, state, loopContext = null, callback) {
    const handler = new StateHandler(engine);
    const stateProxy = new Proxy(state, handler);
    return setLoopContext(handler, loopContext, async () => {
        await callback(stateProxy);
    });
}

class ComponentStateBinding {
    parentPaths = new Set();
    childPaths = new Set();
    childPathByParentPath = new Map();
    parentPathByChildPath = new Map();
    bindingByParentPath = new Map();
    bindingByChildPath = new Map();
    addBinding(binding) {
        const parentPath = binding.bindingState.pattern;
        const childPath = binding.bindingNode.subName;
        if (this.childPathByParentPath.has(parentPath)) {
            throw new Error(`Parent path "${parentPath}" already has a child path.`);
        }
        if (this.parentPathByChildPath.has(childPath)) {
            throw new Error(`Child path "${childPath}" already has a parent path.`);
        }
        this.childPathByParentPath.set(parentPath, childPath);
        this.parentPathByChildPath.set(childPath, parentPath);
        this.parentPaths.add(parentPath);
        this.childPaths.add(childPath);
        this.bindingByParentPath.set(parentPath, binding);
        this.bindingByChildPath.set(childPath, binding);
    }
    getChildPath(parentPath) {
        return this.childPathByParentPath.get(parentPath);
    }
    getParentPath(childPath) {
        return this.parentPathByChildPath.get(childPath);
    }
    toParentPathFromChildPath(childPath) {
        const childPathInfo = getStructuredPathInfo(childPath);
        const matchPaths = childPathInfo.cumulativePathSet.intersection(this.childPaths);
        if (matchPaths.size === 0) {
            raiseError(`No parent path found for child path "${childPath}".`);
        }
        const matchPathArray = Array.from(matchPaths);
        const longestMatchPath = matchPathArray[matchPathArray.length - 1];
        const remainPath = childPath.slice(longestMatchPath.length); // include the dot
        const matchParentPath = this.parentPathByChildPath.get(longestMatchPath);
        if (typeof matchParentPath === "undefined") {
            raiseError(`No parent path found for child path "${childPath}".`);
        }
        return matchParentPath + remainPath;
    }
    toChildPathFromParentPath(parentPath) {
        const parentPathInfo = getStructuredPathInfo(parentPath);
        const matchPaths = parentPathInfo.cumulativePathSet.intersection(this.parentPaths);
        if (matchPaths.size === 0) {
            raiseError(`No child path found for parent path "${parentPath}".`);
        }
        const matchPathArray = Array.from(matchPaths);
        const longestMatchPath = matchPathArray[matchPathArray.length - 1];
        const remainPath = parentPath.slice(longestMatchPath.length); // include the dot
        const matchChildPath = this.childPathByParentPath.get(longestMatchPath);
        if (typeof matchChildPath === "undefined") {
            raiseError(`No child path found for parent path "${parentPath}".`);
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
        this.engine.useWritableStateProxy(null, async (state) => {
            for (const [key, value] of Object.entries(object)) {
                const childPathInfo = getStructuredPathInfo(key);
                this.engine.setPropertyValue(childPathInfo, null, value);
            }
        });
    }
    /**
     * listindexに一致するかどうかは事前にスクリーニングしておく
     * @param refs
     */
    notifyRedraw(refs) {
        for (const parentPathRef of refs) {
            try {
                const childPath = this.componentStateBinding.toChildPathFromParentPath(parentPathRef.info.pattern);
                const childPathInfo = getStructuredPathInfo(childPath);
                const childListIndex = parentPathRef.listIndex;
                const value = this.engine.getPropertyValue(childPathInfo, childListIndex);
                this.engine.updater.addUpdatedStatePropertyRefValue(childPathInfo, childListIndex, value);
            }
            catch (e) {
                // 対象でないものは何もしない
            }
        }
    }
    get(target, prop, receiver) {
        if (prop === AssignStateSymbol) {
            return this.assignState.bind(this);
        }
        else if (prop === NotifyRedrawSymbol) {
            return this.notifyRedraw.bind(this);
        }
        else if (typeof prop === "string") {
            return this.engine.getPropertyValue(getStructuredPathInfo(prop), null);
        }
        raiseError(`Property "${String(prop)}" is not supported in ComponentStateInput.`);
    }
    set(target, prop, value, receiver) {
        if (typeof prop === "string") {
            this.engine.setPropertyValue(getStructuredPathInfo(prop), null, value);
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
    constructor(binding) {
        this.binding = binding;
    }
    get(pathInfo, listIndex) {
        const childPath = this.binding.startsWithByChildPath(pathInfo);
        if (childPath === null) {
            raiseError(`No child path found for path "${pathInfo.toString()}".`);
        }
        const binding = this.binding.bindingByChildPath.get(childPath);
        if (typeof binding === "undefined") {
            raiseError(`No binding found for child path "${childPath}".`);
        }
        const parentPathInfo = getStructuredPathInfo(this.binding.toParentPathFromChildPath(pathInfo.pattern));
        return binding.engine.readonlyState[GetByRefSymbol](parentPathInfo, listIndex ?? binding.bindingState.listIndex);
    }
    set(pathInfo, listIndex, value) {
        const childPath = this.binding.startsWithByChildPath(pathInfo);
        if (childPath === null) {
            raiseError(`No child path found for path "${pathInfo.toString()}".`);
        }
        const binding = this.binding.bindingByChildPath.get(childPath);
        if (typeof binding === "undefined") {
            raiseError(`No binding found for child path "${childPath}".`);
        }
        const parentPathInfo = getStructuredPathInfo(this.binding.toParentPathFromChildPath(pathInfo.pattern));
        const engine = binding.engine;
        engine.useWritableStateProxy(null, async (state) => {
            state[SetByRefSymbol](parentPathInfo, listIndex ?? binding.bindingState.listIndex, value);
        });
    }
    startsWith(pathInfo) {
        return this.binding.startsWithByChildPath(pathInfo) !== null;
    }
    getListIndexesSet(pathInfo, listIndex) {
        const childPath = this.binding.startsWithByChildPath(pathInfo);
        if (childPath === null) {
            raiseError(`No child path found for path "${pathInfo.toString()}".`);
        }
        const binding = this.binding.bindingByChildPath.get(childPath);
        if (typeof binding === "undefined") {
            raiseError(`No binding found for child path "${childPath}".`);
        }
        const parentPathInfo = getStructuredPathInfo(this.binding.toParentPathFromChildPath(pathInfo.pattern));
        return binding.engine.getListIndexesSet(parentPathInfo, listIndex);
    }
}
function createComponentStateOutput(binding) {
    return new ComponentStateOutput(binding);
}

/**
 * ComponentEngineクラスは、Structiveコンポーネントの状態管理・依存関係管理・
 * バインディング・ライフサイクル・レンダリングなどの中核的な処理を担うエンジンです。
 *
 * 主な役割:
 * - 状態インスタンスやプロキシの生成・管理
 * - テンプレート・スタイルシート・フィルター・バインディング情報の管理
 * - 依存関係グラフ（dependentTree）の構築と管理
 * - バインディング情報やリスト情報の保存・取得
 * - ライフサイクル（connectedCallback/disconnectedCallback）処理
 * - Shadow DOMやスタイルシートの適用
 * - 状態プロパティの取得・設定
 * - バインディングの追加・存在判定・リスト管理
 *
 * 構造・設計上の特徴:
 * - 状態や依存関係、バインディング情報を効率的に管理するためのキャッシュやマップを多用
 * - テンプレートやリスト構造の多重管理に対応
 * - 非同期初期化やUpdaterによるバッチ的な状態更新設計
 * - 疎結合な設計で、各種ユーティリティやファクトリ関数と連携
 *
 * 典型的なWeb Componentsのライフサイクルやリアクティブな状態管理を、Structive独自の構造で実現しています。
 */
class ComponentEngine {
    type = 'autonomous';
    config;
    template;
    styleSheet;
    stateClass;
    state;
    readonlyState;
    updater;
    inputFilters;
    outputFilters;
    #bindContent = null;
    get bindContent() {
        if (this.#bindContent === null) {
            raiseError("bindContent is not initialized yet");
        }
        return this.#bindContent;
    }
    baseClass = HTMLElement;
    owner;
    trackedGetters;
    getters;
    setters;
    listInfoSet = new Set();
    elementInfoSet = new Set();
    bindingsByListIndex = new WeakMap();
    dependentTree = new Map();
    bindingsByComponent = new WeakMap();
    structiveChildComponents = new Set();
    #waitForInitialize = Promise.withResolvers();
    #stateBinding = createComponentStateBinding();
    stateInput;
    stateOutput;
    #blockPlaceholder = null; // ブロックプレースホルダー
    #blockParentNode = null; // ブロックプレースホルダーの親ノード
    #ignoreDissconnectedCallback = false; // disconnectedCallbackを無視するフラグ
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
        this.readonlyState = createReadonlyStateProxy(this, this.state);
        this.updater = createUpdater(this);
        this.inputFilters = componentClass.inputFilters;
        this.outputFilters = componentClass.outputFilters;
        this.owner = owner;
        this.trackedGetters = componentClass.trackedGetters;
        this.getters = componentClass.getters;
        this.setters = componentClass.setters;
        this.stateInput = createComponentStateInput(this, this.#stateBinding);
        this.stateOutput = createComponentStateOutput(this.#stateBinding);
        // 依存関係の木を作成する
        const checkDependentProp = (info) => {
            const parentInfo = info.parentInfo;
            if (parentInfo === null)
                return;
            this.addDependentProp(info, parentInfo, "structured");
            checkDependentProp(parentInfo);
        };
        for (const path of componentClass.paths) {
            const info = getStructuredPathInfo(path);
            checkDependentProp(info);
        }
        // 配列のプロパティ、配列要素のプロパティを登録する
        for (const listPath of componentClass.listPaths) {
            this.listInfoSet.add(getStructuredPathInfo(listPath));
            this.elementInfoSet.add(getStructuredPathInfo(listPath + ".*"));
        }
        for (const listPath of this.stateClass.$listProperties ?? []) {
            this.listInfoSet.add(getStructuredPathInfo(listPath));
            this.elementInfoSet.add(getStructuredPathInfo(listPath + ".*"));
        }
    }
    setup() {
        const componentClass = this.owner.constructor;
        for (const info of this.listInfoSet) {
            if (info.wildcardCount > 0)
                continue;
            const value = this.readonlyState[GetByRefSymbol](info, null);
            buildListIndexTree(this, info, null, value);
        }
        this.#bindContent = createBindContent(null, componentClass.id, this, null, null); // this.stateArrayPropertyNamePatternsが変更になる可能性がある
    }
    get waitForInitialize() {
        return this.#waitForInitialize;
    }
    async connectedCallback() {
        await this.owner.parentStructiveComponent?.waitForInitialize.promise;
        // コンポーネントの状態を初期化する
        if (this.owner.dataset.state) {
            // data-state属性から状態を取得する
            try {
                const json = JSON.parse(this.owner.dataset.state);
                this.stateInput[AssignStateSymbol](json);
            }
            catch (e) {
                raiseError("Failed to parse state from dataset");
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
        this.readonlyState[SetCacheableSymbol](() => {
            this.bindContent.render();
        }); // キャッシュ可能にする
        await this.useWritableStateProxy(null, async (stateProxy) => {
            await stateProxy[ConnectedCallbackSymbol]();
        });
        // レンダリングが終わってから実行する
        queueMicrotask(() => {
            if (this.config.enableWebComponents) {
                // Shadow DOMにバインドコンテンツをマウントする
                this.bindContent.mount(this.owner.shadowRoot ?? this.owner);
            }
            else {
                // ブロックプレースホルダーの親ノードにバインドコンテンツをマウントする
                const parentNode = this.#blockParentNode ?? raiseError("Block parent node is not set");
                this.bindContent.mountAfter(parentNode, this.#blockPlaceholder);
            }
            this.#waitForInitialize.resolve();
        });
    }
    async disconnectedCallback() {
        if (this.#ignoreDissconnectedCallback)
            return; // disconnectedCallbackを無視するフラグが立っている場合は何もしない
        await this.useWritableStateProxy(null, async (stateProxy) => {
            await stateProxy[DisconnectedCallbackSymbol]();
        });
        // 親コンポーネントから登録を解除する
        this.owner.parentStructiveComponent?.unregisterChildComponent(this.owner);
        if (!this.config.enableWebComponents) {
            this.#blockPlaceholder?.remove();
            this.#blockPlaceholder = null;
            this.#blockParentNode = null;
        }
    }
    #saveInfoByListIndexByResolvedPathInfoId = {};
    #saveInfoByStructuredPathId = {};
    createSaveInfo() {
        return {
            list: null,
            listIndexesSet: null,
            bindings: [],
        };
    }
    getSaveInfoByStatePropertyRef(info, listIndex) {
        if (listIndex === null) {
            let saveInfo = this.#saveInfoByStructuredPathId[info.id];
            if (typeof saveInfo === "undefined") {
                saveInfo = this.createSaveInfo();
                this.#saveInfoByStructuredPathId[info.id] = saveInfo;
            }
            return saveInfo;
        }
        else {
            let saveInfoByListIndex = this.#saveInfoByListIndexByResolvedPathInfoId[info.id];
            if (typeof saveInfoByListIndex === "undefined") {
                saveInfoByListIndex = new WeakMap();
                this.#saveInfoByListIndexByResolvedPathInfoId[info.id] = saveInfoByListIndex;
            }
            let saveInfo = saveInfoByListIndex.get(listIndex);
            if (typeof saveInfo === "undefined") {
                saveInfo = this.createSaveInfo();
                saveInfoByListIndex.set(listIndex, saveInfo);
            }
            return saveInfo;
        }
    }
    saveBinding(info, listIndex, binding) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
        saveInfo.bindings.push(binding);
    }
    saveListIndexesSet(info, listIndex, saveListIndexesSet) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
        saveInfo.listIndexesSet = saveListIndexesSet;
    }
    saveList(info, listIndex, list) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
        saveInfo.list = list;
    }
    getBindings(info, listIndex) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
        return saveInfo.bindings;
    }
    existsBindingsByInfo(info) {
        if (typeof this.#saveInfoByStructuredPathId[info.id] !== "undefined") {
            return true;
        }
        if (typeof this.#saveInfoByListIndexByResolvedPathInfoId[info.id] !== "undefined") {
            return true;
        }
        return false;
    }
    getListIndexesSet(info, listIndex) {
        if (this.stateOutput.startsWith(info)) {
            return this.stateOutput.getListIndexesSet(info, listIndex);
        }
        const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
        return saveInfo.listIndexesSet;
    }
    getList(info, listIndex) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
        return saveInfo.list;
    }
    addDependentProp(info, refInfo, type) {
        let dependents = this.dependentTree.get(refInfo);
        if (typeof dependents === "undefined") {
            dependents = new Set();
            this.dependentTree.set(refInfo, dependents);
        }
        const edge = createDependencyEdge(info, type);
        dependents.add(edge);
    }
    getPropertyValue(info, listIndex) {
        // プロパティの値を取得する
        return this.readonlyState[GetByRefSymbol](info, listIndex);
    }
    setPropertyValue(info, listIndex, value) {
        // プロパティの値を設定する
        this.updater.addProcess(() => {
            this.useWritableStateProxy(null, async (stateProxy) => {
                stateProxy[SetByRefSymbol](info, listIndex, value);
            });
        });
    }
    // 書き込み可能な状態プロキシを作成する
    async useWritableStateProxy(loopContext, callback) {
        return useWritableStateProxy(this, this.state, loopContext, callback);
    }
    // Structive子コンポーネントを登録する
    registerChildComponent(component) {
        this.structiveChildComponents.add(component);
    }
    unregisterChildComponent(component) {
        this.structiveChildComponents.delete(component);
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
                const info = stack.pop() ?? raiseError('replaceMustacheToTemplateOrEmbed: endif without if');
                if (info.type === 'if') {
                    endTags.push('</template>');
                    break;
                }
                else if (info.type === 'elseif') {
                    endTags.push('</template>');
                }
                else {
                    raiseError('replaceMustacheToTemplateOrEmbed: endif without if');
                }
            } while (true);
            return endTags.join('');
        }
        else if (type === 'endfor') {
            const info = stack.pop() ?? raiseError('replaceMustacheToTemplateOrEmbed: endif without if');
            if (info.type === 'for') {
                return '</template>';
            }
            else {
                raiseError('replaceMustacheToTemplateOrEmbed: endfor without for');
            }
        }
        else if (type === 'elseif') {
            const lastInfo = stack.at(-1) ?? raiseError('replaceMustacheToTemplateOrEmbed: elseif without if');
            if (lastInfo.type === 'if' || lastInfo.type === 'elseif') {
                stack.push(currentInfo);
                return `</template><template data-bind="if:${lastInfo.remain}|not"><template data-bind="if:${remain}">`;
            }
            else {
                raiseError('replaceMustacheToTemplateOrEmbed: elseif without if');
            }
        }
        else if (type === 'else') {
            const lastInfo = stack.at(-1) ?? raiseError('replaceMustacheToTemplateOrEmbed: else without if');
            if (lastInfo.type === 'if') {
                return `</template><template data-bind="if:${lastInfo.remain}|not">`;
            }
            else {
                raiseError('replaceMustacheToTemplateOrEmbed: else without if');
            }
        }
        else {
            raiseError('replaceMustacheToTemplateOrEmbed: unknown type');
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
        for (let childNode of Array.from(template.childNodes)) {
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
            throw new Error(`Invalid path: ${matchPath}`);
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
                    throw new Error(`Invalid segment name: ${segment}`);
                }
                segments.push("." + segment);
            }
        }
        const path = segments.join('');
        return {
            get: new Function('', `return this["${matchPath}"]${path};`),
            set: new Function('value', `this["${matchPath}"]${path} = value;`),
        };
    }
    else {
        const segments = [];
        let count = 0;
        for (const segment of info.pathSegments) {
            if (segment === '*') {
                segments.push("[this.$" + (count + 1) + "]");
                count++;
            }
            else {
                if (!checkSegmentRegexp.test(segment)) {
                    throw new Error(`Invalid segment name: ${segment}`);
                }
                segments.push((segments.length > 0 ? "." : "") + segment);
            }
        }
        const path = segments.join('');
        return {
            get: new Function('', `return this.${path};`),
            set: new Function('value', `this.${path} = value;`),
        };
    }
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
        static get listPaths() {
            return getListPathsSetById(this.id);
        }
        static get paths() {
            return getPathsSetById(this.id);
        }
        static #getters = new Set();
        static get getters() {
            return this.#getters;
        }
        static #setters = new Set();
        static get setters() {
            return this.#setters;
        }
        static #trackedGetters = null;
        static get trackedGetters() {
            if (this.#trackedGetters === null) {
                this.#trackedGetters = new Set();
                let currentProto = this.stateClass.prototype;
                while (currentProto && currentProto !== Object.prototype) {
                    const trackedGetters = Object.getOwnPropertyDescriptors(currentProto);
                    if (trackedGetters) {
                        for (const [key, desc] of Object.entries(trackedGetters)) {
                            const hasGetter = desc.get !== undefined;
                            const hasSetter = desc.set !== undefined;
                            if (hasGetter) {
                                this.#getters.add(key);
                                if (hasSetter) {
                                    this.#setters?.add(key);
                                }
                                else {
                                    // Getterだけ設定しているプロパティが対象
                                    this.#trackedGetters.add(key);
                                }
                            }
                        }
                    }
                    currentProto = Object.getPrototypeOf(currentProto);
                }
                if (config$2.optimizeAccessor) {
                    for (const path of this.paths) {
                        const info = getStructuredPathInfo(path);
                        if (info.pathSegments.length === 1) {
                            continue;
                        }
                        if (this.#getters.has(path)) {
                            continue;
                        }
                        const funcs = createAccessorFunctions(info, this.#getters);
                        Object.defineProperty(this.stateClass.prototype, path, {
                            get: funcs.get,
                            set: funcs.set,
                            enumerable: true,
                            configurable: true,
                        });
                    }
                }
            }
            return this.#trackedGetters;
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
async function createSingleFileComponent(text) {
    const template = document.createElement("template");
    template.innerHTML = escapeEmbed(text);
    const html = template.content.querySelector("template");
    html?.remove();
    const script = template.content.querySelector("script[type=module]");
    const b64 = btoa(String.fromCodePoint(...new TextEncoder().encode(script.text)));
    const scriptModule = script ? await import("data:application/javascript;base64," + b64) : {};
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
    const response = await fetch(import.meta.resolve(path));
    const text = await response.text();
    return createSingleFileComponent(text);
}

function registerComponentClass(tagName, componentClass) {
    componentClass.define(tagName);
}

/**
 * loadFromImportMap.ts
 *
 * importmapの情報をもとに、Structiveのルートやコンポーネントを動的にロード・登録するユーティリティです。
 *
 * 主な役割:
 * - importmap.imports内のエイリアスを走査し、@routes/や@components/のプレフィックスで判定
 * - @routes/の場合はルーティング情報をentryRouteで登録
 * - @components/の場合はloadSingleFileComponentでSFCをロードし、createComponentClassでクラス化してregisterComponentClassで登録
 *
 * 設計ポイント:
 * - importmapのエイリアスを利用して、ルーティングやコンポーネントの自動登録を実現
 * - パスやタグ名の正規化、パラメータ除去なども自動で処理
 * - 非同期でSFCをロードし、動的なWeb Components登録に対応
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
        console.warn(`loadLazyLoadComponent: alias not found for tagName: ${tagName}`);
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
                raiseError(`Failed to load layout from ${config$2.layoutPath}`);
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
