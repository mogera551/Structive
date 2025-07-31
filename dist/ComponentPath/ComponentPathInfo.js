import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
class ComponentPathInfo {
    path;
    info;
    withGetter = false;
    withSetter = false;
    isList = false;
    existsUI = false;
    isTracked = false;
    optimized = false; // 最適化されたパス情報かどうか
    constructor(path) {
        this.path = path;
        this.info = getStructuredPathInfo(path);
    }
}
export function createComponentPathInfo(path) {
    return new ComponentPathInfo(path);
}
