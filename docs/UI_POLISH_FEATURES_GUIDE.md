# 前端UI锦上添花功能使用指南

## 📚 目录

1. [骨架屏加载](#骨架屏加载)
2. [页面切换动画](#页面切换动画)
3. [触摸手势](#触摸手势)
4. [加载状态管理](#加载状态管理)
5. [响应式工具](#响应式工具)
6. [错误处理](#错误处理)
7. [动画效果](#动画效果)
8. [移动端优化](#移动端优化)

---

## 骨架屏加载

### 基础用法

```tsx
import { Skeleton } from '@/components/common';

// 文本骨架屏
<Skeleton type="text" rows={3} loading={isLoading}>
  <YourContent />
</Skeleton>

// 标题骨架屏
<Skeleton type="title" loading={isLoading} />

// 头像骨架屏
<Skeleton type="avatar" loading={isLoading} />

// 按钮骨架屏
<Skeleton type="button" loading={isLoading} />

// 卡片骨架屏
<Skeleton type="card" loading={isLoading} />
```

### 专用骨架屏组件

```tsx
import { 
  DashboardSkeleton, 
  ListSkeleton, 
  TableSkeleton, 
  CardSkeleton 
} from '@/components/common';

// 仪表盘骨架屏
{isLoading ? <DashboardSkeleton /> : <Dashboard />}

// 列表骨架屏（可指定行数）
{isLoading ? <ListSkeleton rows={5} /> : <TaskList />}

// 表格骨架屏
{isLoading ? <TableSkeleton rows={10} /> : <DataTable />}

// 卡片骨架屏（可指定数量）
{isLoading ? <CardSkeleton count={8} /> : <CardGrid />}
```

### 实际应用示例

```tsx
import React, { useState, useEffect } from 'react';
import { DashboardSkeleton } from '@/components/common';
import { fetchDashboardData } from '@/api';

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const result = await fetchDashboardData();
      setData(result);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return <DashboardContent data={data} />;
};
```

---

## 页面切换动画

### SimpleFadeTransition（推荐）

轻量级的淡入淡出效果，适合大多数场景。

```tsx
import { SimpleFadeTransition } from '@/components/PageTransition';

const App: React.FC = () => {
  return (
    <SimpleFadeTransition>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tasks" element={<TasksPage />} />
      </Routes>
    </SimpleFadeTransition>
  );
};
```

### PageTransition（完整版）

包含退出和进入动画的完整过渡效果。

```tsx
import { PageTransition } from '@/components/PageTransition';

const App: React.FC = () => {
  return (
    <PageTransition>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tasks" element={<TasksPage />} />
      </Routes>
    </PageTransition>
  );
};
```

### 自定义动画类

在页面组件中使用动画类：

```tsx
const MyPage: React.FC = () => {
  return (
    <div className="page-container fade-in">
      {/* 页面内容 */}
    </div>
  );
};

// 可用的动画类：
// - fade-in: 淡入
// - slide-in: 从下滑入
// - slide-in-left: 从左滑入
// - slide-in-right: 从右滑入
// - scale-in: 缩放进入
```

---

## 触摸手势

### 滑动手势

```tsx
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

const ImageGallery: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => setCurrentIndex(prev => prev + 1),
    onSwipeRight: () => setCurrentIndex(prev => prev - 1),
    minSwipeDistance: 50, // 最小滑动距离（像素）
    maxSwipeTime: 300, // 最大滑动时间（毫秒）
  });

  return (
    <div {...swipeHandlers}>
      <img src={images[currentIndex]} alt="Gallery" />
    </div>
  );
};
```

### 长按手势

```tsx
import { useLongPress } from '@/hooks/useSwipeGesture';

const TaskCard: React.FC = () => {
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      console.log('长按触发');
      showContextMenu();
    },
    delay: 500, // 长按触发时间（毫秒）
  });

  return (
    <div {...longPressHandlers}>
      <Card>任务内容</Card>
    </div>
  );
};
```

### 双击手势

```tsx
import { useDoubleTap } from '@/hooks/useSwipeGesture';

const ImageViewer: React.FC = () => {
  const [isZoomed, setIsZoomed] = useState(false);

  const doubleTapHandlers = useDoubleTap({
    onDoubleTap: () => setIsZoomed(prev => !prev),
    delay: 300, // 双击间隔时间（毫秒）
  });

  return (
    <div {...doubleTapHandlers}>
      <img 
        src={imageSrc} 
        style={{ transform: isZoomed ? 'scale(2)' : 'scale(1)' }}
      />
    </div>
  );
};
```

---

## 加载状态管理

### useLoadingState（推荐）

完整的加载状态管理，自动处理loading、error、data。

```tsx
import { useLoadingState } from '@/hooks/useLoadingState';

const TaskList: React.FC = () => {
  const { isLoading, error, data, execute } = useLoadingState<Task[]>([]);

  useEffect(() => {
    execute(async () => {
      const tasks = await fetchTasks();
      return tasks;
    });
  }, []);

  if (isLoading) return <ListSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return <List dataSource={data} />;
};
```

### useDeferredLoading

避免短时间加载闪烁，提升用户体验。

```tsx
import { useDeferredLoading } from '@/hooks/useLoadingState';

const QuickLoadingComponent: React.FC = () => {
  const { showLoading, startLoading, stopLoading } = useDeferredLoading(300);

  useEffect(() => {
    const cleanup = startLoading();
    
    fetchData().then(() => {
      stopLoading();
    });

    return cleanup;
  }, []);

  // 只有加载时间超过300ms才显示loading
  if (showLoading) {
    return <Skeleton />;
  }

  return <Content />;
};
```

### useDebouncedLoading

防止频繁触发加载，适合搜索等场景。

```tsx
import { useDebouncedLoading } from '@/hooks/useLoadingState';

const SearchComponent: React.FC = () => {
  const { isLoading, startLoading, stopLoading } = useDebouncedLoading(500);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (searchTerm) {
      startLoading();
      
      searchAPI(searchTerm).then(results => {
        setResults(results);
        stopLoading();
      });
    }
  }, [searchTerm]);

  return (
    <div>
      <Input 
        value={searchTerm} 
        onChange={e => setSearchTerm(e.target.value)} 
      />
      {isLoading && <Spin />}
    </div>
  );
};
```

---

## 响应式工具

### useResponsive

检测屏幕尺寸和设备类型。

```tsx
import { useResponsive } from '@/hooks/useResponsive';

const ResponsiveLayout: React.FC = () => {
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    currentBreakpoint,
    windowSize 
  } = useResponsive();

  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
      
      <p>当前断点: {currentBreakpoint}</p>
      <p>窗口尺寸: {windowSize.width} x {windowSize.height}</p>
    </div>
  );
};
```

### useTouchDevice

检测是否为触摸设备。

```tsx
import { useTouchDevice } from '@/hooks/useResponsive';

const InteractiveComponent: React.FC = () => {
  const isTouchDevice = useTouchDevice();

  return (
    <div>
      {isTouchDevice ? (
        <TouchControls />
      ) : (
        <MouseControls />
      )}
    </div>
  );
};
```

### useNetworkStatus

监测网络连接状态。

```tsx
import { useNetworkStatus } from '@/hooks/useResponsive';
import { Alert } from 'antd';

const App: React.FC = () => {
  const isOnline = useNetworkStatus();

  return (
    <div>
      {!isOnline && (
        <Alert 
          message="网络连接已断开" 
          type="warning" 
          banner 
        />
      )}
      <YourContent />
    </div>
  );
};
```

### usePageVisibility

检测页面是否在前台。

```tsx
import { usePageVisibility } from '@/hooks/useResponsive';

const VideoPlayer: React.FC = () => {
  const isVisible = usePageVisibility();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isVisible) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isVisible]);

  return <video ref={videoRef} src={videoSrc} />;
};
```

### useScrollPosition

获取滚动位置。

```tsx
import { useScrollPosition } from '@/hooks/useResponsive';

const ScrollToTopButton: React.FC = () => {
  const { scrollPosition, isScrolledPast } = useScrollPosition();
  const showButton = isScrolledPast(300);

  return (
    <>
      {showButton && (
        <Button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ position: 'fixed', bottom: 20, right: 20 }}
        >
          回到顶部
        </Button>
      )}
    </>
  );
};
```

---

## 错误处理

### ErrorBoundary

捕获React组件错误，显示友好的错误页面。

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary 
      onError={(error, errorInfo) => {
        // 发送错误到监控服务
        console.error('Error caught:', error, errorInfo);
      }}
    >
      <YourApp />
    </ErrorBoundary>
  );
};
```

### 自定义错误UI

```tsx
<ErrorBoundary
  fallback={
    <div className="custom-error">
      <h1>出错了</h1>
      <p>请联系技术支持</p>
    </div>
  }
>
  <YourComponent />
</ErrorBoundary>
```

### useAsyncError

在异步操作中抛出错误给ErrorBoundary。

```tsx
import { useAsyncError } from '@/components/ErrorBoundary';

const AsyncComponent: React.FC = () => {
  const throwError = useAsyncError();

  const handleClick = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      throwError(error as Error);
    }
  };

  return <Button onClick={handleClick}>执行操作</Button>;
};
```

---

## 动画效果

### CSS动画类

直接在元素上使用动画类：

```tsx
// 淡入动画
<div className="fade-in">内容</div>

// 滑入动画
<div className="slide-in">内容</div>

// 从左滑入
<div className="slide-in-left">内容</div>

// 从右滑入
<div className="slide-in-right">内容</div>

// 缩放进入
<div className="scale-in">内容</div>
```

### 骨架屏动画

```tsx
// 闪烁效果（自动应用）
<div className="skeleton">加载中...</div>

// 脉冲效果
<div className="skeleton-pulse">加载中...</div>
```

### 自定义动画

在CSS中使用已定义的关键帧：

```css
.my-custom-animation {
  animation: fadeIn 0.5s ease-in-out;
}

/* 可用的关键帧：
   - fadeIn
   - slideIn
   - slideInLeft
   - slideInRight
   - scaleIn
   - shimmer
   - pulse
*/
```

---

## 移动端优化

### 触摸反馈

所有卡片和按钮在触摸设备上自动具有触摸反馈：

```tsx
// 卡片触摸反馈（自动）
<Card className="task-card">内容</Card>

// 按钮触摸反馈（自动）
<Button>点击我</Button>
```

### 防止iOS缩放

输入框自动设置16px字体，防止iOS自动缩放：

```tsx
// 自动应用，无需额外配置
<Input placeholder="输入内容" />
```

### 增大可点击区域

按钮和链接自动具有最小44px × 44px的可点击区域：

```tsx
// 自动应用，无需额外配置
<Button size="small">小按钮</Button>
```

### 横向滚动优化

表格自动支持横向滚动：

```tsx
// 自动应用，无需额外配置
<Table dataSource={data} columns={columns} />
```

### 响应式间距

使用响应式工具类：

```tsx
<div className="p-md">
  {/* 桌面端：16px padding */}
  {/* 移动端：自动调整 */}
</div>
```

---

## 最佳实践

### 1. 骨架屏使用建议

- ✅ 对于加载时间>300ms的内容使用骨架屏
- ✅ 骨架屏形状应与实际内容相似
- ✅ 使用专用骨架屏组件（DashboardSkeleton等）
- ❌ 避免对快速加载的内容使用骨架屏

### 2. 动画使用建议

- ✅ 页面切换使用SimpleFadeTransition
- ✅ 列表项使用fade-in或slide-in
- ✅ 模态框使用scale-in
- ❌ 避免过度使用动画
- ❌ 避免动画时间过长（>500ms）

### 3. 触摸手势建议

- ✅ 滑动用于切换内容
- ✅ 长按用于显示菜单
- ✅ 双击用于缩放
- ❌ 避免手势冲突
- ❌ 提供替代的点击操作

### 4. 响应式设计建议

- ✅ 使用useResponsive检测设备类型
- ✅ 移动端优先设计
- ✅ 提供触摸友好的交互
- ✅ 测试不同屏幕尺寸
- ❌ 避免固定像素值

### 5. 错误处理建议

- ✅ 在应用根部使用ErrorBoundary
- ✅ 提供友好的错误提示
- ✅ 提供重试机制
- ✅ 记录错误日志
- ❌ 避免暴露技术细节给用户

---

## 性能优化提示

### 1. 动画性能

```tsx
// ✅ 使用transform（GPU加速）
.animated {
  transform: translateY(0);
  transition: transform 0.3s;
}

// ❌ 避免使用top/left
.slow-animation {
  top: 0;
  transition: top 0.3s;
}
```

### 2. 事件监听

```tsx
// ✅ 使用passive监听
useEffect(() => {
  const handler = () => {};
  window.addEventListener('scroll', handler, { passive: true });
  return () => window.removeEventListener('scroll', handler);
}, []);
```

### 3. 防抖和节流

```tsx
// ✅ 对频繁触发的事件使用防抖
import { useDebouncedLoading } from '@/hooks/useLoadingState';

const { startLoading } = useDebouncedLoading(500);
```

---

## 常见问题

### Q: 骨架屏闪烁怎么办？

A: 使用`useDeferredLoading`，只在加载时间超过阈值时显示骨架屏。

### Q: 页面切换动画卡顿？

A: 使用`SimpleFadeTransition`而不是`PageTransition`，或减少动画时长。

### Q: 触摸手势不生效？

A: 确保元素有足够的尺寸，并且没有其他事件监听器阻止默认行为。

### Q: 移动端按钮太小？

A: 自动应用了44px最小尺寸，如果仍然太小，检查是否有自定义样式覆盖。

### Q: 如何禁用某个动画？

A: 移除对应的className，或设置`animation: none`。

---

## 总结

本指南涵盖了所有锦上添花功能的使用方法。这些功能旨在提升用户体验，但应该根据实际需求合理使用。记住：

- 🎯 **性能优先**：不要为了动画牺牲性能
- 📱 **移动优先**：确保移动端体验良好
- 🎨 **一致性**：保持整个应用的视觉一致性
- 🔧 **可维护性**：使用提供的Hook和组件，避免重复代码

---

**文档版本**：1.0  
**创建日期**：2026-01-09  
**适用版本**：React 18 + TypeScript + Ant Design 5
