# Scaling Quick Start

## 🚀 Quick Start (30 seconds)

### 1. Install GPU Support (Optional)
```bash
npm install gpu.js
```

### 2. Run Scalable Automaton
```bash
./automaton-scalable.ts --gpu
```

That's it! The system will automatically:
- ✅ Use all 4 CPU cores
- ✅ Enable GPU acceleration (if available)
- ✅ Scale dynamically based on memory
- ✅ Process 8-16 modifications in parallel

## 📊 Expected Results

**Before Scaling**:
- Modifications/second: ~1
- Memory: 63MB
- CPU: 25% (1 core)

**After Scaling**:
- Modifications/second: **8-16x faster** (8-16 mods/sec)
- Memory: 200-500MB (still only 3% of available!)
- CPU: 100% (all cores utilized)

## 🎯 Command Options

```bash
# Basic (CPU only, auto-scaling)
./automaton-scalable.ts

# With GPU acceleration
./automaton-scalable.ts --gpu

# Custom workers and interval
./automaton-scalable.ts --workers=8 --interval=500 --gpu

# Maximum performance
./automaton-scalable.ts --workers=8 --interval=100 --gpu
```

## 📈 Performance Tuning

### Increase Parallelism
```bash
# 2x CPU cores = 8 parallel modifications
./automaton-scalable.ts --workers=8

# 4x CPU cores = 16 parallel modifications  
./automaton-scalable.ts --workers=16
```

### Reduce Interval (Higher Throughput)
```bash
# 100ms = 10 executions/second
./automaton-scalable.ts --interval=100

# 500ms = 2 executions/second (balanced)
./automaton-scalable.ts --interval=500
```

## 🔥 Maximum Performance Setup

For maximum performance with your resources:

```bash
./automaton-scalable.ts \
  --workers=8 \
  --interval=100 \
  --gpu
```

**Expected**: 32-64x performance improvement!

## 📊 Monitoring

Stats are printed every 10 seconds:
```
📊 Scalability Stats:
   CPU Cores: 4
   Workers: 8/8
   GPU: ✅ (Available)
   Memory: 200.50MB / 500.00MB (1.3%)
   Objects: 422 (273 modifications)
   Parallel Modifications: 8
```

## 💡 Tips

1. **Start with defaults**: `./automaton-scalable.ts`
2. **Add GPU if available**: `--gpu`
3. **Scale up gradually**: Increase `--workers` incrementally
4. **Monitor memory**: Watch the stats output
5. **You have headroom**: Only using 0.4% of memory currently!

## 🆘 Troubleshooting

**GPU not working?**
```bash
npm install gpu.js
```

**Too much memory usage?**
```bash
# Reduce workers
./automaton-scalable.ts --workers=2
```

**Want to disable auto-scaling?**
```bash
./automaton-scalable.ts --no-auto-scale
```

## 📚 Full Documentation

See `SCALING-GUIDE.md` for complete documentation.
