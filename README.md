# 电子厨房 iPad 本地版使用说明

这是一个网页形式的小 App。它不需要微信、不需要服务器数据库，菜品、图片和打卡记录都保存在当前 iPad 的 Safari 本地数据里。

## 先说结论

iPad 不能像电脑一样直接把一个文件夹“安装成程序”。正确做法是：

1. 把 `ipad-local` 这个网页文件夹放到一个能访问的网址上。
2. 用 iPad 的 Safari 打开这个网址。
3. 点 Safari 分享按钮。
4. 选择“添加到主屏幕”。
5. 以后从主屏幕打开“电子厨房”。

## 需要部署哪些文件

必须保留并部署整个 `ipad-local` 文件夹里的这些文件：

```text
ipad-local/index.html
ipad-local/styles.css
ipad-local/app.js
ipad-local/manifest.webmanifest
ipad-local/service-worker.js
ipad-local/assets/icon.svg
```

这些文件要放在同一个目录结构里，不要只上传 `index.html`。

可选文件：

```text
ipad-local/README.md
ipad-local/preview.png
```

它们只是说明和预览图，不影响电子菜单运行。

## 方式一：在电脑上临时预览

适合先试用，不适合长期放在 iPad 上。

在电脑终端运行：

```bash
cd "/Users/linfeng/Desktop/Coding/App Menu"
python3 -m http.server 4173
```

电脑浏览器打开：

```text
http://localhost:4173/ipad-local/
```

如果 iPad 和电脑在同一个 Wi-Fi 下，也可以用 iPad 打开：

```text
http://电脑局域网IP:4173/ipad-local/
```

例如：

```text
http://192.168.1.23:4173/ipad-local/
```

注意：这种方式要求电脑一直开着，终端里的服务器也要一直运行。电脑关了，iPad 就打不开。

## 方式二：长期使用，推荐

把 `ipad-local` 文件夹部署到免费的静态网站服务，比如：

- GitHub Pages
- Cloudflare Pages
- 自己家里的 NAS 网页目录

部署完成后你会得到一个网址，比如：

```text
https://你的域名/electronic-kitchen/
```

然后在 iPad 上：

1. 打开 Safari。
2. 输入这个网址。
3. 确认页面能正常显示“电子厨房”。
4. 点 Safari 顶部或底部的分享按钮。
5. 选择“添加到主屏幕”。
6. 名称填“电子厨房”。
7. 点“添加”。

之后 iPad 主屏幕上会出现一个“电子厨房”图标，点它就能启动。

## 方式三：完全复制到 iPad 文件 App，不推荐

不建议把 `index.html` 直接放到 iPad 的“文件”App 里打开。

原因是：

- 图片和脚本路径可能受限制。
- 离线缓存可能无法正常工作。
- “添加到主屏幕”的体验不好。
- 本地数据保存可能不稳定。

所以更推荐“放到一个网址上，再用 Safari 添加到主屏幕”。

## 日常怎么用

打开“电子厨房”后：

1. 点“新增菜品”。
2. 填菜名。
3. 选择菜品图片。
4. 填主要食材。
5. 选择适合早餐、午餐还是晚餐。
6. 点保存。
7. 回到菜单页，点“记为早餐 / 午餐 / 晚餐”完成打卡。
8. 在“打卡记录”里按日期查看当天吃了什么。

## 数据保存在哪里

数据保存在当前 iPad 的 Safari 本地数据库里，跟你打开的那个网址绑定。

也就是说：

- 同一台 iPad、同一个网址：能看到原来的数据。
- 换了网址：可能看不到原来的数据。
- 换了设备：不一定自动带过去。
- 清除 Safari 网站数据：可能会清掉电子厨房数据。

## 换设备前怎么做

换 iPad 或 iPhone 前，一定要先：

1. 打开电子厨房。
2. 点“导出备份”。
3. 保存生成的 JSON 文件。
4. 在新设备上打开电子厨房。
5. 点“导入备份”。
6. 选择刚才导出的 JSON 文件。

不要只依赖苹果设备迁移。它可能会带过去，也可能不会完整带过去，本地网页数据库不适合作为唯一备份。
