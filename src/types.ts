
export type Constructor<T = {}> = new (...args: any[]) => T;

export type Primitive = string | number | bigint | boolean | symbol | null | undefined;