# Arrays - Complete Interview Guide

## 🎯 Arrays Fundamentals

Arrays are the **most fundamental data structure** in programming interviews. A collection of elements stored in contiguous memory locations.

### Time & Space Complexity
| Operation | Time | Space | Notes |
|-----------|------|-------|-------|
| Access by index | O(1) | O(1) | Direct lookup |
| Search (unsorted) | O(n) | O(1) | Linear scan |
| Search (sorted) | O(log n) | O(1) | Binary search |
| Insert at end | O(1)* | O(n) | Amortized |
| Insert in middle | O(n) | O(n) | Shift elements |
| Delete from middle | O(n) | O(n) | Shift elements |

\*Amortized O(1) for dynamic arrays with doubling

---

## 🔧 Core Techniques Every Interview

### 1. Two Pointer Technique - O(n), O(1) space

**When**: Sorted array, need pairs/opposite ends, in-place modification

```java
// Remove Duplicates (in-place)
int removeDuplicates(int[] nums) {
    int j = 0;  // Position for unique elements
    for (int i = 1; i < nums.length; i++) {
        if (nums[i] != nums[j]) {
            nums[++j] = nums[i];
        }
    }
    return j + 1;  // New length
}

// Two Sum in Sorted Array
int[] twoSum(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target)
            return new int[]{left + 1, right + 1};  // 1-indexed
        else if (sum < target)
            left++;
        else
            right--;
    }
    
    return new int[]{};
}

// Container With Most Water - O(n)
int maxArea(int[] height) {
    int left = 0, right = height.length - 1;
    int maxArea = 0;
    
    while (left < right) {
        int width = right - left;
        int h = Math.min(height[left], height[right]);
        maxArea = Math.max(maxArea, width * h);
        
        // Move the shorter line
        if (height[left] < height[right])
            left++;
        else
            right--;
    }
    
    return maxArea;
}

// 3Sum - O(n²)
List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);  // O(n log n)
    List<List<Integer>> result = new ArrayList<>();
    
    for (int i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] == nums[i-1]) continue;  // Skip duplicates
        if (nums[i] > 0) break;  // Impossible to get 0 sum
        
        int left = i + 1, right = nums.length - 1;
        int target = -nums[i];
        
        while (left < right) {
            int sum = nums[left] + nums[right];
            if (sum == target) {
                result.add(Arrays.asList(nums[i], nums[left], nums[right]));
                while (left < right && nums[left] == nums[left+1]) left++;
                while (left < right && nums[right] == nums[right-1]) right--;
                left++;
                right--;
            } else if (sum < target) {
                left++;
            } else {
                right--;
            }
        }
    }
    
    return result;
}
```

---

### 2. Sliding Window - O(n), O(k) space

**When**: Contiguous subarrays, strings, finding "something" in window

```java
// Maximum Subarray Sum (Size K) - O(n)
int maxSumSubarray(int[] nums, int k) {
    int windowSum = 0;
    for (int i = 0; i < k; i++) {
        windowSum += nums[i];
    }
    
    int maxSum = windowSum;
    for (int i = k; i < nums.length; i++) {
        windowSum += nums[i] - nums[i - k];
        maxSum = Math.max(maxSum, windowSum);
    }
    
    return maxSum;
}

// Longest Substring Without Repeats - O(n)
int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> lastSeen = new HashMap<>();
    int left = 0, maxLen = 0;
    
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        
        if (lastSeen.containsKey(c)) {
            left = Math.max(left, lastSeen.get(c) + 1);
        }
        
        lastSeen.put(c, right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    
    return maxLen;
}

// Minimum Window Substring (Hard) - O(n)
String minWindow(String s, String t) {
    Map<Character, Integer> need = new HashMap<>();
    Map<Character, Integer> window = new HashMap<>();
    
    for (char c : t.toCharArray()) {
        need.put(c, need.getOrDefault(c, 0) + 1);
    }
    
    int left = 0, required = need.size();
    int formed = 0;
    int ans_len = Integer.MAX_VALUE, ans_left = 0;
    
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        window.put(c, window.getOrDefault(c, 0) + 1);
        
        if (need.containsKey(c) && window.get(c).equals(need.get(c))) {
            formed++;
        }
        
        while (formed == required) {
            if (right - left + 1 < ans_len) {
                ans_len = right - left + 1;
                ans_left = left;
            }
            
            char c_left = s.charAt(left);
            window.put(c_left, window.get(c_left) - 1);
            if (need.containsKey(c_left) && window.get(c_left) < need.get(c_left)) {
                formed--;
            }
            left++;
        }
    }
    
    return ans_len == Integer.MAX_VALUE ? "" : s.substring(ans_left, ans_left + ans_len);
}
```

