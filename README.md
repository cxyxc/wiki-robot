# wiki-robot

wiki-robot 是一个针对 wiki 文档的爬虫工具

## 安装

`npm i git+https://gitlab.sdtdev.net/rd/tools/wiki-robot.git#develop -g`

注：将 develop 分支名调整为 tag 名可安装对应版本，如 0.1.0，develop 分支代码不稳定推荐使用 tag 安装。

## 登陆

登陆完成后用户名密码会被记录在本地，下次使用无需再次执行。

`wiki-robot init 用户名 密码`

## 获取某业务领域所有相关枚举值

抓取 https://wiki.sdtdev.net/SDT:EXEED设计交付 中已经交付的节点相关所有枚举值

```bash
wiki-robot allEnums [转化形式] [输出路径] [系统名称] [业务领域名称]

# 前端
wiki-robot allEnums C ./Enums.js DCS系统功能 整车业务
# 后端
wiki-robot allEnums S ./Enums.cs DCS系统功能 整车业务
```

## 获取某个BO

根据 url 获取 BO 并输出为指定格式代码

```bash
wiki-robot bo [转化形式] [输出路径] [系统名称] [业务领域名称]

# 后端
wiki-robot bo S ./BO.cs https://wiki.sdtdev.net/EXEED:质量反馈单
```