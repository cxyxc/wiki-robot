const puppeteer = require('puppeteer');
const tabletojson = require('tabletojson');
const fs = require('fs');
const path = require('path');

const dataManager = {
    home: {
        url: null,
        tableDatas: [],
        data: {}
    },
    bo: {

    }
}

// 工具方法

// 将 JSON 字符串写入临时文件
function writeJSONFile(data) {
    fs.writeFile(path.join('./test', 'tmp.json'), JSON.stringify(data), () => {
        console.log('写入完成');
    });
}

// 将 table 字符串处理为标准格式（去除合并单元格带来的影响）
// function

puppeteer.launch().then(async browser => {
    const page = await browser.newPage();
    await page.goto('https://wiki.sdtdev.net/%E7%89%B9%E6%AE%8A:%E7%94%A8%E6%88%B7%E7%99%BB%E5%BD%95');
    const usernameInput = await page.$('#wpName1');
    const passwordInput = await page.$('#wpPassword1');
    const submitButton = await page.$('#wpLoginAttempt');
    await usernameInput.type('崔灿');
    await passwordInput.type('18764813705');
    await submitButton.click();
    await page.waitFor(2500);
    dataManager.home.url = 'https://wiki.sdtdev.net/EXEED:%E8%B4%A8%E9%87%8F%E5%8F%8D%E9%A6%88%E7%AE%A1%E7%90%86';
    await page.goto(dataManager.home.url);
    await page.waitFor(2500);

    // 已进入业务节点界面
    
    // 首页
    // 格式化所有表格数据
    const tableDatas = await page.$$eval('.wikitable', nodes => nodes.map(node => node.outerHTML.replace(/[\r\n]/g, "")));
    tableDatas.forEach((data, index) => {
        const jsonData = tabletojson.convert(data)[0];
        dataManager.home.tableDatas.push(jsonData);
    });
    
    // 实体数据填充
    for(let i = 0;i < dataManager.home.tableDatas.length;i++) {
        const data = dataManager.home.tableDatas[i];
        const keyItems = Object.keys(data[0]);
        if(keyItems.includes('所属实体')) {
            const key = data[0].所属实体;
            if(!dataManager.bo[key]) {
                // 说明当前表格数据需要查询实体，跳转至实体页面
                const url = `https://wiki.sdtdev.net/EXEED:${key}`
                await page.goto(url);
                await page.waitFor(2500);
        
                // 获取实体数据
                const boTableData = await page.$eval('.wikitable', node => node.outerHTML.replace(/[\r\n]/g, ""));
                const boJsonData = tabletojson.convert(boTableData)[0];
                dataManager.bo[key] = boJsonData;
            }
            const bo = dataManager.bo[key];
            const tmpData = [...data];
            tmpData.forEach(item => {
                const prop = bo.find(b => b.属性名称 === item.属性名称);
                item = Object.assign({}, item, prop);
            });
            dataManager.home.data[`Untitled${i}`] = tmpData;
        }
    }
    writeJSONFile(dataManager.home.data);

    // await page.screenshot({path: 'screenshot.png'});

    await browser.close();
});
