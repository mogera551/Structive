/**
 * loadFromImportMap
 *
 * importmap のエイリアスを走査し、ルート/コンポーネントを自動登録する。
 * - @routes/*: entryRoute でルーティング登録（/root → / に正規化）
 * - @components/*: SFC を読み込み、ComponentClass を生成して registerComponentClass
 * - #lazy サフィックスが付与されている場合は遅延ロード用に保持
 *
 * 戻り値: Promise<void>
 * Throws: 重大な例外は基本なし（見つからないエイリアスは warn として扱う）
 */
import { entryRoute } from "../Router/Router";
import { raiseError } from "../utils";
import { createComponentClass } from "./createComponentClass";
import { loadImportmap } from "./loadImportmap";
import { loadSingleFileComponent } from "./loadSingleFileComponent";
import { registerComponentClass } from "./registerComponentClass";
import { IUserComponentData } from "./types";

const ROUTES_KEY = "@routes/";
const COMPONENTS_KEY = "@components/";
const LAZY_LOAD_SUFFIX = "#lazy";
const LAZY_LOAD_SUFFIX_LEN = LAZY_LOAD_SUFFIX.length;

const lazyLoadComponentAliasByTagName: Record<string, string> = {};

export async function loadFromImportMap(): Promise<void> {
  const importmap = loadImportmap();
  if (importmap.imports) {
    const loadAliasByTagName: Map<string, string> = new Map();
    for (const [alias, value] of Object.entries(importmap.imports)) {
      let tagName, isLazyLoad;
      if (alias.startsWith(ROUTES_KEY)) {
        isLazyLoad = alias.endsWith(LAZY_LOAD_SUFFIX);
        // remove the prefix '@routes' and the suffix '#lazy' if it exists
        const path = alias.slice(ROUTES_KEY.length - 1, isLazyLoad ? -LAZY_LOAD_SUFFIX_LEN : undefined); 
        const pathWithoutParams = path.replace(/:[^\s/]+/g, ""); // remove the params
        tagName = "routes" + pathWithoutParams.replace(/\//g, "-"); // replace '/' with '-'
        entryRoute(tagName, path === "/root" ? "/" : path); // routing
      } if (alias.startsWith(COMPONENTS_KEY)) {
        isLazyLoad = alias.endsWith(LAZY_LOAD_SUFFIX);
        // remove the prefix '@components/' and the suffix '#lazy' if it exists
        tagName = alias.slice(COMPONENTS_KEY.length, isLazyLoad ? -LAZY_LOAD_SUFFIX_LEN : undefined);
      }
      if (!tagName) {
        continue;
      }
      if (isLazyLoad) {
        // Lazy Load用のコンポーネントのエイリアスを格納
        lazyLoadComponentAliasByTagName[tagName] = alias;
        continue; // Lazy Loadの場合はここでスキップ
      }
      loadAliasByTagName.set(tagName, alias);
    }
    for (const [tagName, alias] of loadAliasByTagName.entries()) {
      // 非Lazy Loadのコンポーネントはここで登録
      const componentData = await loadSingleFileComponent(alias);
      const componentClass = createComponentClass(componentData);
      registerComponentClass(tagName, componentClass);
    }
  }
}

export function hasLazyLoadComponents(): boolean {
  return Object.keys(lazyLoadComponentAliasByTagName).length > 0;
}

export function isLazyLoadComponent(tagName: string): boolean {
  return lazyLoadComponentAliasByTagName.hasOwnProperty(tagName);
}

export function loadLazyLoadComponent(tagName: string): void {
  const alias = lazyLoadComponentAliasByTagName[tagName];
  if (!alias) {
    // 警告として扱うが、構造化メタ情報を付加
    const err = {
      code: "IMP-201",
      message: `Alias not found for tagName: ${tagName}`,
      context: { where: 'loadFromImportMap.loadLazyLoadComponent', tagName },
      docsUrl: "./docs/error-codes.md#imp",
      severity: "warn" as const,
    };
    // 既存挙動は warn + return のため、throw はせず console.warn にメタを付与
    console.warn(err.message, { code: err.code, context: err.context, docsUrl: err.docsUrl, severity: err.severity });
    return;
  }
  delete lazyLoadComponentAliasByTagName[tagName]; // 一度ロードしたら削除
  queueMicrotask(async () => {
    const componentData = await loadSingleFileComponent(alias);
    const componentClass = createComponentClass(componentData);
    registerComponentClass(tagName, componentClass);
  });
}
