import { IComponentEngine } from "../ComponentEngine/types";
import { CreateBindingNodeByNodeFn, IBindingNode } from "./BindingNode/types";
import { CreateBindingStateByStateFn, IBindingState } from "./BindingState/types";
import { IBindContent, IBinding } from "./types";

class Binding implements IBinding {
  parentBindContent: IBindContent;
  node             : Node;
  engine           : IComponentEngine;
  bindingNode      : IBindingNode;
  bindingState     : IBindingState;
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
    this.bindingState = createBindingState(this, engine.stateProxy, engine.outputFilters);
  }

  get bindContents() {
    return this.bindingNode.bindContents;
  }

  init() {
    this.bindingNode.init();
    this.bindingState.init();
  }

  render() {
    this.bindingNode.update();
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