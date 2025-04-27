const DEFAULT_ROUTE_PATH = '/'; // Default route path
const ROUTE_PATH_PREFIX = 'routes:'; // Prefix for route paths
/**
 * example:
 * ```ts
 * entryRoute('my-view', '/my-view/:id');
 */
const routeMap = {};
class Router extends HTMLElement {
    _popstateHandler;
    constructor() {
        super();
        this._popstateHandler = this.popstateHandler.bind(this);
    }
    connectedCallback() {
        this.innerHTML = '<slot name="content"></slot>';
        window.addEventListener('popstate', this._popstateHandler);
        window.dispatchEvent(new Event("popstate")); // Dispatch popstate event to trigger the initial render
    }
    disconnectedCallback() {
        window.removeEventListener('popstate', this._popstateHandler);
    }
    popstateHandler(event) {
        this.render();
    }
    render() {
        const routePath = window.location.pathname || DEFAULT_ROUTE_PATH;
        let tagName = undefined;
        let params = {};
        // Check if the routePath matches any of the defined routes
        for (const [path, tag] of Object.entries(routeMap)) {
            const regex = new RegExp(path.replace(/:[^\s/]+/g, '([^/]+)'));
            if (regex.test(routePath)) {
                tagName = tag;
                // Extract the parameters from the routePath
                const matches = routePath.match(regex);
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
            customElement.setAttribute('state', JSON.stringify(params));
            customElement.setAttribute('slot', 'content');
            this.appendChild(customElement);
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
    routeMap[routePath] = tagName;
}

const globalConfig = {
    debug: false,
    locale: "en-US", // The locale of the component, ex. "en-US", default is "en-US"
    enableShadowDom: true,
    enableMainWrapper: true, // Whether to use the main wrapper or not
    enableRouter: true, // Whether to use the router or not
    autoInsertMainWrapper: false, // Whether to automatically insert the main wrapper or not
    autoInit: true, // Whether to automatically initialize the component or not
    mainTagName: "app-main", // The tag name of the main wrapper, default is "app-main"
    routerTagName: "view-router", // The tag name of the router, default is "view-router"
    layoutPath: "", // The path to the layout file, default is ""
};
function getGlobalConfig() {
    return globalConfig;
}
const config$2 = getGlobalConfig();

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

const config$1 = getGlobalConfig();
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
    trim: trim$1,
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
const outputBuiltinFilters = builtinFilters;
const inputBuiltinFilters = builtinFilters;

let id = 0;
function generateId() {
    return ++id;
}

function raiseError(message) {
    throw new Error(message);
}

const stateClassById = {};
function registerStateClass(id, stateClass) {
    stateClassById[id] = stateClass;
}
function getStateClassById(id) {
    return stateClassById[id] ?? raiseError(`getStateClassById: stateClass not found: ${id}`);
}

const styleSheetById = {};
function registerStyleSheet(id, css) {
    styleSheetById[id] = css;
}
function getStyleSheetById(id) {
    return styleSheetById[id] ?? raiseError(`getStyleSheetById: stylesheet not found: ${id}`);
}

function registerCss(id, css) {
    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(css);
    registerStyleSheet(id, styleSheet);
}

function resolveNodeFromPath(root, path) {
    return path.reduce((node, index) => node?.childNodes[index] ?? null, root);
}

function getAbsoluteNodePath(node) {
    let routeIndexes = [];
    while (node.parentNode !== null) {
        const childNodes = Array.from(node.parentNode.childNodes);
        routeIndexes = [childNodes.indexOf(node), ...routeIndexes];
        node = node.parentNode;
    }
    return routeIndexes;
}

function textToFilter(filters, text) {
    const filter = filters[text.name];
    if (!filter)
        raiseError(`outputBuiltinFiltersFn: filter not found: ${name}`);
    return filter(text.options);
}
const cache$1 = new Map();
function createFilters(filters, texts) {
    let result = cache$1.get(texts);
    if (typeof result === "undefined") {
        result = [];
        for (let i = 0; i < texts.length; i++) {
            result.push(textToFilter(filters, texts[i]));
        }
        cache$1.set(texts, result);
    }
    return result;
}

class BindingNode {
    #binding;
    #node;
    #name;
    #filters;
    #event;
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
    get event() {
        return this.#event;
    }
    get filters() {
        return this.#filters;
    }
    get bindContents() {
        return this.#bindContents;
    }
    constructor(binding, node, name, filters, event) {
        this.#binding = binding;
        this.#node = node;
        this.#name = name;
        this.#filters = filters;
        this.#event = event;
    }
    init() {
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
    get isSelectElement() {
        return this.node instanceof HTMLSelectElement;
    }
    get value() {
        return null;
    }
    get filteredValue() {
        return null;
    }
}

class BindingNodeAttribute extends BindingNode {
    #subName;
    get subName() {
        return this.#subName;
    }
    constructor(binding, node, name, filters, event) {
        super(binding, node, name, filters, event);
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
const createBindingNodeAttribute = (name, filterTexts, event) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeAttribute(binding, node, name, filterFns, event);
};

class BindingNodeCheckbox extends BindingNode {
    assignValue(value) {
        if (!Array.isArray(value)) {
            raiseError(`BindingNodeCheckbox.update: value is not array`);
        }
        const element = this.node;
        element.checked = value.map(_val => _val.toString()).includes(element.value);
    }
}
const createBindingNodeCheckbox = (name, filterTexts, event) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeCheckbox(binding, node, name, filterFns, event);
};

class BindingNodeClassList extends BindingNode {
    assignValue(value) {
        if (!Array.isArray(value)) {
            raiseError(`BindingNodeClassList.update: value is not array`);
        }
        const element = this.node;
        element.className = value.join(" ");
    }
}
const createBindingNodeClassList = (name, filterTexts, event) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeClassList(binding, node, name, filterFns, event);
};

class BindingNodeClassName extends BindingNode {
    #subName;
    get subName() {
        return this.#subName;
    }
    constructor(binding, node, name, filters, event) {
        super(binding, node, name, filters, event);
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
const createBindingNodeClassName = (name, filterTexts, event) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeClassName(binding, node, name, filterFns, event);
};

class BindingNodeEvent extends BindingNode {
    #subName;
    constructor(binding, node, name, filters, event) {
        super(binding, node, name, filters, event);
        this.#subName = this.name.slice(2); // on～
        const element = node;
        element.addEventListener(this.subName, (e) => this.handler(e));
    }
    get subName() {
        return this.#subName;
    }
    update() {
        // 何もしない
    }
    handler(e) {
        const bindingState = this.binding.bindingState;
        const engine = this.binding.engine;
        const stateProxy = engine.stateProxy;
        const updater = engine.updater;
        const loopContext = this.binding.parentBindContent.currentLoopContext;
        const indexes = loopContext?.serialize().map((context) => context.listIndex.index) ?? [];
        const option = this.event;
        if (option === "preventDefault") {
            e.preventDefault();
        }
        this.binding.engine.updater.addProcess(async () => {
            const value = bindingState.value;
            const typeOfValue = typeof value;
            updater.addProcess(async () => {
                if (loopContext) {
                    await engine.setLoopContext(loopContext, async () => {
                        if (typeOfValue === "function") {
                            await Reflect.apply(value, stateProxy, [e, ...indexes]);
                        }
                    });
                }
                else {
                    if (typeOfValue === "function") {
                        await Reflect.apply(value, stateProxy, [e, ...indexes]);
                    }
                }
            });
        });
    }
}
const createBindingNodeEvent = (name, filterTexts, event) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeEvent(binding, node, name, filterFns, event);
};

const DATA_BIND_ATTRIBUTE = "data-bind";
const COMMENT_EMBED_MARK = "@@:"; // 埋め込み変数のマーク
const COMMENT_TEMPLATE_MARK = "@@|"; // テンプレートのマーク

const COMMENT_TEMPLATE_MARK_LEN$1 = COMMENT_TEMPLATE_MARK.length;
class BindingNodeBlock extends BindingNode {
    #id;
    get id() {
        return this.#id;
    }
    constructor(binding, node, name, filters, event) {
        super(binding, node, name, filters, event);
        const id = this.node.textContent?.slice(COMMENT_TEMPLATE_MARK_LEN$1) ?? raiseError("BindingNodeBlock.id: invalid node");
        this.#id = Number(id);
    }
}

class BindingNodeIf extends BindingNodeBlock {
    #bindContent;
    #trueBindContents;
    #falseBindContents = new Set();
    #bindContents;
    get bindContents() {
        return this.#bindContents;
    }
    constructor(binding, node, name, filters, event) {
        super(binding, node, name, filters, event);
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
            this.#bindContent.mountBefore(parentNode, this.node.nextSibling);
            this.#bindContents = this.#trueBindContents;
        }
        else {
            this.#bindContent.unmount();
            this.#bindContents = this.#falseBindContents;
        }
    }
}
const createBindingNodeIf = (name, filterTexts, event) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeIf(binding, node, name, filterFns, event);
};

class BindingNodeFor extends BindingNodeBlock {
    #bindContentsSet = new Set();
    #bindContentByListIndex = new WeakMap();
    #bindContentPool = [];
    #bindContentLastIndex = 0;
    get bindContents() {
        return this.#bindContentsSet;
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
        this.bindContentLastIndex = this.poolLength - 1;
        const newBindContensSet = new Set();
        let lastBindContent = null;
        const parentNode = this.node.parentNode;
        if (parentNode == null) {
            raiseError(`BindingNodeFor.update: parentNode is null`);
        }
        for (const listIndex of listIndexesSet) {
            const lastNode = lastBindContent?.getLastNode(parentNode) ?? this.node;
            let bindContent = this.#bindContentByListIndex.get(listIndex);
            if (typeof bindContent === "undefined") {
                bindContent = this.createBindContent(listIndex);
                bindContent.render();
                bindContent.mountAfter(parentNode, lastNode);
            }
            else {
                if (lastNode.nextSibling !== bindContent.firstChildNode) {
                    bindContent.mountAfter(parentNode, lastNode);
                }
            }
            newBindContensSet.add(bindContent);
            lastBindContent = bindContent;
        }
        // プールの長さを更新する
        // プールの長さは、プールの最後の要素のインデックス+1であるため、
        this.poolLength = this.bindContentLastIndex + 1;
        // 削除
        const removeBindContentsSet = this.#bindContentsSet.difference(newBindContensSet);
        for (const bindContent of removeBindContentsSet) {
            this.deleteBindContent(bindContent);
        }
        this.#bindContentPool.push(...removeBindContentsSet);
        this.#bindContentsSet = newBindContensSet;
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
const createBindingNodeFor = (name, filterTexts, event) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeFor(binding, node, name, filterFns, event);
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
 * バインド情報でノードプロパティを省略された場合のデフォルトのプロパティ名を取得
 * @param node ノード
 * @param nodeType ノードタイプ
 * @returns {string | undefined} デフォルトのプロパティ名
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
    constructor(binding, node, name, filters, event) {
        super(binding, node, name, filters, event);
        const isElement = this.node instanceof HTMLElement;
        if (!isElement)
            return;
        if (!isTwoWayBindable(this.node))
            return;
        const defaultName = getDefaultName(this.node, "HTMLElement");
        if (defaultName !== this.name)
            return;
        const eventName = this.event ?? defaultEventByName[this.name] ?? "readonly";
        if (event === "readonly" || event === "ro")
            return;
        this.node.addEventListener(eventName, () => {
            this.binding.updateStateValue(this.filteredValue);
        });
    }
    init() {
    }
    assignValue(value) {
        if (value === null || value === undefined || Number.isNaN(value)) {
            value = "";
        }
        // @ts-ignore
        this.node[this.name] = value;
    }
}
const createBindingNodeProperty = (name, filterTexts, event) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeProperty(binding, node, name, filterFns, event);
};

class BindingNodeRadio extends BindingNode {
    assignValue(value) {
        if (value === null || value === undefined || Number.isNaN(value)) {
            value = "";
        }
        const element = this.node;
        element.checked = value.toString() === element.value.toString();
    }
}
const createBindingNodeRadio = (name, filterTexts, event) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeRadio(binding, node, name, filterFns, event);
};

