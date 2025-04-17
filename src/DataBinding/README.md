
```JS
// バインドパスの情報
// Stateのプロパティとからバインドを取得する


// example
node1 = list
node2 = list.*
node3 = list.*.name
node4 = list.*.email

root = {
  name: undefined,
  path: undefined,
  parent: undefined,
  childByName: {
    "list": node1
  } 

}

node1 = {
  name: "list",
  path: "list",
  parent: root,
  childByName: {
    "*": node2
  } 
}

node2 = {
  name: "*",
  path: "list.*",
  parent: node1,
  childByName: {
    "name": node3,
    "email": node4
  } 
}

node3 = {
  name: "name",
  path: "list.*.name",
  parent: node2,
  childByName: {}
}

node4 = {
  name: "email",
  path: "list.*.email",
  parent: node2,
  childByName: {}
}

function createBindPath(parent:IBindPath, name:string, path:string) {
  return {
    name, path, parent
  }
}

function searchBinds(root:IBindPath, propRef:IStatePropertyRef) {
  let cur:IBindPath = root;
  for(let i in propRef.prop.elements) {
    const element = propRef.prop.elements[i];
    cur = cur.childByName[element];
    if (typeof cur === "undefined") raiseError(`not found path(${prop.name})`);
  }
  return cur.bindsByLoopIndex.get(propRef.loopIndex);
}

function registerPath(root:IBindPath, prop:IResolvedPathInfo):IBindPath {
  let cur:IBindPath = root;
  for(let i in prop.elements) {
    const element = prop.elements[i];
    let child = cur.childByName[element];
    if (typeof child === "undefined") {
      child = cur.childByName[element] = createBindPath(parent, element, prop.paths[i]);
    };
    cur = child;
  }
  return cur;
}

function registerBind(path:IBindPath, bind:IBindProperty, loopIndex?:IListIndex) {
  path.bindsByLoopIndex.get(loopIndex)?.push(bind) ?? path.bindsByLoopIndex.set(loopIndex, [bind]);
}

```
