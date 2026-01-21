![cassian-florin-blog-banner](/public/static/images/twitter-card.png)

# Cassian Florin · Java Developer & Tech Blog

[![Website](https://img.shields.io/website?url=https%3A%2F%2Fcassianflorin.com)](https://cassianflorin.com)
[![GitHub](https://img.shields.io/github/stars/CassianFlorin/cassian-next-blog?style=social)](https://github.com/CassianFlorin/cassian-next-blog)
[![Twitter Follow](https://img.shields.io/twitter/follow/cassianflorin?style=social)](https://x.com/cassianflorin)

A personal tech blog focusing on Java development, backend engineering, system design, and AI productivity tools.

**Live Site**: [https://cassianflorin.com](https://cassianflorin.com)

## 👨‍💻 About

Hi, I'm Cassian Florin, a Java backend developer sharing practical engineering experience, system design insights, and AI-powered productivity workflows.

This blog is built with Next.js, Tailwind CSS, and MDX, providing a modern and performant platform for technical writing.

## 🎯 Blog Focus

- **Java Development**: Spring Boot, microservices, best practices
- **Backend Engineering**: System architecture, API design, database optimization
- **Developer Tools**: Git workflows, development environment setup
- **AI Productivity**: Cursor, MCP, AI-assisted development
- **Technical Writing**: Documentation, code examples, tutorials

## ✨ Features

This blog is based on the [Tailwind Nextjs Starter Blog](https://github.com/timlrx/tailwind-nextjs-starter-blog) template with custom enhancements:

### Core Features

- ⚡ **Next.js 14** with App Router and TypeScript
- 🎨 **Tailwind CSS 3.0** for styling
- 📝 **MDX** - Write JSX in markdown documents
- 🔍 **SEO Optimized** - Comprehensive SEO configuration with structured data
- 📱 **Mobile-Friendly** - Responsive design
- 🌓 **Dark Mode** - Light and dark theme support
- 🚀 **Performance** - Near perfect Lighthouse score
- 📊 **Analytics** - Umami analytics integration
- 💬 **Comments** - Giscus comments system
- 🔎 **Search** - Kbar command palette search

### Content Features

- 📚 **Contentlayer** - Type-safe content management
- 🎯 **Tags System** - Organized content by topics
- 👥 **Multi-Author** - Support for multiple authors
- 🖼️ **Image Optimization** - Automatic image optimization
- 💻 **Syntax Highlighting** - Beautiful code blocks with Prism
- 📐 **Math Support** - KaTeX for mathematical expressions
- 🔗 **Internal Linking** - Easy cross-referencing between posts

### Custom Components

- `<Callout>` - Highlighted information boxes
- `<ErrorDisplay>` - Formatted error messages
- `<StepProgress>` - Step-by-step guides
- `<EnvironmentComparison>` - Environment configuration comparisons

### SEO Enhancements

- ✅ Optimized meta tags (title, description, keywords)
- ✅ Structured data (BlogPosting Schema)
- ✅ Automatic sitemap generation
- ✅ Robots.txt configuration
- ✅ Open Graph and Twitter Card support
- ✅ Canonical URLs
- ✅ RSS feed

## 📁 Project Structure

```
cassian-next-blog/
├── app/                    # Next.js app directory
│   ├── [locale]/          # Internationalization support
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   ├── seo.tsx            # SEO utilities
│   ├── sitemap.ts         # Sitemap generation
│   └── robots.ts          # Robots.txt generation
├── components/            # React components
│   ├── MDXComponents.tsx  # Custom MDX components
│   ├── Header.tsx         # Site header
│   ├── Footer.tsx         # Site footer
│   └── ...
├── data/                  # Content and configuration
│   ├── blog/             # Blog posts (MDX)
│   ├── authors/          # Author profiles
│   ├── siteMetadata.js   # Site configuration
│   └── headerNavLinks.ts # Navigation links
├── docs/                  # Documentation
│   ├── SEO-GUIDE.md      # SEO optimization guide
│   ├── article-template.md # Article creation template
│   └── adsense-setup.md  # AdSense setup guide
├── layouts/              # Page layouts
│   ├── PostLayout.tsx    # Default post layout
│   ├── PostSimple.tsx    # Simple post layout
│   └── PostBanner.tsx    # Banner post layout
├── public/               # Static assets
│   └── static/
│       ├── images/       # Blog images
│       └── favicons/     # Site icons
├── contentlayer.config.ts # Contentlayer configuration
├── next.config.js        # Next.js configuration
└── tailwind.config.js    # Tailwind configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Yarn or npm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/CassianFlorin/cassian-next-blog.git
cd cassian-next-blog
```

2. Install dependencies:

```bash
yarn install
# or
npm install
```

3. Run the development server:

```bash
yarn dev
# or
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Writing Blog Posts

### Create a New Post

1. Create a new `.mdx` file in `data/blog/`:

```bash
data/blog/20250121-your-post-title.mdx
```

2. Add frontmatter (see [article-template.md](docs/article-template.md) for details):

```yaml
---
title: 'Your Post Title | Main Keyword'
date: '2025-01-21 10:00:00'
tags: ['Java', 'Backend', 'Tutorial']
draft: false
summary: '150-160 character description with keywords for SEO.'
---
```

3. Write your content using Markdown and MDX.

4. Preview locally and publish.

### SEO Best Practices

For SEO-optimized content creation, refer to:

- [SEO Guide](docs/SEO-GUIDE.md) - Comprehensive SEO optimization guide
- [Article Template](docs/article-template.md) - Template with SEO checklist

## 🎨 Customization

### Site Configuration

Edit `data/siteMetadata.js`:

```javascript
const siteMetadata = {
  title: 'Your Blog Title',
  author: 'Your Name',
  description: 'Your blog description',
  siteUrl: 'https://yourdomain.com',
  // ... more settings
};
```

### Navigation

Edit `data/headerNavLinks.ts`:

```typescript
const headerNavLinks = [
  { href: '/', title: 'Home' },
  { href: '/blog', title: 'Blog' },
  { href: '/tags', title: 'Tags' },
  { href: '/projects', title: 'Projects' },
  { href: '/about', title: 'About' },
];
```

### Styling

- `tailwind.config.js` - Tailwind configuration
- `css/tailwind.css` - Global styles
- `css/prism.css` - Code block styles

## 📊 Analytics & Monitoring

### Umami Analytics

Configure in `data/siteMetadata.js`:

```javascript
analytics: {
  umamiAnalytics: {
    umamiWebsiteId: process.env.NEXT_UMAMI_ID,
  },
}
```

### Google AdSense

See [AdSense Setup Guide](docs/adsense-setup.md) for configuration details.

## 🔧 Development

### Available Scripts

```bash
# Development
yarn dev              # Start dev server
yarn build            # Build for production
yarn start            # Start production server

# Linting & Formatting
yarn lint             # Run ESLint
yarn format           # Format with Prettier

# Content
yarn contentlayer     # Generate content types
```

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_UMAMI_ID=your-umami-id
NEXT_PUBLIC_GISCUS_REPO=your-repo
NEXT_PUBLIC_GISCUS_REPOSITORY_ID=your-repo-id
NEXT_PUBLIC_GISCUS_CATEGORY=your-category
NEXT_PUBLIC_GISCUS_CATEGORY_ID=your-category-id
```

## 📦 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/CassianFlorin/cassian-next-blog)

### GitHub Pages

A [`pages.yml`](.github/workflows/pages.yml) workflow is provided for GitHub Pages deployment.

### Other Platforms

See [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for other platforms.

## 📚 Documentation

- [SEO Optimization Guide](docs/SEO-GUIDE.md) - Complete SEO implementation guide
- [Article Template](docs/article-template.md) - Template for creating new posts
- [AdSense Setup](docs/adsense-setup.md) - Google AdSense configuration
- [FAQ](faq/) - Frequently asked questions

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Content**: [Contentlayer](https://contentlayer.dev/)
- **Markdown**: [MDX](https://mdxjs.com/)
- **Analytics**: [Umami](https://umami.is/)
- **Comments**: [Giscus](https://giscus.app/)
- **Search**: [Kbar](https://kbar.vercel.app/)
- **Deployment**: [Vercel](https://vercel.com/)

## 📝 License

[MIT](LICENSE) © [Cassian Florin](https://cassianflorin.com)

Based on [Tailwind Nextjs Starter Blog](https://github.com/timlrx/tailwind-nextjs-starter-blog) by [Timothy Lin](https://www.timlrx.com)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Contact

- **Website**: [cassianflorin.com](https://cassianflorin.com)
- **Email**: flowercard591@gmail.com
- **GitHub**: [@CassianFlorin](https://github.com/CassianFlorin)
- **Twitter**: [@cassianflorin](https://x.com/cassianflorin)

## 🙏 Acknowledgments

- [Tailwind Nextjs Starter Blog](https://github.com/timlrx/tailwind-nextjs-starter-blog) - Original template
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Contentlayer](https://contentlayer.dev/) - Content management

---

**Built with ❤️ by Cassian Florin**
