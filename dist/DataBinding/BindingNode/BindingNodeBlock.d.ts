import { Filters } from "../../Filter/types";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode";
export declare class BindingNodeBlock extends BindingNode {
    #private;
    get id(): number;
    constructor(binding: IBinding, node: Node, name: string, filters: Filters, event: string | null);
}
