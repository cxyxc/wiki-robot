# wiki-robot

wiki-robot 是一个针对 wiki 文档的爬虫工具

## 安装
`npm i git+https://gitlab.sdtdev.net/rd/tools/wiki-robot.git#develop -g`

## 登陆
`wiki-robot init 用户名 密码`

## 获取某业务领域所有相关枚举值

抓取 https://wiki.sdtdev.net/SDT:EXEED设计交付 中已经交付的节点相关所有枚举值

### 前端
`wiki-robot allEnums C ./Enums.js DCS系统功能 整车业务`

### 后端
`wiki-robot allEnums S ./Enums.cs DCS系统功能 整车业务`

