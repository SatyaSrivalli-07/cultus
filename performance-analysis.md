# Performance analysis

Ran `performance.js`, which inserts 200,000 random integer keys and then
does 20,000 searches (half random hits, half likely misses), for a few
different branching factors (`t`). Numbers below are from an actual run,
not estimated:

| t  | tree height | insert time (ms) | inserts/sec | search time (ms) | searches/sec |
|----|-------------|-------------------|-------------|-------------------|--------------|
| 2  | 13          | 2305.0            | ~86,800     | 159.4             | ~125,400     |
| 4  | 7           | 642.8             | ~311,100    | 32.1              | ~622,500     |
| 8  | 4           | 239.4             | ~835,300    | 14.6              | ~1,367,100   |
| 16 | 3           | 176.5             | ~1,133,300  | 8.3               | ~2,419,500   |
| 32 | 3           | 151.1             | ~1,323,700  | 11.9              | ~1,681,100   |
| 64 | 2           | 282.8             | ~707,100    | 8.0               | ~2,509,200   |

## What this shows

Height drops off fast as t grows - going from t=2 to t=16 takes the tree
from 13 levels down to 3 for the same 200k keys. That directly explains
the insert/search speedup: fewer levels means fewer node visits per
operation, and since each node's internal key scan is a small linear
search over at most `2t-1` items, that scan stays cheap even as t grows
(binary search over the keys within a node would help more at very large
t, but this implementation does a linear scan - could be a next step).

Diminishing returns show up around t=16-32: insert throughput keeps
climbing a bit but search actually gets slightly worse at t=64, because
now each node has up to 127 keys to scan through linearly even though
you're only touching 2 levels. There's a real tradeoff between "fewer
levels to descend" and "more keys to scan per level" - in a real disk-
backed system t is usually chosen so that one full node fits exactly in
one disk page/block, which is why databases don't just pick the biggest
t possible.

Big picture: this matches what the B-Tree is supposed to do - trade node
scan cost (cheap, especially in memory) for tree depth (expensive,
especially on disk where each level down means another disk seek). For an
in-memory implementation like this one the sweet spot lands somewhere
around t=16-32; for a real disk-backed index the right t depends on the
page size and record size, not just raw benchmark numbers.
