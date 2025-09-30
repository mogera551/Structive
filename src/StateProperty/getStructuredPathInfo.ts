/**
 * getStructuredPathInfo.ts
 *
 * Stateプロパティのパス文字列から、詳細な構造化パス情報（IStructuredPathInfo）を生成・キャッシュするユーティリティです。
 *
 * 主な役割:
 * - パス文字列を分割し、各セグメントやワイルドカード（*）の位置・親子関係などを解析
 * - cumulativePaths/wildcardPaths/parentPathなど、パス階層やワイルドカード階層の情報を構造化
 * - 解析結果をIStructuredPathInfoとしてキャッシュし、再利用性とパフォーマンスを両立
 * - reservedWords（予約語）チェックで安全性を担保
 *
 * 設計ポイント:
 * - パスごとにキャッシュし、同じパスへの複数回アクセスでも高速に取得可能
 * - ワイルドカードや親子関係、階層構造を厳密に解析し、バインディングや多重ループに最適化
 * - childrenプロパティでパス階層のツリー構造も構築
 * - 予約語や危険なパスはraiseErrorで例外を発生
 */
import { RESERVED_WORD_SET } from '../constants.js';
import { raiseError } from '../utils.js';
import { IStructuredPathInfo } from './types';

/**
 * プロパティ名に"constructor"や"toString"などの予約語やオブジェクトのプロパティ名を
 * 上書きするような名前も指定できるように、Mapを検討したが、そもそもそのような名前を
 * 指定することはないと考え、Mapを使わないことにした。
 */
const _cache: { [key:string]: IStructuredPathInfo } = {};

/**
 * パターン情報を取得します
 * @param pattern パターン
 * @returns {IPatternInfo} パターン情報
 */
class StructuredPathInfo implements IStructuredPathInfo {
  static id : number = 0;
  id = ++StructuredPathInfo.id;
  sid = this.id.toString();
  pattern;
  pathSegments;
  lastSegment;
  cumulativePaths;
  cumulativePathSet;
  cumulativeInfos;
  cumulativeInfoSet;
  wildcardPaths;
  wildcardPathSet;
  wildcardInfos;
  indexByWildcardPath;
  wildcardInfoSet;
  wildcardParentPaths;
  wildcardParentPathSet;
  wildcardParentInfos;
  wildcardParentInfoSet;
  lastWildcardPath;
  lastWildcardInfo;
  parentPath;
  parentInfo;
  wildcardCount;
  children = {};

  constructor(pattern: string) {
    const getPattern = (_pattern: string): IStructuredPathInfo => {
      return (pattern === _pattern) ? this : getStructuredPathInfo(_pattern);
    };
    const pathSegments = pattern.split(".");
    const cumulativePaths = [];
    const cumulativeInfos: IStructuredPathInfo[] = [];
    const wildcardPaths = [];
    const indexByWildcardPath: Record<string, number> = {};
    const wildcardInfos = [];
    const wildcardParentPaths = [];
    const wildcardParentInfos = [];
    let currentPatternPath = "", prevPatternPath = "";
    let wildcardCount = 0;
    for(let i = 0; i < pathSegments.length; i++) {
      currentPatternPath += pathSegments[i];
      if (pathSegments[i] === "*") {
        wildcardPaths.push(currentPatternPath);
        indexByWildcardPath[currentPatternPath] = wildcardCount;
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
    this.cumulativePathSet = new Set(cumulativePaths);
    this.cumulativeInfos = cumulativeInfos;
    this.cumulativeInfoSet = new Set(cumulativeInfos);
    this.wildcardPaths = wildcardPaths;
    this.wildcardPathSet = new Set(wildcardPaths);
    this.indexByWildcardPath = indexByWildcardPath;
    this.wildcardInfos = wildcardInfos;
    this.wildcardInfoSet = new Set(wildcardInfos);
    this.wildcardParentPaths = wildcardParentPaths;
    this.wildcardParentPathSet = new Set(wildcardParentPaths);
    this.wildcardParentInfos = wildcardParentInfos;
    this.wildcardParentInfoSet = new Set(wildcardParentInfos);
    this.lastWildcardPath = lastWildcardPath;
    this.lastWildcardInfo = lastWildcardPath ? getPattern(lastWildcardPath) : null;
    this.parentPath = parentPath;
    this.parentInfo = parentPath ? getPattern(parentPath) : null;
    this.wildcardCount = wildcardCount;
    if (this.parentInfo) {
      this.parentInfo.children[this.lastSegment] = this;
    }
  }
}


export function getStructuredPathInfo(structuredPath: string): IStructuredPathInfo {
  if (RESERVED_WORD_SET.has(structuredPath)) {
    raiseError({
      code: 'STATE-202',
      message: `Pattern is reserved word: ${structuredPath}`,
      context: { where: 'getStructuredPathInfo', structuredPath },
      docsUrl: './docs/error-codes.md#state',
    });
  }
  const info = _cache[structuredPath];
  if (typeof info !== "undefined") {
    return info;
  }
  return (_cache[structuredPath] = new StructuredPathInfo(structuredPath));
}
