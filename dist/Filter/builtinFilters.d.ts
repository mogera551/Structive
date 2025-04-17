import { FilterWithOptions } from "./types";
export declare const outputBuiltinFilters: FilterWithOptions;
export declare const inputBuiltinFilters: FilterWithOptions;
export declare const builtinFilterFn: (name: string, options: string[]) => (filters: FilterWithOptions) => import("./types").FilterFn;
