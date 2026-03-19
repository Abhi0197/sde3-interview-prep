# Python - Complete Interview Guide for SDE 3

**Python is 30-40% of technical interviews**. It's concise, expressive, and ideal for rapid problem-solving. Master Python idioms, not just syntax.

---

## 🐍 Python Fundamentals & Data Structures

### 1. Lists (Dynamic Arrays) - O(1) append, O(n) insert

```python
lst = [1, 2, 3, 4, 5]

# Operations
lst.append(6)           # O(1) amortized - add to end
lst.extend([7, 8])      # O(k) - add multiple elements
lst.insert(0, 0)        # O(n) - shift required
lst.pop()               # O(1) - remove from end
lst.pop(0)              # O(n) - remove from start
lst.remove(3)           # O(n) - remove by value
lst.clear()             # O(n) - remove all

# Slicing
sublst = lst[1:4]       # O(k) - creates new list
lst[1:3] = [10, 11]     # Slice assignment

# Common patterns
lst.reverse()           # O(n) in-place
lst.sort()              # O(n log n) Timsort
sorted_copy = sorted(lst, key=lambda x: -x)  # New sorted list

# Access
first = lst[0]          # O(1)
last = lst[-1]          # O(1) negative indexing
lst[0] = 100            # O(1) assignment
```

**When to use**: Most problems, stack/queue (with collections.deque better for queue)

---

### 2. Dictionaries (Hash Maps) - O(1) average case

```python
d = {'a': 1, 'b': 2}

# Operations
d['c'] = 3              # O(1) insertion
val = d['a']            # O(1) lookup, raises KeyError if missing
val = d.get('a')        # O(1) safe access, returns None if missing
val = d.get('a', 0)     # O(1) with default value
del d['a']              # O(1) delete
d.pop('a')              # O(1) delete and return value
d.pop('a', None)        # O(1) safe pop with default

# Common methods
d.keys()                # O(1) view of keys
d.values()              # O(1) view of values
d.items()               # O(1) view of key-value pairs
d.update({'a': 10})     # O(n) merge another dict
d.clear()               # O(n) remove all

# Iteration (order preserved in Python 3.7+)
for key in d: pass
for key, value in d.items(): pass

# defaultdict - never raises KeyError
from collections import defaultdict
count = defaultdict(int)            # Default: 0
lists = defaultdict(list)           # Default: []
sets = defaultdict(set)             # Default: set()
count['unseen_key'] += 1            # Creates if missing

# Counter - frequency counting
from collections import Counter
freq = Counter(['a', 'b', 'a', 'c', 'a'])  # Counter({'a': 3, 'b': 1, 'c': 1})
freq.most_common(2)                 # [('a', 3), ('b', 1)]
freq['x']                           # 0 (never raises KeyError)

# OrderedDict - maintains insertion order (rarely needed in Python 3.7+)
from collections import OrderedDict
od = OrderedDict()
```

**Interview Tips**:
- Always use `dict.get(key, default)` to avoid KeyError
- Use `Counter` for frequency problems
- Use `defaultdict` when you need automatic initialization

---

### 3. Sets (Unique, Unordered) - O(1) operations

```python
s = {1, 2, 3}
s = set([1, 1, 2, 3])   # Remove duplicates from list

# Operations
s.add(4)                # O(1) add element
s.discard(5)            # O(1) remove if exists (no error)
s.remove(5)             # O(1) remove, raises KeyError if missing
s.pop()                 # O(1) remove and return arbitrary element
s.clear()               # O(n) remove all

# Set operations
s1 & s2                 # O(min(len(s1), len(s2))) intersection
s1 | s2                 # O(len(s1) + len(s2)) union
s1 - s2                 # O(len(s1)) difference
s1 ^ s2                 # O(len(s1) + len(s2)) symmetric difference
s1 <= s2                # Subset check
s1 >= s2                # Superset check

# Membership test
if val in s: pass       # O(1) - very efficient vs list O(n)

# Create set from list fastest way
s = set(lst)            # O(n)
```

**Use Cases**: Remove duplicates, membership testing, intersection/union operations

---

### 4. Tuples (Immutable) - O(1) access, hashable

