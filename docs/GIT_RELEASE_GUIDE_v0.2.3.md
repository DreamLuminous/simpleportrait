# v0.2.3 GitHub Desktop 更新指南

本指南对应 SimplePortrait 简照 v0.2.3。文件安全/导出修订和后续手机/平板精细适配已经合并为同一个版本、同一次 GitHub Desktop 提交。本轮只准备 GitHub 工作副本，不由自动化流程提交、推送、创建 Tag 或发布 Release。

## 目录约定

- 完整版本备份：`E:\证件照\ProjectGit\V0.2.3`
- 分类阶段成果：`E:\AllCode\GitHub\Project\V0.2.3`
- GitHub Desktop 工作仓库：`E:\AllCode\GitHub\jianzhao\simpleportrait`

GitHub 工作仓库保留原有 `.git` 历史；备份目录和阶段成果目录不携带 Git 元数据。

## GitHub Desktop 提交

1. 打开 GitHub Desktop。
2. 选择仓库 `simpleportrait`。
3. 使用 **Repository → Show in Explorer**，确认路径为 `E:\AllCode\GitHub\jianzhao\simpleportrait`。
4. 等待 Changes 列表加载。
5. 检查没有 `node_modules`、`out`、`.next`、`dist`、环境变量、个人照片、构建缓存和版本备份。
6. Summary 建议填写：

```text
release: SimplePortrait v0.2.3
```

7. Description 建议填写：

```text
Merge safe KB/MB ranges, upload and canvas limits, guided export fixes, equal-height mobile canvases, external canvas locking, and refined portrait-tablet layouts.
```

8. 由维护者本人点击 **Commit to main**，确认无误后再点击 **Push origin**。
9. 如需创建版本标签，使用 `v0.2.3`。
10. Release 标题使用 `SimplePortrait v0.2.3 · 文件安全与多端导出修订版`。
11. Release 正文复制 `docs/RELEASE_NOTES_v0.2.3.md`。

## 在线页面冻结说明

- GitHub 仓库源码更新到 v0.2.3。
- GitHub 项目网页/在线预览暂时保留 v0.2.2，不在本轮更新。
- Netlify 暂停更新，本轮没有 `Netlify上传` 目录。
- 当前需要部署 v0.2.3 时，使用 1Panel 阶段成果。

## 上传前检查

- `package.json` 和 `package-lock.json` 均为 `0.2.3`。
- README、CHANGELOG、技术文档和 v0.2.3 发布说明内容一致。
- Changes 中应同时包含 v0.2.3 首轮功能修订和本次多端精细适配；不要拆成第二个版本号。
- GitHub 工作仓库保留 `.git`，但没有复制构建输出和备份目录。
- 不上传照片、身份证号、环境变量、数据库文件、访问日志和服务器证书。
- GitHub Desktop 应显示未提交变更；确认后由维护者本人提交。

## 部署包对应关系

- 1Panel：`E:\AllCode\GitHub\Project\V0.2.3\1Panel服务器\网站根目录`
- 1Panel 压缩包：`E:\AllCode\GitHub\Project\V0.2.3\1Panel服务器\SimplePortrait-v0.2.3-1Panel.zip`
- 完整源码回退：`E:\证件照\ProjectGit\V0.2.3`
- Netlify：本轮不生成，现有在线版本保持 v0.2.2。
