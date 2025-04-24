import { createDataBindAttributes } from "./createDataBindAttributes";
import { getNodesHavingDataBind } from "./getNodesHavingDataBind";
const listDataBindAttributesById = {};
const listPathsSetById = {};
const pathsSetById = {};
function getDataBindAttributesFromTemplate(content) {
    const nodes = getNodesHavingDataBind(content);
    return nodes.map(node => createDataBindAttributes(node));
}
export function registerDataBindAttributes(id, content, rootId = id) {
    const dataBindAttributes = getDataBindAttributesFromTemplate(content);
    const paths = pathsSetById[rootId] ?? (pathsSetById[rootId] = new Set());
    const listPaths = listPathsSetById[rootId] ?? (listPathsSetById[rootId] = new Set());
    for (let i = 0; i < dataBindAttributes.length; i++) {
        const attribute = dataBindAttributes[i];
        for (let j = 0; j < attribute.bindTexts.length; j++) {
            const bindText = attribute.bindTexts[j];
            paths.add(bindText.stateProperty);
            if (bindText.nodeProperty === "for") {
                listPaths.add(bindText.stateProperty);
            }
        }
    }
    return listDataBindAttributesById[id] = dataBindAttributes;
}
export const getDataBindAttributesById = (id) => {
    return listDataBindAttributesById[id];
};
export const getListPathsSetById = (id) => {
    return listPathsSetById[id] ?? [];
};
export const getPathsSetById = (id) => {
    return pathsSetById[id] ?? [];
};
