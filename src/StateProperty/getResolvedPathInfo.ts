/**
 * getResolvedPathInfo.ts
 *
 * Stateプロパティ名（パス文字列）から、ワイルドカードやインデックス情報を含む
 * 詳細なパス情報（IResolvedPathInfo）を解析・生成するユーティリティです。
 *
 * 主な役割:
 * - プロパティ名を分解し、ワイルドカードやインデックスの有無・種別を判定
 * - context/all/partial/none のワイルドカード種別を自動判定
 * - パスごとにキャッシュし、再利用性とパフォーマンスを両立
 * - getStructuredPathInfoで構造化パス情報も取得
 *
 * 設計ポイント:
 * - "constructor"や"toString"などの予約語も扱えるよう、Mapではなくオブジェクトでキャッシュ
 * - ワイルドカード（*）や数値インデックスを柔軟に判定し、wildcardIndexesに格納
 * - context型は未確定インデックス、all型は全て確定インデックス、partial型は混在を示す
 * - ResolvedPathInfoクラスでパス解析・情報保持を一元化
 */
import { IResolvedPathInfo, WildcardType } from './types';
import { getStructuredPathInfo } from './getStructuredPathInfo.js';

/**
 * プロパティ名に"constructor"や"toString"などの予約語やオブジェクトのプロパティ名を
 * 上書きするような名前も指定できるように、Mapを検討したが、そもそもそのような名前を
 * 指定することはないと考え、Mapを使わないことにした。
 */
const _cache: Map<string, IResolvedPathInfo> = new Map();

class ResolvedPathInfo implements IResolvedPathInfo {
  static id : number = 0;
  id = ++ResolvedPathInfo.id;
  name;
  elements;
  paths;
  wildcardCount;
  wildcardType;
  wildcardIndexes;
  info;
  constructor(name: string) {
    const elements = name.split(".");
    const tmpPatternElements = elements.slice();
    const paths = [];
    let incompleteCount = 0;
    let completeCount = 0;
    let lastPath = "";
    let wildcardCount = 0;
    let wildcardType: WildcardType = "none";
    let wildcardIndexes: (number | null)[] = [];
    for(let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (element === "*") {
        tmpPatternElements[i] = "*";
        wildcardIndexes.push(null);
        incompleteCount++;
        wildcardCount++;
      } else {
        const number = Number(element);
        if (!Number.isNaN(number)) {
          tmpPatternElements[i] = "*";
          wildcardIndexes.push(number);
          completeCount++;
          wildcardCount++;
        }
      }
      lastPath += element;
      paths.push(lastPath);
      lastPath += (i < elements.length - 1 ? "." : "");
    }
    const pattern = tmpPatternElements.join(".");
    const info = getStructuredPathInfo(pattern);
    if (incompleteCount > 0 || completeCount > 0) {
      if (incompleteCount === wildcardCount) {
        wildcardType = "context";
      } else if (completeCount === wildcardCount) {
        wildcardType = "all";
      } else {
        wildcardType = "partial";
      }
    }
    this.name = name;
    this.elements = elements;
    this.paths = paths;
    this.wildcardCount = wildcardCount;
    this.wildcardType = wildcardType;
    this.wildcardIndexes = wildcardIndexes;
    this.info = info;
  }
}

export function getResolvedPathInfo(name:string):IResolvedPathInfo {
  let nameInfo: IResolvedPathInfo | undefined;
  return _cache.get(name) ?? (_cache.set(name, nameInfo = new ResolvedPathInfo(name)), nameInfo);
}