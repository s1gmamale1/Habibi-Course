<!-- ruflo-memory-convention:start -->
## Ruflo Memory Convention

**Store memories** with namespace `"patterns"` (the canonical namespace):
```
memory_store(key, value, namespace: "patterns", upsert: true)
```

**Retrieve memories** with `memory_search_unified` — it sweeps ALL namespaces
(`default`, `pattern`, `patterns`, `feedback`, …) and returns relevant results:
```
memory_search_unified(query)
```

> Do NOT use plain `memory_search` without a namespace — it defaults to the
> near-empty `"default"` namespace and returns ~nothing useful.

After completing a task, store a short verdict (what worked / what to apply next)
to namespace `"patterns"` with key `verdict:<taskId>` or `verdict:<sessionId>`.
<!-- ruflo-memory-convention:end -->
