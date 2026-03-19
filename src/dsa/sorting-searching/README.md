# Sorting & Searching - Complete DSA Guide

## 🔍 Searching Algorithms

### Binary Search Template - O(log n)

**Prerequisites**: Array must be sorted

**Key Points**:
- Use `mid = left + (right - left) / 2` to avoid integer overflow
- End condition is `left <= right`
- Don't forget to update left/right correctly

```java
// Template 1: Find exact target
int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (arr[mid] == target)
            return mid;
        else if (arr[mid] < target)
            left = mid + 1;  // Target is in right half
        else
            right = mid - 1;  // Target is in left half
    }
    
    return -1;  // Not found
}
// Time: O(log n), Space: O(1)

// Template 2: Find leftmost (first occurrence)
int findFirst(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    int result = -1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) {
            result = mid;
            right = mid - 1;  // Continue searching left
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return result;
}

// Template 3: Find rightmost (last occurrence)
int findLast(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    int result = -1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) {
            result = mid;
            left = mid + 1;  // Continue searching right
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return result;
}

// Template 4: Find insertion position (if not found)
int searchInsert(int[] arr, int target) {
    int left = 0, right = arr.length;
    
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    
    return left;  // Position where target should be inserted
}
```

---

### Two Pointers - Common Pattern

**When**: Sorted array, find pairs, remove duplicates

```java
// Find two numbers that sum to target
int[] twoSum(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    
    while (left < right) {
        int sum = arr[left] + arr[right];
        
        if (sum == target)
            return new int[]{left, right};
        else if (sum < target)
            left++;  // Need larger sum
        else
            right--;  // Need smaller sum
    }
    
    return new int[]{};  // No solution
}

// Remove duplicates from sorted array
int removeDuplicates(int[] nums) {
    int j = 0;  // Position to write
    for (int i = 1; i < nums.length; i++) {
        if (nums[i] != nums[j]) {
            nums[++j] = nums[i];
        }
    }
    return j + 1;  // New length
}
```

---

### [Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/) - Medium

```
Example: [4,5,6,7,0,1,2], target = 0
Should return 4

Key insight: One half is always sorted!
```

```java
int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (nums[mid] == target) return mid;
        
        // Determine which half is sorted
        if (nums[left] <= nums[mid]) {
            // LEFT half is sorted
            if (nums[left] <= target && target < nums[mid]) {
                // Target in left half
                right = mid - 1;
            } else {
                // Target in right half
                left = mid + 1;
            }
        } else {
            // RIGHT half is sorted
            if (nums[mid] < target && target <= nums[right]) {
                // Target in right half
                left = mid + 1;
            } else {
                // Target in left half
                right = mid - 1;
            }
        }
    }
    
    return -1;
}
// Time: O(log n)
```

---

## 📊 Sorting Algorithms (Comparison)

### Quick Sort - Average O(n log n), Worst O(n²)

**Best for**: General purpose sorting (Java Collections.sort uses variant)

```java
void quickSort(int[] arr, int left, int right) {
    if (left < right) {
        int pi = partition(arr, left, right);
        quickSort(arr, left, pi - 1);
        quickSort(arr, pi + 1, right);
    }
}

int partition(int[] arr, int left, int right) {
    int pivot = arr[right];
    int i = left - 1;
    
    for (int j = left; j < right; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr, i, j);
        }
    }
    
    swap(arr, i + 1, right);
    return i + 1;
}

void swap(int[] arr, int i, int j) {
    int temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}
```

**Pros**: Fast average case, O(log n) space
**Cons**: O(n²) worst case, not stable

---

### Merge Sort - O(n log n) STABLE

**Best for**: When stability matters, external sorting, linked lists

```java
void mergeSort(int[] arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}

void merge(int[] arr, int left, int mid, int right) {
    int[] temp = new int[right - left + 1];
    int i = left, j = mid + 1, k = 0;
    
    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) {
            temp[k++] = arr[i++];
        } else {
            temp[k++] = arr[j++];
        }
    }
    
    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];
    
    System.arraycopy(temp, 0, arr, left, temp.length);
}
```

**Pros**: Guaranteed O(n log n), stable, good for linked lists
**Cons**: O(n) extra space

---

### Heap Sort - O(n log n) In-place

**Best for**: When space is critical

