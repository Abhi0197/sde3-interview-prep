# Trees & Binary Search Trees - Complete Interview Guide

## 🌳 Tree Fundamentals

**Tree Definition**: Connected acyclic graph with parent-child relationships

**Key Metrics**:
- **Height**: Longest path from root to leaf (empty tree = -1, single node = 0)
- **Depth**: Distance from root to node (root depth = 0)
- **Diameter**: Longest path between ANY two nodes (not necessarily through root!)

**Binary Tree vs BST**:
- **Binary Tree**: Each node has ≤ 2 children (no ordering)
- **BST**: Binary Tree where Left < Parent < Right

---

## 🔍 Binary Search Tree Operations

```java
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

// Search - O(log n) average, O(n) worst
TreeNode search(TreeNode root, int target) {
    if (root == null || root.val == target) return root;
    return target < root.val ? 
        search(root.left, target) : search(root.right, target);
}

// Insert - O(log n) average, O(n) worst
TreeNode insert(TreeNode root, int val) {
    if (root == null) return new TreeNode(val);
    if (val < root.val) root.left = insert(root.left, val);
    else if (val > root.val) root.right = insert(root.right, val);
    // Duplicates: ignore or handle per requirements
    return root;
}

// Delete - O(log n) average, O(n) worst
// 3 cases: 0 children, 1 child, 2 children
TreeNode delete(TreeNode root, int val) {
    if (root == null) return null;
    if (val < root.val) {
        root.left = delete(root.left, val);
    } else if (val > root.val) {
        root.right = delete(root.right, val);
    } else {
        // Found node to delete
        
        // Case 1: No children (leaf node)
        if (root.left == null && root.right == null) {
            return null;
        }
        
        // Case 2: One child
        if (root.left == null) return root.right;
        if (root.right == null) return root.left;
        
        // Case 3: Two children
        // Find inorder successor (leftmost in right subtree)
        // OR inorder predecessor (rightmost in left subtree)
        TreeNode minRight = findMin(root.right);
        root.val = minRight.val;
        root.right = delete(root.right, minRight.val);
    }
    return root;
}

TreeNode findMin(TreeNode node) {
    while (node.left != null) node = node.left;
    return node;
}
```

---

## 🧭 Tree Traversals (DFS & BFS)

### DFS Traversals (Recursive)

```java
// In-order (Left-Root-Right): Gives SORTED values in BST
void inorder(TreeNode root) {
    if (root == null) return;
    inorder(root.left);
    System.out.println(root.val);  // Process
    inorder(root.right);
}
// Use: Validate BST, get sorted order, find kth element

// Pre-order (Root-Left-Right): Visit parent before children
void preorder(TreeNode root) {
    if (root == null) return;
    System.out.println(root.val);  // Process
    preorder(root.left);
    preorder(root.right);
}
// Use: Copy tree, serialize, check tree properties

// Post-order (Left-Right-Root): Visit children before parent
void postorder(TreeNode root) {
    if (root == null) return;
    postorder(root.left);
    postorder(root.right);
    System.out.println(root.val);  // Process
}
// Use: Delete tree, get heights, evaluate expressions
```

### Level-Order Traversal (BFS)

```java
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    
    Queue<TreeNode> queue = new LinkedList<>();
    queue.add(root);
    
    while (!queue.isEmpty()) {
        int size = queue.size();  // Critical: Capture current level size
        List<Integer> level = new ArrayList<>();
        
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.add(node.left);
            if (node.right != null) queue.add(node.right);
        }
        result.add(level);
    }
    return result;
}
// Time: O(n), Space: O(w) where w = max width
```

---

## ✔️ Top 15 Interview Problems (By Frequency)

### Problem 1: [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/) ⭐⭐⭐⭐⭐

```
Check if tree is valid BST

Key insight: Each node must be within valid range [min, max]
Not enough to just check left < root < right!

Example:
    5
   / \
  4   6
     / \
    3   7  ← INVALID! 3 < 5 (violates root > left subtree)
```

```java
boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

boolean validate(TreeNode node, long min, long max) {
    if (node == null) return true;
    if (node.val <= min || node.val >= max) return false;
    
    // Left subtree: all values < node.val
    // Right subtree: all values > node.val
    return validate(node.left, min, node.val) &&
           validate(node.right, node.val, max);
}
// Time: O(n), Space: O(h) [recursion depth]
```

---

### Problem 2: [Lowest Common Ancestor (LCA)](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/) ⭐⭐⭐⭐

