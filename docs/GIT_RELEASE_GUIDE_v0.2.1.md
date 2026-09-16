# v0.2.1 GitHub / Gitee 更新指南

本指南对应 SimplePortrait 简照 v0.2.1。

## 目录约定

- 完整版本备份：`E:\证件照\ProjectGit\V0.2.1`
- 分类阶段成果：`E:\AllCode\GitHub\Project\V0.2.1`
- GitHub 工作仓库：`E:\AllCode\GitHub\jianzhao\simpleportrait`

GitHub 工作仓库保留原有 `.git` 历史；备份目录与阶段成果目录不携带 Git 元数据。

## GitHub Desktop 更新

1. 在 GitHub Desktop 中选择 `simpleportrait`。
2. 使用 **Repository → Show in Explorer**，确认路径为 `E:\AllCode\GitHub\jianzhao\simpleportrait`。
3. 等待 Changes 列表加载并确认没有 `node_modules`、`out`、`.next`、`dist`、环境变量、个人照片和缓存文件。
4. Summary 填写：

```text
release: SimplePortrait v0.2.1
```

5. Description 可填写：

```text
Improve the landing page contrast and capability summary, fix mobile wizard overlap, and refine the tablet Professional workbench for v0.2.1.
```

6. 点击 **Commit to main**，随后点击 **Push origin**。
7. 在 GitHub 或 Gitee 创建标签和 Release：`v0.2.1`。
8. Release 正文直接复制 `docs/RELEASE_NOTES_v0.2.1.md`。

## 上传前检查

- `package.json` 和 `package-lock.json` 版本均为 `0.2.1`。
- README 与 CHANGELOG 顶部显示 `v0.2.1`。
- 不上传构建缓存、依赖目录、照片、身份证号、环境变量和本地历史数据。
- GitHub 与 Gitee 同时维护时使用相同标签和 Release 内容。