```java
void heapSort(int[] arr) {
    int n = arr.length;
    
    // Build max heap (bottom-up)
    for (int i = n / 2 - 1; i >= 0; i--)
        heapify(arr, n, i);
    
    // Extract elements from heap one by one
    for (int i = n - 1; i > 0; i--) {
        // Move current root (max) to end
        swap(arr, 0, i);
        // Heapify reduced heap
        heapify(arr, i, 0);
    }
}

void heapify(int[] arr, int n, int i) {
    int largest = i;
    int left = 2 * i + 1;
    int right = 2 * i + 2;
    
    // Find largest among root, left, right
    if (left < n && arr[left] > arr[largest])
        largest = left;
    if (right < n && arr[right] > arr[largest])
        largest = right;
    
    // If root is not largest, swap and recursively heapify
    if (largest != i) {
        swap(arr, i, largest);
        heapify(arr, n, largest);
    }
}
```

**Pros**: O(1) extra space, guaranteed O(n log n)
**Cons**: Not stable, slower than quick sort in practice

---

## 📈 Algorithm Comparison Table

| Algorithm | Best | Average | Worst | Space | Stable | Use Case |
|-----------|------|---------|-------|-------|--------|-----------|
| **Quick Sort** | O(n log n) | O(n log n) | O(n²) | O(log n) | No | Default choice |
| **Merge Sort** | O(n log n) | O(n log n) | O(n log n) | **O(n)** | **Yes** | Need stable sort |
| **Heap Sort** | O(n log n) | O(n log n) | O(n log n) | O(1) | No | Space-critical |
| **Insertion** | O(n) | O(n²) | O(n²) | O(1) | Yes | Small/nearly sorted |
| **Bubble** | O(n) | O(n²) | O(n²) | O(1) | Yes | Learning/small |

---

## 🎯 Advanced Problems

### [Kth Largest Element](https://leetcode.com/problems/kth-largest-element-in-an-array/) - O(nlog k)

```
Find kth largest in unsorted array

Approach 1: Min heap of size k
Approach 2: QuickSelect average O(n)
```

```java
int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();
    
    for (int num : nums) {
        minHeap.offer(num);
        if (minHeap.size() > k) {
            minHeap.poll();  // Remove smallest if size > k
        }
    }
    
    return minHeap.peek();
}
// Time: O(n log k), Space: O(k)
```

### [Median of Two Sorted Arrays](https://leetcode.com/problems/median-of-two-sorted-arrays/) - Hard O(log(m+n))

```
Find median of two sorted arrays without merging
Constraint: O(log(m+n)) time
```

```java
double findMedianSortedArrays(int[] nums1, int[] nums2) {
    if (nums1.length > nums2.length) {
        return findMedianSortedArrays(nums2, nums1);
    }
    
    int m = nums1.length, n = nums2.length;
    int low = 0, high = m;
    
    while (low <= high) {
        int cut1 = (low + high) / 2;
        int cut2 = (m + n + 1) / 2 - cut1;
        
        int left1 = cut1 == 0 ? Integer.MIN_VALUE : nums1[cut1 - 1];
        int right1 = cut1 == m ? Integer.MAX_VALUE : nums1[cut1];
        int left2 = cut2 == 0 ? Integer.MIN_VALUE : nums2[cut2 - 1];
        int right2 = cut2 == n ? Integer.MAX_VALUE : nums2[cut2];
        
        if (left1 <= right2 && left2 <= right1) {
            if ((m + n) % 2 == 0)
                return (Math.max(left1, left2) + Math.min(right1, right2)) / 2.0;
            else
                return Math.max(left1, left2);
        } else if (left1 > right2) {
            high = cut1 - 1;
        } else {
            low = cut1 + 1;
        }
    }
    
    return -1;
}
```

---

## ⚠️ Common Mistakes

❌ **Integer overflow**: `mid = (left + right) / 2` when left and right are large
✅ Use: `mid = left + (right - left) / 2`

❌ **Infinite loop**: Using `left < right` but then setting `left = mid + 1` and `right = mid - 1`
✅ Use: `left <= right` for most cases

❌ **Off-by-one errors**: Forgetting array bounds
✅ Always check: `i >= 0` and `i < arr.length`

❌ **Unstable sort when stability needed**: Using quick sort for objects where order matters
✅ Use merge sort for stability

---

## 🎓 Interview Checklist

- [ ] Binary search template (can code from memory)
- [ ] Binary search variants (first/last/insert position)
- [ ] Know major sorts and when to use each
- [ ] Understand stable vs in-place trade-offs
- [ ] Can implement quick sort with correct pivot
- [ ] Understand rotated array search
- [ ] Two pointer technique
- [ ] Can handle duplicates
- [ ] Custom comparators for objects
- [ ] Know complexity of each algorithm cold
