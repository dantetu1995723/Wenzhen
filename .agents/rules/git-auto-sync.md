---
trigger: always_on
---

# 自动同步 GitHub 规范 (Auto Git Sync)

每当完成本项目的代码修改、界面调整或文件更新后，必须自动将改动提交并推送到 GitHub 远端仓库：
1. 检查 `git status` 确认变更内容。
2. 执行 `git add` 暂存相关修改文件。
3. 执行 `git commit -m "<清晰的提交信息>"` 提交变更。
4. 执行 `git push` 同步至远端（`origin/main`），确保同事通过 GitHub 链接访问时能看到最新界面。