---

### 3. Prefix Sum / Cumulative Sum - O(n), O(n) space

**When**: Range sum queries, subarrays with specific properties, product problems

```java
// 1D Prefix Sum
int[] buildPrefixSum(int[] nums) {
    int[] prefix = new int[nums.length + 1];
    for (int i = 0; i < nums.length; i++) {
        prefix[i + 1] = prefix[i] + nums[i];
    }
    return prefix;
}

int rangeSum(int[] prefix, int left, int right) {
    return prefix[right + 1] - prefix[left];  // Inclusive
}

// 2D Prefix Sum
int[][] buildPrefix2D(int[][] matrix) {
    int m = matrix.length, n = matrix[0].length;
    int[][] prefix = new int[m + 1][n + 1];
    
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            prefix[i][j] = matrix[i-1][j-1] 
                          + prefix[i-1][j] 
                          + prefix[i][j-1] 
                          - prefix[i-1][j-1];
        }
    }
    return prefix;
}

int sumOfRect(int[][] prefix, int r1, int c1, int r2, int c2) {
    return prefix[r2+1][c2+1] 
         - prefix[r1][c2+1] 
         - prefix[r2+1][c1] 
         + prefix[r1][c1];
}

// Count Subarrays with Sum = K - O(n)
int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0, 1);  // Empty subarray
    
    int count = 0;
    int sum = 0;
    
    for (int num : nums) {
        sum += num;
        // If there exists prefix_sum such that sum - prefix_sum = k
        // Then we found a valid subarray
        count += prefixCount.getOrDefault(sum - k, 0);
        prefixCount.put(sum, prefixCount.getOrDefault(sum, 0) + 1);
    }
    
    return count;
}

// Product of Array Except Self - O(n), O(1) space (excluding output)
int[] productExceptSelf(int[] nums) {
    int n = nums.length;
    int[] answer = new int[n];
    
    // Left products: answer[i] = product of all elements to the left
    answer[0] = 1;
    for (int i = 1; i < n; i++) {
        answer[i] = answer[i-1] * nums[i-1];
    }
    
    // Right products: multiply with product of all elements to the right
    int rightProduct = 1;
    for (int i = n - 1; i >= 0; i--) {
        answer[i] *= rightProduct;
        rightProduct *= nums[i];
    }
    
    return answer;
}
```

---

### 4. Kadane's Algorithm - Maximum Subarray - O(n), O(1)

**Greedy approach**: At each position, decide to extend or restart.

