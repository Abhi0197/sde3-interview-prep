# Dynamic Programming - Comprehensive Guide

## Overview

Dynamic Programming (DP) is a **fundamental algorithm design technique** that solves complex problems by breaking them into overlapping subproblems and caching their solutions. For SDE 3 interviews, DP is **critical** - appearing in 30-40% of coding interviews.

---

## 🎯 Core DP Principles

### 1. **Optimal Substructure**
An optimal solution contains optimal solutions to subproblems.

**Example: Longest Increasing Subsequence (LIS)**
```python
# If LIS ending at index i is optimal, then LIS ending at i-1 is also optimal
# LIS[i] = max(LIS[j] for j < i where arr[j] < arr[i]) + 1

arr = [3, 10, 2, 1, 20]
#  LIS = [3, 10, 20]
#  LIS[4] = max(LIS[0], LIS[2], LIS[3]) + 1 = max(2, 2, 1) + 1 = 3
```

### 2. **Overlapping Subproblems**
Same subproblems repeat in recursive computation.

**Example: Fibonacci**
```
fib(5) calls:
         fib(5)
        /      \
     fib(4)    fib(3)
     /   \      /   \
  fib(3) fib(2) fib(2) fib(1)
  /  \   /  \   /  \
fib(2)...fib(2) appears MANY times ❌
```

**Without DP**: O(2^n) - exponential!  
**With DP**: O(n) - linear!

### 3. **Memoization vs Tabulation**

| Aspect | Memoization (Top-Down) | Tabulation (Bottom-Up) |
|--------|------------------------|------------------------|
| Approach | Recursion + caching | Iteration + table |
| Order | Solves needed subproblems | Solve all subproblems |
| Code | Closer to brute force | Loop-based |
| Space | Recursion stack | No recursion |
| Debugging | Harder (deep recursion) | Easier (step-by-step) |

---

## 🔥 Classic DP Problems

### 1. **Fibonacci (Warmup)**

**Problem**: Find F(n) where F(n) = F(n-1) + F(n-2), F(0)=0, F(1)=1

```python
# Approach 1: Naive Recursion - O(2^n) ❌
def fib_recursive(n):
    if n <= 1:
        return n
    return fib_recursive(n-1) + fib_recursive(n-2)

# Approach 2: Memoization - O(n) ✅
def fib_memo(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib_memo(n-1, memo) + fib_memo(n-2, memo)
    return memo[n]

# Approach 3: Tabulation - O(n) ✅
def fib_tab(n):
    if n <= 1:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]

# Approach 4: Space Optimized - O(1) ✅✅
def fib_optimal(n):
    if n <= 1:
        return n
    prev, curr = 0, 1
    for _ in range(2, n + 1):
        prev, curr = curr, prev + curr
    return curr
```

**Interview Tips**:
- Start with naive recursion to show understanding
- Identify overlapping subproblems
- Optimize to memoization
- Discuss space optimization

---

### 2. **[Climbing Stairs](https://leetcode.com/problems/climbing-stairs/) (Medium)**

**Problem**: Reach nth stair. Each move: climb 1 or 2 steps. How many ways?

```python
# Example: n=3
# Path 1: 1+1+1
# Path 2: 1+2
# Path 3: 2+1
# Total: 3 ways

# Insight: dp[n] = dp[n-1] + dp[n-2]
# (reach n by coming from n-1 with 1 step OR from n-2 with 2 steps)

def climb_stairs(n):
    if n <= 2:
        return n
    dp = [0] * (n + 1)
    dp[1], dp[2] = 1, 2
    for i in range(3, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]

# Extended: k steps allowed
def climb_stairs_k(n, k):
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        for j in range(1, min(k, i) + 1):
            dp[i] += dp[i-j]
    return dp[n]
```

**Follow-ups**:
- Can skip any stair? → Use different state
- Some stairs forbidden? → Skip those in calculation
- Find path itself? → Backtrack from dp table

---

