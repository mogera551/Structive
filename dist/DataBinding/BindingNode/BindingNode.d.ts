import { Filters } from "../../Filter/types";
import { IListIndex } from "../../ListIndex/types";
import { IBindContent, IBinding } from "../types";
import { IBindingNode } from "./types";
export declare class BindingNode implements IBindingNode {
    #private;
    get node(): Node;
    get name(): string;
    get binding(): IBinding;
    get event(): string | null;
    get filters(): Filters;
    get bindContents(): Set<IBindContent>;
    constructor(binding: IBinding, node: Node, name: string, filters: Filters, event: string | null);
    init(): void;
    update(): void;
    assignValue(value: any): void;
    updateElements(listIndexes: IListIndex[], values: any[]): void;
    get isSelectElement(): boolean;
}
