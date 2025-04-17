export type FilterFn = (value: any) => any;
export type FilterWithOptionsFn = (options?: string[]) => FilterFn;
export type FilterWithOptions = Record<string, FilterWithOptionsFn>;
export type Filters = FilterFn[];
export type FilterFnByBuiltinFiltersFn = (filters: FilterWithOptions) => FilterFn;
export type FilterFnByBuiltinFiltersFnByNameAndOptions = (name: string, options: string[]) => FilterFnByBuiltinFiltersFn;
