---
title: "Parallel Computation: Pthreads vs OpenMP"
---
## What is a thread?
Is essentially a lightweight unit of execution **within a process** that is given a sequence of instructions, its own registers, stack and program counter.
- They share the same heap and global memory, so they can communicate easily 
- The OS's scheduler decides which threads run on which cores
- If there are more threads than cores, it time slices between them
### So why not add infinite threads?
Adding more threads does not always mean a speed-up:
- **Synchronisation costs**: threads sometimes need to **wait** for each other (e.g. when accessing shared memory).
	- consumes CPU cycles just idling
- **Overhead**: creating threads, context switching, and scheduling have costs.
- **Load balancing**: if one thread does more work than others, it becomes the bottleneck.
### How many threads to use?
Well it really depends on the nature of the task and what your bottleneck is and how multi-threading can address this. 
#### Pure computation (Parallelsim)
like for example your trying to find all the prime numbers between 0 and n
- This is a CPU-intensive task and the bottleneck is the core itself
- Adding threads up to the amount of cores available in your machine (and splitting work accordingly) means that the work can be run in parallel up to that many cores
- Additional threads above this usually doesn't help as the work cannot be parallelised further and just adds to overhead
#### I/O Bound (Concurrency)
When your task is heavily dependent on I/O, say a web server, having more threads than CPU cores is beneficial as it enables concurrency. This is ensures that the time the CPU is spent idling is a minimum.

**e.g. A thread per request web-server**
- Each incoming request is given its own thread.
- If one thread is blocked on I/O, other threads can still process requests.
- The OS scheduler switches between threads, so the CPU can always do useful work while others are waiting.

** In practise this is not very scalable so modern web-servers use **asynchronous I/O**, where instead of creating a thread per request, the same thread can do other work while also performing I/O in a **non-blocking manner**.

