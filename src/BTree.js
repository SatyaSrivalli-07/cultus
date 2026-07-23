class BTreeNode {
  constructor(t, leaf) {
    this.t = t;
    this.leaf = leaf;
    this.keys = [];
    this.vals = [];
    this.children = [];
  }

  isFull() {
    return this.keys.length === 2 * this.t - 1;
  }
}

class BTree {
  constructor(t = 3) {
    if (t < 2) throw new Error('min degree t must be >= 2');
    this.t = t;
    this.root = new BTreeNode(t, true);
  }

  search(key) {
    return this._search(this.root, key);
  }

  _search(node, key) {
    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) i++;

    if (i < node.keys.length && node.keys[i] === key) {
      return node.vals[i];
    }
    if (node.leaf) return undefined;
    return this._search(node.children[i], key);
  }

  rangeQuery(low, high) {
    const out = [];
    this._range(this.root, low, high, out);
    return out;
  }

  _range(node, low, high, out) {
    let i = 0;
    while (i < node.keys.length && node.keys[i] < low) i++;

    while (i < node.keys.length && node.keys[i] <= high) {
      if (!node.leaf) this._range(node.children[i], low, high, out);
      out.push({ key: node.keys[i], value: node.vals[i] });
      i++;
    }
    if (!node.leaf) this._range(node.children[i], low, high, out);
  }

  insert(key, value) {
    if (this.search(key) !== undefined) {
      this._overwrite(this.root, key, value);
      return;
    }

    const root = this.root;
    if (root.isFull()) {
      const newRoot = new BTreeNode(this.t, false);
      newRoot.children.push(root);
      this._splitChild(newRoot, 0);
      this.root = newRoot;
      this._insertNonFull(newRoot, key, value);
    } else {
      this._insertNonFull(root, key, value);
    }
  }

  _overwrite(node, key, value) {
    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) i++;
    if (i < node.keys.length && node.keys[i] === key) {
      node.vals[i] = value;
      return;
    }
    this._overwrite(node.children[i], key, value);
  }

  _splitChild(parent, i) {
    const t = this.t;
    const child = parent.children[i];
    const sibling = new BTreeNode(t, child.leaf);
    const medianKey = child.keys[t - 1];
    const medianVal = child.vals[t - 1];

    sibling.keys = child.keys.slice(t);
    sibling.vals = child.vals.slice(t);
    child.keys = child.keys.slice(0, t - 1);
    child.vals = child.vals.slice(0, t - 1);

    if (!child.leaf) {
      sibling.children = child.children.slice(t);
      child.children = child.children.slice(0, t);
    }

    parent.children.splice(i + 1, 0, sibling);
    parent.keys.splice(i, 0, medianKey);
    parent.vals.splice(i, 0, medianVal);
  }

  _insertNonFull(node, key, value) {
    let i = node.keys.length - 1;

    if (node.leaf) {
      node.keys.push(null);
      node.vals.push(null);
      while (i >= 0 && node.keys[i] > key) {
        node.keys[i + 1] = node.keys[i];
        node.vals[i + 1] = node.vals[i];
        i--;
      }
      node.keys[i + 1] = key;
      node.vals[i + 1] = value;
      return;
    }

    while (i >= 0 && node.keys[i] > key) i--;
    i++;

    if (node.children[i].isFull()) {
      this._splitChild(node, i);
      if (key > node.keys[i]) i++;
    }
    this._insertNonFull(node.children[i], key, value);
  }

  delete(key) {
    if (this.search(key) === undefined) return false;
    this._delete(this.root, key);

    // root shrank to zero keys but still has a child -> that child becomes new root
    if (this.root.keys.length === 0 && !this.root.leaf) {
      this.root = this.root.children[0];
    }
    return true;
  }

  _delete(node, key) {
    const t = this.t;
    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) i++;

    const foundHere = i < node.keys.length && node.keys[i] === key;

    if (foundHere) {
      if (node.leaf) {
        node.keys.splice(i, 1);
        node.vals.splice(i, 1);
        return;
      }
      this._deleteFromInternal(node, i);
      return;
    }

    if (node.leaf) {
      return;
    }

    const isLastChild = i === node.children.length - 1;
    if (node.children[i].keys.length < t) {
      this._fillChild(node, i);
    }
    if (isLastChild && i > node.children.length - 1) {
      this._delete(node.children[i - 1], key);
    } else {
      this._delete(node.children[i], key);
    }
  }

  _deleteFromInternal(node, i) {
    const t = this.t;
    const key = node.keys[i];

    if (node.children[i].keys.length >= t) {
      const pred = this._getPredecessor(node, i);
      node.keys[i] = pred.key;
      node.vals[i] = pred.value;
      this._delete(node.children[i], pred.key);
    } else if (node.children[i + 1].keys.length >= t) {
      const succ = this._getSuccessor(node, i);
      node.keys[i] = succ.key;
      node.vals[i] = succ.value;
      this._delete(node.children[i + 1], succ.key);
    } else {
      this._mergeChildren(node, i);
      this._delete(node.children[i], key);
    }
  }

  _getPredecessor(node, i) {
    let cur = node.children[i];
    while (!cur.leaf) cur = cur.children[cur.children.length - 1];
    return { key: cur.keys[cur.keys.length - 1], value: cur.vals[cur.vals.length - 1] };
  }

  _getSuccessor(node, i) {
    let cur = node.children[i + 1];
    while (!cur.leaf) cur = cur.children[0];
    return { key: cur.keys[0], value: cur.vals[0] };
  }

  _fillChild(node, i) {
    const t = this.t;

    if (i > 0 && node.children[i - 1].keys.length >= t) {
      this._borrowFromPrev(node, i);
    } else if (i < node.children.length - 1 && node.children[i + 1].keys.length >= t) {
      this._borrowFromNext(node, i);
    } else if (i < node.children.length - 1) {
      this._mergeChildren(node, i);
    } else {
      this._mergeChildren(node, i - 1);
    }
  }

  _borrowFromPrev(node, i) {
    const child = node.children[i];
    const sibling = node.children[i - 1];

    child.keys.unshift(node.keys[i - 1]);
    child.vals.unshift(node.vals[i - 1]);
    if (!child.leaf) {
      child.children.unshift(sibling.children.pop());
    }

    node.keys[i - 1] = sibling.keys.pop();
    node.vals[i - 1] = sibling.vals.pop();
  }

  _borrowFromNext(node, i) {
    const child = node.children[i];
    const sibling = node.children[i + 1];

    child.keys.push(node.keys[i]);
    child.vals.push(node.vals[i]);
    if (!child.leaf) {
      child.children.push(sibling.children.shift());
    }

    node.keys[i] = sibling.keys.shift();
    node.vals[i] = sibling.vals.shift();
  }

  _mergeChildren(node, i) {
    const left = node.children[i];
    const right = node.children[i + 1];

    left.keys.push(node.keys[i]);
    left.vals.push(node.vals[i]);
    left.keys = left.keys.concat(right.keys);
    left.vals = left.vals.concat(right.vals);
    if (!left.leaf) {
      left.children = left.children.concat(right.children);
    }

    node.keys.splice(i, 1);
    node.vals.splice(i, 1);
    node.children.splice(i + 1, 1);
  }

  inorder() {
    const out = [];
    const walk = (node) => {
      for (let i = 0; i < node.keys.length; i++) {
        if (!node.leaf) walk(node.children[i]);
        out.push(node.keys[i]);
      }
      if (!node.leaf) walk(node.children[node.children.length - 1]);
    };
    walk(this.root);
    return out;
  }

  height() {
    let h = 0;
    let node = this.root;
    while (!node.leaf) {
      h++;
      node = node.children[0];
    }
    return h;
  }
}

module.exports = { BTree, BTreeNode };
