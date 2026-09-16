# Netlify 手动上传说明

对应版本：SimplePortrait 简照 v0.2.1

## 直接上传

将阶段成果目录中的整个 `Netlify上传` 文件夹拖入 Netlify Drop。该文件夹根目录已经包含 `index.html`，不需要再选择里面的子目录。

## Git 自动部署

如果改用 GitHub / Gitee 源码自动构建：

- Build command：`npm run build:netlify`
- Publish directory：`out`
- Node.js：22

项目根目录已经提供 `netlify.toml`。手动拖拽上传时，构建过程已提前完成，不需要在 Netlify 中再次执行 npm 命令。

## 更新检查

上传后至少检查：

- 首页、制作台、隐私页和三个图片工具可以打开。
- 直接刷新 `/id-photo/`、`/privacy/` 和 `/tools/` 不出现 404。
- 浏览器控制台没有静态资源 404。
- 手机浏览器底部“下一步”按钮没有被浏览器工具栏遮挡。
