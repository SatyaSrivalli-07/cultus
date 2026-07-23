const assert = require('assert');
const { BTree } = require('../src/BTree');

function test(name, fn) {
  try {
    fn();
    console.log(`PASS - ${name}`);
  } catch (err) {
    console.log(`FAIL - ${name}`);
    console.log(err);
    process.exitCode = 1;
  }
}

test('basic insert and search', () => {
  const t = new BTree(3);
  t.insert(10, 'a');
  t.insert(20, 'b');
  t.insert(5, 'c');
  assert.strictEqual(t.search(10), 'a');
  assert.strictEqual(t.search(20), 'b');
  assert.strictEqual(t.search(5), 'c');
  assert.strictEqual(t.search(999), undefined);
});

test('inorder stays sorted after lots of random inserts', () => {
  const t = new BTree(3);
  const keys = [];
  for (let i = 0; i < 500; i++) {
    const k = Math.floor(Math.random() * 10000);
    if (t.search(k) === undefined) keys.push(k);
    t.insert(k, `v${k}`);
  }
  const sorted = t.inorder();
  const expected = [...keys].sort((a, b) => a - b);
  assert.deepStrictEqual(sorted, expected);
});

test('overwrite existing key does not duplicate it', () => {
  const t = new BTree(2);
  t.insert(1, 'first');
  t.insert(1, 'second');
  assert.strictEqual(t.search(1), 'second');
  assert.strictEqual(t.inorder().filter(k => k === 1).length, 1);
});

test('node splits when it exceeds 2t-1 keys, root grows', () => {
  // t=2 means a node can hold at most 3 keys before splitting
  const t = new BTree(2);
  assert.strictEqual(t.height(), 0);
  for (let i = 1; i <= 4; i++) t.insert(i, i);
  // 4 keys with t=2 forces at least one split, so height should be > 0
  assert.ok(t.height() > 0);
  assert.deepStrictEqual(t.inorder(), [1, 2, 3, 4]);
});

test('cascading splits with sequential insert of many keys', () => {
  const t = new BTree(2); // small t forces frequent splitting
  for (let i = 0; i < 100; i++) t.insert(i, i);
  assert.deepStrictEqual(t.inorder(), Array.from({ length: 100 }, (_, i) => i));
  // sanity check the tree is actually multi-level, not a flat list
  assert.ok(t.height() >= 3);
});

test('delete from a leaf with no underflow', () => {
  const t = new BTree(3);
  [10, 20, 30, 40, 50].forEach(k => t.insert(k, k));
  const ok = t.delete(30);
  assert.strictEqual(ok, true);
  assert.strictEqual(t.search(30), undefined);
  assert.deepStrictEqual(t.inorder(), [10, 20, 40, 50]);
});

test('delete triggers borrow-from-sibling when child underflows', () => {
  const t = new BTree(2); // t=2, min keys per non-root node = 1
  for (let i = 1; i <= 7; i++) t.insert(i, i);
  t.delete(1);
  t.delete(2);
  // tree should still be valid and contain the rest
  assert.deepStrictEqual(t.inorder(), [3, 4, 5, 6, 7]);
  for (const k of [3, 4, 5, 6, 7]) {
    assert.strictEqual(t.search(k), k);
  }
});

test('delete triggers node merge when no sibling can lend a key', () => {
  const t = new BTree(2);
  for (let i = 1; i <= 5; i++) t.insert(i, i);
  // delete enough keys to force merges all the way down
  [1, 2, 3].forEach(k => t.delete(k));
  assert.deepStrictEqual(t.inorder(), [4, 5]);
  assert.strictEqual(t.search(4), 4);
  assert.strictEqual(t.search(5), 5);
});

test('delete internal node key uses predecessor/successor correctly', () => {
  const t = new BTree(2);
  for (let i = 1; i <= 15; i++) t.insert(i, i * 10);
  // pick a key that's very likely sitting in an internal node at this size
  t.delete(8);
  assert.strictEqual(t.search(8), undefined);
  const expected = [1,2,3,4,5,6,7,9,10,11,12,13,14,15];
  assert.deepStrictEqual(t.inorder(), expected);
});

test('deleting everything empties the tree cleanly', () => {
  const t = new BTree(3);
  const keys = [15, 3, 42, 8, 23, 4, 16, 99, 1, 7];
  keys.forEach(k => t.insert(k, k));
  keys.forEach(k => t.delete(k));
  assert.deepStrictEqual(t.inorder(), []);
  assert.strictEqual(t.height(), 0);
});

test('range query returns inclusive sorted slice', () => {
  const t = new BTree(3);
  [5, 15, 25, 35, 45, 55, 65].forEach(k => t.insert(k, k));
  const result = t.rangeQuery(20, 50).map(e => e.key);
  assert.deepStrictEqual(result, [25, 35, 45]);
});

test('range query on empty tree returns empty array', () => {
  const t = new BTree(3);
  assert.deepStrictEqual(t.rangeQuery(0, 100), []);
});

test('constructor rejects t < 2', () => {
  assert.throws(() => new BTree(1));
});

console.log('\nall tests finished');
