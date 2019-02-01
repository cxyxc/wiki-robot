const puppeteer = require('puppeteer');
const tabletojson = require('tabletojson');
const dtoManager = require('./managers/DtoManager');
const transTableToJSON = require('./utils/transTableToJSON');

const LOGIN_URL = 'https://wiki.sdtdev.net/%E7%89%B9%E6%AE%8A:%E7%94%A8%E6%88%B7%E7%99%BB%E5%BD%95';
const USERNAME = '崔灿';
const PASSWORD = '18764813705';

const fs = require('fs');
const path = require('path');

// 分析表头中是否包含实体标识并返回实体名
function getBoKey(data) {
    const keyItems = Object.keys(data[0]);
    const key = keyItems.find(item => item === '所属实体' || item === '实体名称')
    return data[0][key];
}


// 工具方法
// 将 JSON 字符串写入临时文件
function writeJSONFile(data) {
    fs.writeFile(path.join('./test', 'tmp.json'), JSON.stringify(data, null, 2), () => {
        console.log('写入完成');
    });
}

class BoManager {
    constructor() {
        this.data = {};
    }
    set(key, data) {
        this.data[key] = data;
    }
    get(key) {
        return this.data[key];
    }
    print() {
        writeJSONFile(this.data);
    }
}
const boManager = new BoManager();

puppeteer.launch().then(async browser => {
    const page = await browser.newPage();
    await page.goto(LOGIN_URL);
    const usernameInput = await page.$('#wpName1');
    const passwordInput = await page.$('#wpPassword1');
    const submitButton = await page.$('#wpLoginAttempt');
    await usernameInput.type(USERNAME);
    await passwordInput.type(PASSWORD);
    await submitButton.click();
    await page.waitFor(1000);
    const url = 'https://wiki.sdtdev.net/EXEED:%E7%B4%A2%E8%B5%94%E7%94%B3%E8%AF%B7%E5%8D%95';
    await page.goto(url);
    await page.waitFor(1000);

    // 已进入业务节点界面
    
    // 格式化所有表格数据
    const tableDatas = await page.$$eval('.wikitable', nodes => nodes.map(node => node.outerHTML));
    const jsonDatas = tableDatas.map(data => transTableToJSON(data));
    
    // 实体数据填充
    for(let i = 0;i < jsonDatas.length;i++) {
        const data = jsonDatas[i];
        const key = getBoKey(data); // 判断数据中是否包含 BO key
        if(key) {
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

            dtoManager.setOriginalData(`Untitled${i}`, data.map(item => {
                const prop = bo.find(b => b.属性名称 === item.属性名称);
                return Object.assign({}, prop, item);
            }));
        }
    }

    dtoManager.genarate();
    boManager.print();
    // await page.screenshot({path: 'screenshot.png'});

    await browser.close();
});