class BindingNodeStyle extends BindingNode {
    #subName;
    get subName() {
        return this.#subName;
    }
    constructor(binding, node, name, filters, event) {
        super(binding, node, name, filters, event);
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
const createBindingNodeStyle = (name, filterTexts, event) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeStyle(binding, node, name, filterFns, event);
};

const symbolName$1 = "componentState";
const RenderSymbol = Symbol.for(`${symbolName$1}.render`);
const BindParentComponentSymbol = Symbol.for(`${symbolName$1}.bindParentComponent`);

class BindingNodeComponent extends BindingNode {
    #subName;
    get subName() {
        return this.#subName;
    }
    constructor(binding, node, name, filters, event) {
        super(binding, node, name, filters, event);
        const [, subName] = this.name.split(".");
        this.#subName = subName;
    }
    init() {
        const engine = this.binding.engine;
        let bindings = engine.bindingsByComponent.get(this.node);
        if (typeof bindings === "undefined") {
            bindings = new Set();
            engine.bindingsByComponent.set(this.node, bindings);
        }
        bindings.add(this.binding);
    }
    assignValue(value) {
        const component = this.node;
        component.state[RenderSymbol](this.subName, value);
    }
}
const createBindingNodeComponent = (name, filterTexts, event) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeComponent(binding, node, name, filterFns, event);
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
function _getBindingNodeCreator(isComment, isElement, propertyName) {
    const bindingNodeCreatorByName = nodePropertyConstructorByNameByIsComment[isComment ? 1 : 0][propertyName];
    if (typeof bindingNodeCreatorByName !== "undefined") {
        return bindingNodeCreatorByName;
    }
    if (isComment && propertyName === "for") {
        return createBindingNodeFor;
    }
    if (isComment) {
        raiseError(`getBindingNodeCreator: unknown node property ${propertyName}`);
    }
    const nameElements = propertyName.split(".");
    const bindingNodeCreatorByFirstName = nodePropertyConstructorByFirstName[nameElements[0]];
    if (typeof bindingNodeCreatorByFirstName !== "undefined") {
        return bindingNodeCreatorByFirstName;
    }
    if (isElement) {
        if (propertyName.startsWith("on")) {
            return createBindingNodeEvent;
        }
        else {
            return createBindingNodeProperty;
        }
    }
    else {
        return createBindingNodeProperty;
    }
}
const _cache$2 = {};
/**
 * バインドのノードプロパティの生成関数を取得する
 * @param node ノード
 * @param propertyName プロパティ名
 * @returns {CreateBindingNodeFn} ノードプロパティのコンストラクタ
 */
function getBindingNodeCreator(node, propertyName, filterTexts, event) {
    const isComment = node instanceof Comment;
    const isElement = node instanceof Element;
    const key = isComment + "\t" + isElement + "\t" + propertyName;
    const fn = _cache$2[key] ?? (_cache$2[key] = _getBindingNodeCreator(isComment, isElement, propertyName));
    return fn(propertyName, filterTexts, event);
}

const symbolName = "state";
const GetByRefSymbol = Symbol.for(`${symbolName}.GetByRef`);
const SetByRefSymbol = Symbol.for(`${symbolName}.SetByRef`);
const SetCacheableSymbol = Symbol.for(`${symbolName}.SetCacheable`);
const ConnectedCallbackSymbol = Symbol.for(`${symbolName}.ConnectedCallback`);
const DisconnectedCallbackSymbol = Symbol.for(`${symbolName}.DisconnectedCallback`);
const ResolveSymbol = Symbol.for(`${symbolName}.Resolve`);
const GetAllSymbol = Symbol.for(`${symbolName}.GetAll`);

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
    pattern;
    pathSegments;
    lastSegment;
    cumulativePaths;
    cumulativeInfos;
    wildcardPaths;
    wildcardInfos;
    wildcardParentPaths;
    wildcardParentInfos;
    lastWildcardPath;
    lastWildcardInfo;
    parentPath;
    parentInfo;
    wildcardCount;
    constructor(pattern) {
        const getPattern = (_pattern) => {
            return (pattern === _pattern) ? this : getStructuredPathInfo(_pattern);
        };
        const pathSegments = pattern.split(".");
        const cumulativePaths = [];
        const cumulativeInfos = [];
        const wildcardPaths = [];
        const wildcardInfos = [];
        const wildcardParentPaths = [];
        const wildcardParentInfos = [];
        let currentPatternPath = "", prevPatternPath = "";
        let wildcardCount = 0;
        for (let i = 0; i < pathSegments.length; i++) {
            currentPatternPath += pathSegments[i];
            if (pathSegments[i] === "*") {
                wildcardPaths.push(currentPatternPath);
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
        this.cumulativeInfos = cumulativeInfos;
        this.wildcardPaths = wildcardPaths;
        this.wildcardInfos = wildcardInfos;
        this.wildcardParentPaths = wildcardParentPaths;
        this.wildcardParentInfos = wildcardParentInfos;
        this.lastWildcardPath = lastWildcardPath;
        this.lastWildcardInfo = lastWildcardPath ? getPattern(lastWildcardPath) : null;
        this.parentPath = parentPath;
        this.parentInfo = parentPath ? getPattern(parentPath) : null;
        this.wildcardCount = wildcardCount;
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
            const loopContext = this.binding.parentBindContent.loopContext?.find(lastWildcardPath) ??
                raiseError(`BindingState.init: loopContext is null`);
            this.#listIndexRef = loopContext.listIndexRef;
        }
        this.binding.engine.saveBinding(this.info, this.listIndex, this.binding);
    }
    assignValue(value) {
        const loopContext = this.binding.parentBindContent.currentLoopContext;
        const engine = this.binding.engine;
        const stateProxy = engine.stateProxy;
        const bindingState = this.binding.bindingState;
        if (loopContext) {
            engine.setLoopContext(loopContext, async () => {
                // @ts-ignore
                stateProxy[SetByRefSymbol](bindingState.info, bindingState.listIndex, value);
            });
        }
        else {
            // @ts-ignore
            stateProxy[SetByRefSymbol](bindingState.info, bindingState.listIndex, value);
        }
    }
}
const createBindingState = (name, filterTexts) => (binding, state, filters) => {
    const filterFns = createFilters(filters, filterTexts); // ToDo:ここは、メモ化できる
    return new BindingState(binding, state, name, filterFns);
};

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
    assignValue(value) {
        raiseError("BindingStateIndex: assignValue is not implemented");
    }
}
const createBindingStateIndex = (name, filterTexts) => (binding, state, filters) => {
    const filterFns = createFilters(filters, filterTexts); // ToDo:ここは、メモ化できる
    return new BindingStateIndex(binding, state, name, filterFns);
};

