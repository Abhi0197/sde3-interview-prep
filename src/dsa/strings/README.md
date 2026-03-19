# Strings - Complete Interview Guide

## 🔤 String Fundamentals

**Immutability** (Java/Python): Concatenation creates new object - O(n). Use StringBuilder for O(1) appends.

**Key Insight**: String problems often reduce to:
1. Character frequency tracking (arrays, hash maps)
2. Substring/subarray patterns (sliding window, two pointers)
3. Transformation problems (DP, BFS)

---

## 🎯 Core String Techniques

### **Technique 1: Sliding Window (Two Pointers)**

**When to Use**: Find longest/shortest substring with property X
- Longest substring without repeating characters
- Minimum window substring
- All anagrams of P in S

**Pattern**:
```
1. Move right pointer to expand window
2. Check if condition met
3. If not met, move left to shrink
4. Track best result
```

**Problem: Longest Substring Without Repeating Characters**

```
Input: "abcabcbb"
Output: 3 (substring "abc")

Approach:
- Track last seen index of each character
- When duplicate found, move left pointer after last occurrence
- Update max length

Example execution:
"a" → length=1, lastIndex[a]=0
"ab" → length=2, lastIndex[b]=1
"abc" → length=3, lastIndex[c]=2
"abca" → duplicate 'a' at index 3, move left to index 1
         now window is "bca" → length=3
"abcab" → duplicate 'b', move left to index 2
          window is "cab" → length=3
```

```java
int lengthOfLongestSubstring(String s) {
    int[] lastIndex = new int[256];
    Arrays.fill(lastIndex, -1);
    int left = 0, maxLen = 0;
    
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        // If character seen after left pointer, move left past it
        if (lastIndex[c] >= left) {
            left = lastIndex[c] + 1;
        }
        lastIndex[c] = right;
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
// Time: O(n), Space: O(k) where k = charset size
```

**Edge Cases**:
- Empty string → 0
- All unique → length of string
- All same → 1
- Single char → 1

---

### **Technique 2: Sliding Window with Target Count**

**Problem: Minimum Window Substring**

```
Input: s = "ADOBECODEBANC", t = "ABC"
Output: "BANC"

Explanation: Shortest window containing all chars of t
```

**Approach**:
1. Track character frequency needed from `t`
2. Expand window with `right` until we have all chars
3. Shrink window with `left` until window is invalid
4. Track minimum valid window

```java
String minWindow(String s, String t) {
    if (s == null || t == null || s.length() < t.length()) return "";
    
    // Count required characters
    int[] tCount = new int[256];
    for (char c : t.toCharArray()) tCount[c]++;
    
    int[] sCount = new int[256];
    int required = t.length();  // How many chars we still need
    int left = 0, minLen = Integer.MAX_VALUE, minStart = 0;
    
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        // Add character to window
        if (sCount[c] < tCount[c]) required--;  // Needed this char!
        sCount[c]++;
        
        // Try to shrink window from left
        while (required == 0) {
            // Found valid window
            if (right - left + 1 < minLen) {
                minLen = right - left + 1;
                minStart = left;
            }
            
            // Remove left character
            if (sCount[s.charAt(left)] <= tCount[s.charAt(left)]) {
                required++;  // This was a needed char
            }
            sCount[s.charAt(left)]--;
            left++;
        }
    }
    
    return minLen == Integer.MAX_VALUE ? "" : s.substring(minStart, minStart + minLen);
}
// Time: O(|s| + |t|), Space: O(1) [fixed charset]
```

**Interview Tips**:
- Clarify: Must contain all chars or at least one of each?
- Follow-up: What if we need to find count of such windows?
- Variation: Find all indexes where valid windows start

---

### **Technique 3: Two Pointers (Reverse/Palindrome)**

**Problem: Valid Palindrome**

```
Input: "A man, a plan, a canal: Panama"
Output: true (ignoring non-alphanumeric)

Key: Only alphanumeric matters, case-insensitive
```

