---
title: "Speedup of Parallel System: Amdahl's vs Gustafson's Law"
tags:
  - low-level
  - hpc
---
### Amdahl's Law
*Assumes:* 
- That a certain computational problem is **fixed**
- The computation can be split into $p$, parallelisable and $(1-p)$ non-parallelisable components
- The time taken for **sequential component cannot be improved** 

The **time speedup** achieved by such system, running on $N$ processors, can be modelled by
$$
S=\frac{1}{(1-p)+\frac{p}{N}}
$$
### Gustafson's Law
Basically says that, when we have a large parallel system the amount of work we can actually do increases. In essence, parallel machines do not just speed up exisiting problems but enable us to do bigger ones.

If you have a problem that takes some time $tp$ to be run on $N$ processors, where the computation **time** for the parallel component takes $p$ units and the sequential component takes $1-p$. The application can be run on a **sequential machine** in

$$
t = (1-p)t_{p} +Np*(t_{P})
$$
Now if we **increase the problem size** and the number of cores accordingly, to keep the execution time of the parallel component ($p*tp$) **constant**, we can model the speedup as a multiplier of the **size of the new problem** achievable, in the same amount of time.
$$
S=\frac{(1-p)t_{p}+Nt_{p}}{t_{p}}=(1-p) + Np
$$

However, this is an optimistic estimation of the actual speedup, not taking into account the fact that communication overheads increase as problems scale.

### Summary
The way Amdahl's and Gustafson's Law model the fraction of serial to parallel components in the problem is they key difference.

- Amdahl's Law  $1-p$ signifies the **fraction of sequential execution time on ==1 processor**== 
	- i.e. this is time taken for sequential operations, whether I/O or something else, **no matter the amount of PUs**
- Gustfason's Law $1-p$ is the **fraction of sequential runtime, on a ==parallel== machine with N processors**
	- i.e. As you scale the problem up, the parallel work dominates, so the **_measured_ serial fraction looks smaller and smaller** (though the absolute sequential work may be the same).
	- Overall wall time stays the same
