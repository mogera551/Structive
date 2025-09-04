import { MAX_WILDCARD_DEPTH } from "../../constants";
/**
 * stackIndexByIndexName
 * インデックス名からスタックインデックスへのマッピング
 * $1 => 0
 * $2 => 1
 * :
 * ${MAX_WILDCARD_DEPTH} => MAX_WILDCARD_DEPTH - 1
 */
export const indexByIndexName2 = {};
for (let i = 0; i < MAX_WILDCARD_DEPTH; i++) {
    indexByIndexName2[`$${i + 1}`] = i;
}
