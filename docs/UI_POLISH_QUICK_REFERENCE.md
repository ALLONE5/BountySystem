# 前端UI锦上添花功能快速参考

## 🚀 快速开始

### 1. 骨架屏（最常用）

```tsx
import { DashboardSkeleton, ListSkeleton, TableSkeleton } from '@/components/common';

// 仪表盘
{isLoading ? <DashboardSkeleton /> : <Dashboard />}

// 列表
{isLoading ? <ListSkeleton rows={5} /> : <List />}

// 表格
{isLoading ? <TableSkeleton rows={10} /> : <Table />}
```

### 2. 页面切换动画

```tsx
import { SimpleFadeTransition } from '@/components/PageTransition';

<SimpleFadeTransition>
  <Routes>...</Routes>
</SimpleFadeTransition>
```

### 3. 加载状态管理

```tsx
import { useLoadingState } from '@/hooks/useLoadingState';

const { isLoading, data, execute } = useLoadingState();

useEffect(() => {
  execute(async () => await fetchData());
}, []);
```

### 4. 响应式检测

```tsx
import { useResponsive } from '@/hooks/useResponsive';

const { isMobile, isTablet, isDesktop } = useResponsive();
```

### 5. 触摸手势

```tsx
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

const handlers = useSwipeGesture({
  onSwipeLeft: handleNext,
  onSwipeRight: handlePrev,
});

<div {...handlers}>内容</div>
```

---

## 📦 所有组件和Hook

### 组件（3个）
```tsx
import { 
  Skeleton,           // 通用骨架屏
  PageTransition,     // 页面切换动画
  ErrorBoundary       // 错误边界
} from '@/components/...';
```

### 骨架屏变体（5个）
```tsx
import { 
  DashboardSkeleton,  // 仪表盘骨架屏
  ListSkeleton,       // 列表骨架屏
  TableSkeleton,      // 表格骨架屏
  CardSkeleton        // 卡片骨架屏
} from '@/components/common';
```

### 手势Hook（3个）
```tsx
import { 
  useSwipeGesture,    // 滑动手势
  useLongPress,       // 长按手势
  useDoubleTap        // 双击手势
} from '@/hooks/useSwipeGesture';
```

### 加载Hook（3个）
```tsx
import { 
  useLoadingState,    // 完整加载状态
  useDeferredLoading, // 延迟加载
  useDebouncedLoading // 防抖加载
} from '@/hooks/useLoadingState';
```

### 响应式Hook（5个）
```tsx
import { 
  useResponsive,      // 响应式检测
  useTouchDevice,     // 触摸设备检测
  useNetworkStatus,   // 网络状态
  usePageVisibility,  // 页面可见性
  useScrollPosition   // 滚动位置
} from '@/hooks/useResponsive';
```

---

## 🎨 动画类

```tsx
// 直接在className中使用
<div className="fade-in">淡入</div>
<div className="slide-in">滑入</div>
<div className="slide-in-left">左滑入</div>
<div className="slide-in-right">右滑入</div>
<div className="scale-in">缩放</div>
```

---

## 📱 移动端优化

### 自动应用的优化
- ✅ 44px最小可点击区域
- ✅ 触摸反馈动画
- ✅ 防止iOS自动缩放
- ✅ 横向滚动优化

### 响应式工具类
```tsx
<div className="hide-mobile">桌面端显示</div>
<div className="show-mobile">移动端显示</div>
```

---

## 🔧 常用模式

### 模式1：数据加载
```tsx
const { isLoading, data, execute } = useLoadingState();

useEffect(() => {
  execute(async () => await api.getData());
}, []);

if (isLoading) return <ListSkeleton />;
return <List data={data} />;
```

### 模式2：响应式布局
```tsx
const { isMobile } = useResponsive();

return isMobile ? <MobileView /> : <DesktopView />;
```

### 模式3：滑动切换
```tsx
const [index, setIndex] = useState(0);
const handlers = useSwipeGesture({
  onSwipeLeft: () => setIndex(i => i + 1),
  onSwipeRight: () => setIndex(i => i - 1),
});

<div {...handlers}>{items[index]}</div>
```

### 模式4：延迟加载
```tsx
const { showLoading, startLoading, stopLoading } = useDeferredLoading(300);

useEffect(() => {
  const cleanup = startLoading();
  fetchData().then(() => stopLoading());
  return cleanup;
}, []);

if (showLoading) return <Skeleton />;
```

### 模式5：网络状态
```tsx
const isOnline = useNetworkStatus();

return (
  <>
    {!isOnline && <Alert message="网络已断开" />}
    <YourContent />
  </>
);
```

---

## ⚡ 性能提示

### ✅ 推荐
- 使用transform做动画（GPU加速）
- 使用passive监听滚动事件
- 使用延迟加载避免闪烁
- 使用防抖减少请求

### ❌ 避免
- 使用top/left做动画
- 过度使用动画
- 对快速加载使用骨架屏
- 频繁触发状态更新

---

## 📖 完整文档

详细使用指南：[UI_POLISH_FEATURES_GUIDE.md](./UI_POLISH_FEATURES_GUIDE.md)

---

**版本**：1.0  
**日期**：2026-01-09
