import { createDataBindAttributes } from "./createDataBindAttributes.js";
import { getNodesHavingDataBind } from "./getNodesHavingDataBind.js";
import { IDataBindAttributes } from "./types";

const listDataBindAttributesById: {[key:number]:IDataBindAttributes[]} = {};

const listPathsSetById: {[key:number]:Set<string>} = {};

const pathsSetById: {[key:number]:Set<string>} = {};

function getDataBindAttributesFromTemplate(content: DocumentFragment): IDataBindAttributes[] {
  const nodes = getNodesHavingDataBind(content);
  return nodes.map(node => createDataBindAttributes(node));
}

export function registerDataBindAttributes(
  id     : number, 
  content: DocumentFragment,
  rootId : number = id
): IDataBindAttributes[] {
  const dataBindAttributes = getDataBindAttributesFromTemplate(content);
  const paths = pathsSetById[rootId] ?? (pathsSetById[rootId] = new Set<string>());
  const listPaths = listPathsSetById[rootId] ?? (listPathsSetById[rootId] = new Set<string>());
  for(let i = 0; i < dataBindAttributes.length; i++) {
    const attribute = dataBindAttributes[i];
    for(let j = 0; j < attribute.bindTexts.length; j++) {
      const bindText = attribute.bindTexts[j];
      paths.add(bindText.stateProperty);
      if (bindText.nodeProperty === "for") {
        listPaths.add(bindText.stateProperty);
      }
    }
  }
  return listDataBindAttributesById[id] = dataBindAttributes;
}

export const getDataBindAttributesById = (id: number): IDataBindAttributes[] => {
  return listDataBindAttributesById[id];
}

export const getListPathsSetById = (id: number): Set<string> => {
  return listPathsSetById[id] ?? [];
};

export const getPathsSetById = (id: number): Set<string> => {
  return pathsSetById[id] ?? [];
};