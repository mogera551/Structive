
export function removeEmptyTextNodes(content:DocumentFragment):void {
  Array.from(content.childNodes).forEach(node => {
    if (node.nodeType === Node.TEXT_NODE && !(node.nodeValue ?? "").trim()) {
      content.removeChild(node);
    }
  });  
}