### 3. **0/1 Knapsack Problem (Classic)**

**Problem**: Given items with weight and value, fill knapsack of capacity W to maximize value.

```python
def knapsack_01(weights, values, W):
    n = len(weights)
    # dp[i][w] = max value using first i items with weight limit w
    dp = [[0] * (W + 1) for _ in range(n + 1)]
    
    for i in range(1, n + 1):
        for w in range(W + 1):
            # Don't take item
            dp[i][w] = dp[i-1][w]
            
            # Take item (if it fits)
            if weights[i-1] <= w:
                dp[i][w] = max(
                    dp[i][w],
                    dp[i-1][w - weights[i-1]] + values[i-1]
                )
    
    return dp[n][W]

# Space optimized: O(W) instead of O(n*W)
def knapsack_01_optimized(weights, values, W):
    dp = [0] * (W + 1)
    
    for i in range(len(weights)):
        # Traverse backward to avoid using same item twice
        for w in range(W, weights[i] - 1, -1):
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i])
    
    return dp[W]

# Unbounded Knapsack (can use item multiple times)
def knapsack_unbounded(weights, values, W):
    dp = [0] * (W + 1)
    
    for i in range(len(weights)):
        # Traverse forward to allow reusing items
        for w in range(weights[i], W + 1):
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i])
    
    return dp[W]
```

**Variations**:
- Bounded: Limited copies of each item
- Unbounded: Unlimited copies
- Fractional: Can split items (greedy, not DP)

---

### 4. **[Coin Change](https://leetcode.com/problems/coin-change/) (Very Common)**

**Problem**: Given coin denominations, find minimum coins to make amount.

```python
def coin_change_min(coins, amount):
    # dp[i] = min coins to make amount i
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    
    for coin in coins:
        for amt in range(coin, amount + 1):
            dp[amt] = min(dp[amt], dp[amt - coin] + 1)
    
    return dp[amount] if dp[amount] != float('inf') else -1

# Count ways to make change
def coin_change_ways(coins, amount):
    dp = [0] * (amount + 1)
    dp[0] = 1  # One way to make 0: use no coins
    
    for coin in coins:
        for amt in range(coin, amount + 1):
            dp[amt] += dp[amt - coin]
    
    return dp[amount]

# Example: coins=[1,2,5], amount=5
# Ways: [5], [2,2,1], [2,1,1,1], [1,1,1,1,1] = 4 ways
```

**Interview patterns**:
- Minimum coins: use min operation
- Count ways: use sum operation
- Reconstruct path: store parent in dp

---

### 5. **[Longest Increasing Subsequence](https://leetcode.com/problems/longest-increasing-subsequence/) (LIS - Hard)**

**Problem**: Find length of longest strictly increasing subsequence.

```python
def lis_length(arr):
    n = len(arr)
    if n == 0:
        return 0
    
    # Approach 1: O(n^2) with dp
    dp = [1] * n
    for i in range(1, n):
        for j in range(i):
            if arr[j] < arr[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    
    return max(dp)

def lis_array(arr):
    # Approach 2: O(n log n) with binary search
    from bisect import bisect_left
    
    # tails[i] = smallest tail element for LIS of length i+1
    tails = []
    indices = []  # Track which element ends each LIS
    
    for num in arr:
        pos = bisect_left(tails, num)
        if pos == len(tails):
            tails.append(num)
            indices.append(len(indices))
        else:
            tails[pos] = num
            indices[pos] = len(indices)
    
    return len(tails)

# Example: arr = [3, 10, 2, 1, 20]
# LIS = [3, 10, 20] (length 3)
# dp = [1, 2, 1, 1, 3]
```

---

### 6. **[Edit Distance](https://leetcode.com/problems/edit-distance/) (Levenshtein - Common)**

**Problem**: Minimum operations (insert/delete/replace) to transform s1 into s2.

