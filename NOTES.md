# Notes on the B-Tree implementation

## Node structure
Each node keeps a `keys` array and a `vals` array (same index = same pair),
plus a `children` array if it's not a leaf. Min degree is `t`. So a node
holds between `t-1` and `2t-1` keys (except the root, which can have fewer).

## Insertion / splitting
Standard top-down split-on-the-way-down approach: before recursing into a
child, check if it's full (`2t-1` keys). If it is, split it right there
before going in. That way you never end up trying to insert into an
already-full node and having to split on the way back up.

Splitting a full node: take the median key/value, push it up into the
parent, and the two halves on either side become two new children. If the
parent was also full, that split cascades - which is exactly why the root
gets checked separately in `insert()`: if the root itself is full, we make
a brand new empty root, hang the old root off it as its one child, and
split immediately. That's the only way the tree grows in height.

Overwrite case: if the key's already in the tree, we don't want a
duplicate, so `insert()` checks with `search()` first and just walks down
to update the value in place if it finds a match.

## Deletion
This is the messier part. Three cases when the key is found in a leaf vs
an internal node vs not found at the current node at all:

1. **Leaf, key present** - just splice it out. Easy case.
2. **Internal node, key present** - can't just remove it, that would leave
   a hole in the middle of the tree structure. Instead:
   - if the left child has >= t keys, pull up its predecessor (max key in
     that subtree) to replace the deleted key, then recursively delete the
     predecessor from the left child
   - else if the right child has >= t keys, same thing but with the
     successor (min key)
   - else both children are already at the minimum (t-1 keys), so merge
     them into one node (with the key from the parent dropping down
     between them), then delete from the merged node
3. **Key not in this node** - have to recurse into the right child, but
   first make sure that child has at least `t` keys before going in
   (otherwise if we end up in case 2 above and need to borrow a key, the
   child won't have any to give). This is `_fillChild`:
   - try borrowing from the left sibling first (rotate through the
     parent), then the right sibling
   - if neither sibling can spare a key without going below `t-1`
     themselves, merge with whichever sibling is available

## Underflow handling
"Underflow" here just means a non-root node dropped below `t-1` keys after
a deletion. We never actually let a node sit in an underflowed state -
`_fillChild` is called *before* descending into a child that would
underflow, not after. That keeps the invariant true the whole way down
instead of having to fix it up on the way back.

Root is a special case - it's allowed to have as few as 0 keys. If it hits
0 (and isn't a leaf), its one remaining child becomes the new root and the
tree shrinks by one level. That's the only place the tree height goes
down.

## Things I did NOT implement
- No disk persistence - it's all in memory, `Map`/array based.
- No concurrent access handling - single-threaded use only.
- Deletion of a key that doesn't exist just returns `false` rather than
  throwing, figured that's more useful for a KV store than an exception.
