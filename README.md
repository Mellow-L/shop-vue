# 在线购物系统 - 前端部署指南

本项目是一个基于 Vue 3 和 Vite 构建的在线购物系统前端界面。

## 部署步骤

### 1. 安装依赖

确保您的开发环境中已安装 Node.js (推荐 LTS 版本) 和 pnpm。

在项目根目录下运行以下命令安装项目所需的依赖包：

```bash
pnpm install
```

### 2. 构建项目

运行以下命令来构建生产环境的前端静态文件：

```bash
pnpm run build
```

此命令会在项目根目录下生成一个 `dist` 文件夹，其中包含了优化后的 HTML, CSS, 和 JavaScript 文件。

### 3. 部署静态文件

将 `dist` 文件夹中的 **所有内容** 上传到您的静态文件服务器或托管平台（例如 Nginx, Apache, Vercel, Netlify, GitHub Pages 等）。

**配置示例 (Nginx):**

如果使用 Nginx，您需要配置服务器以正确处理单页应用 (SPA) 的路由。以下是一个简单的 Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name yourdomain.com; # 替换为您的域名或 IP 地址

    # 指向 dist 文件夹的路径
    root /path/to/your/project/dist; 
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 可选：配置 Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript application/x-javascript text/xml application/xml application/xml+rss text/javascript;

    # 可选：配置缓存
    location ~* \.(?:css|js)$ {
        expires 1y;
        add_header Cache-Control "public";
    }
    location ~* \.(?:jpg|jpeg|gif|png|ico|cur|gz|svg|svgz|mp4|ogg|ogv|webm|htc)$ {
        expires 1M;
        add_header Cache-Control "public";
    }
}
```

请根据您的实际服务器环境和需求调整配置。

### 4. 访问应用

完成部署后，您可以通过配置的域名或服务器 IP 地址访问在线购物系统的前端界面。