```python
t = (1, 2, 3)
t = 1, 2, 3             # Parentheses optional

# Can be dict keys (lists cannot)
d = {(1, 2): 'value'}

# Unpacking
a, b, c = (1, 2, 3)
a, *rest, c = range(5)  # Extended unpacking
a, b = b, a             # Swap (creates tuple)

# namedtuple - structured alternative
from collections import namedtuple
Point = namedtuple('Point', ['x', 'y'])
p = Point(1, 2)
print(p.x, p.y)

# Access
t[0]                    # O(1)
t[-1]                   # O(1) negative index
t[1:3]                  # O(k) slice
len(t)                  # O(1)
for val in t: pass      # O(n)
```

---

### 5. Deque (Double-Ended Queue) - O(1) both ends

```python
from collections import deque

dq = deque([1, 2, 3])

# Operations
dq.append(4)            # O(1) add right
dq.appendleft(0)        # O(1) add left
dq.pop()                # O(1) remove right
dq.popleft()            # O(1) remove left
dq[0]                   # O(1) index access
dq.rotate(1)            # O(n) rotate right
dq.reverse()            # O(n) reverse

# Use cases
# Implement queue (not list!)
queue = deque()
queue.append(1)         # Enqueue - O(1)
queue.popleft()         # Dequeue - O(1)

# Implement stack (list works fine too)
stack = deque()
stack.append(1)         # Push - O(1)
stack.pop()             # Pop - O(1)

# Sliding window
dq = deque(maxlen=k)    # Auto-remove left when maxlen exceeded
dq.append(x)            # Add right, auto-remove left if full
```

**Interview Tip**: Use `deque` for queues, NOT list (list.pop(0) is O(n))

---

## 🎯 Pythonic Patterns (Critical for Interviews)

### List Comprehensions (Preferred over loops)

```python
# Basic
squares = [x**2 for x in range(10)]         # [0, 1, 4, 9, ...]

# With condition
even_squares = [x**2 for x in range(10) if x % 2 == 0]

# Nested
matrix = [[i+j for j in range(3)] for i in range(3)]

# Dict comprehension
word_lens = {word: len(word) for word in ['python', 'java']}
freq_map = {word: freq.count(word) for word in set(freq)}

# Set comprehension
unique_chars = {c for c in 'aabbcc'}        # {'a', 'b', 'c'}

# Complex example: group by length
word_by_len = {len(w): [word for word in words if len(word) == len(w)]
               for w in set(words)}
```

**Why**: Faster, more Pythonic, better readability

---

### Generators & Iterators (Memory efficient)

```python
# Generator expression (lazy evaluation)
gen = (x**2 for x in range(1000000))  # Creates no list!
for val in gen:
    print(val)

# Generator function
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a      # Pauses and returns value
        a, b = b, a + b

for num in fibonacci(5):
    print(num)       # Prints: 0 1 1 2 3

# infinite generators
def infinite_counter():
    i = 0
    while True:
        yield i
        i += 1

# generator methods
gen = fibonacci(10)
next(gen)            # Get next value
```

**Memory Impact**: Generator O(1), List O(n)

---

### Lambda Functions & Higher-Order Functions

```python
# Lambda - anonymous functions
square = lambda x: x ** 2
square(5)                           # 25

# Useful with sorted
nums = [3, 1, 4, 1, 5]
sorted(nums)                        # [1, 1, 3, 4, 5]
sorted(nums, reverse=True)          # [5, 4, 3, 1, 1]
sorted(nums, key=lambda x: -x)      # [5, 4, 3, 1, 1]

# Complex sorting
students = [('Alice', 90), ('Bob', 85), ('Charlie', 90)]
sorted(students, key=lambda x: (-x[1], x[0]))  # Sort by score desc, then name asc

# map, filter, reduce
doubled = list(map(lambda x: x*2, nums))  # [6, 2, 8, 2, 10]
evens = list(filter(lambda x: x % 2 == 0, nums))  # [4]

from functools import reduce
product = reduce(lambda x, y: x*y, nums)  # 3*1*4*1*5 = 60
```

---

## 🔍 String Operations & Manipulation