const ereg = new RegExp(/^\$\d+$/);
function getBindingStateCreator(name, filterTexts) {
    if (ereg.test(name)) {
        return createBindingStateIndex(name, filterTexts);
    }
    else {
        return createBindingState(name, filterTexts);
    }
}

const COMMENT_EMBED_MARK_LEN = COMMENT_EMBED_MARK.length;
const COMMENT_TEMPLATE_MARK_LEN = COMMENT_TEMPLATE_MARK.length;
const getTextFromContent = (node) => node.textContent?.slice(COMMENT_EMBED_MARK_LEN).trim() ?? "";
const getTextFromAttribute = (node) => node.getAttribute(DATA_BIND_ATTRIBUTE) ?? "";
const getTextFromTemplate = (node) => {
    const text = node.textContent?.slice(COMMENT_TEMPLATE_MARK_LEN).trim();
    const id = Number(text);
    const template = getTemplateById(id) ?? raiseError(`Template not found: ${text}`);
    return template.getAttribute(DATA_BIND_ATTRIBUTE) ?? "";
};
const getTextFromSVGElement = (node) => node.getAttribute(DATA_BIND_ATTRIBUTE) ?? "";
const getTextByNodeType = {
    "Text": getTextFromContent,
    "HTMLElement": getTextFromAttribute,
    "Template": getTextFromTemplate,
    "SVGElement": getTextFromSVGElement
};
function getDataBindText(nodeType, node) {
    const bindText = getTextByNodeType[nodeType](node) ?? "";
    if (nodeType === "Text") {
        return "textContent:" + bindText;
    }
    else {
        return bindText;
    }
}

const createNodeKey = (node) => node.constructor.name + "\t" + ((node instanceof Comment) ? (node.textContent?.[2] ?? "") : "");
const nodeTypeByNodeKey = {};
const getNodeTypeByNode = (node) => (node instanceof Comment && node.textContent?.[2] === ":") ? "Text" :
    (node instanceof HTMLElement) ? "HTMLElement" :
        (node instanceof Comment && node.textContent?.[2] === "|") ? "Template" :
            (node instanceof SVGElement) ? "SVGElement" : raiseError(`Unknown NodeType: ${node.nodeType}`);
/**
 * ノードのタイプを取得
 * @param node ノード
 * @param nodeKey ノードキー
 * @returns {NodeType} ノードタイプ
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
    const [bindExpression, event = null] = expression.split("@").map(trim);
    const [nodePropertyText, statePropertyText] = bindExpression.split(":").map(trim);
    const { property: nodeProperty, filters: inputFilterTexts } = parseProperty(nodePropertyText);
    const { property: stateProperty, filters: outputFilterTexts } = parseProperty(statePropertyText);
    return { nodeProperty, stateProperty, inputFilterTexts, outputFilterTexts, event };
};
/**
 * parse bind text and return BindText[]
 */