```java
boolean isPalindrome(String s) {
    int left = 0, right = s.length() - 1;
    
    while (left < right) {
        // Skip non-alphanumeric from left
        while (left < right && !Character.isLetterOrDigit(s.charAt(left))) left++;
        // Skip non-alphanumeric from right
        while (left < right && !Character.isLetterOrDigit(s.charAt(right))) right--;
        
        // Check if characters match (case-insensitive)
        if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right)))
            return false;
        
        left++;
        right--;
    }
    return true;
}
// Time: O(n), Space: O(1)
```

**Variations**:
- Is string a valid palindrome after deleting at most one character?
- Shortest palindrome (add chars to beginning)
- Palindrome pairs (find pairs that form palindrome)

---

### **Technique 4: Hash Map for Character Frequencies**

**Problem: Valid Anagram**

```
Input: s = "anagram", t = "nagaram"
Output: true

Two approaches:
1. Sort both, compare → O(n log n)
2. Count frequencies → O(n)
```

```java
boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    
    int[] freq = new int[26];
    // Count frequencies in s
    for (char c : s.toCharArray()) freq[c - 'a']++;
    
    // Decrement for t
    for (char c : t.toCharArray()) {
        if (--freq[c - 'a'] < 0) return false;
    }
    return true;
}
// Time: O(n), Space: O(1) [26 letters]
```

**Related Problems**:
- Group Anagrams: Group all anagrams together
  - Approach: Sort each string as key, group by key
  - Better: Encode frequency as key (avoid sorting)
- Anagram Substrings: Find all anagrams of p in s

---

### **Technique 5: Expand Around Center**

**Problem: Longest Palindromic Substring**

```
Input: "babad"
Output: "bab" or "aba"

Approach: For each center, expand outward while characters match
- Odd length palindromes: Center is single char
- Even length palindromes: Center is between two chars
```

```java
String longestPalindrome(String s) {
    if (s == null || s.length() < 2) return s;
    
    int start = 0, maxLen = 1;
    
    // Check odd-length palindromes (single char center)
    for (int i = 0; i < s.length(); i++) {
        int len = expandAroundCenter(s, i, i);
        if (len > maxLen) {
            maxLen = len;
            start = i - len / 2;
        }
    }
    
    // Check even-length palindromes (two char center)
    for (int i = 0; i < s.length() - 1; i++) {
        int len = expandAroundCenter(s, i, i + 1);
        if (len > maxLen) {
            maxLen = len;
            start = i - len / 2 + 1;
        }
    }
    
    return s.substring(start, start + maxLen);
}

int expandAroundCenter(String s, int left, int right) {
    while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
        left--;
        right++;
    }
    return right - left - 1;  // Length of palindrome found
}
// Time: O(n²), Space: O(1)
```

**Complexity Analysis**:
- Time: O(n²) - for each of n centers, we expand O(n) distance
- Space: O(1) - only pointers, no extra data structures

**Interview Tips**:
- Follow-up: Can you do better than O(n²)?
  - Yes! Manacher's Algorithm → O(n), but complex
- Clarify: Return substring or just length?

---

### **Technique 6: Dynamic Programming for Transformations**

**Problem: Edit Distance (Levenshtein Distance)**

```
Input: s1 = "horse", s2 = "ros"
Output: 3 (operations: delete 'h', delete 'e', delete 'r')

Allowed operations: Insert, Delete, Replace
```

```java
int editDistance(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m + 1][n + 1];
    
    // Base cases
    for (int i = 0; i <= m; i++) dp[i][0] = i;  // Delete all
    for (int j = 0; j <= n; j++) dp[0][j] = j;  // Insert all
    
    // Fill DP table
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1];  // No operation needed
            } else {
                dp[i][j] = 1 + Math.min({
                    dp[i - 1][j],      // Delete from s1
                    dp[i][j - 1],      // Insert into s1
                    dp[i - 1][j - 1]   // Replace
                });
            }
        }
    }
    return dp[m][n];
}
// Time: O(m*n), Space: O(m*n) [can optimize to O(n) with rolling array]
```

