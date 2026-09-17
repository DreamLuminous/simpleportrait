# v0.2.2 GitHub / Gitee 更新指南

本指南对应 SimplePortrait 简照 v0.2.2。

## 目录约定

- 完整版本备份：`E:\证件照\ProjectGit\V0.2.2`
- 分类阶段成果：`E:\AllCode\GitHub\Project\V0.2.2`
- GitHub 工作仓库：`E:\AllCode\GitHub\jianzhao\simpleportrait`

GitHub 工作仓库保留原有 `.git` 历史；备份目录与阶段成果目录不携带 Git 元数据。

## GitHub Desktop 更新

1. 在 GitHub Desktop 中选择 `simpleportrait`。
2. 使用 **Repository → Show in Explorer**，确认路径为 `E:\AllCode\GitHub\jianzhao\simpleportrait`。
3. 等待 Changes 列表加载。
4. 确认没有 `node_modules`、`out`、`.next`、`dist`、环境变量、个人照片和浏览器缓存。
5. Summary 填写：

```text
release: SimplePortrait v0.2.2
```

6. Description 可填写：

```text
Refine phone, portrait-tablet, landscape-tablet and desktop layouts; lock small screens to the guided workflow; keep the matting canvas visible and make the final step export-only.
```

7. 点击 **Commit to main**，随后点击 **Push origin**。
8. 在 GitHub 或 Gitee 创建标签：`v0.2.2`。
9. Release 标题使用：`SimplePortrait v0.2.2 · Web/PWA 设备分层适配修订版`。
10. Release 正文复制 `docs/RELEASE_NOTES_v0.2.2.md`。
11. 如需附加文件，可以上传阶段成果中的源码压缩包和部署压缩包。

## 上传前检查

- `package.json` 和 `package-lock.json` 版本均为 `0.2.2`。
- README、CHANGELOG 和技术文档顶部显示当前 v0.2.2。
- GitHub 工作仓库保留 `.git`，但不包含依赖、构建缓存、部署输出和本地备份。
- 不上传照片、身份证号、环境变量、数据库文件和本地历史数据。
- GitHub 与 Gitee 同时维护时使用相同标签和 Release 内容。

## 部署包对应关系

- Netlify：使用 `E:\AllCode\GitHub\Project\V0.2.2\Netlify上传`。
- 1Panel：使用 `E:\AllCode\GitHub\Project\V0.2.2\1Panel服务器\网站根目录`。
- 完整源码回退：使用 `E:\证件照\ProjectGit\V0.2.2`。