const parseExpressions = (text) => {
    return text.split(";").map(trim).filter(has).map(s => parseExpression(s));
};
const cache = {};
/**
 * 取得したバインドテキスト(getBindTextByNodeType)を解析して、バインド情報を取得する
 * @param text バインドテキスト
 * @param defaultName デフォルト名
 * @returns {IBindText[]} バインド情報
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
 * ノードからdata-bind属性を削除
 * @param node ノード
 * @param nodeType ノードタイプ
 * @returns {Node} ノード
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
 * コメントノードをテキストノードに置き換える
 * @param node ノード
 * @param nodeType ノードタイプ
 * @returns {Node} ノード
 */
function replaceTextNodeFromComment(node, nodeType) {
    return replaceTextNodeFn[nodeType]?.(node) ?? node;
}

class DataBindAttributes {
    nodeType; // ノードの種別
    nodePath; // ノードのルート
    bindTexts; // BINDテキストの解析結果
    creatorByText = new Map(); // BINDテキストからバインディングクリエイターを取得
    constructor(node) {
        this.nodeType = getNodeType(node);
        const text = getDataBindText(this.nodeType, node);
        // CommentNodeをTextに置換、template.contentの内容が書き換わることに注意
        node = replaceTextNodeFromComment(node, this.nodeType);
        // data-bind属性を削除する
        removeDataBindAttribute(node, this.nodeType);
        this.nodePath = getAbsoluteNodePath(node);
        this.bindTexts = parseBindText(text);
        for (let i = 0; i < this.bindTexts.length; i++) {
            const bindText = this.bindTexts[i];
            const creator = {
                createBindingNode: getBindingNodeCreator(node, bindText.nodeProperty, bindText.inputFilterTexts, bindText.event),
                createBindingState: getBindingStateCreator(bindText.stateProperty, bindText.outputFilterTexts),
            };
            this.creatorByText.set(bindText, creator);
        }
    }
}
function createDataBindAttributes(node) {
    return new DataBindAttributes(node);
}

/**
 * "@@:"もしくは"@@|"で始まるコメントノードを取得する
 */
function isCommentNode(node) {
    return node instanceof Comment && ((node.textContent?.indexOf(COMMENT_EMBED_MARK) === 0) || (node.textContent?.indexOf(COMMENT_TEMPLATE_MARK) === 0));
}
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
const getDataBindAttributesById = (id) => {
    return listDataBindAttributesById[id];
};
const getListPathsSetById = (id) => {
    return listPathsSetById[id] ?? [];
};
const getPathsSetById = (id) => {
    return pathsSetById[id] ?? [];
};

function removeEmptyTextNodes(content) {
    Array.from(content.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && !(node.nodeValue ?? "").trim()) {
            content.removeChild(node);
        }
    });
}

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