```python
# Creation and basics
s = "hello"
s = 'hello'
s = """multi
line"""

# Operations
len(s)                  # O(1) length
s[0]                    # O(1) indexing
s[-1]                   # O(1) last char
s[1:3]                  # O(k) substring
s.upper()               # O(n) new string
s.lower()               # O(n) new string

# Searching
s.find('l')             # O(n*m) returns index, -1 if not found
s.index('l')            # O(n*m) returns index, ValueError if not found
'l' in s                # O(n) membership test (faster than find)
s.count('l')            # O(n) count occurrences
s.startswith('he')      # O(k) prefix check
s.endswith('lo')        # O(k) suffix check

# Modification (all return new strings - strings immutable!)
s.replace('l', 'y')     # O(n) replace all
s.strip()               # O(n) remove whitespace from ends
s.lstrip()              # O(n) remove left whitespace
s.rstrip()              # O(n) remove right whitespace
s.split()               # O(n) split by whitespace
s.split(',')            # O(n) split by char
','.join(list_of_str)   # O(n) join - PREFERRED over concatenation!

# Case operations
s.swapcase()            # O(n)
s.title()               # O(n)
s.capitalize()          # O(n)

# Character checks
s.isdigit()             # All digits?
s.isalpha()             # All letters?
s.isalnum()             # Alphanumeric?
s.isspace()             # All whitespace?
```

**Critical**: Use `''.join(list)` NOT `+` for concatenation (O(n) vs O(n²))

---

## 🔄 Iteration & Enumeration

```python
# Basic iteration
for item in iterable: pass

# With index
for i, item in enumerate(list):
    print(f"Index {i}: {item}")

# Two iterables together
for a, b in zip(list1, list2):
    print(a, b)

# Zip with fill value
from itertools import zip_longest
for a, b in zip_longest(list1, list2, fillvalue=0):
    print(a, b)

# Range
for i in range(0, 10):         # 0 to 9
for i in range(1, 10, 2):      # 1, 3, 5, 7, 9 (step 2)
for i in range(10, 0, -1):     # 10 down to 1 (step -1)

# Reversed iteration
for item in reversed(lst):
    print(item)
```

---

## 🧮 Common Algorithms in Python

### Sorting & Searching

```python
# Sort (built-in Timsort O(n log n))
lst = [3, 1, 4, 1, 5, 9, 2, 6]
lst.sort()                           # In-place sort
sorted_lst = sorted(lst)             # New sorted list

# Sort by multiple criteria
students = [('Alice', 90), ('Bob', 85), ('Alice', 88)]
sorted(students, key=lambda x: (x[0], -x[1]))  # By name, then score desc

# Stable sorting (maintains original order for equal elements)
sorted(students, key=lambda x: x[1], reverse=True)

# Binary search
import bisect
pos = bisect.bisect_left(sorted_lst, 4)   # Insert position (left)
pos = bisect.bisect_right(sorted_lst, 4)  # Insert position (right)
bisect.insort(sorted_lst, 4)               # Insert maintaining order

# Custom comparator (use key, not cmp!)
def compare_func(x):
    return (-x[0], x[1])  # Sort by first desc, second asc
sorted_data = sorted(data, key=compare_func)
```

### Two Pointers & Sliding Window

```python
# Two pointer: Remove duplicates from sorted
def removeDuplicates(nums):
    j = 0
    for i in range(1, len(nums)):
        if nums[i] != nums[j]:
            j += 1
            nums[j] = nums[i]
    return j + 1

# Sliding window: Longest substring without repeats
def lengthOfLongestSubstring(s):
    char_index = {}
    left = 0
    max_len = 0
    
    for right in range(len(s)):
        if s[right] in char_index:
            left = max(left, char_index[s[right]] + 1)
        char_index[s[right]] = right
        max_len = max(max_len, right - left + 1)
    
    return max_len
```

---

## ⚡ Performance Tips

| Operation | Complexity | vs | Alternative | Notes |
|-----------|-----------|----|--------------| ------|
| list += [1] | O(n) | list.append(1) | O(1) | += creates new list |
| '+'.join() | O(n) | s + '+' | O(n²) | Concatenation |
| set lookup | O(1) | list in | O(n) | For membership |
| deque.pop(0) | O(1) | list.pop(0) | O(n) | From front |
| Counter | O(n) | dict manual | O(n log n) | Frequency |

---

## 🎓 Python Interview Checklist

- [ ] Know all data structures: list, dict, set, tuple, deque
- [ ] defaultdict vs Counter vs OrderedDict use cases
- [ ] List comprehensions (cleaner than loops)
- [ ] Generators for memory efficiency
- [ ] Use `deque` for queues, not list
- [ ] String join, not concatenation
- [ ] bisect for binary search
- [ ] enumerate for index + value
- [ ] zip for parallel iteration
- [ ] Lambda + sorted with key parameter
- [ ] Edge cases: empty, single element, duplicates
- [ ] Space vs time trade-offs with dicts/sets
```python
s = "hello world"
s.upper()              # HELLO WORLD
s.split()              # ['hello', 'world']
s.replace('o', '0')    # hell0 w0rld
reversed_s = s[::-1]   # dlrow olleh
```

