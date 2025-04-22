import { IBindContent, IBinding } from "../DataBinding/types";
import { FilterWithOptions } from "../Filter/types";
import { IListIndex } from "../ListIndex/types";
import { ILoopContext } from "../LoopContext/types";
import { IState, IStateProxy, IStructiveState } from "../StateClass/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IUpdater } from "../Updater/types";
import { ComponentType, IComponentConfig, StructiveComponent } from "../WebComponents/types";
export interface IComponentEngine {
    type: ComponentType;
    config: IComponentConfig;
    template: HTMLTemplateElement;
    styleSheet: CSSStyleSheet;
    stateClass: IStructiveState;
    state: IState;
    stateProxy: IStateProxy;
    updater: IUpdater;
    inputFilters: FilterWithOptions;
    outputFilters: FilterWithOptions;
    bindContent: IBindContent;
    baseClass: typeof HTMLElement;
    owner: StructiveComponent;
    trackedGetters: Set<string>;
    getContextListIndex(patternName: string): IListIndex | null;
    getLoopContexts(): ILoopContext[];
    getLastStatePropertyRef(): {
        info: IStructuredPathInfo;
        listIndex: IListIndex;
    } | null;
    listInfoSet: Set<IStructuredPathInfo>;
    elementInfoSet: Set<IStructuredPathInfo>;
    bindingsByListIndex: WeakMap<IListIndex, Set<IBinding>>;
    dependentTree: Map<IStructuredPathInfo, Set<IStructuredPathInfo>>;
    setLoopContext(loopContext: ILoopContext, callback: () => Promise<void>): Promise<void>;
    asyncSetStatePropertyRef(info: IStructuredPathInfo | IStructuredPathInfo[], listIndex: IListIndex | IListIndex[], callback: () => Promise<any>): Promise<any>;
    setStatePropertyRef(info: IStructuredPathInfo, listIndex: IListIndex, callback: () => any): any;
    connectedCallback(): Promise<void>;
    disconnectedCallback(): Promise<void>;
    saveBinding(pattern: IStructuredPathInfo, listIndex: IListIndex | null, binding: IBinding): void;
    saveListIndexesSet(pattern: IStructuredPathInfo, listIndex: IListIndex | null, saveListIndexesSet: Set<IListIndex>): void;
    saveList(pattern: IStructuredPathInfo, listIndex: IListIndex | null, list: any[]): void;
    getBindings(pattern: IStructuredPathInfo, listIndex: IListIndex | null): IBinding[];
    getListIndexesSet(pattern: IStructuredPathInfo, listIndex: IListIndex | null): Set<IListIndex> | null;
    getList(pattern: IStructuredPathInfo, listIndex: IListIndex | null): any[] | null;
    addDependentProp(pattern: IStructuredPathInfo, dependentPattern: IStructuredPathInfo): void;
}
export interface ISaveInfoByResolvedPathInfo {
    list: any[] | null;
    listIndexesSet: Set<IListIndex> | null;
    bindings: IBinding[];
}
