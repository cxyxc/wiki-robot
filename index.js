const puppeteer = require('puppeteer');
const tabletojson = require('tabletojson');
const fs = require('fs');
const path = require('path');
const transTableToJSON = require('./utils/transTableToJSON');

const pageManager = {
    home: {
        url: null,
        tableDatas: [],
        data: {}
    },
}
class BoManager {
    constructor() {
        this.data = {};
        this.set = this.set.bind(this);
        this.get = this.get.bind(this);
    }
    set(key, data) {
        this.data[key] = data;
    }
    get(key) {
        return this.data[key];
    }
}
const boManager = new BoManager();

// 工具方法
// 将 JSON 字符串写入临时文件
function writeJSONFile(data) {
    fs.writeFile(path.join('./test', 'tmp.json'), JSON.stringify(data), () => {
        console.log('写入完成');
    });
}

puppeteer.launch().then(async browser => {
    const page = await browser.newPage();
    await page.goto('https://wiki.sdtdev.net/%E7%89%B9%E6%AE%8A:%E7%94%A8%E6%88%B7%E7%99%BB%E5%BD%95');
    const usernameInput = await page.$('#wpName1');
    const passwordInput = await page.$('#wpPassword1');
    const submitButton = await page.$('#wpLoginAttempt');
    await usernameInput.type('崔灿');
    await passwordInput.type('18764813705');
    await submitButton.click();
    await page.waitFor(1000);
    pageManager.home.url = 'https://wiki.sdtdev.net/EXEED:%E8%B4%A8%E9%87%8F%E5%8F%8D%E9%A6%88%E7%AE%A1%E7%90%86';
    await page.goto(pageManager.home.url);
    await page.waitFor(1000);

    // 已进入业务节点界面
    
    // 首页
    // 格式化所有表格数据
    const tableDatas = await page.$$eval('.wikitable', nodes => nodes.map(node => node.outerHTML));
    tableDatas.forEach((data, index) => {
        const jsonData = transTableToJSON(data);
        pageManager.home.tableDatas.push(jsonData);
    });
    
    // 实体数据填充
    for(let i = 0;i < pageManager.home.tableDatas.length;i++) {
        const data = pageManager.home.tableDatas[i];
        const keyItems = Object.keys(data[0]);
        if(keyItems.includes('所属实体')) {
            const key = data[0].所属实体;
            if(!boManager.get(key)) {
                // 说明当前表格数据需要查询实体，跳转至实体页面
                const url = `https://wiki.sdtdev.net/EXEED:${key}`
                await page.goto(url);
                await page.waitFor(1000);
        
                // 获取实体数据
                const boTableData = await page.$eval('.wikitable', node => node.outerHTML.replace(/[\r\n]/g, ""));
                const boJsonData = tabletojson.convert(boTableData)[0];
                boManager.set(key, boJsonData);
            }
            const bo = boManager.get(key);
            pageManager.home.data[`Untitled${i}`] = data.map(item => {
                const prop = bo.find(b => b.属性名称 === item.属性名称);
                return Object.assign({}, item, prop);
            });
        }
    }
    writeJSONFile(pageManager.home.data);

    // await page.screenshot({path: 'screenshot.png'});

    await browser.close();
});
