class _Updater {
    version;
    constructor(version) {
        this.version = version;
    }
    static create(componentId) {
        let version = this.versionByComponentId.get(componentId);
        if (typeof version === "undefined") {
            version = 0;
        }
        version++;
        this.versionByComponentId.set(componentId, version);
        return new _Updater(version);
    }
    static versionByComponentId = new Map();
}
export const Updater = _Updater;
