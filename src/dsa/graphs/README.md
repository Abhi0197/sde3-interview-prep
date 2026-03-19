# Graph Algorithms & Patterns

## Overview

Graphs are fundamental data structures for modeling relationships and networks. Mastering graph algorithms is critical for SDE 3 interviews—graphs appear in 25-30% of technical questions and are essential for system design (networks, dependencies, topology).

### Why Graphs Matter
- **Real-world relevance**: Social networks, recommendation systems, routing, dependency management
- **Interview frequency**: 25+ LeetCode problems in typical SDE 3 prep
- **Complexity ranges**: From simple traversals (DFS/BFS) to advanced optimization (shortest paths, matching)
- **System design integration**: Graph concepts underpin distributed systems, message routing, and scalability

## Graph Representations

### 1. Adjacency Matrix
```
Space Complexity: O(V²)
Time for edge lookup: O(1)
Best for: Dense graphs, dense query patterns
```
**When to use**: Small graphs (<500 nodes), heavy edge queries

**Trade-offs**:
- ✅ Fast edge lookup O(1)
- ❌ Memory intensive for sparse graphs
- ❌ Slow iteration over edges O(V²)

### 2. Adjacency List
```
Space Complexity: O(V + E)
Time for edge lookup: O(degree)
Best for: Sparse graphs, most interview scenarios
```
**When to use**: Most problems, standard choice for interviews

**Implementation**:
```
graph = {
  1: [2, 3],
  2: [1, 4],
  3: [1],
  4: [2]
}
```

**Trade-offs**:
- ✅ Memory efficient O(V+E)
- ✅ Efficient traversal
- ❌ Edge lookup slower than matrix

