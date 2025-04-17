import { IListIndex } from "../ListIndex/types";
import { IComponentEngine } from "../ComponentEngine/types";
import { IBindContent, IBinding } from "./types";
export declare function createBindContent(parentBinding: IBinding | null, id: number, engine: IComponentEngine, loopContext: string | null, listIndex: IListIndex | null): IBindContent;
