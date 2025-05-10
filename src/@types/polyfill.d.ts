
interface ObjectConstructor {
  /**
   * Groups members of an iterable according to the return value of the passed callback.
   * @param items An iterable.
   * @param keySelector A callback which will be invoked for each item in items.
   */
  groupBy<K extends PropertyKey, T>(
      items: Iterable<T>,
      keySelector: (item: T, index: number) => K,
  ): Partial<Record<K, T[]>>;
  getOwnPropertyDescriptors<T>(o: T): {
    [P in keyof T]: TypedPropertyDescriptor<T[P]>; 
  } & { [x: string]: PropertyDescriptor; };
}

interface MapConstructor {
  /**
   * Groups members of an iterable according to the return value of the passed callback.
   * @param items An iterable.
   * @param keySelector A callback which will be invoked for each item in items.
   */
  groupBy<K, T>(
      items: Iterable<T>,
      keySelector: (item: T, index: number) => K,
  ): Map<K, T[]>;
}

interface PromiseWithResolvers<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

interface PromiseConstructor {
  /**
   * Creates a new Promise with the given resolvers.
   * @returns An object containing the promise and its resolvers.
   */
  withResolvers<T>(): PromiseWithResolvers<T>;
}

interface Array<T> {
  /**
   * Sorts the array in place.
   * @param compareFn A callback which will be invoked for each pair of items.
   */
  toSorted(compareFn: (a: T, b: T) => number): this;
  /**
   * Reverses the array in place.
   */
  toReversed(): this;
}

interface Set<T> {
  intersection(other: Set<T>): Set<T>;
  union(other: Set<T>): Set<T>;
  difference(other: Set<T>): Set<T>;
  symmetricDifference(other: Set<T>): Set<T>;
  isSubsetOf(other: Set<T>): boolean;
  isSupersetOf(other: Set<T>): boolean;
}