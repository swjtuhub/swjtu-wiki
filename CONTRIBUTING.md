# SWJTU-Wiki 贡献指南

首先，感谢你愿意为 SWJTU-Wiki 贡献自己的一份力量！

本指南旨在引导你更规范地向 SWJTU-Wiki 提交贡献，请务必认真阅读。

## 提交 Issue

### 报告问题、故障与漏洞

SWJTU-Wiki 目前处于开发初期，如果你在使用过程中发现问题，欢迎提交 Issue。

### 建议功能

欢迎在 Issue 中提议要加入哪些新模块/功能。请仔细描述你的需求，尽量避免高度概括，可能的话可以提出你认为可行的解决方案。

## Pull Request

SWJTU-Wiki 使用 [VuePress](https://vuepress.vuejs.org/) 构建，使用 `yarn` 管理项目。

下面的命令能在已安装 [Node.js](https://nodejs.org/en/) 的情况下帮你快速配置开发环境。

```bash
# 安装依赖
yarn install
# 本地开发
yarn dev
```

之后 VuePress 会在 http://localhost:8080 启动一个热重载的开发服务器。

### Commit 规范

请确保每一个 commit 都能清晰地描述其功能，一个 commit 尽量只有一个功能。

SWJTU-Wiki 的 commit message 格式遵循 [gitmoji](https://gitmoji.dev/) 规范。

### 参与开发

若要修改项目构建代码，请确保你的代码风格和项目已有的代码保持一致。

若不熟悉前端开发，可只贡献相应的 Markdown 文件，由维护者负责其他内容。

## 工程结构

本项目资源存放在根目录 `docs` 文件夹中，以下为具体结构：

```
docs
├── .vuepress
│   ├── public
│   │   └── img (存放图片)
│   └── config.ts (VuePress配置)
├── @pages (特殊页面)
├── ... (分类文章)
├── ... (分类文章)
├── _content (目录)
└── index.md (主页)
```

## Git 分支

`master` 分支为 SWJTU-Wiki 的开发分支，在网站稳定运行后请不要直接修改 `master` 分支，而是创建一个目标分支为 `swjtu-wiki:master` 的 Pull Request 来提交修改。

`gh_pages` 分支为 GitHub Pages 运行仓库，请勿直接修改此分支。当 `master` 分支有新的 `push` 时，会通过 Actions 自动构建网站并提交 `gh_pages` 分支。

如果你不是 SWJTU-Wiki 团队的成员，可在 fork 本仓库后，向本仓库的 `master` 分支发起 Pull Request，注意遵循先前提到的 commit message 规范创建 commit 。我们将在 code review 通过后合并到主分支。
