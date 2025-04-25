import { raiseError } from '../utils.js';
import { IStructuredPathInfo } from './types';

/**
 * プロパティ名に"constructor"や"toString"などの予約語やオブジェクトのプロパティ名を
 * 上書きするような名前も指定できるように、Mapを検討したが、そもそもそのような名前を
 * 指定することはないと考え、Mapを使わないことにした。
 */
const _cache: { [key:string]: IStructuredPathInfo } = {};
//const _cache: Map<string, IStructuredPathInfo> = new Map();

/**
 * パターン情報を取得します
 * @param pattern パターン
 * @returns {IPatternInfo} パターン情報
 */
class StructuredPathInfo implements IStructuredPathInfo {
  static id = 0;
  id = ++StructuredPathInfo.id;
  pattern;
  pathSegments;
  lastSegment;
  cumulativePaths;
  cumulativeInfos;
  wildcardPaths;
  wildcardInfos;
  wildcardParentPaths;
  wildcardParentInfos;
  lastWildcardPath;
  lastWildcardInfo;
  parentPath;
  parentInfo;
  wildcardCount;

  constructor(pattern: string) {
    const getPattern = (_pattern: string): IStructuredPathInfo => {
      return (pattern === _pattern) ? this : getStructuredPathInfo(_pattern);
    };
    const pathSegments = pattern.split(".");
    const cumulativePaths = [];
    const cumulativeInfos: IStructuredPathInfo[] = [];
    const wildcardPaths = [];
    const wildcardInfos = [];
    const wildcardParentPaths = [];
    const wildcardParentInfos = [];
    let currentPatternPath = "", prevPatternPath = "";
    let wildcardCount = 0;
    for(let i = 0; i < pathSegments.length; i++) {
      currentPatternPath += pathSegments[i];
      if (pathSegments[i] === "*") {
        wildcardPaths.push(currentPatternPath);
        wildcardInfos.push(getPattern(currentPatternPath));
        wildcardParentPaths.push(prevPatternPath);
        wildcardParentInfos.push(getPattern(prevPatternPath));
        wildcardCount++;
      }
      cumulativePaths.push(currentPatternPath);
      cumulativeInfos.push(getPattern(currentPatternPath));
      prevPatternPath = currentPatternPath;
      currentPatternPath += ".";
    }
    const lastWildcardPath = wildcardPaths.length > 0 ? wildcardPaths[wildcardPaths.length - 1] : null;
    const parentPath = cumulativePaths.length > 1 ? cumulativePaths[cumulativePaths.length - 2] : null;
    this.pattern = pattern;
    this.pathSegments = pathSegments;
    this.lastSegment = pathSegments[pathSegments.length - 1];
    this.cumulativePaths = cumulativePaths;
    this.cumulativeInfos = cumulativeInfos;
    this.wildcardPaths = wildcardPaths;
    this.wildcardInfos = wildcardInfos;
    this.wildcardParentPaths = wildcardParentPaths;
    this.wildcardParentInfos = wildcardParentInfos;
    this.lastWildcardPath = lastWildcardPath;
    this.lastWildcardInfo = lastWildcardPath ? getPattern(lastWildcardPath) : null;
    this.parentPath = parentPath;
    this.parentInfo = parentPath ? getPattern(parentPath) : null;
    this.wildcardCount = wildcardCount;
  }
}

const reservedWords = new Set([
  "constructor", "prototype", "__proto__", "toString",
  "valueOf", "hasOwnProperty", "isPrototypeOf",
  "watch", "unwatch", "eval", "arguments",
  "let", "var", "const", "class", "function",
  "null", "true", "false", "new", "return",
]);

export function getStructuredPathInfo(structuredPath: string): IStructuredPathInfo {
  let info: IStructuredPathInfo | undefined;
  info = _cache[structuredPath];
  if (typeof info !== "undefined") {
    return info;
  }
  if (reservedWords.has(structuredPath)) {
    raiseError(`getStructuredPathInfo: pattern is reserved word: ${structuredPath}`);
  }
  return (_cache[structuredPath] = new StructuredPathInfo(structuredPath));
}
