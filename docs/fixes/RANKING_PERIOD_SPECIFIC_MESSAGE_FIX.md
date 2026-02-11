# 排名页面期间特定消息修复

## 问题描述
用户反馈希望将前端逻辑改为如果在rankings返回中没有用户数据，则在图中栏目中显示该日期未参与排名，而不是显示通用的"您还没有排名数据"消息。

## 解决方案
修改了 `packages/frontend/src/pages/RankingPage.tsx` 中的 `renderMyRankingCard` 函数，使其根据当前选择的时间周期显示具体的未参与排名消息：

### 修改内容
1. **月度排名**: 显示 `${year}年${month}月未参与排名`
2. **季度排名**: 显示 `${year}年第${quarter}季度未参与排名`  
3. **总累积排名**: 显示 `总累积期间未参与排名`

### 代码变更
```typescript
const renderMyRankingCard = () => {
  if (!myRanking) {
    const getNoRankingMessage = () => {
      if (period === 'monthly') {
        return `${year}年${month}月未参与排名`;
      } else if (period === 'quarterly') {
        return `${year}年第${quarter}季度未参与排名`;
      }
      return '总累积期间未参与排名';
    };

    return (
      <Card style={{ textAlign: 'center', padding: '24px 0' }}>
        <Text type="secondary" style={{ fontSize: 16 }}>{getNoRankingMessage()}</Text>
      </Card>
    );
  }
  // ... 其余代码保持不变
};
```

## 用户体验改进
- **之前**: 显示通用消息 "您还没有排名数据"
- **现在**: 显示具体时间周期的消息，如 "2026年2月未参与排名"

这样用户可以清楚地知道是在哪个具体时间段内没有参与排名，提供了更精确和有用的信息。

## 测试验证
- 语法检查通过，无编译错误
- 消息会根据用户选择的时间周期（月度/季度/总累积）动态更新
- 保持了原有的UI样式和布局

## 影响范围
- 仅影响排名页面的"我的排名"卡片显示
- 不影响其他页面的排名数据显示（如仪表板页面）
- 向后兼容，不会破坏现有功能

## 修复时间
2026年2月11日