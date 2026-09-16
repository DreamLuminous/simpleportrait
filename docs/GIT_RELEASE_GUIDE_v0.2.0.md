# v0.2.0 GitHub / Gitee 更新指南

本指南对应 SimplePortrait 简照 v0.2.0。

## 目录约定

- 版本备份：`E:\证件照\ProjectGit\V0.2`
- 阶段成果：`E:\AllCode\GitHub\Project\V0.2`
- GitHub 工作仓库：`E:\AllCode\GitHub\jianzhao\simpleportrait`

其中 GitHub 工作仓库保留原有 `.git` 历史，其余两个目录不携带 Git 元数据。

## 使用 GitHub Desktop 更新

1. 打开 GitHub Desktop。
2. 当前仓库选择 `simpleportrait`。
3. 使用 **Repository → Show in Explorer**，确认目录是 `E:\AllCode\GitHub\jianzhao\simpleportrait`。
4. 返回 GitHub Desktop，等待 Changes 列表加载完成。
5. 检查列表中没有 `node_modules`、`out`、`.next`、`dist`、个人照片和本地环境变量。
6. Summary 填写：

```text
release: SimplePortrait v0.2.0
```

7. Description 可填写：

```text
Update the Web/PWA editor, mobile workflow, matting tools, privacy documentation, and v0.2.0 release notes.
```

8. 点击 **Commit to main**。
9. 点击 **Push origin**。
10. 在 GitHub 或 Gitee 仓库页面创建标签和 Release：`v0.2.0`。

## Release 正文

Release 页面可以直接复制 [v0.2.0 发布说明](RELEASE_NOTES_v0.2.0.md) 的内容。

## 上传前检查

- `package.json` 和 `package-lock.json` 的项目版本为 `0.2.0`。
- README 显示当前版本 `v0.2.0`。
- CHANGELOG 顶部有 `v0.2.0` 记录。
- 技术文档和验收清单已经更新到 v0.2.0。
- 联系邮箱与 Gitee 仓库地址正确。
- 不包含构建缓存、依赖目录、原图和本地历史。
- GitHub 与 Gitee 同时维护时，两个远端应使用相同标签和 Release 内容。
