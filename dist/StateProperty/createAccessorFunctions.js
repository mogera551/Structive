/**
 * createAccessorFunctions.ts
 *
 * Stateプロパティのパス情報（IStructuredPathInfo）から、動的なgetter/setter関数を生成するユーティリティです。
 *
 * 主な役割:
 * - パス情報とgetter集合から、最適なアクセサ関数（get/set）を動的に生成
 * - ワイルドカード（*）やネストしたプロパティパスにも対応
 * - パスやセグメントのバリデーションも実施
 *
 * 設計ポイント:
 * - matchPathsから最長一致のgetterパスを探索し、そこからの相対パスでアクセサを構築
 * - パスが一致しない場合はinfo.pathSegmentsから直接アクセサを生成
 * - new Functionで高速なgetter/setterを動的生成
 * - パスやセグメント名は正規表現で厳密にチェックし、安全性を担保
 */
import { getStructuredPathInfo } from "./getStructuredPathInfo";
import { raiseError } from "../utils";
const checkSegmentRegexp = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
const checkPathRegexp = /^[a-zA-Z_$][0-9a-zA-Z_$]*(\.[a-zA-Z_$][0-9a-zA-Z_$]*|\.\*)*$/;
export function createAccessorFunctions(info, getters) {
    const matchPaths = new Set(info.cumulativePaths).intersection(getters);
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
        if (!checkPathRegexp.test(matchPath)) {
            raiseError({
                code: "STATE-202",
                message: `Invalid path: ${matchPath}`,
                context: { matchPath },
                docsUrl: "./docs/error-codes.md#state",
            });
        }
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
                if (!checkSegmentRegexp.test(segment)) {
                    raiseError({
                        code: "STATE-202",
                        message: `Invalid segment name: ${segment}`,
                        context: { segment, matchPath },
                        docsUrl: "./docs/error-codes.md#state",
                    });
                }
                segments.push("." + segment);
            }
        }
        const path = segments.join('');
        const getterFuncText = `return this["${matchPath}"]${path};`;
        const setterFuncText = `this["${matchPath}"]${path} = value;`;
        //console.log('path/getter/setter:', info.pattern, getterFuncText, setterFuncText);
        return {
            get: new Function('', getterFuncText),
            set: new Function('value', setterFuncText),
        };
    }
    else {
        const segments = [];
        let count = 0;
        for (let i = 0; i < info.pathSegments.length; i++) {
            const segment = info.pathSegments[i];
            if (segment === '*') {
                segments.push("[this.$" + (count + 1) + "]");
                count++;
            }
            else {
                if (!checkSegmentRegexp.test(segment)) {
                    raiseError({
                        code: "STATE-202",
                        message: `Invalid segment name: ${segment}`,
                        context: { segment },
                        docsUrl: "./docs/error-codes.md#state",
                    });
                }
                segments.push((segments.length > 0 ? "." : "") + segment);
            }
        }
        const path = segments.join('');
        const getterFuncText = `return this.${path};`;
        const setterFuncText = `this.${path} = value;`;
        //console.log('path/getter/setter:', info.pattern, getterFuncText, setterFuncText);
        return {
            get: new Function('', getterFuncText),
            set: new Function('value', setterFuncText),
        };
    }
}
