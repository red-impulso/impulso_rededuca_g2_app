"use client";

// Browser extensions (Google Translate, Grammarly, ...) mutate DOM nodes that
// React manages; React then crashes with
// "NotFoundError: Failed to execute 'removeChild' on 'Node'".
// This patch makes both operations no-op when the node is no longer a child.
// See https://github.com/facebook/react/issues/17256
// The module runs on the client before hydration; `Node` may not exist on the
// server, and the flag keeps dev-mode HMR from wrapping the methods twice.
const proto = typeof Node === "function" ? Node.prototype : undefined;

if (proto && !(proto as { __domPatched?: boolean }).__domPatched) {
  (proto as { __domPatched?: boolean }).__domPatched = true;

  const originalRemoveChild = proto.removeChild;
  proto.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = proto.insertBefore;
  proto.insertBefore = function <T extends Node>(
    this: Node,
    newNode: T,
    referenceNode: Node | null,
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

export function DomPatch() {
  return null;
}
