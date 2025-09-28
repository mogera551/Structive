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

let id$1 = 0;
function generateId() {
    return ++id$1;
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
        raiseError(`BindingNode: assignValue not implemented`);
    }
    updateElements(listIndexes, values) {
        raiseError(`BindingNode: updateElements not implemented`);
    }
    notifyRedraw(refs) {
        // サブクラスで親子関係を考慮してバインディングの更新を通知する実装が可能
    }
    applyChange(renderer) {
        if (renderer.updatedBindings.has(this.binding))
            return;
        const filteredValue = this.binding.bindingState.getFilteredValue(renderer.readonlyState);
        this.assignValue(filteredValue);
        renderer.updatedBindings.add(this.binding);
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
const _cache$3 = {};
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
    const info = _cache$3[structuredPath];
    if (typeof info !== "undefined") {
        return info;
    }
    if (RESERVED_WORD_SET.has(structuredPath)) {
        raiseError(`getStructuredPathInfo: pattern is reserved word: ${structuredPath}`);
    }
    return (_cache$3[structuredPath] = new StructuredPathInfo(structuredPath));
}

/**
 * プロパティ名に"constructor"や"toString"などの予約語やオブジェクトのプロパティ名を
 * 上書きするような名前も指定できるように、Mapを検討したが、そもそもそのような名前を
 * 指定することはないと考え、Mapを使わないことにした。
 */
const _cache$2 = new Map();
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
    return _cache$2.get(name) ?? (_cache$2.set(name, nameInfo = new ResolvedPathInfo(name)), nameInfo);
}

function createRefKey(info, listIndex) {
    return (listIndex == null) ? info.sid : (info.sid + "#" + listIndex.sid);
}
class StatePropertyRef {
    info;
    #listIndexRef;
    get listIndex() {
        if (this.#listIndexRef === null)
            return null;
        return this.#listIndexRef.deref() ?? raiseError("listIndex is null");
    }
    key;
    constructor(info, listIndex) {
        this.info = info;
        this.#listIndexRef = listIndex !== null ? new WeakRef(listIndex) : null;
        this.key = createRefKey(info, listIndex);
    }
}
const refByInfoByListIndex = new WeakMap();
const refByInfoByNull = new Map();
function getStatePropertyRef(info, listIndex) {
    let ref = null;
    if (listIndex !== null) {
        let refByInfo = refByInfoByListIndex.get(listIndex);
        if (typeof refByInfo === "undefined") {
            refByInfo = new Map();
            refByInfoByListIndex.set(listIndex, refByInfo);
        }
        ref = refByInfo.get(info);
        if (typeof ref === "undefined") {
            ref = new StatePropertyRef(info, listIndex);
            refByInfo.set(info, ref);
        }
        return ref;
    }
    else {
        ref = refByInfoByNull.get(info);
        if (typeof ref === "undefined") {
            ref = new StatePropertyRef(info, null);
            refByInfoByNull.set(info, ref);
        }
        return ref;
    }
}

function getContextListIndex(handler, structuredPath) {
    const ref = handler.refStack[handler.refIndex];
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
                raiseError(`lastWildcardPath is null`);
            return getContextListIndex(handler, lastWildcardPath) ??
                raiseError(`ListIndex not found: ${resolvedPath.info.pattern}`);
        case "all":
            let parentListIndex = null;
            for (let i = 0; i < resolvedPath.info.wildcardCount; i++) {
                const wildcardParentPattern = resolvedPath.info.wildcardParentInfos[i] ??
                    raiseError(`wildcardParentPattern is null`);
                const wildcardRef = getStatePropertyRef(wildcardParentPattern, parentListIndex);
                const listIndexes = handler.engine.getListIndexes(wildcardRef) ??
                    raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
                const wildcardIndex = resolvedPath.wildcardIndexes[i] ??
                    raiseError(`wildcardIndex is null`);
                parentListIndex = listIndexes[wildcardIndex] ??
                    raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
            }
            return parentListIndex;
        case "partial":
            raiseError(`Partial wildcard type is not supported yet: ${resolvedPath.info.pattern}`);
    }
}

const symbolName$1 = "state";
const GetByRefSymbol = Symbol.for(`${symbolName$1}.GetByRef`);
const SetByRefSymbol = Symbol.for(`${symbolName$1}.SetByRef`);
const SetCacheableSymbol = Symbol.for(`${symbolName$1}.SetCacheable`);
const ConnectedCallbackSymbol = Symbol.for(`${symbolName$1}.ConnectedCallback`);
const DisconnectedCallbackSymbol = Symbol.for(`${symbolName$1}.DisconnectedCallback`);

function checkDependency(handler, ref) {
    // 動的依存関係の登録
    if (handler.refIndex >= 0) {
        const lastInfo = handler.refStack[handler.refIndex]?.info ?? null;
        if (lastInfo !== null) {
            if (handler.engine.pathManager.getters.has(lastInfo.pattern) &&
                !handler.engine.pathManager.setters.has(lastInfo.pattern) &&
                lastInfo.pattern !== ref.info.pattern) {
                handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, ref.info.pattern);
            }
        }
    }
}

function setStatePropertyRef(handler, ref, callback) {
    handler.refIndex++;
    if (handler.refIndex >= handler.refStack.length) {
        handler.refStack.push(null);
    }
    handler.refStack[handler.refIndex] = ref;
    try {
        return callback();
    }
    finally {
        handler.refStack[handler.refIndex] = null;
        handler.refIndex--;
    }
}

