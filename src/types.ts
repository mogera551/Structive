
export type Constructor<T = {}> = new (...args: any[]) => T;

export type primitive = string | number | boolean | bigint | symbol | null | undefined;