```java
// Maximum Subarray Sum
int maxSubarray(int[] nums) {
    int maxSum = nums[0];
    int currentSum = nums[0];
    
    for (int i = 1; i < nums.length; i++) {
        // Either extend existing sum or start fresh
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }
    
    return maxSum;
}

// Track indices of maximum subarray
int[] maxSubarrayIndices(int[] nums) {
    int maxSum = nums[0];
    int currentSum = nums[0];
    int maxStart = 0, maxEnd = 0;
    int tempStart = 0;
    
    for (int i = 1; i < nums.length; i++) {
        if (nums[i] > currentSum + nums[i]) {
            currentSum = nums[i];
            tempStart = i;
        } else {
            currentSum = currentSum + nums[i];
        }
        
        if (currentSum > maxSum) {
            maxSum = currentSum;
            maxStart = tempStart;
            maxEnd = i;
        }
    }
    
    return new int[]{maxStart, maxEnd, maxSum};
}

// Maximum Product Subarray (similar logic)
int maxProductSubarray(int[] nums) {
    int maxProduct = nums[0];
    int minProduct = nums[0];
    int result = nums[0];
    
    for (int i = 1; i < nums.length; i++) {
        // Negative number can flip min to max
        int tempMax = Math.max(nums[i], Math.max(maxProduct * nums[i], minProduct * nums[i]));
        minProduct = Math.min(nums[i], Math.min(maxProduct * nums[i], minProduct * nums[i]));
        maxProduct = tempMax;
        
        result = Math.max(result, maxProduct);
    }
    
    return result;
}
```

---

### 5. Rotate & Rearrange Arrays - O(n), O(1) space

```java
// Rotate Array Right by K - O(n)
void rotate(int[] nums, int k) {
    k = k % nums.length;  // Handle k > n
    reverse(nums, 0, nums.length - 1);
    reverse(nums, 0, k - 1);
    reverse(nums, k, nums.length - 1);
}

void reverse(int[] nums, int start, int end) {
    while (start < end) {
        int temp = nums[start];
        nums[start] = nums[end];
        nums[end] = temp;
        start++;
        end--;
    }
}

// Move Zeros to End - O(n), O(1)
void moveZeroes(int[] nums) {
    int nonZeroIndex = 0;
    for (int i = 0; i < nums.length; i++) {
        if (nums[i] != 0) {
            int temp = nums[i];
            nums[i] = nums[nonZeroIndex];
            nums[nonZeroIndex] = temp;
            nonZeroIndex++;
        }
    }
}

// Next Permutation - O(n)
void nextPermutation(int[] nums) {
    // Find rightmost position i where nums[i] < nums[i+1]
    int i = nums.length - 2;
    while (i >= 0 && nums[i] >= nums[i + 1]) {
        i--;
    }
    
    if (i >= 0) {
        // Find rightmost position j > i where nums[j] > nums[i]
        int j = nums.length - 1;
        while (j > i && nums[j] <= nums[i]) {
            j--;
        }
        // Swap
        int temp = nums[i];
        nums[i] = nums[j];
        nums[j] = temp;
    }
    
    // Reverse from i+1 to end
    reverse(nums, i + 1, nums.length - 1);
}
```

---

## 📋 Classic Problems by Difficulty