### Counter (Frequency)
```python
from collections import Counter
freq = Counter('hello')  # Counter({'l': 2, 'h': 1...})
freq['l']                # 2
freq.most_common(2)      # [('l', 2), ('h', 1)]
```

---

## 🔍 OOP in Python

### Classes
```python
class TreeNode:
    count = 0  # Class variable
    
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None
        TreeNode.count += 1
    
    def __str__(self):
        return f"Node({self.val})"
    
    def __eq__(self, other):
        return self.val == other.val

node = TreeNode(5)
print(node)          # Node(5)
```

### Decorators
```python
class Calculator:
    @property
    def pi(self):
        return 3.14159
    
    @staticmethod
    def add(a, b):
        return a + b
    
    @classmethod
    def from_string(cls, s):
        return cls(int(s))

calc = Calculator()
print(calc.pi)              # 3.14159 (property)
print(Calculator.add(2, 3))  # 5 (static method)
```

---

## 📦 Built-in Functions

```python
# All, Any
all([True, True, True])   # True
any([False, False, True])  # True

# Map, Filter
nums = [1, 2, 3, 4, 5]
squares = list(map(lambda x: x**2, nums))
evens = list(filter(lambda x: x % 2 == 0, nums))

# Zip
names = ['a', 'b', 'c']
ages = [1, 2, 3]
for name, age in zip(names, ages):
    print(f"{name}: {age}")

# Range
for i in range(10):       # 0-9
    pass
for i in range(2, 10, 2): # 2, 4, 6, 8
    pass
```

---

## ⚡ Performance Tips

```python
# Bad: O(n^2) - list lookup is O(n)
for i in range(len(lst)):
    if i in lst:
        pass

# Good: O(n) - set lookup is O(1)
lst_set = set(lst)
for i in range(len(lst)):
    if i in lst_set:
        pass

# String concatenation
# Bad: O(n^2)
result = ""
for s in strings:
    result += s

# Good: O(n)
result = ''.join(strings)

# Use deque for frequent popleft
from collections import deque
q = deque()
q.append(1)      # O(1)
q.popleft()      # O(1)
```

---

## 🎯 Common Interview Patterns

### Two Pointers
```python
def twoSum(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        s = nums[left] + nums[right]
        if s == target:
            return [left, right]
        elif s < target:
            left += 1
        else:
            right -= 1
    return []
```

### Sliding Window
```python
def maxSlidingWindow(nums, k):
    from collections import deque
    result = []
    dq = deque()
    
    for i, num in enumerate(nums):
        # Remove out of window
        if dq and dq[0] < i - k + 1:
            dq.popleft()
        
        # Remove smaller elements
        while dq and nums[dq[-1]] <= num:
            dq.pop()
        
        dq.append(i)
        
        if i >= k - 1:
            result.append(nums[dq[0]])
    
    return result
```

### DFS/BFS
```python
def dfs(node, visited):
    if node in visited:
        return
    visited.add(node)
    for neighbor in node.neighbors:
        dfs(neighbor, visited)

def bfs(start):
    from collections import deque
    queue = deque([start])
    visited = {start}
    
    while queue:
        node = queue.popleft()
        for neighbor in node.neighbors:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
```

---

## 📊 Time Complexity Cheat Sheet

| Operation | List | Dict | Set | Deque |
|-----------|------|------|-----|-------|
| Access | O(1) | O(1) | — | O(1) |
| Search | O(n) | O(1) | O(1) | O(1)* |
| Insert | O(n) | O(1) | O(1) | O(1) |
| Delete | O(n) | O(1) | O(1) | O(1) |
| Pop End | O(1) | — | — | O(1) |
| Pop Front | O(n) | — | — | O(1) |

---

## 🎓 Interview Checklist

- [ ] List, Dict, Set operations and time complexity
- [ ] List comprehensions fluently
- [ ] Understand mutability (list vs tuple)
- [ ] Know when to use which data structure
- [ ] Default dict, Counter, deque familiarity
- [ ] Generators for memory efficiency
- [ ] Decorators (@property, @staticmethod)
- [ ] String operations and slicing
- [ ] Zip, map, filter functions
- [ ] Two pointers, sliding window patterns
