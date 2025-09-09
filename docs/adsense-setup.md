# Google AdSense 集成说明

## 概述

本博客已集成 Google AdSense，支持自动在所有博客页面显示广告，无需每次手动添加。

## 文件结构

```
├── app/layout.tsx              # 根布局，包含 AdSense 脚本
├── components/AdSense.tsx     # 可复用的广告组件
├── layouts/PostLayout.tsx      # 博客布局，集成广告位
└── data/adsenseConfig.ts       # AdSense 配置文件
```

## 配置说明

### 1. 更新 AdSense 客户端 ID

在 `data/adsenseConfig.ts` 中更新你的 AdSense 客户端 ID：

```typescript
export const adsenseConfig = {
  clientId: 'ca-pub-你的客户端ID', // 替换为你的真实客户端 ID
  // ...
}
```

### 2. 更新广告位 ID

在 `data/adsenseConfig.ts` 中更新你的广告位 ID：

```typescript
adSlots: {
  postContent: '你的文章内容广告位ID',
  sidebar: '你的侧边栏广告位ID',
  banner: '你的横幅广告位ID',
  listItem: '你的列表广告位ID',
}
```

### 3. 环境控制

- `enabled`: 是否启用 AdSense
- `showInDevelopment`: 开发环境是否显示广告（建议设为 false）

## 广告位位置

### 博客文章页面

1. **文章内容后**: 在文章正文结束后显示
2. **侧边栏**: 在右侧边栏底部显示

### 自定义广告位

你可以在任何地方使用 AdSense 组件：

```tsx
import AdSense from '@/components/AdSense'

;<AdSense
  adSlot="你的广告位ID"
  adFormat="auto"
  className="text-center"
  adStyle={{ minHeight: '250px' }}
/>
```

## 参数说明

- `adSlot`: 广告位 ID（必需）
- `adFormat`: 广告格式（'auto' | 'rectangle' | 'vertical' | 'horizontal'）
- `adStyle`: 自定义样式
- `className`: CSS 类名

## 注意事项

1. **广告位 ID**: 需要在 Google AdSense 后台创建对应的广告位
2. **审核**: 新网站需要等待 Google 审核通过才能显示广告
3. **政策**: 确保内容符合 AdSense 政策要求
4. **性能**: 广告加载不会影响页面性能

## 测试

1. 开发环境默认不显示广告
2. 生产环境会自动显示广告
3. 可以通过修改 `showInDevelopment` 在开发环境测试

## 维护

- 所有广告相关配置都在 `data/adsenseConfig.ts` 中
- 新增广告位只需在配置文件中添加新的 ID
- 组件会自动处理广告加载和错误处理
