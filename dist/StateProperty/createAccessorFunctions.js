import { getStructuredPathInfo } from "./getStructuredPathInfo";
export function createAccessorFunctions(info, trackedGetters) {
    const matchPaths = new Set(info.cumulativePaths).intersection(trackedGetters);
    let len = -1;
    let matchPath = '';
    for (const curPath of matchPaths) {
        const pathSegments = curPath.split('.');
        if (pathSegments.length === 1) {
            continue;
        }
        if (pathSegments.length > len) {
            len = pathSegments.length;
            matchPath = curPath;
        }
    }
    if (matchPath.length > 0) {
        const matchInfo = getStructuredPathInfo(matchPath);
        const segments = [];
        let count = matchInfo.wildcardCount;
        for (let i = matchInfo.pathSegments.length; i < info.pathSegments.length; i++) {
            const segment = info.pathSegments[i];
            if (segment === '*') {
                segments.push("[this.$" + (count + 1) + "]");
                count++;
            }
            else {
                segments.push("." + segment);
            }
        }
        const path = segments.join('');
        return {
            get: new Function('', `return this["${matchPath}"]${path};`),
            set: new Function('value', `this["${matchPath}"]${path} = value;`),
        };
    }
    else {
        const segments = [];
        let count = 0;
        for (const segment of info.pathSegments) {
            if (segment === '*') {
                segments.push("[this.$" + (count + 1) + "]");
                count++;
            }
            else {
                segments.push((segments.length > 0 ? "." : "") + segment);
            }
        }
        const path = segments.join('');
        return {
            get: new Function('', `return this.${path};`),
            set: new Function('value', `this.${path} = value;`),
        };
    }
}
