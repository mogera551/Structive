import { IComponentEngine } from "../ComponentEngine/types";
import { getStructuredPathInfo } from "./getStructuredPathInfo";
import { IAccessorFunctions, IStructuredPathInfo } from "./types";

const checkSegmentRegexp = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
const checkPathRegexp = /^[a-zA-Z_$][0-9a-zA-Z_$]*(\.[a-zA-Z_$][0-9a-zA-Z_$]*|\.\*)*$/;

export function createAccessorFunctions(info: IStructuredPathInfo, getters: Set<string>): IAccessorFunctions {
  const matchPaths = new Set(info.cumulativePaths).intersection(getters);
  let len = -1;
  let matchPath = '';
  for(const curPath of matchPaths) {
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
    if (!checkPathRegexp.test(matchPath)) {
      throw new Error(`Invalid path: ${matchPath}`);
    }
    const matchInfo = getStructuredPathInfo(matchPath);
    const segments = [];
    let count = matchInfo.wildcardCount;
    for(let i = matchInfo.pathSegments.length; i < info.pathSegments.length; i++) {
      const segment = info.pathSegments[i];
      if (segment === '*') {
        segments.push("[this.$" + (count + 1) + "]");
        count++;
      } else {
        if (!checkSegmentRegexp.test(segment)) {
          throw new Error(`Invalid segment name: ${segment}`);
        }
        segments.push("." + segment);
      }
    }
    const path = segments.join('');
    return {
      get : new Function('', `return this["${matchPath}"]${path};`) as ()=> any,
      set : new Function('value', `this["${matchPath}"]${path} = value;`) as (value: any) => void,
    }
  } else {
    const segments = [];
    let count = 0;
    for(const segment of info.pathSegments) {
      if (segment === '*') {
        segments.push("[this.$" + (count + 1) + "]");
        count++;
      } else {
        if (!checkSegmentRegexp.test(segment)) {
          throw new Error(`Invalid segment name: ${segment}`);
        }
        segments.push((segments.length > 0 ? "." : "") + segment);
      }
    }
    const path = segments.join('');
    return {
      get : new Function('', `return this.${path};`) as ()=> any,
      set : new Function('value', `this.${path} = value;`) as (value: any) => void,
    }
  }

}
