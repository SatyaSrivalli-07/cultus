# B-Tree KV index

A B-Tree that stores key/value pairs, in JS, no external libs.

## Usage
```js
const { BTree } = require('./src/BTree');

const tree = new BTree(4); // min degree t=4
tree.insert(10, 'hello');
tree.search(10);           // 'hello'
tree.delete(10);
tree.rangeQuery(5, 50);    // [{key, value}, ...] sorted, inclusive
```

## Run tests
```
node test/btree.test.js
```
13 tests, all assertion-based (not just console output) - covers
splitting, cascading splits, borrow-from-sibling, node merges, and
predecessor/successor replacement on internal-node deletes.

## Run the perf benchmark
```
node performance.js
```
See `performance-analysis.md` for the writeup.

## What's here
- `src/BTree.js` - the actual implementation
- `test/btree.test.js` - test suite
- `performance.js` - benchmark script
- `performance-analysis.md` - results + analysis
- `NOTES.md` - how split/delete/underflow handling works, case by case

## Known limitations
No persistence (in-memory only), no concurrency handling. See end of
NOTES.md for the full list.
"# cultus" 
