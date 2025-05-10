class dependencyWalker {
    engine;
    entryRef;
    traced = new Set();
    constructor(engine, entryRef) {
        this.engine = engine;
        this.entryRef = entryRef;
    }
    walkSub(info, callback) {
        if (this.traced.has(info)) {
            return;
        }
        this.traced.add(info);
        callback(this.entryRef, info);
        const refs = this.engine.dependentTree.get(info) ?? [];
        for (const ref of refs) {
            this.walkSub(ref, callback);
        }
    }
    walk(callback) {
        const traced = new Set();
        this.walkSub(this.entryRef.info, callback);
    }
}
export function createDependencyWalker(engine, entryRef) {
    return new dependencyWalker(engine, entryRef);
}
