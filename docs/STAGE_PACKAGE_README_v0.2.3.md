# SimplePortrait 简照 v0.2.3 阶段成果

本阶段目录只保存当前可直接部署或用于发布说明的成果，完整源码另行备份。

本目录已合并 v0.2.3 首轮文件安全/导出修订与后续手机、平板响应式精修；1Panel 压缩包、GitHub 发布资料和完整备份对应同一份最终源码。

## 目录分类

- `1Panel服务器/网站根目录`：将其中全部内容复制到 1Panel 静态网站根目录。
- `1Panel服务器/SimplePortrait-v0.2.3-1Panel.zip`：1Panel 网站根目录压缩包。
- `1Panel服务器/部署说明.md`：1Panel/OpenResty 更新步骤。
- `1Panel服务器/nginx-simpleportrait.conf.example`：静态子页面路由和缓存配置参考。
- `GitHub发布资料`：Release 正文、GitHub Desktop 更新指南、技术文档和在线部署状态。

## 本轮未生成

- 不生成 `Netlify上传` 目录。
- Netlify 暂停更新。
- GitHub 项目网页/在线预览暂时冻结在 v0.2.2。
- GitHub 仓库源码可以由维护者通过 GitHub Desktop 更新到 v0.2.3。

## 对应位置

- 完整版本备份：`E:\证件照\ProjectGit\V0.2.3`
- GitHub 工作仓库：`E:\AllCode\GitHub\jianzhao\simpleportrait`
- 分类阶段成果：`E:\AllCode\GitHub\Project\V0.2.3`

## 发布前验证

- 核心算法测试通过。
- 390 px 手机、744/834 px 竖屏平板、1112 px 横屏平板和 1440 px 电脑浏览器回归通过。
- 手机第 2—4 步画布等高、第三步直达抠图、第四步直达导出、锁定按钮外置和小平板顶部栏无重叠检查通过。
- KB/MB、上传上限、区间顺序和画布安全限制通过。
- 静态生产构建通过。
- 1Panel 网站根目录不包含源码、依赖、缓存、测试照片和环境变量。
