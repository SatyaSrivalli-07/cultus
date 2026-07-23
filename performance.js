const { BTree } = require('./src/BTree');

const N = 200000;
const branchFactors = [2, 4, 8, 16, 32, 64];

function randInts(n) {
  const arr = new Array(n);
  for (let i = 0; i < n; i++) arr[i] = Math.floor(Math.random() * n * 10);
  return arr;
}

function run(t) {
  const keys = randInts(N);
  const tree = new BTree(t);

  const insertStart = process.hrtime.bigint();
  for (const k of keys) tree.insert(k, k);
  const insertEnd = process.hrtime.bigint();

  const searchKeys = [];
  for (let i = 0; i < 20000; i++) {
    searchKeys.push(i % 2 === 0 ? keys[Math.floor(Math.random() * keys.length)]
                                 : Math.floor(Math.random() * N * 10));
  }
  const searchStart = process.hrtime.bigint();
  for (const k of searchKeys) tree.search(k);
  const searchEnd = process.hrtime.bigint();

  const insertMs = Number(insertEnd - insertStart) / 1e6;
  const searchMs = Number(searchEnd - searchStart) / 1e6;

  return {
    t,
    height: tree.height(),
    insertMs: insertMs.toFixed(1),
    insertPerSec: Math.round(N / (insertMs / 1000)),
    searchMs: searchMs.toFixed(1),
    searchPerSec: Math.round(searchKeys.length / (searchMs / 1000)),
  };
}

console.log(`N = ${N} keys per run\n`);
console.log('t\theight\tinsert(ms)\tinserts/sec\tsearch(ms)\tsearches/sec');
for (const t of branchFactors) {
  const r = run(t);
  console.log(`${r.t}\t${r.height}\t${r.insertMs}\t\t${r.insertPerSec}\t${r.searchMs}\t\t${r.searchPerSec}`);
}
