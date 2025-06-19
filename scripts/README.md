# 自动化脚本说明

## 标签翻译自动更新脚本

### 功能说明

`update-tags.mjs` 脚本可以自动扫描 `data/blog/` 目录下的所有 MDX 文件，提取其中的标签，并自动更新 `messages/zh.json` 和 `messages/en.json` 文件中的翻译。

### 使用方法

#### 1. 手动运行

```bash
# 使用 npm 脚本
npm run update-tags

# 或者直接运行
node scripts/update-tags.mjs
```

#### 2. 自动运行（推荐）

脚本已经配置为在 Git pre-commit hook 中自动运行，当你提交代码时会自动检查并更新标签翻译。

### 脚本功能

1. **扫描 MDX 文件**：自动扫描 `data/blog/` 目录下的所有 `.mdx` 文件
2. **提取标签**：从每个文件的 frontmatter 中提取 `tags` 字段
3. **智能翻译**：
   - 对于已知的标签，使用预设的翻译
   - 对于未知的标签，使用标签本身作为翻译（你可以后续手动修改）
4. **更新文件**：自动更新中文和英文翻译文件

### 预设翻译

脚本包含了一些常用标签的预设翻译：

| 中文标签 | 英文翻译           |
| -------- | ------------------ |
| 开发习惯 | Development Habits |
| 随笔     | Essay              |
| 开端     | Start              |
| Git      | Git                |
| GitHub   | GitHub             |
| 代码     | Code               |
| 功能     | Features           |
| 指南     | Guide              |
| 书籍     | Book               |
| 反思     | Reflection         |

### 示例输出

```
🔍 Scanning MDX files for tags...
Found 3 unique tags: ['Git', '开发习惯', '随笔']

📝 Updating translation files...

Updating Chinese translations:
  + Added: "Git" -> "Git"
  + Added: "开发习惯" -> "开发习惯"
  ✓ Updated /path/to/messages/zh.json with 2 new tags

Updating English translations:
  + Added: "Git" -> "Git"
  + Added: "开发习惯" -> "Development Habits"
  ✓ Updated /path/to/messages/en.json with 2 new tags

✅ Summary:
  - Chinese translations: 2 tags added
  - English translations: 2 tags added
  - Total unique tags: 3

💡 Tip: You may want to review and improve the auto-generated translations.
```

### 注意事项

1. **备份重要文件**：脚本会直接修改翻译文件，建议在重要修改前备份
2. **检查翻译质量**：脚本生成的翻译可能需要手动调整，特别是对于新标签
3. **Git 集成**：脚本已集成到 pre-commit hook 中，提交时会自动运行

### 自定义翻译

如果需要添加新的预设翻译，可以编辑 `scripts/update-tags.mjs` 文件中的 `DEFAULT_TRANSLATIONS` 和 `EN_TO_ZH_TRANSLATIONS` 对象。

### 故障排除

如果脚本运行失败，请检查：

1. 文件路径是否正确
2. 翻译文件是否为有效的 JSON 格式
3. MDX 文件的 frontmatter 格式是否正确
4. Node.js 版本是否支持 ES modules