### Easy
1. [**Two Sum**](https://leetcode.com/problems/two-sum/) - Hash map, O(n)
2. [**Best Time to Buy & Sell Stock**](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) - One pass, track min
3. [**Contains Duplicate**](https://leetcode.com/problems/contains-duplicate/) - HashSet
4. [**Valid Parentheses**](https://leetcode.com/problems/valid-parentheses/) - Stack
5. [**Remove Duplicates from Sorted Array**](https://leetcode.com/problems/remove-duplicates-from-sorted-array/) - Two pointer

### Medium
1. [**3Sum**](https://leetcode.com/problems/3sum/) - Sorting + two pointer, O(n²)
2. [**Container With Most Water**](https://leetcode.com/problems/container-with-most-water/) - Two pointer, O(n)
3. [**Maximum Subarray**](https://leetcode.com/problems/maximum-subarray/) - Kadane's, O(n)
4. [**Product of Array Except Self**](https://leetcode.com/problems/product-of-array-except-self/) - Prefix sum technique
5. [**Rotate Array**](https://leetcode.com/problems/rotate-array/) - Reverse trick, O(n)
6. [**Search in Rotated Sorted Array**](https://leetcode.com/problems/search-in-rotated-sorted-array/) - Binary search variant
7. [**Next Permutation**](https://leetcode.com/problems/next-permutation/) - In-place rearrangement

### Hard
1. [**Trapping Rain Water**](https://leetcode.com/problems/trapping-rain-water/) - Two pointer or dynamic programming, O(n)
2. [**Median of Two Sorted Arrays**](https://leetcode.com/problems/median-of-two-sorted-arrays/) - Binary search, O(log(m+n))
3. [**Merge K Sorted Lists**](https://leetcode.com/problems/merge-k-sorted-lists/) - Heap or merge sort
4. [**Maximum Product Subarray**](https://leetcode.com/problems/maximum-product-subarray/) - Dynamic programming variant
5. [**First Missing Positive**](https://leetcode.com/problems/first-missing-positive/) - In-place transformation, O(n)

---

## ⚠️ Common Mistakes & Gotchas

❌ **Modifying array while iterating** - Use two pointers or create new array
✅ Use careful index management or copy first

❌ **Integer overflow** - When multiplying or summing large nums
✅ Use `long` or check for overflow before operations

❌ **Off-by-one errors in ranges** - Especially with 2D arrays
✅ Always verify: inclusive/exclusive, loop bounds

❌ **Not handling duplicates** - Many problems have duplicates
✅ Skip duplicates explicitly with checks

❌ **Forgetting edge cases** - Empty array, single element, all same
✅ Always test: n=0, n=1, all same, all different

---

## 🎯 Interview Checklist

- [ ] Can implement two pointer technique
- [ ] Understand sliding window deeply  
- [ ] Prefix sum patterns (1D and 2D)
- [ ] Kadane's algorithm + max product variant
- [ ] Rotate arrays without extra space
- [ ] Two sum → 3sum → ksum progression
- [ ] Binary search in sorted and rotated arrays
- [ ] Handle edge cases (empty, negatives, duplicates)
- [ ] Optimize from brute force to optimal
- [ ] Can code rotation reversal technique

## Complexity Cheat Sheet

| Operation | Time | Space |
|-----------|------|-------|
| Access    | O(1) | O(1)  |
| Search    | O(n) | O(1)  |
| Insert    | O(n) | O(1)  |
| Delete    | O(n) | O(1)  |
| Sort      | O(n² to n log n) | O(1 to n) |

## Practice Sequence

1. Basic operations and indexing
2. Two pointer technique
3. Sliding window
4. Prefix sums
5. Binary search variants
6. Dynamic programming with arrays

---

## Frequently Asked Interview Questions

### Q1: Given unsorted array, find two numbers that add to target sum

**Naive**: Check all pairs → O(n²), O(1)

**Optimal**: Hash map → O(n), O(n)
```
Hash approach:
- For each number, compute complement = target - number
- Check if complement exists in hash map
- Store each number in hash map as we go

Code:
map = {}
for num in array:
    complement = target - num
    if complement in map:
        return [map[complement], num]
    map[num] = index
```

**Follow-up**: What if array is sorted?
```
Two pointer approach → O(n), O(1)
left = 0, right = n-1
while left < right:
    sum = arr[left] + arr[right]
    if sum == target: return [left, right]
    if sum < target: left++
    else: right--
```

### Q2: Find the maximum sum of contiguous subarray

**Problem**: arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4] → Answer: 6 (from [4, -1, 2, 1])

**Brute Force**: Check all subarrays → O(n³)

**Optimal**: Kadane's Algorithm → O(n), O(1)
```
Intuition: At each position, decide:
- Continue previous subarray or start fresh?

Code:
max_sum = arr[0]
current_sum = arr[0]
for i = 1 to n-1:
    current_sum = max(arr[i], current_sum + arr[i])
    max_sum = max(max_sum, current_sum)
return max_sum

Example:
arr = [-2, 1, -3, 4, -1, 2, 1]
current: -2, 1, -2, 4, 3, 5, 6
max:     -2, 1, 1,  4, 4, 5, 6 ← Answer: 6
```

**Interview tip**: Explain intuition before coding (shows understanding)

### Q3: Product of Array Except Self

**Problem**: arr = [1, 2, 3, 4] → [24, 12, 8, 6]
(Each position = product of all OTHER elements)

**Naive**: For each element, multiply all others → O(n²)

**Left-Right Pass**: → O(n), O(n)
```
Approach:
1. Left array: prefix of each position
2. Right array: suffix of each position
3. Multiply left[i] * right[i]

Code:
left = [1] * n
right = [1] * n
result = [1] * n

// Build left array (product of all before i)
for i = 1 to n-1:
    left[i] = left[i-1] * arr[i-1]

// Build right array (product of all after i)
for i = n-2 down to 0:
    right[i] = right[i+1] * arr[i+1]

// Combine
for i = 0 to n-1:
    result[i] = left[i] * right[i]

Example:
arr   = [1, 2, 3, 4]
left  = [1, 1, 2, 6]  (prefix products)
right = [24, 12, 4, 1] (suffix products)
result= [24, 12, 8, 6]  (left * right)
```

**Space optimization**: Use result array itself → O(1) extra

### Q4: Container With Most Water

**Problem**: Height array, find two lines that contain most water
```
Input:  [1,8,6,2,5,4,8,3,7]
      ▁|     ▁     ▁▁▁
      8|  ▁▁▁  ▁   
      1|▁      ▁ ▁▁ ▁
        └─────────────
Answer: (1, 8) pair, area = min(1, 8) * (8-1) = 7
```

**Naive**: Check all pairs → O(n²)

**Optimal**: Two pointers → O(n)
```
Intuition: 
- Start with widest container (left=0, right=n-1)
- Area = min(height[left], height[right]) * width
- Move pointer with smaller height inward (only hope to increase area)

Code:
left = 0, right = n-1
max_area = 0
while left < right:
    width = right - left
    height = min(arr[left], arr[right])
    area = height * width
    max_area = max(max_area, area)
    
    // Move pointer with smaller height
    if arr[left] < arr[right]:
        left++
    else:
        right--
return max_area
```

### Q5: 3Sum (find 3 numbers summing to target)

**Problem**: arr = [-1, 0, 1, 2, -1, -4], target = 0
→ Answer: [[-1, -1, 2], [-1, 0, 1]]

**Approach**: Sort + Two pointers on each element
```
Code:
sort(arr)
result = []

for i = 0 to n-3:
    if arr[i] > target: break  // Optimization
    if i > 0 and arr[i] == arr[i-1]: continue  // Skip duplicates
    
    // Two sum on arr[i+1:]
    left = i+1, right = n-1
    while left < right:
        sum = arr[i] + arr[left] + arr[right]
        if sum == target:
            result.append([arr[i], arr[left], arr[right]])
            left++
            right--
            
            // Skip duplicates
            while left < right and arr[left] == arr[left-1]: left++
            while right > left and arr[right] == arr[right+1]: right--
        elif sum < target:
            left++
        else:
            right--

return result

Time: O(n²) - O(n log n) sort + O(n²) loop
Space: O(1) - except result
```

### Q6: Merge Sorted Array

**Problem**: Two sorted arrays, merge into first (space already allocated)
```
Input:
nums1 = [1,2,3,0,0,0], m = 3
nums2 = [2,5,6],      n = 3
Output: [1,2,2,3,5,6]
```

**Naive**: Concatenate and sort → O(n log n)

**Optimal**: Backward fill → O(n+m), O(1)
```
Intuition: Fill from END of nums1
- Both arrays sorted
- Larger elements at end of data
- Fill largest backwards, gradually fill nums1

Code:
p1 = m - 1
p2 = n - 1
p = m + n - 1

while p1 >= 0 and p2 >= 0:
    if nums1[p1] > nums2[p2]:
        nums1[p] = nums1[p1]
        p1--
    else:
        nums1[p] = nums2[p2]
        p2--
    p--

// Copy remaining nums2 (if any)
while p2 >= 0:
    nums1[p] = nums2[p2]
    p2--
    p--

(No need to copy nums1, already in place)
```

### Q7: Trapping Rain Water

**Problem**: Elevation array, how much rain trapped between bars?
```
Input: [0,1,0,2,1,0,1,3,2,1,2,1]
       ▁█ █ █ █ █  ▁ █ █ █
       █████████████ ▁ ███
Area trapped: 6
```

**Naive**: For each position, find left max and right max → O(n²)

**Optimal**: Pre-compute max heights → O(n), O(n)
```
Code:
left_max = [0] * n
right_max = [0] * n
water = 0

// Build left max array
for i = 1 to n-1:
    left_max[i] = max(left_max[i-1], arr[i-1])

// Build right max array
for i = n-2 down to 0:
    right_max[i] = max(right_max[i+1], arr[i+1])

// Water at position i is trapped
for i = 0 to n-1:
    water_level = min(left_max[i], right_max[i])
    if water_level > arr[i]:
        water += water_level - arr[i]

return water

Alternative (space-optimized): Two pointers
left = 0, right = n-1
left_max = 0, right_max = 0
water = 0

while left < right:
    if arr[left] <= arr[right]:
        if arr[left] >= left_max:
            left_max = arr[left]
        else:
            water += left_max - arr[left]
        left++
    else:
        if arr[right] >= right_max:
            right_max = arr[right]
        else:
            water += right_max - arr[right]
        right--

Space: O(1)
```

### Q8: Find Kth Largest Element

**Problem**: Find kth largest element in unsorted array

**Naive**: Sort entire array → O(n log n)

**Better**: Min-heap of size k → O(n log k)
```
For k=2 (find 2nd largest):

Code:
heap = min_heap()
for num in arr:
    heap.push(num)
    if heap.size() > k:
        heap.pop()

return heap.top()  // kth largest

Example:
arr = [3, 2, 1, 5, 6, 4], k = 2
Iteration:
3: heap = [3]
2: heap = [2, 3]
1: heap = [1, 2, 3], pop → [2, 3]
5: heap = [2, 3, 5], pop → [3, 5]
6: heap = [3, 5, 6], pop → [5, 6]
4: heap = [4, 5, 6], size ok
Answer: 5 (2nd largest)
```

**Optimal**: Quickselect → O(n) avg, O(n²) worst
```
Like quicksort but only recurse on relevant partition
Code:
select(arr, 0, n-1, k):
    if left == right:
        return arr[left]
    
    // Partition
    pivot_index = partition(arr, left, right)
    
    if k == pivot_index:
        return arr[k]
    elif k < pivot_index:
        return select(arr, left, pivot_index-1, k)
    else:
        return select(arr, pivot_index+1, right, k)
```

---

## Key Patterns Summary

| Problem Type | Pattern | Time | Space |
|--------------|---------|------|-------|
| Two Sum | Hash map or two pointer | O(n) | O(n) or O(1) |
| Max subarray | Kadane's | O(n) | O(1) |
| Sliding window | Two pointers | O(n) | O(1) |
| Prefix sums | DP array | O(n) | O(n) |
| Binary search | Divide & conquer | O(log n) | O(log n) |
| Sort | Quicksort/Mergesort | O(n log n) | O(n) |

---

## Array Interview Checklist

Before implementing:
- [ ] Clarify: in-place allowed? Extra space available?
- [ ] Ask about range of numbers and array size
- [ ] Clarify: duplicates? Negatives?
- [ ] Mention edge cases (empty, single, all same)
- [ ] Think of multiple approaches (brute → optimal)

During implementation:
- [ ] Use meaningful variable names
- [ ] Add comments for non-obvious logic
- [ ] Handle edge cases without special code
- [ ] Consider space-time tradeoffs
- [ ] Test with given and additional examples
