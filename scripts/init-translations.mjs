#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ZH_TRANSLATION_FILE = path.join(__dirname, '../messages/zh.json')
const EN_TRANSLATION_FILE = path.join(__dirname, '../messages/en.json')

const zhTranslations = {
  "common": {
    "home": "首页",
    "blog": "博客",
    "about": "关于",
    "projects": "项目",
    "tags": "标签",
    "search": "搜索",
    "theme": "主题",
    "language": "语言"
  },
  "home": {
    "title": "欢迎来到我的博客",
    "description": "分享技术、生活和想法",
    "readMore": "阅读更多",
    "viewAllPosts": "查看所有文章"
  },
  "blog": {
    "readMore": "阅读更多",
    "publishedOn": "发布于",
    "lastModified": "最后修改",
    "readingTime": "阅读时间",
    "tags": "标签",
    "relatedPosts": "相关文章",
    "noPosts": "暂无文章",
    "previous": "上一页",
    "next": "下一页",
    "of": "共",
    "allPosts": "所有文章",
    "viewPostsTagged": "查看标签为"
  },
  "about": {
    "title": "关于我",
    "description": "了解更多关于我的信息"
  },
  "projects": {
    "title": "项目",
    "description": "我参与的一些项目",
    "viewProject": "查看项目",
    "viewCode": "查看代码"
  },
  "footer": {
    "copyright": "版权所有",
    "poweredBy": "由 Next.js 驱动"
  },
  "search": {
    "placeholder": "搜索文章...",
    "noResults": "没有找到相关结果",
    "searchResults": "搜索结果"
  },
  "theme": {
    "light": "浅色",
    "dark": "深色",
    "system": "系统"
  },
  "tags": {}
}

const enTranslations = {
  "common": {
    "home": "Home",
    "blog": "Blog",
    "about": "About",
    "projects": "Projects",
    "tags": "Tags",
    "search": "Search",
    "theme": "Theme",
    "language": "Language"
  },
  "home": {
    "title": "Welcome to My Blog",
    "description": "Sharing technology, life and thoughts",
    "readMore": "Read More",
    "viewAllPosts": "View All Posts"
  },
  "blog": {
    "readMore": "Read More",
    "publishedOn": "Published on",
    "lastModified": "Last Modified",
    "readingTime": "Reading Time",
    "tags": "Tags",
    "relatedPosts": "Related Posts",
    "noPosts": "No posts found",
    "previous": "Previous",
    "next": "Next",
    "of": "of",
    "allPosts": "All Posts",
    "viewPostsTagged": "View posts tagged"
  },
  "about": {
    "title": "About Me",
    "description": "Learn more about me"
  },
  "projects": {
    "title": "Projects",
    "description": "Some projects I've worked on",
    "viewProject": "View Project",
    "viewCode": "View Code"
  },
  "footer": {
    "copyright": "All rights reserved",
    "poweredBy": "Powered by Next.js"
  },
  "search": {
    "placeholder": "Search posts...",
    "noResults": "No results found",
    "searchResults": "Search Results"
  },
  "theme": {
    "light": "Light",
    "dark": "Dark",
    "system": "System"
  },
  "tags": {}
}

function initTranslations() {
  console.log('📝 Initializing translation files...')
  
  try {
    fs.writeFileSync(ZH_TRANSLATION_FILE, JSON.stringify(zhTranslations, null, 2) + '\n')
    console.log('✓ Created Chinese translation file')
    
    fs.writeFileSync(EN_TRANSLATION_FILE, JSON.stringify(enTranslations, null, 2) + '\n')
    console.log('✓ Created English translation file')
    
    console.log('✅ Translation files initialized successfully!')
  } catch (error) {
    console.error('❌ Error initializing translation files:', error.message)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  initTranslations()
}

export { initTranslations } 