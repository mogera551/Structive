/**
 * Runtime polyfills for Set.prototype methods declared in src/@types/polyfill.d.ts
 * Ensures methods exist at runtime for tests and library code.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setProto = Set.prototype;
if (typeof setProto.union !== 'function') {
    setProto.union = function (other) {
        const result = new Set(this);
        for (const v of other)
            result.add(v);
        return result;
    };
}
if (typeof setProto.intersection !== 'function') {
    setProto.intersection = function (other) {
        const result = new Set();
        // iterate smaller set for performance
        const [small, big] = this.size <= other.size ? [this, other] : [other, this];
        for (const v of small)
            if (big.has(v))
                result.add(v);
        return result;
    };
}
if (typeof setProto.difference !== 'function') {
    setProto.difference = function (other) {
        const result = new Set();
        for (const v of this)
            if (!other.has(v))
                result.add(v);
        return result;
    };
}
if (typeof setProto.symmetricDifference !== 'function') {
    setProto.symmetricDifference = function (other) {
        const result = new Set();
        for (const v of this)
            if (!other.has(v))
                result.add(v);
        for (const v of other)
            if (!this.has(v))
                result.add(v);
        return result;
    };
}
if (typeof setProto.isSubsetOf !== 'function') {
    setProto.isSubsetOf = function (other) {
        for (const v of this)
            if (!other.has(v))
                return false;
        return true;
    };
}
if (typeof setProto.isSupersetOf !== 'function') {
    setProto.isSupersetOf = function (other) {
        for (const v of other)
            if (!this.has(v))
                return false;
        return true;
    };
}
export {};