/**
 * getByRef.ts
 *
 * StateClassの内部APIとして、構造化パス情報（IStructuredPathInfo）とリストインデックス（IListIndex）を指定して
 * 状態オブジェクト（target）から値を取得するための関数（getByRef）の実装です。
 *
 * 主な役割:
 * - 指定されたパス・インデックスに対応するState値を取得（多重ループやワイルドカードにも対応）
 * - 依存関係の自動登録（trackedGetters対応時はsetTrackingでラップ）
 * - キャッシュ機構（handler.cacheable時はrefKeyで値をキャッシュ）
 * - getter経由で値取得時はSetStatePropertyRefSymbolでスコープを一時設定
 * - 存在しない場合は親infoやlistIndexを辿って再帰的に値を取得
 *
 * 設計ポイント:
 * - handler.engine.trackedGettersに含まれる場合はsetTrackingで依存追跡を有効化
 * - キャッシュ有効時はrefKeyで値をキャッシュし、取得・再利用を最適化
 * - ワイルドカードや多重ループにも柔軟に対応し、再帰的な値取得を実現
 * - finallyでキャッシュへの格納を保証
 */
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
function getByRefWritable(target, ref, receiver, handler) {
    checkDependency(handler, ref);
    // 親子関係のあるgetterが存在する場合は、外部依存から取得
    // ToDo: stateにgetterが存在する（パスの先頭が一致する）場合はgetter経由で取得
    if (handler.engine.stateOutput.startsWith(ref.info) && handler.engine.pathManager.getters.intersection(ref.info.cumulativePathSet).size === 0) {
        return handler.engine.stateOutput.get(ref.info, ref.listIndex);
    }
    // パターンがtargetに存在する場合はgetter経由で取得
    if (ref.info.pattern in target) {
        return setStatePropertyRef(handler, ref, () => {
            return Reflect.get(target, ref.info.pattern, receiver);
        });
    }
    else {
        // 存在しない場合は親infoを辿って再帰的に取得
        const parentInfo = ref.info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
        const parentListIndex = parentInfo.wildcardCount < ref.info.wildcardCount ? (ref.listIndex?.parentListIndex ?? null) : ref.listIndex;
        const parentRef = getStatePropertyRef(parentInfo, parentListIndex);
        const parentValue = getByRefWritable(target, parentRef, receiver, handler);
        const lastSegment = ref.info.lastSegment;
        if (lastSegment === "*") {
            // ワイルドカードの場合はlistIndexのindexでアクセス
            const index = ref.listIndex?.index ?? raiseError(`propRef.listIndex?.index is undefined`);
            return Reflect.get(parentValue, index);
        }
        else {
            // 通常のプロパティアクセス
            return Reflect.get(parentValue, lastSegment);
        }
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
    try {
        // 親子関係のあるgetterが存在する場合は、外部依存を通じて値を設定
        // ToDo: stateにgetterが存在する（パスの先頭が一致する）場合はgetter経由で取得
        if (handler.engine.stateOutput.startsWith(ref.info) && handler.engine.pathManager.setters.intersection(ref.info.cumulativePathSet).size === 0) {
            return handler.engine.stateOutput.set(ref.info, ref.listIndex, value);
        }
        if (ref.info.pattern in target) {
            return setStatePropertyRef(handler, ref, () => {
                return Reflect.set(target, ref.info.pattern, value, receiver);
            });
        }
        else {
            const parentInfo = ref.info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
            const parentListIndex = parentInfo.wildcardCount < ref.info.wildcardCount ? (ref.listIndex?.parentListIndex ?? null) : ref.listIndex;
            const parentRef = getStatePropertyRef(parentInfo, parentListIndex);
            const parentValue = getByRefWritable(target, parentRef, receiver, handler);
            const lastSegment = ref.info.lastSegment;
            if (lastSegment === "*") {
                const index = ref.listIndex?.index ?? raiseError(`propRef.listIndex?.index is undefined`);
                return Reflect.set(parentValue, index, value);
            }
            else {
                return Reflect.set(parentValue, lastSegment, value);
            }
        }
    }
    finally {
        handler.updater.enqueueRef(ref);
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
function resolveWritable(target, prop, receiver, handler) {
    return (path, indexes, value) => {
        const info = getStructuredPathInfo(path);
        const lastInfo = handler.refStack[handler.refIndex]?.info ?? null;
        if (lastInfo !== null && lastInfo.pattern !== info.pattern) {
            // gettersに含まれる場合は依存関係を登録
            if (handler.engine.pathManager.getters.has(lastInfo.pattern) &&
                !handler.engine.pathManager.setters.has(lastInfo.pattern)) {
                handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, info.pattern);
            }
        }
        let listIndex = null;
        for (let i = 0; i < info.wildcardParentInfos.length; i++) {
            const wildcardParentPattern = info.wildcardParentInfos[i] ?? raiseError(`wildcardParentPath is null`);
            const wildcardRef = getStatePropertyRef(wildcardParentPattern, listIndex);
            const listIndexes = handler.engine.getListIndexes(wildcardRef) ?? [];
            const index = indexes[i] ?? raiseError(`index is null`);
            listIndex = listIndexes[index] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
        }
        const ref = getStatePropertyRef(info, listIndex);
        if (typeof value === "undefined") {
            return getByRefWritable(target, ref, receiver, handler);
        }
        else {
            return setByRef(target, ref, value, receiver, handler);
        }
    };
}

/**
 * getAll.ts
 *
 * StateClassのAPIとして、ワイルドカードを含むStateプロパティパスに対応した
 * 全要素取得関数（getAll）の実装です。
 *
 * 主な役割:
 * - 指定パス（path）に一致する全てのState要素を配列で取得
 * - 多重ループやワイルドカード（*）を含むパスにも対応
 * - indexes未指定時は現在のループコンテキストから自動でインデックスを解決
 *
 * 設計ポイント:
 * - getStructuredPathInfoでパス情報を解析し、依存関係も自動で登録
 * - walkWildcardPatternでワイルドカード階層を再帰的に探索し、全インデックス組み合わせを列挙
 * - resolveで各インデックス組み合わせに対応する値を取得し、配列で返却
 * - getContextListIndexで現在のループインデックスを取得
 * - handler.engine.getListIndexesSetで各階層のリストインデックス集合を取得
 */
function getAllWritable(target, prop, receiver, handler) {
    const resolve = resolveWritable(target, prop, receiver, handler);
    return (path, indexes) => {
        const info = getStructuredPathInfo(path);
        const lastInfo = handler.refStack[handler.refIndex]?.info ?? null;
        if (lastInfo !== null && lastInfo.pattern !== info.pattern) {
            // gettersに含まれる場合は依存関係を登録
            if (handler.engine.pathManager.getters.has(lastInfo.pattern) &&
                !handler.engine.pathManager.setters.has(lastInfo.pattern)) {
                handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, info.pattern);
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
            const wildcardRef = getStatePropertyRef(wildcardParentPattern, listIndex);
            const listIndexes = handler.engine.getListIndexes(wildcardRef) ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
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

function trackDependency(target, prop, receiver, handler) {
    return (path) => {
        const lastInfo = handler.refStack[handler.refIndex]?.info ?? raiseError("Internal error: refStack is null.");
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
    const index = indexByIndexName[prop];
    if (typeof index !== "undefined") {
        const listIndex = handler.refStack[handler.refIndex]?.listIndex;
        return listIndex?.indexes[index] ?? raiseError(`ListIndex not found: ${prop.toString()}`);
    }
    if (typeof prop === "string") {
        if (prop[0] === "$") {
            switch (prop) {
                case "$resolve":
                    return resolveWritable(target, prop, receiver, handler);
                case "$getAll":
                    return getAllWritable(target, prop, receiver, handler);
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
        return getByRefWritable(target, ref, receiver, handler);
    }
    else if (typeof prop === "symbol") {
        switch (prop) {
            case GetByRefSymbol:
                return (ref) => getByRefWritable(target, ref, receiver, handler);
            case SetByRefSymbol:
                return (ref, value) => setByRef(target, ref, value, receiver, handler);
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
        const ref = getStatePropertyRef(resolvedInfo.info, listIndex);
        return setByRef(target, ref, value, receiver, handler);
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
async function asyncSetStatePropertyRef(handler, ref, callback) {
    handler.refIndex++;
    if (handler.refIndex >= handler.refStack.length) {
        handler.refStack.push(null);
    }
    handler.refStack[handler.refIndex] = ref;
    try {
        await callback();
    }
    finally {
        handler.refStack[handler.refIndex] = null;
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
            await asyncSetStatePropertyRef(handler, loopContext.ref, callback);
        }
        else {
            await callback();
        }
    }
    finally {
        handler.loopContext = null;
    }
}

const STACK_DEPTH$1 = 32;
let StateHandler$1 = class StateHandler {
    engine;
    lastTrackingStack = null;
    trackingStack = Array(STACK_DEPTH$1).fill(null);
    trackingIndex = -1;
    refStack = Array(STACK_DEPTH$1).fill(null);
    refIndex = -1;
    loopContext = null;
    updater;
    constructor(engine, updater) {
        this.engine = engine;
        this.updater = updater;
    }
    get(target, prop, receiver) {
        return getWritable(target, prop, receiver, this);
    }
    set(target, prop, value, receiver) {
        return set(target, prop, value, receiver, this);
    }
};
async function useWritableStateProxy(engine, updater, state, loopContext, callback) {
    const handler = new StateHandler$1(engine, updater);
    const stateProxy = new Proxy(state, handler);
    return setLoopContext(handler, loopContext, async () => {
        await callback(stateProxy);
    });
}

let version = 0;
let id = 0;
class ListIndex {
    #parentListIndex = null;
    #pos = 0;
    #index = 0;
    #version;
    #id = ++id;
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

function calcListDiff(parentListIndex, oldListValue, newListValue, oldIndexes) {
    const _newListValue = newListValue || [];
    const _oldListValue = oldListValue || [];
    const _oldIndexes = oldIndexes || [];
    if (_newListValue === _oldListValue || (_newListValue.length === 0 && _oldListValue.length === 0)) {
        return {
            oldListValue,
            newListValue,
            oldIndexes: _oldIndexes,
            newIndexes: _oldIndexes,
        };
    }
    if (_newListValue.length === 0) {
        return {
            oldListValue,
            newListValue,
            oldIndexes: _oldIndexes,
            newIndexes: [],
            removes: new Set(_oldIndexes),
        };
    }
    else if (_oldListValue.length === 0) {
        const newIndexes = [];
        for (let i = 0; i < _newListValue.length; i++) {
            newIndexes.push(createListIndex(parentListIndex, i));
        }
        return {
            oldListValue,
            newListValue,
            oldIndexes: _oldIndexes,
            newIndexes,
            adds: new Set(newIndexes),
        };
    }
    else {
        const listIndexByListValue = new Map();
        for (let i = 0; i < _oldListValue.length; i++) {
            listIndexByListValue.set(_oldListValue[i], _oldIndexes[i]);
        }
        const adds = new Set();
        const removes = new Set(oldIndexes);
        const overwrites = new Set();
        const changeIndexes = new Set();
        const newIndexes = [];
        for (let i = 0; i < _newListValue.length; i++) {
            const newValue = _newListValue[i];
            let newListIndex = listIndexByListValue.get(newValue);
            if (typeof newListIndex === "undefined") {
                newListIndex = createListIndex(parentListIndex, i);
                adds.add(newListIndex);
            }
            else {
                if (newListIndex.index !== i) {
                    newListIndex.index = i;
                    changeIndexes.add(newListIndex);
                }
                removes.delete(newListIndex);
            }
            newIndexes.push(newListIndex);
        }
        return {
            oldListValue,
            newListValue,
            oldIndexes: _oldIndexes,
            newIndexes,
            adds,
            removes,
            overwrites,
            changeIndexes,
        };
    }
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

/**
 * getByRef.ts
 *
 * StateClassの内部APIとして、構造化パス情報（IStructuredPathInfo）とリストインデックス（IListIndex）を指定して
 * 状態オブジェクト（target）から値を取得するための関数（getByRef）の実装です。
 *
 * 主な役割:
 * - 指定されたパス・インデックスに対応するState値を取得（多重ループやワイルドカードにも対応）
 * - 依存関係の自動登録（trackedGetters対応時はsetTrackingでラップ）
 * - キャッシュ機構（handler.cacheable時はrefKeyで値をキャッシュ）
 * - getter経由で値取得時はSetStatePropertyRefSymbolでスコープを一時設定
 * - 存在しない場合は親infoやlistIndexを辿って再帰的に値を取得
 *
 * 設計ポイント:
 * - handler.engine.trackedGettersに含まれる場合はsetTrackingで依存追跡を有効化
 * - キャッシュ有効時はrefKeyで値をキャッシュし、取得・再利用を最適化
 * - ワイルドカードや多重ループにも柔軟に対応し、再帰的な値取得を実現
 * - finallyでキャッシュへの格納を保証
 */
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
function getByRefReadonly(target, ref, receiver, handler) {
    checkDependency(handler, ref);
    // キャッシュが有効な場合はrefKeyで値をキャッシュ
    if (handler.cacheable) {
        const value = handler.cache.get(ref.key);
        if (typeof value !== "undefined") {
            return value;
        }
        if (handler.cache.has(ref.key)) {
            return undefined;
        }
    }
    let value;
    try {
        // 親子関係のあるgetterが存在する場合は、外部依存から取得
        // ToDo: stateにgetterが存在する（パスの先頭が一致する）場合はgetter経由で取得
        if (handler.engine.stateOutput.startsWith(ref.info) && handler.engine.pathManager.getters.intersection(ref.info.cumulativePathSet).size === 0) {
            return value = handler.engine.stateOutput.get(ref.info, ref.listIndex);
        }
        // パターンがtargetに存在する場合はgetter経由で取得
        if (ref.info.pattern in target) {
            return (value = setStatePropertyRef(handler, ref, () => {
                return Reflect.get(target, ref.info.pattern, receiver);
            }));
        }
        else {
            // 存在しない場合は親infoを辿って再帰的に取得
            const parentInfo = ref.info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
            const parentListIndex = parentInfo.wildcardCount < ref.info.wildcardCount ? (ref.listIndex?.parentListIndex ?? null) : ref.listIndex;
            const parentRef = getStatePropertyRef(parentInfo, parentListIndex);
            const parentValue = getByRefReadonly(target, parentRef, receiver, handler);
            const lastSegment = ref.info.lastSegment;
            if (lastSegment === "*") {
                // ワイルドカードの場合はlistIndexのindexでアクセス
                const index = ref.listIndex?.index ?? raiseError(`propRef.listIndex?.index is undefined`);
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
        if (handler.cacheable) {
            handler.cache.set(ref.key, value);
        }
        if (handler.renderer != null) {
            if (handler.engine.pathManager.lists.has(ref.info.pattern)) {
                handler.renderer.calcListDiff(ref, value, true);
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
function resolveReadonly(target, prop, receiver, handler) {
    return (path, indexes, value) => {
        const info = getStructuredPathInfo(path);
        const lastInfo = handler.refStack[handler.refIndex]?.info ?? null;
        if (lastInfo !== null && lastInfo.pattern !== info.pattern) {
            // gettersに含まれる場合は依存関係を登録
            if (handler.engine.pathManager.getters.has(lastInfo.pattern) &&
                !handler.engine.pathManager.setters.has(lastInfo.pattern)) {
                handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, info.pattern);
            }
        }
        let listIndex = null;
        for (let i = 0; i < info.wildcardParentInfos.length; i++) {
            const wildcardParentPattern = info.wildcardParentInfos[i] ?? raiseError(`wildcardParentPath is null`);
            const wildcardRef = getStatePropertyRef(wildcardParentPattern, listIndex);
            const listIndexes = handler.engine.getListIndexes(wildcardRef) ?? [];
            const index = indexes[i] ?? raiseError(`index is null`);
            listIndex = listIndexes[index] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
        }
        const ref = getStatePropertyRef(info, listIndex);
        if (typeof value === "undefined") {
            return getByRefReadonly(target, ref, receiver, handler);
        }
        else {
            raiseError(`Cannot set value on a readonly proxy: ${path}`);
        }
    };
}

function setCacheable(handler, callback) {
    handler.cacheable = true;
    handler.cache = new Map();
    try {
        callback();
    }
    finally {
        handler.cacheable = false;
    }
}

/**
 * getAll.ts
 *
 * StateClassのAPIとして、ワイルドカードを含むStateプロパティパスに対応した
 * 全要素取得関数（getAll）の実装です。
 *
 * 主な役割:
 * - 指定パス（path）に一致する全てのState要素を配列で取得
 * - 多重ループやワイルドカード（*）を含むパスにも対応
 * - indexes未指定時は現在のループコンテキストから自動でインデックスを解決
 *
 * 設計ポイント:
 * - getStructuredPathInfoでパス情報を解析し、依存関係も自動で登録
 * - walkWildcardPatternでワイルドカード階層を再帰的に探索し、全インデックス組み合わせを列挙
 * - resolveで各インデックス組み合わせに対応する値を取得し、配列で返却
 * - getContextListIndexで現在のループインデックスを取得
 * - handler.engine.getListIndexesSetで各階層のリストインデックス集合を取得
 */
function getAllReadonly(target, prop, receiver, handler) {
    const resolve = resolveReadonly(target, prop, receiver, handler);
    return (path, indexes) => {
        const info = getStructuredPathInfo(path);
        const lastInfo = handler.refStack[handler.refIndex]?.info ?? null;
        if (lastInfo !== null && lastInfo.pattern !== info.pattern) {
            // gettersに含まれる場合は依存関係を登録
            if (handler.engine.pathManager.getters.has(lastInfo.pattern) &&
                !handler.engine.pathManager.setters.has(lastInfo.pattern)) {
                handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, info.pattern);
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
            const wildcardRef = getStatePropertyRef(wildcardParentPattern, listIndex);
            let listIndexes = handler.engine.getListIndexes(wildcardRef);
            if (listIndexes === null) {
                receiver[GetByRefSymbol](wildcardRef); // 依存関係登録のために一度取得
                listIndexes = handler.engine.getListIndexes(wildcardRef);
                if (listIndexes === null) {
                    raiseError(`ListIndex is not found: ${wildcardParentPattern.pattern}`);
                }
            }
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
    const index = indexByIndexName[prop];
    if (typeof index !== "undefined") {
        const listIndex = handler.refStack[handler.refIndex]?.listIndex;
        return listIndex?.indexes[index] ?? raiseError(`ListIndex not found: ${prop.toString()}`);
    }
    if (typeof prop === "string") {
        if (prop[0] === "$") {
            switch (prop) {
                case "$resolve":
                    return resolveReadonly(target, prop, receiver, handler);
                case "$getAll":
                    return getAllReadonly(target, prop, receiver, handler);
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
        return getByRefReadonly(target, ref, receiver, handler);
    }
    else if (typeof prop === "symbol") {
        switch (prop) {
            case GetByRefSymbol:
                return (ref) => getByRefReadonly(target, ref, receiver, handler);
            case SetCacheableSymbol:
                return (callback) => setCacheable(handler, callback);
            default:
                return Reflect.get(target, prop, receiver);
        }
    }
}

const STACK_DEPTH = 32;
class StateHandler {
    engine;
    cacheable = false;
    cache = new Map();
    lastTrackingStack = null;
    trackingStack = Array(STACK_DEPTH).fill(null);
    trackingIndex = -1;
    refStack = Array(STACK_DEPTH).fill(null);
    refIndex = -1;
    loopContext = null;
    renderer = null;
    constructor(engine, renderer) {
        this.engine = engine;
        this.renderer = renderer;
    }
    get(target, prop, receiver) {
        return getReadonly(target, prop, receiver, this);
    }
    set(target, prop, value, receiver) {
        raiseError(`Cannot set property ${String(prop)} of readonly state.`);
    }
}
function createReadonlyStateProxy(engine, state, renderer = null) {
    return new Proxy(state, new StateHandler(engine, renderer));
}

class Renderer {
    #updatedBindings = new Set();
    #trackedRefs = new Set();
    #engine;
    #readonlyState = null;
    #listDiffByRef = new Map();
    constructor(engine) {
        this.#engine = engine;
    }
    get updatedBindings() {
        return this.#updatedBindings;
    }
    get trackedRefs() {
        return this.#trackedRefs;
    }
    get readonlyState() {
        if (!this.#readonlyState) {
            raiseError("ReadonlyState is not initialized.");
        }
        return this.#readonlyState;
    }
    get engine() {
        if (!this.#engine) {
            raiseError("Engine is not initialized.");
        }
        return this.#engine;
    }
    render(items) {
        this.#listDiffByRef.clear();
        this.#trackedRefs.clear();
        this.#updatedBindings.clear();
        // 実際のレンダリングロジックを実装
        const readonlyState = this.#readonlyState = createReadonlyStateProxy(this.#engine, this.#engine.state, this);
        try {
            readonlyState[SetCacheableSymbol](() => {
                for (let i = 0; i < items.length; i++) {
                    const ref = items[i];
                    const node = findPathNodeByPath(this.#engine.pathManager.rootNode, ref.info.pattern);
                    if (node === null) {
                        raiseError(`PathNode not found: ${ref.info.pattern}`);
                    }
                    this.renderItem(ref, node);
                }
            });
        }
        finally {
            this.#readonlyState = null;
        }
    }
    calcListDiff(ref, _newListValue = undefined, isNewValue = false) {
        let listDiff = this.#listDiffByRef.get(ref);
        if (typeof listDiff === "undefined") {
            const [oldListValue, oldListIndexes] = this.engine.getListAndListIndexes(ref);
            let newListValue = isNewValue ? _newListValue : this.readonlyState[GetByRefSymbol](ref);
            listDiff = calcListDiff(ref.listIndex, oldListValue, newListValue, oldListIndexes);
            this.#listDiffByRef.set(ref, listDiff);
            if (oldListValue !== newListValue) {
                this.engine.saveListAndListIndexes(ref, newListValue, listDiff.newIndexes);
            }
        }
        return listDiff;
    }
    renderItem(ref, node) {
        if (this.trackedRefs.has(ref)) {
            return; // すでに処理済みのRef情報はスキップ
        }
        this.trackedRefs.add(ref);
        // バインディングに変更を適用する
        // 変更があったバインディングはupdatedBindingsに追加する
        const bindings = this.#engine.getBindings(ref);
        for (let i = 0; i < bindings.length; i++) {
            const binding = bindings[i];
            if (this.updatedBindings.has(binding)) {
                continue; // すでに更新済みのバインディングはスキップ
            }
            binding.applyChange(this);
        }
        // 静的な依存関係を辿る
        for (const [name, childNode] of node.childNodeByName) {
            const childInfo = getStructuredPathInfo(childNode.currentPath);
            if (name === WILDCARD) {
                const diff = this.calcListDiff(ref);
                for (const listIndex of diff.adds ?? []) {
                    const childRef = getStatePropertyRef(childInfo, listIndex);
                    this.renderItem(childRef, childNode);
                }
            }
            else {
                const childRef = getStatePropertyRef(childInfo, ref.listIndex);
                this.renderItem(childRef, childNode);
            }
        }
        // 動的な依存関係を辿る
        const deps = this.#engine.pathManager.dynamicDependencies.get(ref.info.pattern);
        if (deps) {
            for (const depPath of deps) {
                const depInfo = getStructuredPathInfo(depPath);
                if (depInfo.wildcardCount > 0) {
                    const infos = depInfo.wildcardParentInfos;
                    const walk = (info, listIndex, index, nextInfo) => {
                        const depRef = getStatePropertyRef(info, listIndex);
                        const listIndexes = this.#engine.getListIndexes(depRef) || [];
                        if ((index + 1) < infos.length) {
                            for (let i = 0; i < listIndexes.length; i++) {
                                const subListIndex = listIndexes[i];
                                walk(nextInfo, subListIndex, index + 1, infos[index + 1]);
                            }
                        }
                        else {
                            for (let i = 0; i < listIndexes.length; i++) {
                                const subListIndex = listIndexes[i];
                                const depRef = getStatePropertyRef(depInfo, subListIndex);
                                const depNode = findPathNodeByPath(this.#engine.pathManager.rootNode, depInfo.pattern);
                                if (depNode === null) {
                                    raiseError(`PathNode not found: ${depInfo.pattern}`);
                                }
                                this.renderItem(depRef, depNode);
                            }
                        }
                    };
                    walk(depInfo.wildcardParentInfos[0], null, 0, depInfo.wildcardParentInfos[1] || null);
                }
                else {
                    const depRef = getStatePropertyRef(depInfo, null);
                    const depNode = findPathNodeByPath(this.#engine.pathManager.rootNode, depInfo.pattern);
                    if (depNode === null) {
                        raiseError(`PathNode not found: ${depInfo.pattern}`);
                    }
                    this.renderItem(depRef, depNode);
                }
            }
        }
    }
}
function render(refs, engine) {
    const renderer = new Renderer(engine);
    renderer.render(refs);
}

/**
 * Updater2クラスは、状態管理と更新の中心的な役割を果たします。
 * 状態更新が必要な場合に、都度インスタンスを作成して使用します。
 * 主な機能は以下の通りです:
 */
class Updater {
    queue = [];
    #updating = false;
    #rendering = false;
    #engine = null;
    // Ref情報をキューに追加
    enqueueRef(ref) {
        this.queue.push(ref);
        if (this.#rendering)
            return;
        this.#rendering = true;
        queueMicrotask(() => {
            this.rendering();
        });
    }
    // 状態更新開始
    async beginUpdate(engine, loopContext, callback) {
        try {
            this.#updating = true;
            this.#engine = engine;
            await useWritableStateProxy(engine, this, engine.state, loopContext, async (state) => {
                // 状態更新処理
                await callback(state);
            });
        }
        finally {
            this.#updating = false;
        }
    }
    // レンダリング
    rendering() {
        try {
            while (this.queue.length > 0) {
                // キュー取得
                const queue = this.queue;
                this.queue = [];
                if (!this.#engine)
                    raiseError("Engine is not initialized.");
                // レンダリング実行
                render(queue, this.#engine);
            }
        }
        finally {
            this.#rendering = false;
        }
    }
}
async function update(engine, loopContext, callback) {
    const updater = new Updater();
    await updater.beginUpdate(engine, loopContext, async (state) => {
        await callback(updater, state);
    });
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
        await update(engine, loopContext, async (updater, state) => {
            // stateProxyを生成し、バインディング値を実行
            const func = this.binding.bindingState.getValue(state);
            if (typeof func !== "function") {
                raiseError(`BindingNodeEvent: ${this.name} is not a function.`);
            }
            await Reflect.apply(func, state, [e, ...indexes]);
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
    assignValue(value) {
        raiseError(`BindingNodeIf.assignValue: not implemented`);
    }
    applyChange(renderer) {
        if (renderer.updatedBindings.has(this.binding))
            return;
        const filteredValue = this.binding.bindingState.getFilteredValue(renderer.readonlyState);
        if (typeof filteredValue !== "boolean") {
            raiseError(`BindingNodeIf.update: value is not boolean`);
        }
        const parentNode = this.node.parentNode;
        if (parentNode == null) {
            raiseError(`BindingNodeIf.update: parentNode is null`);
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
        renderer.updatedBindings.add(this.binding);
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

const EMPTY_SET = new Set();
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
    #bindContents = [];
    #bindContentByListIndex = new WeakMap();
    #bindContentPool = [];
    #bindContentLastIndex = 0;
    #loopInfo = undefined;
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
    get loopInfo() {
        if (typeof this.#loopInfo === "undefined") {
            const loopPath = this.binding.bindingState.pattern + ".*";
            this.#loopInfo = getStructuredPathInfo(loopPath);
        }
        return this.#loopInfo;
    }
    assignValue(value) {
        raiseError("BindingNodeFor.assignValue: Not implemented. Use update or applyChange.");
    }
    applyChange(renderer) {
        if (renderer.updatedBindings.has(this.binding))
            return;
        let newBindContents = [];
        // 削除を先にする
        const removeBindContentsSet = new Set();
        const listDiff = renderer.calcListDiff(this.binding.bindingState.ref);
        const parentNode = this.node.parentNode ?? raiseError(`BindingNodeFor.update: parentNode is null`);
        // 全削除最適化のフラグ
        const isAllRemove = (listDiff.oldListValue?.length === listDiff.removes?.size && (listDiff.oldListValue?.length ?? 0) > 0);
        // 親ノードこのノードだけ持つかのチェック
        let isParentNodeHasOnlyThisNode = false;
        if (isAllRemove) {
            const parentChildNodes = Array.from(parentNode.childNodes);
            const lastContent = this.#bindContents.at(-1) ?? raiseError(`BindingNodeFor.update: lastContent is null`);
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
            if (listDiff.removes) {
                for (const listIndex of listDiff.removes) {
                    const bindContent = this.#bindContentByListIndex.get(listIndex);
                    if (typeof bindContent === "undefined") {
                        raiseError(`BindingNodeFor.applyChange: bindContent is not found`);
                    }
                    this.deleteBindContent(bindContent);
                    removeBindContentsSet.add(bindContent);
                }
            }
            this.#bindContentPool.push(...removeBindContentsSet);
        }
        let lastBindContent = null;
        const firstNode = this.node;
        this.bindContentLastIndex = this.poolLength - 1;
        const isAllAppend = listDiff.newListValue?.length === listDiff.adds?.size && (listDiff.newListValue?.length ?? 0) > 0;
        //    if (!listDiff.onlySwap) {
        // 全追加の場合、バッファリングしてから一括追加する
        const fragmentParentNode = isAllAppend ? document.createDocumentFragment() : parentNode;
        const fragmentFirstNode = isAllAppend ? null : firstNode;
        const adds = listDiff.adds ?? EMPTY_SET;
        for (const listIndex of listDiff.newIndexes) {
            const lastNode = lastBindContent?.getLastNode(fragmentParentNode) ?? fragmentFirstNode;
            let bindContent;
            if (adds.has(listIndex)) {
                bindContent = this.createBindContent(listIndex);
                bindContent.mountAfter(fragmentParentNode, lastNode);
                bindContent.applyChange(renderer);
            }
            else {
                bindContent = this.#bindContentByListIndex.get(listIndex);
                if (typeof bindContent === "undefined") {
                    raiseError(`BindingNodeFor.applyChange: bindContent is not found`);
                }
                if (lastNode?.nextSibling !== bindContent.firstChildNode) {
                    bindContent.mountAfter(fragmentParentNode, lastNode);
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
        //    } else {
        // リストインデックスの並び替え
        // リストインデックスの並び替え時、インデックスの変更だけなので、要素の再描画はしたくない
        // 並べ替えはするが、要素の内容は変わらないため
        /*
              if (listIndexResults.swapTargets) {
                const bindContents = Array.from(this.#bindContents);
                const targets = Array.from(listIndexResults.swapTargets);
                targets.sort((a, b) => a.index - b.index);
                for(let i = 0; i < targets.length; i++) {
                  const targetListIndex = targets[i];
                  const targetBindContent = this.#bindContentByListIndex.get(targetListIndex);
                  if (typeof targetBindContent === "undefined") {
                    raiseError(`BindingNodeFor.assignValue2: bindContent is not found`);
                  }
                  bindContents[targetListIndex.index] = targetBindContent;
                  const lastNode = bindContents[targetListIndex.index - 1]?.getLastNode(parentNode) ?? firstNode;
                  targetBindContent.mountAfter(parentNode, lastNode);
                }
                newBindContents = bindContents;
              }
        */
        //    }
        // リスト要素の上書き
        /*
            if (listDiff.replaces) {
              for (const listIndex of listDiff.replaces) {
                const bindContent = this.#bindContentByListIndex.get(listIndex);
                if (typeof bindContent === "undefined") {
                  raiseError(`BindingNodeFor.assignValue2: bindContent is not found`);
                }
                bindContent.applyChange(renderer);
              }
            }
        */
        // プールの長さを更新する
        // プールの長さは、プールの最後の要素のインデックス+1であるため、
        this.poolLength = this.bindContentLastIndex + 1;
        this.#bindContents = newBindContents;
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
const _cache$1 = {};
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
    return _cache$1[key] ?? (_cache$1[key] = getDefaultPropertyByNodeType[nodeType]?.(node));
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
            await update(engine, loopContext, async (updater, state) => {
                binding.updateStateValue(state, value);
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
    assignValue(value) {
    }
    notifyRedraw(refs) {
        const notifyRefs = [];
        const info = this.binding.bindingState.info;
        const listIndex = this.binding.bindingState.listIndex?.at(info.wildcardCount - 1) ?? null;
        const at = (listIndex?.length ?? 0) - 1;
        for (const ref of refs) {
            if (info.pathSegments.length > ref.info.pathSegments.length) {
                // 親パスが更新された
                // ex values, values.* valuesが更新された場合
                if (info.cumulativePathSet.has(ref.info.pattern)) {
                    const thisAt = (ref.listIndex?.length ?? 0) - 1;
                    if (thisAt >= 0) {
                        if (listIndex === null)
                            continue;
                        if (ref.listIndex !== listIndex?.at(thisAt))
                            continue;
                    }
                    const newRef = getStatePropertyRef(info, listIndex);
                    notifyRefs.push(newRef);
                }
            }
            else {
                // 子パスが更新された
                // ex values.*.foo values.* values.*.fooが更新された
                if (!ref.info.cumulativePathSet.has(info.pattern)) {
                    // リストインデックスが一致しない場合はスキップ
                    if (at >= 0) {
                        if (ref.listIndex?.at(at) !== listIndex)
                            continue;
                    }
                    notifyRefs.push(ref);
                }
            }
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
        return this.#ref ?? raiseError("ref is null");
    }
    get filters() {
        return this.#filters;
    }
    get binding() {
        return this.#binding;
    }
    constructor(binding, pattern, filters) {
        this.#binding = binding;
        this.#pattern = pattern;
        this.#info = getStructuredPathInfo(pattern);
        this.#filters = filters;
    }
    getValue(state) {
        return state[GetByRefSymbol](this.ref);
    }
    getFilteredValue(state) {
        let value = state[GetByRefSymbol](this.ref);
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
            this.#ref = getStatePropertyRef(this.#info, loopContext.listIndex);
        }
        else {
            this.#ref = getStatePropertyRef(this.#info, null);
        }
        this.binding.engine.saveBinding(this.ref, this.binding);
    }
    assignValue(writeState, value) {
        writeState[SetByRefSymbol](this.ref, value);
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
    #ref = null;
    get pattern() {
        return raiseError("Not implemented");
    }
    get info() {
        return raiseError("Not implemented");
    }
    get listIndex() {
        return this.ref.listIndex;
    }
    get ref() {
        return this.#ref ?? raiseError("ref is null");
    }
    get filters() {
        return this.#filters;
    }
    get binding() {
        return this.#binding;
    }
    constructor(binding, pattern, filters) {
        this.#binding = binding;
        const indexNumber = Number(pattern.slice(1));
        if (isNaN(indexNumber)) {
            raiseError("BindingStateIndex: pattern is not a number");
        }
        this.#indexNumber = indexNumber;
        this.#filters = filters;
    }
    getValue(state) {
        return this.listIndex?.index ?? raiseError("listIndex is null");
    }
    getFilteredValue(state) {
        let value = this.listIndex?.index ?? raiseError("listIndex is null");
        for (let i = 0; i < this.#filters.length; i++) {
            value = this.#filters[i](value);
        }
        return value;
    }
    init() {
        const loopContext = this.binding.parentBindContent.currentLoopContext ??
            raiseError(`BindingState.init: loopContext is null`);
        const loopContexts = loopContext.serialize();
        const currentLoopContext = loopContexts[this.#indexNumber - 1] ??
            raiseError(`BindingState.init: currentLoopContext is null`);
        this.#ref = currentLoopContext.ref;
        const bindings = this.binding.engine.bindingsByListIndex.get(currentLoopContext.listIndex);
        if (bindings === undefined) {
            this.binding.engine.bindingsByListIndex.set(currentLoopContext.listIndex, new Set([this.binding]));
        }
        else {
            bindings.add(this.binding);
        }
    }
    assignValue(writeState, value) {
        raiseError("BindingStateIndex: assignValue is not implemented");
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
        this.bindingState = createBindingState(this, engine.outputFilters);
    }
    get bindContents() {
        return this.bindingNode.bindContents;
    }
    init() {
        this.bindingNode.init();
        this.bindingState.init();
    }
    updateStateValue(writeState, value) {
        return this.bindingState.assignValue(writeState, value);
    }
    notifyRedraw(refs) {
        this.bindingNode.notifyRedraw(refs);
    }
    applyChange(renderer) {
        if (renderer.updatedBindings.has(this))
            return;
        this.bindingNode.applyChange(renderer);
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
        return this.#ref ?? raiseError("ref is null");
    }
    get path() {
        return this.ref.info.pattern ?? raiseError("info.pattern is null");
    }
    get info() {
        return this.ref.info ?? raiseError("info is null");
    }
    get listIndex() {
        return this.ref.listIndex ?? raiseError("listIndex is required");
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
            if (lastBinding.bindContents.length > 0) {
                const childBindContent = lastBinding.bindContents.at(-1) ?? raiseError(`BindContent: childBindContent is not found`);
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
    constructor(parentBinding, id, engine, loopRef) {
        this.parentBinding = parentBinding;
        this.#id = id;
        this.fragment = createContent(id);
        this.childNodes = Array.from(this.fragment.childNodes);
        this.engine = engine;
        this.loopContext = (loopRef.listIndex !== null) ? createLoopContext(loopRef, this) : null;
        this.bindings = createBindings(this, id, engine, this.fragment);
    }
    mount(parentNode) {
        for (let i = 0; i < this.childNodes.length; i++) {
            parentNode.appendChild(this.childNodes[i]);
        }
    }
    mountBefore(parentNode, beforeNode) {
        for (let i = 0; i < this.childNodes.length; i++) {
            parentNode.insertBefore(this.childNodes[i], beforeNode);
        }
    }
    mountAfter(parentNode, afterNode) {
        const beforeNode = afterNode?.nextSibling ?? null;
        for (let i = 0; i < this.childNodes.length; i++) {
            parentNode.insertBefore(this.childNodes[i], beforeNode);
        }
    }
    unmount() {
        const parentElement = this.childNodes[0]?.parentElement ?? null;
        if (parentElement === null) {
            return; // すでにDOMから削除されている場合は何もしない
        }
        for (let i = 0; i < this.childNodes.length; i++) {
            parentElement.removeChild(this.childNodes[i]);
        }
    }
    bindings = [];
    init() {
        for (let i = 0; i < this.bindings.length; i++) {
            this.bindings[i].init();
        }
    }
    assignListIndex(listIndex) {
        if (this.loopContext == null)
            raiseError(`BindContent: loopContext is null`);
        this.loopContext.assignListIndex(listIndex);
        this.init();
    }
    applyChange(renderer) {
        for (let i = 0; i < this.bindings.length; i++) {
            const binding = this.bindings[i];
            if (renderer.updatedBindings.has(binding))
                continue;
            binding.applyChange(renderer);
        }
    }
}
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
        this.bindings.add(binding);
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
        update(this.engine, null, async (updater, stateProxy) => {
            for (const [key, value] of Object.entries(object)) {
                const childPathInfo = getStructuredPathInfo(key);
                const childRef = getStatePropertyRef(childPathInfo, null);
                stateProxy[SetByRefSymbol](childRef, value);
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
                // Ref情報をもとに状態更新キューに追加
                update(this.engine, null, async (updater, stateProxy) => {
                    const childRef = getStatePropertyRef(childPathInfo, childListIndex);
                    updater.enqueueRef(childRef);
                });
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
        return binding.engine.getPropertyValue(parentPathInfo, listIndex ?? binding.bindingState.listIndex);
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
        const ref = getStatePropertyRef(parentPathInfo, listIndex ?? binding.bindingState.listIndex);
        update(engine, null, async (updater, stateProxy) => {
            stateProxy[SetByRefSymbol](ref, value);
        });
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
    bindingsByListIndex = new WeakMap();
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
        this.stateOutput = createComponentStateOutput(this.#stateBinding);
    }
    get pathManager() {
        return this.owner.constructor.pathManager;
    }
    setup() {
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
        if (this.config.enableWebComponents) {
            // Shadow DOMにバインドコンテンツをマウントする
            this.bindContent.mount(this.owner.shadowRoot ?? this.owner);
        }
        else {
            // ブロックプレースホルダーの親ノードにバインドコンテンツをマウントする
            const parentNode = this.#blockParentNode ?? raiseError("Block parent node is not set");
            this.bindContent.mountAfter(parentNode, this.#blockPlaceholder);
        }
        await update(this, null, async (updater, stateProxy) => {
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
            await update(this, null, async (updater, stateProxy) => {
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
        finally {
            this.#waitForDisconnected.resolve(); // disconnectedCallbackが呼ばれたことを通知   
        }
    }
    #saveInfoByStructuredPathId = {};
    #saveInfoByResolvedPathInfoIdByListIndex = new WeakMap();
    createSaveInfo() {
        return {
            list: null,
            listIndexes: null,
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
            let saveInfoByResolvedPathInfoId = this.#saveInfoByResolvedPathInfoIdByListIndex.get(listIndex);
            if (typeof saveInfoByResolvedPathInfoId === "undefined") {
                saveInfoByResolvedPathInfoId = {};
                this.#saveInfoByResolvedPathInfoIdByListIndex.set(listIndex, saveInfoByResolvedPathInfoId);
            }
            let saveInfo = saveInfoByResolvedPathInfoId[info.id];
            if (typeof saveInfo === "undefined") {
                saveInfo = this.createSaveInfo();
                saveInfoByResolvedPathInfoId[info.id] = saveInfo;
            }
            return saveInfo;
        }
    }
    saveBinding(ref, binding) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(ref.info, ref.listIndex);
        saveInfo.bindings.push(binding);
    }
    saveListAndListIndexes(ref, list, listIndexes) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(ref.info, ref.listIndex);
        saveInfo.list = list;
        saveInfo.listIndexes = listIndexes;
    }
    getBindings(ref) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(ref.info, ref.listIndex);
        return saveInfo.bindings;
    }
    getListIndexes(ref) {
        if (this.stateOutput.startsWith(ref.info)) {
            return this.stateOutput.getListIndexes(ref);
        }
        const saveInfo = this.getSaveInfoByStatePropertyRef(ref.info, ref.listIndex);
        return saveInfo.listIndexes;
    }
    getListAndListIndexes(ref) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(ref.info, ref.listIndex);
        return [saveInfo.list, saveInfo.listIndexes];
    }
    getPropertyValue(info, listIndex) {
        // プロパティの値を取得する
        const ref = getStatePropertyRef(info, listIndex);
        const stateProxy = createReadonlyStateProxy(this, this.state);
        return stateProxy[GetByRefSymbol](ref);
    }
    setPropertyValue(info, listIndex, value) {
        // プロパティの値を設定する
        const ref = getStatePropertyRef(info, listIndex);
        update(this, null, async (updater, stateProxy) => {
            stateProxy[SetByRefSymbol](ref, value);
        });
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
        for (let i = 0; i < info.pathSegments.length; i++) {
            const segment = info.pathSegments[i];
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

class PathManager {
    alls = new Set();
    lists = new Set();
    elements = new Set();
    funcs = new Set();
    getters = new Set();
    setters = new Set();
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
    addDynamicDependency(target, source) {
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