**Interview Tips**:
- Space optimization: Use only 2 rows (previous, current)
- Follow-up: Return the actual edits, not just count?
  - Backtrack through DP table to reconstruct operations
- Related: Word Ladder (shortest transformation sequence)

---

### **Technique 7: String Matching - KMP Algorithm**

**Problem: Pattern Matching in String**

```
Input: text = "ABABDABACDABABCABAB", pattern = "ABABCABAB"
Output: 10 (index where pattern starts)

Naive: O(n*m)
KMP: O(n+m) - skip comparisons using failure function
```

**KMP Key Idea**: When mismatch occurs, skip characters we know match using LPS (Longest Proper Prefix which is also Suffix)

```java
int[] buildLPS(String pattern) {
    int[] lps = new int[pattern.length()];
    int len = 0, i = 1;
    
    while (i < pattern.length()) {
        if (pattern.charAt(i) == pattern.charAt(len)) {
            lps[i++] = ++len;
        } else {
            if (len > 0) len = lps[len - 1];
            else i++;
        }
    }
    return lps;
}

int findPattern(String text, String pattern) {
    int[] lps = buildLPS(pattern);
    int i = 0, j = 0;  // i for text, j for pattern
    
    while (i < text.length()) {
        if (text.charAt(i) == pattern.charAt(j)) {
            i++;
            j++;
        }
        
        if (j == pattern.length()) {
            return i - j;  // Pattern found at index
        } else if (i < text.length() && text.charAt(i) != pattern.charAt(j)) {
            if (j > 0) j = lps[j - 1];
            else i++;
        }
    }
    return -1;  // Pattern not found
}
// Time: O(n+m), Space: O(m)
```

**Use Case**: Word search in text, DNA sequence matching, autocomplete

---

## 💼 Top 20 Interview Problems Ranked by Frequency

| # | Problem | Difficulty | Technique | Frequency |
|---|---------|-----------|-----------|-----------|
| 1 | [Longest Substring No Repeat](https://leetcode.com/problems/longest-substring-without-repeating-characters/) | Medium | Sliding Window | ⭐⭐⭐⭐⭐ |
| 2 | [Valid Palindrome](https://leetcode.com/problems/valid-palindrome/) | Easy | Two Pointers | ⭐⭐⭐⭐⭐ |
| 3 | [Min Window Substring](https://leetcode.com/problems/minimum-window-substring/) | Hard | Sliding Window | ⭐⭐⭐⭐ |
| 4 | [Group Anagrams](https://leetcode.com/problems/group-anagrams/) | Medium | Hash Map | ⭐⭐⭐⭐ |
| 5 | [Longest Palindromic Substring](https://leetcode.com/problems/longest-palindromic-substring/) | Medium | DP/Expand | ⭐⭐⭐⭐ |
| 6 | [Edit Distance](https://leetcode.com/problems/edit-distance/) | Medium | DP | ⭐⭐⭐⭐ |
| 7 | [Implement strStr()](https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/) | Easy | KMP | ⭐⭐⭐ |
| 8 | [All Anagrams of a Pattern in String](https://leetcode.com/problems/find-all-anagrams-in-a-string/) | Medium | Sliding Window | ⭐⭐⭐ |
| 9 | [Word Break](https://leetcode.com/problems/word-break/) | Medium | DP | ⭐⭐⭐ |
| 10 | [Regular Expression Matching](https://leetcode.com/problems/regular-expression-matching/) | Hard | DP | ⭐⭐⭐ |

---

## 🎓 Interview Checklist

- [ ] Sliding window for substring problems (longest, minimum, count)
- [ ] Two pointers for palindrome/reversal/two-sum problems
- [ ] Hash map for character frequency (anagrams, permutations)
- [ ] When to use StringBuilder vs String concatenation
- [ ] DP for edit distance and transformation problems
- [ ] Expand around center for palindrome problems
- [ ] Pattern matching (brute force vs KMP)
- [ ] Reverse a string and handle substrings
- [ ] Edge cases: empty string, single char, all same chars
- [ ] Time/space trade-offs (frequency array vs hash map)