```
Find LCA of two nodes in BST

Input tree:       6
                 / \
                2   8
               / \  / \
              0 4 7  9
                /\
               3  5

LCA(2, 4) = 2
LCA(2, 8) = 6
LCA(0, 4) = 2
```

```java
TreeNode findLCA_BST(TreeNode root, int p, int q) {
    // Take advantage of BST property
    if (p < root.val && q < root.val)
        return findLCA_BST(root.left, p, q);
    if (p > root.val && q > root.val)
        return findLCA_BST(root.right, p, q);
    return root;  // root is LCA
}
// Time: O(log n) [balanced] to O(n) [skewed]

// For non-BST (generic binary tree):
TreeNode findLCA_Generic(TreeNode root, int p, int q) {
    if (root == null) return null;
    
    TreeNode left = findLCA_Generic(root.left, p, q);
    TreeNode right = findLCA_Generic(root.right, p, q);
    
    if (left != null && right != null) return root;  // Both p,q found
    return left != null ? left : right;  // One or none found on one side
}
// Time: O(n), Space: O(h)
```

---

### Problem 3: [Maximum Path Sum in Tree](https://leetcode.com/problems/binary-tree-maximum-path-sum/) ⭐⭐⭐⭐

```
Find max sum of any path (path = any sequence of edges)
Path doesn't need to start/end at root

Tree:
      -10
      /  \
     9   20
        /  \
       15   7

Max path: 15 → 20 → 7 = 42 (not through root)
```

```java
int maxPathSum(TreeNode root) {
    int[] max = {Integer.MIN_VALUE};
    maxPathHelper(root, max);
    return max[0];
}

// Returns: max sum of path starting from this node going DOWN
int maxPathHelper(TreeNode node, int[] max) {
    if (node == null) return 0;
    
    // Recursively get max paths from left and right
    int left = Math.max(0, maxPathHelper(node.left, max));
    int right = Math.max(0, maxPathHelper(node.right, max));
    
    // Current path through this node (left → node → right)
    max[0] = Math.max(max[0], left + node.val + right);
    
    // Return max path going DOWN from this node
    return Math.max(left, right) + node.val;
}
// Time: O(n), Space: O(h)
```

---

### Problem 4: [Path Sum III - Count Paths](https://leetcode.com/problems/path-sum-iii/) ⭐⭐⭐⭐

```
Count paths where sum equals target (path goes downward)

Tree:
     10
    /  \
   5   -3
  / \
 3   2
    /
   11

Count paths with sum = 8:
- 5 → 3 (one path)
- 5 → 2 → 11 (one path)
Total: 2
```

```java
int pathSum(TreeNode root, int targetSum) {
    Map<Integer, Integer> prefixSum = new HashMap<>();
    prefixSum.put(0, 1);  // Base case: "no nodes"
    return dfsPath(root, 0, targetSum, prefixSum);
}

int dfsPath(TreeNode node, long currentSum, int target, Map<Integer, Integer> prefixSum) {
    if (node == null) return 0;
    
    currentSum += node.val;
    
    // How many times have we seen (currentSum - target)?
    // If yes, there's a path ending here with sum = target
    int count = prefixSum.getOrDefault((int)(currentSum - target), 0);
    
    // Add current sum to map
    prefixSum.put((int)currentSum, prefixSum.getOrDefault((int)currentSum, 0) + 1);
    
    // Recurse to children
    count += dfsPath(node.left, currentSum, target, prefixSum);
    count += dfsPath(node.right, currentSum, target, prefixSum);
    
    // Backtrack: remove current sum (important!)
    prefixSum.put((int)currentSum, prefixSum.get((int)currentSum) - 1);
    
    return count;
}
// Time: O(n), Space: O(h)
```

---

### Problem 5:  Build Tree from Traversals ⭐⭐⭐

```
Reconstruct tree from inorder + preorder

Inorder:  [9,3,15,20,7]
Preorder: [3,9,20,15,7]

Key: Preorder[0] is ROOT. Split inorder at root.
```

