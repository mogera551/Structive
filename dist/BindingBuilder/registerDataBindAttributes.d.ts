import { IDataBindAttributes } from "./types";
export declare function registerDataBindAttributes(id: number, content: DocumentFragment, rootId?: number): IDataBindAttributes[];
export declare const getDataBindAttributesById: (id: number) => IDataBindAttributes[];
export declare const getListPathsSetById: (id: number) => Set<string>;
export declare const getPathsSetById: (id: number) => Set<string>;