class Binding {
    parentBindContent;
    node;
    engine;
    bindingNode;
    bindingState;
    constructor(parentBindContent, node, engine, createBindingNode, createBindingState) {
        this.parentBindContent = parentBindContent;
        this.node = node;
        this.engine = engine;
        this.bindingNode = createBindingNode(this, node, engine.inputFilters);
        this.bindingState = createBindingState(this, engine.stateProxy, engine.outputFilters);
    }
    get bindContents() {
        return this.bindingNode.bindContents;
    }
    init() {
        this.bindingNode.init();
        this.bindingState.init();
    }
    render() {
        this.bindingNode.update();
    }
    updateStateValue(value) {
        const engine = this.engine;
        const bindingState = this.bindingState;
        engine.updater.addProcess(() => {
            return bindingState.assignValue(value);
        });
    }
}
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
    return document.importNode(template.content, true);
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
        if (lastBinding.node === lastChildNode) {
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
        parentNode.appendChild(this.fragment);
    }
    mountBefore(parentNode, beforeNode) {
        parentNode.insertBefore(this.fragment, beforeNode);
    }
    mountAfter(parentNode, afterNode) {
        parentNode.insertBefore(this.fragment, afterNode?.nextSibling ?? null);
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

class ListIndex {
    static id = 0;
    id = ++ListIndex.id;
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
    at(position) {
        let iterator;
        if (position >= 0) {
            iterator = this.iterator();
        }
        else {
            position = -position - 1;
            iterator = this.reverseIterator();
        }
        let next;
        while (position >= 0) {
            next = iterator.next();
            position--;
        }
        return next?.value ?? null;
    }
}
function createListIndex(parentListIndex, index) {
    return new ListIndex(parentListIndex, index);
}
function getMaxListIndexId() {
    return ListIndex.id;
}

/**
 * 参照用のIDを生成する
 * ListIndexのIDは最大値を取得してから計算するため、ListIndexの構築が完了していない場合、重複が発生する可能性がある
 */
/**
 * ToDo:ListIndexの構築が完了していない状態で、IDを取得すると例外を発生させる仕組みが必要
 */
function getStatePropertyRefId(info, listIndex) {
    const listIndexMaxId = getMaxListIndexId();
    return info.id * (listIndexMaxId + 1) + (listIndex?.id ?? 0);
}

function setTracking(info, handler, callback) {
    handler.trackingStack.push(info);
    handler.lastTrackingStack = info;
    try {
        return callback();
    }
    finally {
        handler.trackingStack.pop();
        handler.lastTrackingStack = handler.trackingStack[handler.trackingStack.length - 1] ?? null;
    }
}

function _getByRef(target, info, listIndex, receiver, handler) {
    if (handler.lastTrackingStack != null && handler.lastTrackingStack !== info) {
        const lastPattern = handler.lastTrackingStack;
        if (lastPattern.parentInfo !== info) {
            handler.engine.addDependentProp(lastPattern, info);
        }
    }
    let refId = 0;
    if (handler.cacheable) {
        refId = getStatePropertyRefId(info, listIndex);
        const value = handler.cache[refId];
        if (typeof value !== "undefined") {
            return value;
        }
        if (refId in handler.cache) {
            return undefined;
        }
    }
    let value;
    try {
        if (info.pattern in target) {
            return (value = handler.engine.setStatePropertyRef(info, listIndex, () => {
                return Reflect.get(target, info.pattern, receiver);
            }));
        }
        else {
            const parentInfo = info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
            const parentListIndex = parentInfo.wildcardCount < info.wildcardCount ? (listIndex?.parentListIndex ?? null) : listIndex;
            const parentValue = getByRef$1(target, parentInfo, parentListIndex, receiver, handler);
            const lastSegment = info.lastSegment;
            if (lastSegment === "*") {
                const index = listIndex?.index ?? raiseError(`propRef.listIndex?.index is undefined`);
                return (value = Reflect.get(parentValue, index));
            }
            else {
                return (value = Reflect.get(parentValue, lastSegment));
            }
        }
    }
    finally {
        if (handler.cacheable && !(refId in handler.cache)) {
            handler.cache[refId] = value;
        }
    }
}
function getByRef$1(target, info, listIndex, receiver, handler) {
    if (handler.engine.trackedGetters.has(info.pattern)) {
        return setTracking(info, handler, () => {
            return _getByRef(target, info, listIndex, receiver, handler);
        });
    }
    else {
        return _getByRef(target, info, listIndex, receiver, handler);
    }
}

function getByRef(target, prop, receiver, handler) {
    return (pattern, listIndex) => getByRef$1(target, pattern, listIndex, receiver, handler);
}

function setByRef$1(target, info, listIndex, value, receiver, handler) {
    try {
        if (info.pattern in target) {
            if (info.wildcardCount > 0) {
                if (listIndex === null) {
                    raiseError(`propRef.listIndex is null`);
                }
                return handler.engine.setStatePropertyRef(info, listIndex, () => {
                    return Reflect.set(target, info.pattern, value, receiver);
                });
            }
            else {
                return Reflect.set(target, info.pattern, value, receiver);
            }
        }
        else {
            const parentInfo = info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
            const parentListIndex = parentInfo.wildcardCount < info.wildcardCount ? (listIndex?.parentListIndex ?? null) : listIndex;
            const parentValue = getByRef$1(target, parentInfo, parentListIndex, receiver, handler);
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

function setByRef(target, prop, receiver, handler) {
    return (pattern, listIndex, value) => setByRef$1(target, pattern, listIndex, value, receiver, handler);
}

async function setCacheable$1(handler, callback) {
    handler.cacheable = true;
    handler.cache = {};
    try {
        await callback();
    }
    finally {
        handler.cacheable = false;
    }
}

function setCacheable(target, prop, receiver, handler) {
    return async (callback) => {
        await setCacheable$1(handler, callback);
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

function resolve(target, prop, receiver, handler) {
    return (path, indexes, value) => {
        const info = getStructuredPathInfo(path);
        let listIndex = null;
        for (let i = 0; i < info.wildcardParentInfos.length; i++) {
            const wildcardParentPattern = info.wildcardParentInfos[i] ?? raiseError(`wildcardParentPath is null`);
            const listIndexes = Array.from(handler.engine.getListIndexesSet(wildcardParentPattern, listIndex) ?? []);
            const index = indexes[i] ?? raiseError(`index is null`);
            listIndex = listIndexes[index] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
        }
        if (typeof value === "undefined") {
            return getByRef$1(target, info, listIndex, receiver, handler);
        }
        else {
            return setByRef$1(target, info, listIndex, value, receiver, handler);
        }
    };
}

function getAll(target, prop, receiver, handler) {
    const resolve$1 = resolve(target, prop, receiver, handler);
    return (path, indexes) => {
        const info = getStructuredPathInfo(path);
        if (handler.lastTrackingStack != null && handler.lastTrackingStack !== info) {
            const lastPattern = handler.lastTrackingStack;
            if (lastPattern.parentInfo !== info) {
                handler.engine.addDependentProp(lastPattern, info);
            }
        }
        if (typeof indexes === "undefined") {
            for (let i = 0; i < info.wildcardInfos.length; i++) {
                const wildcardPattern = info.wildcardInfos[i] ?? raiseError(`wildcardPattern is null`);
                const listIndex = handler.engine.getContextListIndex(wildcardPattern.pattern);
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
            resultValues.push(resolve$1(info.pattern, resultIndexes[i]));
        }
        return resultValues;
    };
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

function getListIndex(info, engine) {
    if (info.info.wildcardCount === 0) {
        return null;
    }
    let listIndex = null;
    const lastWildcardPath = info.info.lastWildcardPath ??
        raiseError(`lastWildcardPath is null`);
    if (info.wildcardType === "context") {
        listIndex = engine.getContextListIndex(lastWildcardPath) ??
            raiseError(`ListIndex not found: ${info.info.pattern}`);
    }
    else if (info.wildcardType === "all") {
        let parentListIndex = null;
        for (let i = 0; i < info.info.wildcardCount; i++) {
            const wildcardParentPattern = info.info.wildcardParentInfos[i] ?? raiseError(`wildcardParentPattern is null`);
            const listIndexes = Array.from(engine.getListIndexesSet(wildcardParentPattern, parentListIndex) ?? []);
            const wildcardIndex = info.wildcardIndexes[i] ?? raiseError(`wildcardIndex is null`);
            parentListIndex = listIndexes[wildcardIndex] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
        }
        listIndex = parentListIndex;
    }
    else if (info.wildcardType === "partial") ;
    else if (info.wildcardType === "none") ;
    return listIndex;
}

const matchIndexPropertyName = new RegExp(/^\$(\d+)$/);
function get(target, prop, receiver, handler) {
    let value;
    if (typeof prop === "string") {
        if (matchIndexPropertyName.test(prop)) {
            const number = prop.slice(1);
            const index = Number(number);
            const ref = handler.engine.getLastStatePropertyRef() ??
                raiseError(`get: this.engine.getLastStatePropertyRef() is null`);
            return ref.listIndex?.at(index - 1)?.index ?? raiseError(`ListIndex not found: ${prop}`);
        }
        else if (prop === "$resolve") {
            return resolve(target, prop, receiver, handler);
        }
        else if (prop === "$getAll") {
            return getAll(target, prop, receiver, handler);
        }
        else {
            const resolvedInfo = getResolvedPathInfo(prop);
            const listIndex = getListIndex(resolvedInfo, handler.engine);
            value = getByRef$1(target, resolvedInfo.info, listIndex, receiver, handler);
        }
    }
    else if (typeof prop === "symbol") {
        if (prop in handler.callableApi) {
            return handler.callableApi[prop](target, prop, receiver, handler);
        }
        value = Reflect.get(target, prop, receiver);
    }
    return value;
}

function set(target, prop, value, receiver, handler) {
    if (typeof prop === "string") {
        const resolvedInfo = getResolvedPathInfo(prop);
        const listIndex = getListIndex(resolvedInfo, handler.engine);
        return setByRef$1(target, resolvedInfo.info, listIndex, value, receiver, handler);
    }
    else {
        return Reflect.set(target, prop, value, receiver);
    }
}

class StateHandler {
    engine;
    cacheable = false;
    cache = {};
    lastTrackingStack = null;
    trackingStack = [];
    constructor(engine) {
        this.engine = engine;
    }
    callableApi = {
        [GetByRefSymbol]: getByRef,
        [SetByRefSymbol]: setByRef,
        [SetCacheableSymbol]: setCacheable,
        [ConnectedCallbackSymbol]: connectedCallback,
        [DisconnectedCallbackSymbol]: disconnectedCallback,
        [ResolveSymbol]: resolve,
        [GetAllSymbol]: getAll,
    };
    get(target, prop, receiver) {
        return get(target, prop, receiver, this);
    }
    set(target, prop, value, receiver) {
        return set(target, prop, value, receiver, this);
    }
}
function createStateProxy(engine, state) {
    return new Proxy(state, new StateHandler(engine));
}

const BLANK_LISTINDEXES_SET = new Set();
function buildListIndexTreeSub(engine, listInfos, info, listIndex, value) {
    const oldValue = engine.getList(info, listIndex) ?? [];
    if (oldValue === value) {
        return;
    }
    const oldListIndexesSet = engine.getListIndexesSet(info, listIndex) ?? BLANK_LISTINDEXES_SET;
    const oldListIndexesByItem = Map.groupBy(oldListIndexesSet, listIndex => oldValue[listIndex.index]);
    const newListIndexesSet = new Set();
    for (let i = 0; i < value.length; i++) {
        const item = value[i];
        const oldListIndexes = oldListIndexesByItem.get(item);
        let curListIndex = oldListIndexes?.shift();
        if (!curListIndex) {
            curListIndex = createListIndex(listIndex, i);
        }
        else {
            if (curListIndex.index !== i) {
                curListIndex.index = i;
                engine.updater.addUpdatedListIndex(curListIndex);
            }
        }
        newListIndexesSet.add(curListIndex);
    }
    engine.saveListIndexesSet(info, listIndex, newListIndexesSet);
    engine.saveList(info, listIndex, value.slice(0));
    const searchPath = info.pattern + ".*";
    for (const info of listInfos) {
        if (searchPath !== info.lastWildcardPath) {
            continue;
        }
        for (const subListIndex of newListIndexesSet) {
            const subValue = engine.stateProxy[GetByRefSymbol](info, subListIndex);
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

function extractListIndexes(info, listIndex, engine) {
    const wildcardParentInfos = info.wildcardParentInfos ?? [];
    const _extractListIndexes = (pos, currentListIndex, resultListIndexes) => {
        const wildcardParentInfo = wildcardParentInfos[pos];
        if (!wildcardParentInfo) {
            if (currentListIndex) {
                resultListIndexes.push(currentListIndex);
            }
            return;
        }
        const subListIndex = listIndex?.at(pos) ?? null;
        if (subListIndex) {
            _extractListIndexes(pos + 1, subListIndex, resultListIndexes);
        }
        else {
            const listIndexes = engine.getListIndexesSet(wildcardParentInfo, currentListIndex);
            for (const loopListIndex of listIndexes ?? []) {
                _extractListIndexes(pos + 1, loopListIndex, resultListIndexes);
            }
        }
    };
    const resultListIndexes = [];
    _extractListIndexes(0, listIndex, resultListIndexes);
    return resultListIndexes;
}
function _collectAffectedGetters(refInfo, refListIndex, engine, resultPathInfos, resultRefs) {
    //  if (engine.listInfoSet.has(refInfo)) return;
    if (resultPathInfos.has(refInfo))
        return;
    const dependentPathInfos = engine.dependentTree.get(refInfo);
    for (const dependentPathInfo of dependentPathInfos ?? []) {
        if (engine.listInfoSet.has(refInfo) && dependentPathInfo.parentInfo === refInfo && dependentPathInfo.lastSegment === "*") {
            continue;
        }
        let dependentListIndex = null;
        let updateList = false;
        for (let i = dependentPathInfo.wildcardParentInfos.length - 1; i >= 0; i--) {
            const wildcardParentInfo = dependentPathInfo.wildcardParentInfos[i];
            if (resultPathInfos.has(wildcardParentInfo)) {
                updateList = true;
                break;
            }
            const pos = refInfo.wildcardParentInfos.indexOf(wildcardParentInfo);
            if (pos < 0)
                continue;
            dependentListIndex = refListIndex?.at(pos) ?? null;
            if (dependentListIndex !== null)
                break;
        }
        if (updateList) {
            continue;
        }
        if (dependentPathInfo.wildcardParentInfos.length > 0) {
            const extractlistIndexes = extractListIndexes(dependentPathInfo, dependentListIndex, engine);
            for (const listIndex of extractlistIndexes) {
                resultRefs.push({ info: dependentPathInfo, listIndex });
                _collectAffectedGetters(dependentPathInfo, listIndex, engine, resultPathInfos, resultRefs);
            }
        }
        else {
            resultRefs.push({ info: dependentPathInfo, listIndex: null });
            _collectAffectedGetters(dependentPathInfo, null, engine, resultPathInfos, resultRefs);
        }
    }
}
function collectAffectedGetters(updateRefs, engine) {
    const resultPathInfos = new Set();
    const resultRefs = [];
    for (const ref of updateRefs) {
        const info = ref.info;
        const listIndex = ref.listIndex;
        if (resultPathInfos.has(info))
            continue;
        _collectAffectedGetters(info, listIndex, engine, resultPathInfos, resultRefs);
        resultPathInfos.add(info);
    }
    return resultRefs;
}

class Updater {
    processList = [];
    updatedProperties = new Set();
    updatedValues = {};
    engine;
    constructor(engine) {
        this.engine = engine;
    }
    addProcess(process) {
        this.processList.push(process);
        this.waitForQueueEntry.resolve();
    }
    addUpdatedStatePropertyRefValue(info, listIndex, value) {
        const refId = getStatePropertyRefId(info, listIndex);
        this.updatedProperties.add({ info, listIndex });
        this.updatedValues[refId] = value;
        this.waitForQueueEntry.resolve();
    }
    addUpdatedListIndex(listIndex) {
        this.updatedProperties.add(listIndex);
        this.waitForQueueEntry.resolve();
    }
    terminate() {
        const waitForMainLoopTerminate = Promise.withResolvers();
        this.waitForQueueEntry.resolve(waitForMainLoopTerminate);
        return waitForMainLoopTerminate;
    }
    waitForQueueEntry = Promise.withResolvers();
    async main(waitForComponentInit) {
        await waitForComponentInit.promise;
        const config = getGlobalConfig();
        while (true) {
            try {
                const waitForMainLoopTerminate = await this.waitForQueueEntry.promise;
                config.debug && performance.mark(`start`);
                Updater.updatingCount++;
                try {
                    await this.exec();
                    if (config.debug) {
                        performance.mark(`end`);
                        performance.measure(`exec`, `start`, `end`);
                        console.log(performance.getEntriesByType("measure"));
                        performance.clearMeasures(`exec`);
                        performance.clearMarks(`start`);
                        performance.clearMarks(`end`);
                    }
                }
                finally {
                    Updater.updatingCount--;
                    if (waitForMainLoopTerminate) {
                        waitForMainLoopTerminate.resolve();
                        break;
                    }
                }
            }
            catch (e) {
                console.error(e);
            }
            finally {
                this.waitForQueueEntry = Promise.withResolvers();
            }
        }
    }
    async updateState() {
        while (this.processList.length > 0) {
            const processList = this.processList;
            this.processList = [];
            for (let i = 0; i < processList.length; i++) {
                const process = processList[i];
                await process();
            }
        }
    }
    async rebuild() {
        const retArrayElementBindings = [];
        const retBindings = [];
        const engine = this.engine;
        const processedListIndexes = new Set();
        const processedPropertyRefIdsSet = new Set();
        while (this.updatedProperties.size > 0) {
            const updatedProiperties = Array.from(this.updatedProperties.values());
            const updatedRefs = []; // 更新されたプロパティ参照のリスト
            const arrayPropertyRefs = [];
            const arrayElementPropertyRefs = [];
            this.updatedProperties.clear();
            for (let i = 0; i < updatedProiperties.length; i++) {
                const item = updatedProiperties[i];
                let bindings;
                if ("index" in item) {
                    if (processedListIndexes.has(item))
                        continue;
                    const listIndex = item;
                    bindings = engine.bindingsByListIndex.get(listIndex);
                    processedListIndexes.add(listIndex);
                }
                else {
                    const statePropertyRefId = getStatePropertyRefId(item.info, item.listIndex);
                    if (processedPropertyRefIdsSet.has(statePropertyRefId))
                        continue;
                    const statePropertyRef = item;
                    if (engine.listInfoSet.has(statePropertyRef.info)) {
                        arrayPropertyRefs.push(statePropertyRef);
                    }
                    if (engine.elementInfoSet.has(statePropertyRef.info)) {
                        arrayElementPropertyRefs.push(statePropertyRef);
                    }
                    bindings = engine.getBindings(item.info, item.listIndex);
                    processedPropertyRefIdsSet.add(statePropertyRefId);
                    updatedRefs.push(statePropertyRef);
                }
                retBindings.push(...bindings ?? []);
            }
            // リストインデックスの構築
            const builtStatePropertyRefIds = new Set();
            for (let i = 0; i < arrayPropertyRefs.length; i++) {
                const arrayPropertyRef = arrayPropertyRefs[i];
                const statePropertyRefId = getStatePropertyRefId(arrayPropertyRef.info, arrayPropertyRef.listIndex);
                const value = this.updatedValues[statePropertyRefId] ?? null;
                buildListIndexTree(engine, arrayPropertyRef.info, arrayPropertyRef.listIndex, value);
                builtStatePropertyRefIds.add(statePropertyRefId);
            }
            const parentRefByRefId = {};
            const statePropertyRefByStatePropertyRefId = Object.groupBy(arrayElementPropertyRefs, ref => {
                if (ref.info.parentInfo === null)
                    raiseError(`parentInfo is null`);
                const parentInfo = ref.info.parentInfo;
                const parentListIndex = (ref.info.wildcardCount === ref.info.parentInfo.wildcardCount) ?
                    ref.listIndex : (ref.listIndex?.parentListIndex ?? null);
                const parentRefId = getStatePropertyRefId(parentInfo, parentListIndex);
                if (!(parentRefId in parentRefByRefId)) {
                    parentRefByRefId[parentRefId] = { info: parentInfo, listIndex: parentListIndex };
                }
                return parentRefId;
            });
            for (const [parentRefIdKey, refs] of Object.entries(statePropertyRefByStatePropertyRefId)) {
                const parentRefId = Number(parentRefIdKey);
                if (builtStatePropertyRefIds.has(parentRefId))
                    continue;
                if (typeof refs === "undefined")
                    continue;
                const parentRef = parentRefByRefId[parentRefId];
                if (parentRef === null)
                    continue;
                const values = [];
                const listIndexes = [];
                for (let j = 0; j < refs.length; j++) {
                    const ref = refs[j];
                    const statePropertyRefId = getStatePropertyRefId(ref.info, ref.listIndex);
                    const value = this.updatedValues[statePropertyRefId] ?? null;
                    values.push(value);
                    const listIndex = ref.listIndex;
                    if (listIndex === null) {
                        throw new Error("listIndex is null");
                    }
                    listIndexes.push(listIndex);
                }
                const bindings = engine.getBindings(parentRef.info, parentRef.listIndex);
                for (const binding of bindings) {
                    const arrayElementBinding = {
                        parentRef,
                        binding,
                        listIndexes,
                        values
                    };
                    retArrayElementBindings.push(arrayElementBinding);
                }
            }
            const updatingRefs = collectAffectedGetters(updatedRefs, engine);
            for (const updatingRef of updatingRefs) {
                const bindings = engine.getBindings(updatingRef.info, updatingRef.listIndex);
                retBindings.push(...bindings ?? []);
            }
        }
        this.updatedValues = {};
        return { bindings: retBindings, arrayElementBindings: retArrayElementBindings };
    }
    async render(bindings) {
        await this.engine.stateProxy[SetCacheableSymbol](async () => {
            return render(bindings);
        });
    }
    async exec() {
        while (this.processList.length !== 0 || this.updatedProperties.size !== 0) {
            // update state
            await this.updateState();
            // rebuild
            const { bindings, arrayElementBindings } = await this.rebuild();
            // render
            for (const arrayElementBinding of arrayElementBindings) {
                arrayElementBinding.binding.bindingNode.updateElements(arrayElementBinding.listIndexes, arrayElementBinding.values);
            }
            if (bindings.length > 0) {
                await this.render(bindings);
            }
        }
    }
    static updatingCount = 0;
}
function createUpdater(engine) {
    return new Updater(engine);
}

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

class ComponentEngine {
    type = 'autonomous';
    config;
    template;
    styleSheet;
    stateClass;
    state;
    stateProxy;
    updater;
    inputFilters;
    outputFilters;
    bindContent;
    baseClass = HTMLElement;
    owner;
    trackedGetters;
    listInfoSet = new Set();
    elementInfoSet = new Set();
    bindingsByListIndex = new WeakMap();
    dependentTree = new Map();
    bindingsByComponent = new WeakMap();
    #waitForInitialize = Promise.withResolvers();
    #loopContext = null;
    #stackStructuredPathInfo = [];
    #stackListIndex = [];
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
        this.stateProxy = createStateProxy(this, this.state);
        this.updater = createUpdater(this);
        this.inputFilters = componentClass.inputFilters;
        this.outputFilters = componentClass.outputFilters;
        this.owner = owner;
        this.trackedGetters = componentClass.trackedGetters;
        // 依存関係の木を作成する
        const checkDependentProp = (info) => {
            const parentInfo = info.parentInfo;
            if (parentInfo === null)
                return;
            this.addDependentProp(info, parentInfo);
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
        this.bindContent = createBindContent(null, componentClass.id, this, null, null); // this.stateArrayPropertyNamePatternsが変更になる可能性がある
        for (const info of this.listInfoSet) {
            if (info.wildcardCount > 0)
                continue;
            const value = this.stateProxy[GetByRefSymbol](info, null);
            buildListIndexTree(this, info, null, value);
        }
        this.updater.main(this.#waitForInitialize);
    }
    async connectedCallback() {
        this.owner.state[BindParentComponentSymbol]();
        attachShadow(this.owner, this.config, this.styleSheet);
        await this.stateProxy[ConnectedCallbackSymbol]();
        await this.stateProxy[SetCacheableSymbol](async () => {
            this.bindContent.render();
        });
        this.bindContent.mount(this.owner.shadowRoot ?? this.owner);
        this.#waitForInitialize.resolve();
    }
    async disconnectedCallback() {
        await this.stateProxy[DisconnectedCallbackSymbol]();
    }
    async setLoopContext(loopContext, callback) {
        try {
            if (this.#loopContext !== null) {
                throw new Error("loopContext is already set");
            }
            this.#loopContext = loopContext;
            await this.asyncSetStatePropertyRef(loopContext.info, loopContext.listIndex, async () => {
                await callback();
            });
        }
        finally {
            this.#loopContext = null;
        }
    }
    async asyncSetStatePropertyRef(info, listIndex, callback) {
        this.#stackStructuredPathInfo.push(info);
        this.#stackListIndex.push(listIndex);
        try {
            return await callback();
        }
        finally {
            this.#stackStructuredPathInfo.pop();
            this.#stackListIndex.pop();
        }
    }
    setStatePropertyRef(info, listIndex, callback) {
        this.#stackStructuredPathInfo.push(info);
        this.#stackListIndex.push(listIndex);
        try {
            return callback();
        }
        finally {
            this.#stackStructuredPathInfo.pop();
            this.#stackListIndex.pop();
        }
    }
    getLastStatePropertyRef() {
        if (this.#stackStructuredPathInfo.length === 0) {
            return null;
        }
        const info = this.#stackStructuredPathInfo[this.#stackStructuredPathInfo.length - 1];
        if (typeof info === "undefined") {
            return null;
        }
        const listIndex = this.#stackListIndex[this.#stackListIndex.length - 1];
        if (typeof listIndex === "undefined") {
            return null;
        }
        return { info, listIndex };
    }
    getContextListIndex(structuredPath) {
        const lastRef = this.getLastStatePropertyRef();
        if (lastRef === null) {
            return null;
        }
        const info = lastRef.info;
        const index = info.wildcardPaths.indexOf(structuredPath);
        if (index >= 0) {
            return lastRef.listIndex?.at(index) ?? null;
        }
        return null;
    }
    getLoopContexts() {
        if (this.#loopContext === null) {
            throw new Error("loopContext is null");
        }
        return this.#loopContext.serialize();
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
    getListIndexesSet(info, listIndex) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
        return saveInfo.listIndexesSet;
    }
    getList(info, listIndex) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
        return saveInfo.list;
    }
    addDependentProp(info, refInfo) {
        let dependents = this.dependentTree.get(refInfo);
        if (typeof dependents === "undefined") {
            dependents = new Set();
            this.dependentTree.set(refInfo, dependents);
        }
        dependents.add(info);
    }
    getPropertyValue(info, listIndex) {
        // プロパティの値を取得する
        return this.stateProxy[GetByRefSymbol](info, listIndex);
    }
    setPropertyValue(info, listIndex, value) {
        // プロパティの値を設定する
        this.updater.addProcess(() => {
            this.stateProxy[SetByRefSymbol](info, listIndex, value);
        });
    }
}
function createComponentEngine(config, component) {
    return new ComponentEngine(config, component);
}

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

function registerHtml(id, html) {
    const template = document.createElement("template");
    template.dataset.id = id.toString();
    template.innerHTML = replaceMustacheWithTemplateTag(html);
    replaceTemplateTagWithComment(id, template);
}

function getBaseClass(extendTagName) {
    return extendTagName ? document.createElement(extendTagName).constructor : HTMLElement;
}

function getComponentConfig(userConfig) {
    const globalConfig = getGlobalConfig();
    return {
        enableShadowDom: userConfig.enableShadowDom ?? globalConfig.enableShadowDom,
        extends: userConfig.extends ?? null,
    };
}

class ComponentState {
    engine;
    constructor(engine) {
        this.engine = engine;
    }
    bindParentProperty(binding) {
        const propName = binding.bindingNode.subName;
        Object.defineProperty(this.engine.state, propName, {
            get: () => {
                return binding.bindingState.filteredValue;
            },
            set: (value) => {
                return binding.updateStateValue(value);
            },
        });
    }
    bindParentComponent() {
        // bindParentComponent
        const parent = this.engine.owner.parentStructiveComponent;
        if (parent === null) {
            return;
        }
        const bindings = parent.getBindingsFromChild(this.engine.owner);
        for (const binding of bindings ?? []) {
            this.bindParentProperty(binding);
        }
    }
    render(name, value) {
        // render
        const info = getStructuredPathInfo(name);
        this.engine.updater.addUpdatedStatePropertyRefValue(info, null, value);
    }
    getPropertyValue(name) {
        // getPropertyValue
        const info = getStructuredPathInfo(name);
        return this.engine.getPropertyValue(info, null);
    }
    setPropertyValue(name, value) {
        // setPropertyValue
        const info = getStructuredPathInfo(name);
        this.engine.setPropertyValue(info, null, value);
    }
}
class ComponentStateHandler {
    get(state, prop, receiver) {
        if (prop === RenderSymbol) {
            return state.render.bind(state);
        }
        else if (prop === BindParentComponentSymbol) {
            return state.bindParentComponent.bind(state);
        }
        else if (typeof prop === 'string') {
            return state.getPropertyValue(prop);
        }
        else {
            return Reflect.get(state, prop, receiver);
        }
    }
    set(state, prop, value, receiver) {
        if (typeof prop === 'string') {
            state.setPropertyValue(prop, value);
            return true;
        }
        else {
            return Reflect.set(state, prop, value, receiver);
        }
    }
}
const createComponentState = (engine) => {
    return new Proxy(new ComponentState(engine), new ComponentStateHandler());
};

function findStructiveParent(el) {
    let current = el.parentNode;
    while (current) {
        if (current.state && current.isStructive) {
            return current;
        }
        current = current.parentNode;
        if (current instanceof ShadowRoot) {
            if (current.host && current.host.state && current.host.isStructive) {
                return current.host;
            }
            current = current.host;
        }
    }
    return null;
}
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
        #componentState;
        constructor() {
            super();
            this.#engine = createComponentEngine(componentConfig, this);
            this.#componentState = createComponentState(this.#engine);
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
            return this.#componentState;
        }
        get isStructive() {
            return this.#engine.stateClass.$isStructive ?? false;
        }
        getBindingsFromChild(component) {
            return this.#engine.bindingsByComponent.get(component) ?? null;
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
        static #trackedGetters = null;
        static get trackedGetters() {
            if (this.#trackedGetters === null) {
                this.#trackedGetters = new Set();
                let currentProto = this.stateClass.prototype;
                while (currentProto && currentProto !== Object.prototype) {
                    const trackedGetters = Object.getOwnPropertyDescriptors(currentProto);
                    if (trackedGetters) {
                        for (const [key, desc] of Object.entries(trackedGetters)) {
                            if (desc.get) {
                                this.#trackedGetters.add(key);
                            }
                        }
                    }
                    currentProto = Object.getPrototypeOf(currentProto);
                }
            }
            return this.#trackedGetters;
        }
    };
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
    const scriptModule = script ? await import("data:text/javascript;charset=utf-8," + script.text) : {};
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

async function loadSingleFileComponent(path) {
    const response = await fetch(import.meta.resolve(path));
    const text = await response.text();
    return createSingleFileComponent(text);
}

function registerComponentClass(tagName, componentClass) {
    componentClass.define(tagName);
}

async function registerSingleFileComponents(singleFileComponents) {
    for (const [tagName, path] of Object.entries(singleFileComponents)) {
        let componentData = null;
        if (config$2.enableRouter) {
            const routePath = path.startsWith("@routes") ? path.slice(7) : path; // remove the prefix 'routes:'
            entryRoute(tagName, routePath === "/root" ? "/" : routePath); // routing
            componentData = await loadSingleFileComponent("@routes" + (routePath === "/" ? "/root" : routePath));
        }
        else {
            componentData = await loadSingleFileComponent(path);
        }
        const componentClass = createComponentClass(componentData);
        registerComponentClass(tagName, componentClass);
    }
}

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

function bootstrap() {
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

const config = config$2;
let initialized = false;
async function defineComponents(singleFileComponents) {
    await registerSingleFileComponents(singleFileComponents);
    if (config.autoInit) {
        bootstrapStructive();
    }
}
function bootstrapStructive() {
    if (!initialized) {
        bootstrap();
        initialized = true;
    }
}

export { bootstrapStructive, config, defineComponents };
//# sourceMappingURL=structive.js.map
