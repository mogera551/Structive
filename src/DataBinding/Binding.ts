import { IComponentEngine } from "../ComponentEngine/types";
import { IStateProxy } from "../StateClass/types";
import { CreateBindingNodeByNodeFn, IBindingNode } from "./BindingNode/types";
import { CreateBindingStateByStateFn, IBindingState } from "./BindingState/types";
import { IBindContent, IBinding } from "./types";

class Binding implements IBinding {
  parentBindContent: IBindContent;
  node             : Node;
  engine           : IComponentEngine;
  bindingNode      : IBindingNode;
  bindingState     : IBindingState;
  version          : number | undefined;
  constructor(
    parentBindContent : IBindContent,
    node              : Node,
    engine            : IComponentEngine,
    createBindingNode : CreateBindingNodeByNodeFn, 
    createBindingState: CreateBindingStateByStateFn,
  ) {
    this.parentBindContent = parentBindContent
    this.node = node;
    this.engine = engine
    this.bindingNode = createBindingNode(this, node, engine.inputFilters);
    this.bindingState = createBindingState(this, engine.readonlyState, engine.outputFilters);
  }

  get bindContents() {
    return this.bindingNode.bindContents;
  }

  init() {
    this.bindingNode.init();
    this.bindingState.init();
  }

  render() {
    if (this.version !== this.engine.updater.version) {
      try {
        this.bindingNode.update();
      } finally {
        this.version = this.engine.updater.version;
      }
    }
  }

  updateStateValue(writeState:IStateProxy, value: any) {
    return this.bindingState.assignValue(writeState, value);
  }
}

export function createBinding(
  parentBindContent : IBindContent,
  node              : Node, 
  engine            : IComponentEngine, 
  createBindingNode : CreateBindingNodeByNodeFn, 
  createBindingState: CreateBindingStateByStateFn
): IBinding {
  return new Binding(
    parentBindContent, 
    node, 
    engine, 
    createBindingNode, 
    createBindingState
  );
}