### 3. Edge List
```
edges = [[1, 2], [2, 3], [1, 3], [2, 4]]
Space: O(E)
```
**When to use**: Algorithms that process edges sequentially (Kruskal's MST, Bellman-Ford)

## Core Traversal Algorithms

### Depth-First Search (DFS)

**Purpose**: Explore graph by going deep first, backtracking when necessary

**Time Complexity**: O(V + E)  
**Space Complexity**: O(V) for recursion stack

**Key Patterns**:
- Detecting cycles in directed/undirected graphs
- Finding connected components
- Topological sorting
- Checking if graph is bipartite

**Interview Tip**: DFS is recursive by nature; stack-based iterative DFS useful for avoiding stack overflow questions

**Common Variations**:
1. **Pre-order DFS** (process node before children)
2. **Post-order DFS** (process node after children)  
3. **In-order DFS** (for trees primarily)

### Breadth-First Search (BFS)

**Purpose**: Explore graph level-by-level; optimal for shortest path in unweighted graphs

**Time Complexity**: O(V + E)  
**Space Complexity**: O(V) for queue

**Key Patterns**:
- Shortest path in unweighted graphs
- Level-order traversal
- Finding components by proximity
- Bipartite checking (alternative to DFS)

**Interview Advantages**:
- ✅ Naturally finds shortest paths
- ✅ Less stack memory than DFS
- ✅ Good for "minimum steps/distance" problems

## Shortest Path Algorithms

### 1. Dijkstra's Algorithm

**Constraints**:
- Positive edge weights only
- No negative cycles

**Time Complexity**: O((V + E) log V) with min-heap  
**Space Complexity**: O(V)

**When to use**:
- Finding shortest path in weighted graphs with positive weights
- GPS navigation, networking routing protocols
- Competitive programming standard choice

**Key Insight**: Greedy algorithm—always pick unvisited node with smallest distance

**Implementation Pattern**:
1. Initialize distances to all nodes as infinity, source as 0
2. Use priority queue (min-heap) ordered by distance
3. For each node, update neighbors' distances if shorter path found
4. Mark node as visited when popped from queue (can't improve further)

**Interview Tips**:
- Watch for negative edge detection—problem should explicitly state "all weights positive"
- Use early termination if only need distance to one target node
- Consider time complexity difference with naive priority queue vs heap

### 2. Bellman-Ford Algorithm

**Constraints**:
- Works with negative edge weights
- Detects negative cycles
- No negative cycles should exist in valid input

**Time Complexity**: O(V × E)  
**Space Complexity**: O(V)

**When to use**:
- Graphs with negative edge weights
- Detecting negative cycles (financial arbitrage detection)
- When Dijkstra not applicable due to negative weights

**Key Insight**: Relax all edges V-1 times, then one more pass detects negative cycles

**Interview Pattern**:
```
For i = 1 to V-1:
  For each edge (u,v,w):
    if dist[u] + w < dist[v]:
      dist[v] = dist[u] + w

// Negative cycle detection
For each edge (u,v,w):
  if dist[u] + w < dist[v]:
    // Negative cycle exists
```

### 3. Floyd-Warshall Algorithm

**Purpose**: All-pairs shortest paths

**Time Complexity**: O(V³)  
**Space Complexity**: O(V²)

**When to use**:
- Need shortest paths between all pairs
- Small graph (V ≤ 500)
- Detecting negative cycles
- DP-based approach if interviewer wants to see DP thinking

**Key Insight**: Dynamic programming on intermediate nodes

```
dist[i][j][k] = shortest path from i to j using only nodes 0..k as intermediates
```

## Cycle Detection & Topological Sorting

### Cycle Detection

**Undirected Graphs**:
- DFS approach: If visiting neighbor that's not our parent → cycle exists
- Union-Find: If two nodes already connected, adding edge creates cycle

**Directed Graphs**:
- DFS with colors (white=unvisited, gray=visiting, black=done)
- If encounter gray node during DFS → cycle exists
- Cycle exists iff DFS produces back edge

**Interview Scenarios**:
- "Does this graph have a cycle?" (return boolean)
- "Find a cycle" (return cycle path)
- "Remove minimum edges to make acyclic" (MST-adjacent problem)

### Topological Sort

**Prerequisites**:
- Directed acyclic graph (DAG)
- Represents dependencies/ordering

**Time Complexity**: O(V + E)  
**Space Complexity**: O(V)

**Two Approaches**:

**1. DFS-based (post-order)**:
- Perform DFS, add node to result after processing all descendants
- Result is reverse topological order → reverse to get correct order

**2. Kahn's Algorithm (BFS-based)**:
```
1. Calculate in-degree for all nodes
2. Add all nodes with in-degree 0 to queue
3. While queue not empty:
   - Remove node, add to result
   - For each neighbor, decrease in-degree
   - If in-degree becomes 0, add to queue
```

**Interview Applications**:
- Course prerequisites ("You need Course A before Course B")
- Build system dependencies
- Package deployment ordering
- Job scheduling with constraints

## Minimum Spanning Tree (MST)

**Purpose**: Connect all nodes with minimum total edge weight (for undirected graphs)

**Properties**:
- Spans all V vertices (connected components get separate MSTs)
- Uses exactly V-1 edges (tree property)
- Total weight is minimal among all spanning trees
- Not unique if ties in edge weights

### Kruskal's Algorithm

**Approach**: Greedy—sort edges by weight, add if doesn't create cycle

**Time Complexity**: O(E log E) for sorting + O(E × α(V)) for Union-Find  
**Space Complexity**: O(V) for Union-Find structure

**Implementation**:
```
1. Sort all edges by weight
2. Initialize Union-Find
3. For each edge (u,v,w) in sorted order:
   - If u,v not in same component:
     - Add edge to MST
     - Union u,v components
4. Return MST edges
```

**When to use**: When edge-centric or preference to sort all edges upfront

### Prim's Algorithm

**Approach**: Greedy—grow MST from a starting node by adding minimum weight edges

**Time Complexity**: O((V + E) log V) with min-heap  
**Space Complexity**: O(V)

**Implementation**:
```
1. Start with arbitrary vertex in MST
2. Track minimum edge from MST to non-MST vertices in priority queue
3. Repeatedly pick minimum edge connecting MST to non-MST
4. Add new vertex to MST, update priority queue with new edges
```

**When to use**: Dense graphs (E ≈ V²), natural to grow incrementally

## Bipartite Checking

**Definition**: Can partition vertices into two sets such that all edges go between sets (no edges within sets)

**Interview Context**: Used in matching problems, recommendation systems, conflict detection

**Detection Approach**:
- 2-coloring: Try to color graph with 2 colors such that adjacent nodes have different colors
- BFS or DFS from each unvisited node
- If contradiction during coloring → not bipartite

**Complexity**: O(V + E)

**Interview Pattern**:
```
Use BFS/DFS to assign color:
- Color source node with color 0
- Color all neighbors with color 1
- If neighbor already has same color → return False
```

## Connected Components & Strongly Connected Components (SCC)

### Connected Components (Undirected)

**Purpose**: Find all maximal connected subgraphs

**Algorithm**: DFS or BFS from each unvisited node

**Time Complexity**: O(V + E)  
**Space Complexity**: O(V)

**Interview Use**: "Count number of isolated regions", "Which nodes are reachable from X"

### Strongly Connected Components (Directed)

**Purpose**: Find maximal set of vertices where every vertex is reachable from every other

**Kosaraju's Algorithm**: O(V + E)
```
1. Perform DFS on original graph, push nodes to stack in order of completion
2. Perform DFS on transpose graph in order of nodes popped from stack
3. Each DFS tree is one SCC
```

**Tarjan's Algorithm**: O(V + E), single pass
```
Uses low-link values and stack to identify SCCs during DFS
```

## Advanced Problem Patterns

### Pattern 1: Graph Construction
**Recognition**: Problem describes relationships/connections  
**Approach**: Build adjacency list, determine if directed/undirected  
**Examples**: Social networks, dependency graphs, constraint satisfaction

### Pattern 2: Distance/Path Finding
**Recognition**: "Shortest path", "minimum steps", "ways to reach"  
**Approach**: 
- Unweighted → BFS
- Single source, positive weights → Dijkstra
- All pairs → Floyd-Warshall
- Negative weights → Bellman-Ford

### Pattern 3: Cycle Detection
**Recognition**: "Has cycle", "circular dependency", "deadlock"  
**Approach**: 
- Directed → DFS coloring
- Undirected → DFS with parent tracking or Union-Find

### Pattern 4: Ordering/Scheduling
**Recognition**: "Order the tasks", "prerequisites", "build system"  
**Approach**: Topological sort (verify DAG first)

### Pattern 5: Connectivity
**Recognition**: "Connected components", "islands", "reach target"  
**Approach**: DFS/BFS from unvisited nodes, count components

## Complexity Reference

| Algorithm | Time | Space | Use Case |
|-----------|------|-------|----------|
| DFS | O(V+E) | O(V) | Traversal, cycles, connectivity |
| BFS | O(V+E) | O(V) | Shortest path (unweighted) |
| Dijkstra | O((V+E)logV) | O(V) | Shortest path (positive weights) |
| Bellman-Ford | O(V×E) | O(V) | Shortest path (negative weights) |
| Floyd-Warshall | O(V³) | O(V²) | All-pairs shortest paths |
| Kruskal | O(ElogE) | O(V) | MST |
| Prim | O((V+E)logV) | O(V) | MST |
| Topological Sort | O(V+E) | O(V) | DAG ordering |

## LeetCode Problem Recommendations

### Level 1: Traversal Basics
- [Number of Islands](https://leetcode.com/problems/number-of-islands/) - Connected components
- [Clone Graph](https://leetcode.com/problems/clone-graph/) - DFS traversal
- [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/) - BFS
- [Course Schedule](https://leetcode.com/problems/course-schedule/) - Cycle detection
- [Max Area of Island](https://leetcode.com/problems/max-area-of-island/) - DFS

### Level 2: Shortest Path & Routing
- [Word Ladder](https://leetcode.com/problems/word-ladder/) - BFS shortest path
- [Network Delay Time](https://leetcode.com/problems/network-delay-time/) - Dijkstra
- [Cheapest Flights with K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/) - Constrained shortest path
- [Find City with Smallest Distance to Other Cities](https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/) - All-pairs shortest path
- [The Maze II](https://leetcode.com/problems/the-maze-ii/) - Dijkstra in grid

### Level 3: Advanced Patterns
- [Alien Dictionary](https://leetcode.com/problems/alien-dictionary/) - Topological sort on characters
- [Find if Path Exists](https://leetcode.com/problems/find-if-path-exists-in-graph/) - Graph connectivity
- [Critical Connections in Network](https://leetcode.com/problems/critical-connections-in-a-network/) - Bridge finding
- [Path With Minimum Effort](https://leetcode.com/problems/path-with-minimum-effort/) - Dijkstra in grid
- [Parallel Courses III](https://leetcode.com/problems/parallel-courses-iii/) - Topological sort with weights

### Level 4: System Design Integration
- LeetCode 310: Minimum Height Trees (special topological property)
- LeetCode 444: Sequence Reconstruction (topological validation)
- LeetCode 1857: Largest Color Value in Directed Graph (DP on DAG)
- LeetCode 1976: Number of Ways to Arrive at Destination (path counting with shortest path)

## Interview Tips

1. **Always clarify**: Directed or undirected? Weighted or unweighted? Positive or negative weights?

2. **Choose representation wisely**: 
   - Most problems → adjacency list
   - Dense graphs → adjacency matrix
   - Edge processing → edge list

3. **Complexity awareness**:
   - DFS/BFS: O(V+E) → prefer when possible
   - Dijkstra additions (heap): log V factor
   - Floyd-Warshall: O(V³) → only for small graphs or all-pairs requirement

4. **Common pitfalls**:
   - Forgetting to mark visited nodes → infinite loop
   - Treating directed as undirected or vice versa
   - Using BFS for weighted shortest path without Dijkstra
   - Topological sort on cyclic graph → crashes or incorrect output

5. **Testing**:
   - Disconnected components
   - Self-loops, duplicate edges
   - Single node, empty graph
   - Cycles in directed graphs
   - Starting from different source nodes

6. **Space optimization**:
   - Use visited set instead of separate tracking structure when possible
   - Track only essential node information
   - Consider bit flags for large graphs with boolean states

## Key Takeaways

- **DFS/BFS**: Master both—fundamental for all graph problems
- **Shortest Paths**: Know when to use each algorithm (BFS vs Dijkstra vs Bellman-Ford)
- **Graph Construction**: Most problems start here—get representation right
- **Cycle Detection**: Critical for system design (deadlock detection, dependency validation)
- **Topological Sort**: Essential for scheduling, build systems, course prerequisites
- **MST Algorithms**: Important but less common in interviews than shortest paths
- **Pattern Recognition**: Most interview problems fit 5-6 core patterns; learn to identify them quickly

## Real Interview Examples

**Example 1: "Design a social network where you can find mutual friends"**
- Graph: Nodes = users, edges = friendships (undirected)
- Algorithm: Intersection of neighbors (distance-2 BFS)
- Complexity: O(friends * friends) which is bounded by O(V²)

**Example 2: "Find minimum cost to build a network connecting all cities"**
- Graph: Nodes = cities, edges = roads with costs
- Algorithm: MST (Kruskal or Prim)
- Interview focus: Complexity tradeoff between algorithms

**Example 3: "Detect if our deployment system has circular dependencies"**
- Graph: Nodes = packages, edges = depends_on (directed)
- Algorithm: Cycle detection in directed graph (DFS coloring)
- System design angle: Why dependency cycles cause deployment failures

**Example 4: "Route messages through our network backbone with minimum latency"**
- Graph: Nodes = servers, edges = links with latency
- Algorithm: Dijkstra for each source or Floyd-Warshall for all pairs
- Consideration: Real-world links fail—how does algorithm handle dynamic graph?
