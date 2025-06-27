/**
 * loadFromImportMap.ts
 *
 * importmapの情報をもとに、Structiveのルートやコンポーネントを動的にロード・登録するユーティリティです。
 *
 * 主な役割:
 * - importmap.imports内のエイリアスを走査し、@routes/や@components/のプレフィックスで判定
 * - @routes/の場合はルーティング情報をentryRouteで登録
 * - @components/の場合はloadSingleFileComponentでSFCをロードし、createComponentClassでクラス化してregisterComponentClassで登録
 *
 * 設計ポイント:
 * - importmapのエイリアスを利用して、ルーティングやコンポーネントの自動登録を実現
 * - パスやタグ名の正規化、パラメータ除去なども自動で処理
 * - 非同期でSFCをロードし、動的なWeb Components登録に対応
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
    console.warn(`loadLazyLoadComponent: alias not found for tagName: ${tagName}`);
    return;
  }
  delete lazyLoadComponentAliasByTagName[tagName]; // 一度ロードしたら削除
  queueMicrotask(async () => {
    const componentData = await loadSingleFileComponent(alias);
    const componentClass = createComponentClass(componentData);
    registerComponentClass(tagName, componentClass);
  });
}
