---
name: git-commit-cn
description: 根据 git diff 生成中文 Git commit message。在用户要求提交代码、写 commit message、git commit 时使用。
---

# Git Commit 中文消息生成

## 工作流

1. 运行 `git diff --cached` 获取暂存区变更；若为空则用 `git diff` 获取工作区变更
2. 运行 `git log --oneline -5` 了解近期提交风格
3. 分析变更内容，确定 commit type 和模块名
4. 按下方格式生成 commit message

## Commit 格式

```
<type>(<module>): 简短描述

- 修改点1
- 修改点2
- 修改点3
```

## Type 类型

| Type     | 含义      |
| -------- | --------- |
| feat     | 新功能    |
| fix      | 修复问题  |
| refactor | 重构      |
| perf     | 性能优化  |
| docs     | 文档      |
| test     | 测试      |
| chore    | 构建/工具 |

## 模块名推断

优先从变更文件路径自动推断模块名：

- 路径含 `order` → module = `order`
- 路径含 `user` → module = `user`
- 路径含多个模块 → 取变更最多的模块，或用逗号分隔
- 无法推断 → 提示用户指定

## 规则

- 简短描述不超过 50 字
- 修改点按实际变更列出，通常 2-5 条
- 不要列出无意义的修改（如仅空格变化）
- 如果变更跨多个不相关功能，建议用户拆分提交
- 不要直接操作 git commit 进行提交，将生成号的 commit message 返回出来

## 示例

**输入**: 新增了订单归还相关接口和逻辑

**输出**:

```
feat(order): 支持订单归还流程

- 新增订单归还接口
- 调整订单状态流转逻辑
- 更新相关单元测试
```

**输入**: 修复了账单计算精度问题

**输出**:

```
fix(bill): 修复账单金额计算精度丢失

- 将 double 运算改为 BigDecimal
- 补充金额计算的单元测试
```