### What is the speed-up? (Amdahl's Law)
When parallelising you task amongst multiple cores the speed up is **bound by the portion of serial work**. [Amdahl's Law](https://en.wikipedia.org/wiki/Amdahl%27s_law) demonstrates this with this formula for the expected speedup of parallelising a computational task

$$Speedup(N)=\frac{1}{(1−P)+\frac{N}{p}}$$
Where:
- $P$ = fraction of code that can be parallelised.
- $N$ = number of threads/cores.
#### Intuition
- The **part of your code that cannot be parallelised,** **always costs the same time** no matter how many cores you add.
- The **parallel part** shrinks as you add more cores $(P/N)$, but it can never vanish completely unless $P=1$.
- This means the **speedup curve flattens out**, so even when the number of cores **goes to infinity** there is not much difference since the serial part becomes the performance bottleneck
## pthreads (POSIX threads)
Is a low-level library following the [POSIX](https://www.google.com/search?q=what+is+POSIX&sca_esv=831661049e449a6f&sxsrf=AE3TifNe6SCqGQedoN0_7ERgIkt8CkL-ZA%3A1755998954369&ei=6mqqaOinFo6NseMPteHJuAs&ved=0ahUKEwjoxJrvpaKPAxWORmwGHbVwErcQ4dUDCBA&uact=5&oq=what+is+POSIX&gs_lp=Egxnd3Mtd2l6LXNlcnAiDXdoYXQgaXMgUE9TSVgyCxAAGIAEGJECGIoFMgsQABiABBiRAhiKBTIFEAAYgAQyBRAAGIAEMgoQABiABBgUGIcCMgUQABiABDILEAAYgAQYkQIYigUyBRAAGIAEMgUQABiABDIFEAAYgARIxRJQmwNYshFwA3gBkAEAmAG1AaAB_wOqAQMwLjO4AQPIAQD4AQGYAgWgAu0CwgIKEAAYsAMY1gQYR8ICBhAAGBYYHsICCBAAGBYYChgewgIKECMYgAQYJxiKBZgDAIgGAZAGCJIHAzMuMqAH4hGyBwMwLjK4B-ICwgcFMC4zLjLIBw8&sclient=gws-wiz-serp) standard where you can manually create, join and manage threads. It's a doubled edged sword, gives you lot of control but you have to also handle synchronisation (race conditions) and work distribution yourself.

Here is a parallel block of code that I wrote to compute the primes up to a number $n$, using the [Sieve of Eratosthenes](https://en.wikipedia.org/wiki/Sieve_of_Eratosthenes) algorithm.

```c++
std::vector<bool> printPrimesToNParalell(int n, int threads) {
	if (n < 2)
		return {true, true};
	// get primes < sqrt(n)
	
	auto basePrimes = getPrimesToSqrtN((int)floor(sqrt(n)));
	
	std::vector<bool> isComp(n + 1);
	isComp[0] = isComp[1] = true;
	
	// initialise tasks and threads
	std::vector<pthread_t> threadsIds(threads);
	std::vector<Task> tasks(threads);
	
	int totalChunks = n - 1;
	int chunkSize = (totalChunks + threads - 1) / threads;
	int threadSpawned = 0;
	
	for (int t = 0; t < threads; t++) {
		ll rangeStart = 2 + (ll)t * chunkSize;
		ll rangeEnd = rangeStart + chunkSize - 1; // inclusive 
	
		if (rangeStart > n) break;
		if (rangeEnd > n) rangeEnd = n;

		tasks[t] = Task{t, rangeStart, rangeEnd, &isComp, &basePrimes};
		
		if (pthread_create(&threadsIds[t], NULL, findCompositesInRange, &tasks[t]) != 0) {
			perror("pthread_create");
			exit(1);
		}
		threadSpawned++; //increment the successfull threads spawned
	}
	
	for (int t = 0; t < threadSpawned; t++)
		pthread_join(threadsIds[t], NULL);
	
	return isComp;
}
```

Essentially, the algorithm first computes the primes up to $\sqrt n$ (line 6) and then, in parallel, marks the multiples of those prime numbers that are **above $\sqrt n$** as composite in a boolean array, where then we know which numbers are prime. 

I parallelised the work by splitting the range of`[2..n]` into chunks, where each of the 8 threads in my machine was assigned it own to handle marking that specific section. Since each threads operates in its own boundary within the boolean array there is no synchronisation required.

For this somewhat simple implementation, working with pthreads wasn't to difficult, and I managed to get a around a 3x speedup. I think this is indicative of the portion of serial tasks within the program and the uneven workload amongst the range of `[2...n]`, where each thread wasn't handling a similarly intensive task.

### OpenMP
 a higher-level abstraction, through compiler directives, that makes creating and managing threads easier. It hides the details of thread management, while still letting you influence scheduling and synchronisation.

You basically tell the compiler "what to do", and OpenMP decides "how" it will parallelise the computation. As opposed to the pthreads implementation above, OpenMP provides some additional options for how the program should distribute and schedule work amongst threads. The pthreads range split approach above **assumes work is equal** in each chunk, implementing measures to account for uneven work would require additional complexity  

With OpenMP this a little more simple, allowing you to guide how work should be distributed and scheduled with just simple compiler directives:
- `static[,chunk]`: round-robin fixed chunks (low overhead; best for uniform work, same as pthreads range-split). 
- `dynamic[,chunk]`: threads pull next chunk when done (good for irregular work).
- `guided[,chunk]`: large chunks first, shrinking over time (compromise between overhead & balance).
### What does the chunk in `[,chunk]` mean?
**`, chunk`** is an **optional integer** that tells the runtime how many loop iterations to hand to a thread at a time

**Small Chunks:**
- Good when work is **unbalanced**
- A single thread is not left doing a **large portion** that is intensive while other threads idle
- Better load balancing, but also **more overhead**

For the task of computing primes up to n, using a smaller chunk value helped as the work tended to be more intensive in the upper end up of n. Heres the code...

```c++
std::vector<bool> printPrimesToOpenMP(int n, int threads) {
	if (n < 2)
		return {true, true};
	
	// get primes < sqrt(n)
	auto basePrimes = getPrimesToSqrtN((int)floor(sqrt(n)));
	
	std::vector<bool> isComp(n + 1);
	isComp[0] = isComp[1] = true;
	
	ll totalChunks = n - 1;
	ll segments = threads * 10;
	ll chunkSize = (totalChunks + segments - 1) / segments; // 80 segments
	
	omp_set_num_threads(threads);
	#pragma omp parallel for schedule(dynamic, 1)
	for (ll rangeStart = 2; rangeStart <= n; rangeStart += chunkSize) {
		ll rangeEnd = rangeStart + chunkSize - 1; // inclusive
		if (rangeEnd > n)
			rangeEnd = n;
		
		for (auto p : basePrimes) {
			ll p2 = p * p
			ll first = std::max(p2, ((rangeStart + p - 1) / p) * p);
			for (ll i = first; i <= rangeEnd; i += p) {
				isComp[i] = true;
			}
		}
	}

	return isComp;

}
```

The work is split up into 80 different segments and the dynamic scheduler assigns a segment to thread when it become available. 

**Performance vs pthreads**

With some non-extensive benchmarking the OpenMP implementation yielded: 

```zsh
-> % ./task3.o
Enter a value for n: 100000000
Time taken: 0.128826seconds
```
while the pthread implementation was slightly slower:
``` zsh
-> % ./task2.o
Enter a value for n: 100000000
Time taken: 0.134285seconds
```

My assumption would be that this is mostly due to the dynamic distribution of work being more optimal for this particular task.

#### OpenMP `private` and `shared` keywords

In addition, OpenMP provides two keywords for specifying how data should be shared amongst threads. These control whether threads see one common instance or their own copy
- **`shared(varlist)`**
    - All threads refer to the **same single instance**.
    - Reads/writes must be synchronised (e.g., atomics, critical) to avoid races.
- **`private(varlist)`**
    - Each thread gets its **own uninitialised copy**.
    - The original value is **not** copied in; on exit, the private value is **discarded**.

In my code this is not explicitly specified and is left to OpenMP to configure. By default...
- Variables **declared inside** the parallel region are **private** to that region.
- Variables **visible from outside** (locals in the enclosing scope, globals/statics) are typically **shared** .

### Summary
This is was a quick introduction into multi-threading and parallel computation, going over two common frameworks which enable this kind of work. This is only a foundation for me at the moment, to get a grasp what parallel computation is and how it is done at a high level. Hope you enjoyed and learned something :)

`- ravi`