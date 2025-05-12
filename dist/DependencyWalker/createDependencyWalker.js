import { createDependencyKey } from "./createDependencyEdge";
class dependencyWalker {
    engine;
    entryRef;
    traced = new Set();
    constructor(engine, entryRef) {
        this.engine = engine;
        this.entryRef = entryRef;
    }
    walkSub(info, type, callback) {
        const key = createDependencyKey(info, type);
        if (this.traced.has(key)) {
            return;
        }
        this.traced.add(key);
        callback(this.entryRef, info, type);
        const edges = this.engine.dependentTree.get(info) ?? [];
        for (const edge of edges) {
            const overridedType = edge.type === "structured" ? type : edge.type;
            this.walkSub(edge.info, overridedType, callback);
        }
    }
    walk(callback) {
        const traced = new Set();
        this.walkSub(this.entryRef.info, "structured", callback);
    }
}
export function createDependencyWalker(engine, entryRef) {
    return new dependencyWalker(engine, entryRef);
}
