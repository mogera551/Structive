class ListIndexTree {
    rootIndexes = [];
    map = new WeakMap();
    addChildIndexes(parent, children) {
        if (parent) {
            this.map.set(parent, children);
        }
        else {
            this.rootIndexes = children;
        }
    }
    getListIndexes(parent) {
        if (parent) {
            return this.map.get(parent) || [];
        }
        else {
            return this.rootIndexes;
        }
    }
}
export function createListIndexTree() {
    return new ListIndexTree();
}
