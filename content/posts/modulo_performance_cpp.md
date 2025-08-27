---
title: Performance of using modulo
tags: [low-level, comparch]
---
Was working on this [problem](https://cses.fi/problemset/result/14221206/) that required repeated modulo operations on an answer with a constant ($10^9+7$). The algorithm was already as efficient as it could be however the large test cases were failing and I was unsure why. Initially tried tweaking the algorithm for early exit conditions, path pruning, sorted input etc. However, none of this worked so after doing little bit of research i found out it was due to the repeated modulo operation within the code. 

You maybe asking, "but this is a constant time operation, is it really the problem?" But what I found out was that not every arithmetic operation on a cpu has the same computational load.

In C++, `a % m` for integers translates to a **division instruction** (`idiv` or `div` on x86).
Division is _much slower_ than add/sub/mul:

- addition: 1 cycle
- subtraction: 1 cycle
- multiplication: ~3 cycles
- division: ~20–40 cycles (depends on CPU, but **an order of magnitude slower**).

This is due to there not being a simple circuit, like for add, subtract and multiply, to perform "divide this number by that." Most of the time `idiv` or `div` is reliant on iterative algorithms 
(e.g. restoring division, Newton-Raphson and Goldschmidt) you can read about them [here](https://en.wikipedia.org/wiki/Division_algorithm).

Essentially, under the hood this what my C++ code looked like on `x86` assembly on [Compiler Explore](https://godbolt.org/z/8s19bxoeM).

**Using Modulo**

C++
```cpp
int MOD = 1'000'000'007;

int mod_op(int a, int b) {
	return (a + b) % MOD; 
}
```

x86
```x86asm
mov edx, DWORD PTR [rbp-4]
mov eax, DWORD PTR [rbp-8]
add eax, edx
mov esi, DWORD PTR MOD[rip]
cdq
idiv esi
mov ecx, edx
mov eax, ecx
```

As you can see there is `idiv` instruction to perform the modulo operation, and since this is being done millions of times in my C++ code this is very costly. However, what I didn't initially notice is that my value for `MOD` is not a constant and this was actually the key problem.

**Using Modulo with `constexpr` Divisor**

With modern compilers, when you define the divisor as a constant it can apply some key optimisations. Particularly, if the divisor is known ahead of time you can replace the operation with other cheaper operations which have the same effect.

This sequence is much faster than an actual hardware division. This is what the same `x86` code looks like with `MOD` as a `constexpr`

```x86asm
mov edx, DWORD PTR [rbp-4]
mov eax, DWORD PTR [rbp-8]
add eax, edx
movsx rdx, eax
imul rdx, rdx, 1152921497 //imul instead of idiv
shr rdx, 32
sar edx, 28
mov ecx, eax
sar ecx, 31
sub edx, ecx
imul ecx, edx, 1000000007
sub eax, ecx
mov edx, eax
mov eax, edx
```

This passes the test cases, and yields a run time of `0.5s` on the large inputs. However we can do better! 

**Using Compare and Subtract**

The modulo operation is basically just finding the difference of the value and the divisor if the value is greater than the divisor. Hence, since we know what the divisor is ahead of time we can implement this like such...

```cpp
int mod_conditional(int a, int b) {
	int x = a + b;
	return (x >= MOD) ? x - MOD : x;
}
```

The assembly looks something like this:

```x86asm
mov edx, DWORD PTR [rbp-20]
mov eax, DWORD PTR [rbp-24]
add eax, edx
mov DWORD PTR [rbp-4], eax
cmp DWORD PTR [rbp-4], 1000000006
jle .L4
sub DWORD PTR [rbp-4], 1000000007
```

As you can it's just doing a compare and subtract, which very cheap for the cpu. This yields a time of `0.31s` on the large test cases, a smaller improvement from `>1.0s` to `0.5s` but an improvement nonetheless!

**A good rule of thumb**
- Avoid `%` in tight loops unless the divisor is a **power of two** (in which case compilers optimise `%` into a cheap bitmask).
- For arbitrary constants (like `1e9+7`), use conditional subtract or precomputed tricks.

Thanks for reading :)) `-ravi`
