# 公开仓库与个人数据

本仓库用于发布应用源码。正式训练数据、体重记录、访问密码和部署凭据保留在运行环境中，不随源码发布。

## 提交范围

- 可提交：源码、测试、空的 `data/.gitkeep`、不含真实值的 `.env.example`，以及使用默认或虚构数据制作的界面预览。
- 保留在运行环境：`.env` 及其环境变体、训练数据目录、导出的 JSON 备份、数据库、日志、SSH / TLS 私钥、云服务凭据。
- 示例中的 `test-only-password-12345` 仅供自动测试使用，不是部署密码，不能用于真实服务。
- `.gitignore` 和 `.dockerignore` 分别排除本地提交和容器构建上下文中的常见敏感文件。忽略规则不能移除已经进入 Git 历史的文件，也不能阻止强制添加。

提交前查看 `git diff --cached` 和 `git diff --cached --name-only`，确认只包含本次需要发布的文件。界面截图、错误日志和终端输出也应检查是否带有真实姓名、邮箱、训练或体重数据、地址及令牌。

## 部署时

使用 README 中的生产配置，设置独立随机的 `APP_PASSWORD`、实际允许的域名与 HTTPS。GitHub 仓库公开不代表应用中的个人数据需要公开。不要使用没有密码的本地开发配置直接提供公网服务。

需要通过 CI 注入部署凭据时，使用 GitHub Actions Secrets 或运行环境的秘密管理功能，不要把真实值写入工作流、源码、Dockerfile 或构建参数输出。

## Git 作者邮箱

本项目后续提交使用 GitHub 的 `noreply` 邮箱。其他开发者应为自己的克隆配置个人的 GitHub 隐私邮箱，不要复制别人的身份配置。

只修改本地 Git 配置不会改变已有提交的作者邮箱。清理已有提交涉及改写历史、改变提交编号，并需要协调其他克隆；改写后也不能保证已被复制或缓存的信息消失。

## 如果凭据被提交

先到凭据所属服务撤销或轮换密码、令牌或私钥，再处理仓库与历史。只删除当前文件、追加一条删除提交或把仓库改为私有，不能使已经公开的凭据重新保密。不要在公开 Issue 中粘贴实际凭据或个人数据。

参考：[GitHub 的敏感数据清理说明](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)、[提交邮箱配置说明](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address)。