```java
TreeNode buildTree(int[] preorder, int[] inorder) {
    Map<Integer, Integer> inMap = new HashMap<>();
    for (int i = 0; i < inorder.length; i++) {
        inMap.put(inorder[i], i);
    }
    return buildHelper(preorder, inorder, 0, preorder.length - 1, 0, inorder.length - 1, inMap);
}

TreeNode buildHelper(int[] preorder, int[] inorder,
                     int preLo, int preHi, int inLo, int inHi,
                     Map<Integer, Integer> inMap) {
    if (preLo > preHi) return null;
    
    TreeNode root = new TreeNode(preorder[preLo]);
    int inRoot = inMap.get(root.val);
    
    int numsLeft = inRoot - inLo;
    root.left = buildHelper(preorder, inorder, preLo + 1, preLo + numsLeft,
                            inLo, inRoot - 1, inMap);
    root.right = buildHelper(preorder, inorder, preLo + numsLeft + 1, preHi,
                             inRoot + 1, inHi, inMap);
    return root;
}
// Time: O(n), Space: O(n)
```

---

### Problem 6: Serialize/Deserialize Tree ⭐⭐

```
Convert tree to string and back

Serialize:   [3,9,20,null,null,15,7]
Deserialize: Reconstruct tree from string
```

```java
// Use pre-order + null markers
String serialize(TreeNode root) {
    StringBuilder sb = new StringBuilder();
    serializeHelper(root, sb);
    return sb.toString();
}

void serializeHelper(TreeNode node, StringBuilder sb) {
    if (node == null) {
        sb.append("null,");
        return;
    }
    sb.append(node.val).append(",");
    serializeHelper(node.left, sb);
    serializeHelper(node.right, sb);
}

TreeNode deserialize(String data) {
    String[] nodes = data.split(",");
    Queue<String> queue = new LinkedList<>(Arrays.asList(nodes));
    return deserializeHelper(queue);
}

TreeNode deserializeHelper(Queue<String> queue) {
    String val = queue.poll();
    if (val.equals("null")) return null;
    TreeNode node = new TreeNode(Integer.parseInt(val));
    node.left = deserializeHelper(queue);
    node.right = deserializeHelper(queue);
    return node;
}
// Time: O(n), Space: O(n)
```

---

### Additional Problems

| # | Problem | Difficulty | Technique |
|---|---------|-----------|-----------|
| 7 | [Symmetric Tree (Mirror Tree)](https://leetcode.com/problems/symmetric-tree/) | Easy | DFS |
| 8 | [Binary Tree Diameter](https://leetcode.com/problems/diameter-of-binary-tree/) | Medium | DFS |
| 9 | [Balanced Binary Tree](https://leetcode.com/problems/balanced-binary-tree/) | Easy | DFS |
| 10 | [Invert Binary Tree](https://leetcode.com/problems/invert-binary-tree/) | Easy | DFS |
| 11 | [Flatten Tree to Linked List](https://leetcode.com/problems/flatten-binary-tree-to-linked-list/) | Medium | DFS |
| 12 | [Kth Smallest in BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/) | Medium | Inorder |
| 13 | [Closest Value in BST](https://leetcode.com/problems/closest-binary-search-tree-value/) | Easy | BST Properties |
| 14 | [Delete Node in BST](https://leetcode.com/problems/delete-node-in-a-bst/) | Medium | BST Delete |
| 15 | [Recover BST](https://leetcode.com/problems/recover-binary-search-tree/) | Hard | Inorder |

---

## 🚀 Interview Tips

**Common Mistakes**:
- ❌ Forgetting to check null pointers
- ❌ Using wrong traversal for task
- ❌ Not maintaining BST invariants
- ❌ Forgetting to handle duplicate values

**When to Use Each**:
- **Inorder**: Get sorted values, validate BST
- **Preorder**: Copy tree, serialize
- **Postorder**: Delete tree, compute heights
- **BFS**: Level-by-level, shortest path

**Edge Cases**:
- Empty tree (null root)
- Single node
- Skewed tree (looks like linked list)
- All same values
- Negative values

---

## 📊 Complexity Summary

| Operation | Best | Average | Worst | Note |
|-----------|------|---------|-------|------|
| Search BST | O(log n) | O(log n) | O(n) | Skewed tree |
| Insert BST | O(log n) | O(log n) | O(n) | Maintain property |
| Delete BST | O(log n) | O(log n) | O(n) | Handle 3 cases |
| Traverse | O(n) | O(n) | O(n) | Visit all |

---

## 🎓 Interview Checklist

- [ ] Can implement search, insert, delete correctly
- [ ] Know all 4 traversals and when to use each
- [ ] Can validate BST (understand range checking)
- [ ] Can find LCA efficiently
- [ ] Can solve path sum variations
- [ ] Can serialize/deserialize
- [ ] Can build tree from traversals
- [ ] Understand height vs depth
- [ ] Know balanced BST concepts (AVL, Red-Black)
- [ ] Can handle duplicate values correctly