```python
def edit_distance(s1, s2):
    m, n = len(s1), len(s2)
    # dp[i][j] = min ops to transform s1[0..i] to s2[0..j]
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    # Base cases
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i-1] == s2[j-1]:
                dp[i][j] = dp[i-1][j-1]  # No op needed
            else:
                dp[i][j] = 1 + min(
                    dp[i-1][j],      # Delete
                    dp[i][j-1],      # Insert
                    dp[i-1][j-1]     # Replace
                )
    
    return dp[m][n]

# Example: s1="horse", s2="ros"
# h o r s e
# - r o s
# Ops: delete h, delete e = 2
```

---

## 📝 DP State Design Patterns

### **1. Linear DP** (Single dimension)
```python
# dp[i] = answer for state i
# Transition: dp[i] = f(dp[0..i-1])
# Example: Fibonacci, Climbing Stairs, House Robber
```

### **2. 2D DP** (Two dimensions)
```python
# dp[i][j] = answer for state (i, j)
# Transition: dp[i][j] = f(dp[0..i][0..j])
# Example: Knapsack, EditDistance, DP on Grid
```

### **3. String DP**
```python
# dp[i][j] = answer for substring s[i..j]
# Example: Longest Palindromic Substring, Burst Balloons
```

### **4. Tree DP**
```python
# dp[node][state] = answer for subtree rooted at node
# Example: House Robber III, Tree Path Problems
```

---

## 🎓 Interview Checklist

### Understanding
- [ ] Can identify if a problem is a DP problem
- [ ] Can define state and recurrence relation clearly
- [ ] Understand memoization vs tabulation trade-offs
- [ ] Know time and space complexity analysis

### Implementation
- [ ] Can code memoization clean
- [ ] Can code tabulation clean
- [ ] Can optimize space when possible
- [ ] Trace through examples while coding

### Communication
- [ ] Explain why problem has optimal substructure
- [ ] Explain why subproblems overlap
- [ ] Walk through small example
- [ ] Discuss time/space trade-offs

### Advanced
- [ ] Can solve hard DP problems under time pressure
- [ ] Know when to use 1D vs 2D vs string DP
- [ ] Can reconstruct solution (not just count)
- [ ] Can optimize O(n^2) to O(n log n) with other techniques

---

## 🔥 Most Asked Interview Problems

| Problem | Difficulty | Key Insight | Companies |
|---------|-----------|-------------|-----------|
| [Climbing Stairs](https://leetcode.com/problems/climbing-stairs/) | Easy | Linear recurrence | All |
| [House Robber](https://leetcode.com/problems/house-robber/) | Easy/Medium | State = include/exclude | All |
| [Coin Change](https://leetcode.com/problems/coin-change/) | Medium | Count subproblems | Bloomberg, Google |
| [Edit Distance](https://leetcode.com/problems/edit-distance/) | Medium | String alignment | Amazon, Microsoft |
| [Longest Increasing Subsequence](https://leetcode.com/problems/longest-increasing-subsequence/) | Medium | Binary search optimization | Google, Facebook |
| [Burst Balloons](https://leetcode.com/problems/burst-balloons/) | Hard | Interval DP | Hard round |
| [Regular Expression Matching](https://leetcode.com/problems/regular-expression-matching/) | Hard | String DP | Google (famous) |
| [Distinct Subsequences](https://leetcode.com/problems/distinct-subsequences/) | Hard | String DP with duplicates | Google, Amazon |

---

## 💡 Key Takeaways

1. **DP ≈ Memoized Recursion**: Start with recursive solution, add caching
2. **State Definition**: Once you define state correctly, recurrence is obvious
3. **Optimize Space**: Often reducible from O(n^2) to O(n) by reusing arrays
4. **Reconstruct Path**: Store parent pointers or indices to rebuild solution
5. **Test Edge Cases**: n=0, empty strings, single elements crucial
6. **Practice Regularly**: DP requires pattern recognition from experience
7. **Time Budget**: Hard DP problems need 30-40 min in interview
8. **Communicate**: Explain your thought process while coding
