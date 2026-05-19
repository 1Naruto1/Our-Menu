# 电子厨房新版 PWA

这是新版 iPad / iPhone 本地电子菜单。它是纯前端 PWA，不需要微信、不需要服务器数据库。

## 当前版本

这一版使用：

- 顶部横向可爱背景图
- 使用可爱厨房 PNG 作为主屏幕 App 图标
- 早餐 / 午餐 / 晚餐图标切换
- 页面内标题可自定义
- 菜品图片区域加高，图片更容易看完整
- 每张菜只保留一个当前餐次打卡按钮
- 打卡时可添加五颗星评分和评论
- 菜品编辑按钮
- 可选择日期补打卡，例如前几天忘记记录时可以切到那一天再打卡
- 打卡记录可删除
- 本地 IndexedDB 保存菜品、图片和打卡记录
- JSON 导入 / 导出备份

## 需要上传到 GitHub 的文件

如果你想用这个新版替换 GitHub Pages 当前网页，请把 `electronic-kitchen-app` 文件夹里的内容上传到仓库根目录。

仓库根目录最终应该类似：

```text
assets/
app.js
index.html
manifest.webmanifest
README.md
service-worker.js
styles.css
```

`assets/` 里至少要有：

```text
icon.svg
kawaii-bg.png
home-badge.png
rabbit-spatula.png
tiger-chef.png
dinner-badge.png
```

不要只上传 `index.html`，也不要漏掉 `assets` 文件夹。

## GitHub 网页端更新方式

1. 打开你的 GitHub 仓库。
2. 删除或覆盖旧的这些文件：

```text
assets/
app.js
index.html
manifest.webmanifest
service-worker.js
styles.css
README.md
```

3. 点击 `Add file`。
4. 点击 `Upload files`。
5. 把 `electronic-kitchen-app` 文件夹里面的所有内容拖进去。
6. 页面底部点击 `Commit changes`。
7. 等 GitHub Pages 自动部署完成。

## iPhone / iPad 更新后看不到新界面怎么办

这是 PWA 缓存导致的。可以按顺序处理：

1. 等 GitHub Pages 部署完成。
2. Safari 打开你的 GitHub Pages 地址。
3. 在网址后面加版本参数，例如：

```text
?v=9
```

4. 还不更新的话，删除主屏幕上的旧“电子厨房”，再从 Safari 重新添加到主屏幕。

## 数据提醒

这个版本的数据仍然保存在当前设备本地。更新网页文件不会自动同步电脑和手机里的菜单数据。

换设备或重装前请先在电子厨房里点击“导出备份”。
