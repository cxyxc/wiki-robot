const puppeteer = require('puppeteer');
const dtoManager = require('./managers/DtoManager');
const boManager = require('./managers/BoManager');
const transTableToJSON = require('./utils/transTableToJSON');
const login = require('./utils/login');

// 分析表头中是否包含实体标识并返回实体名
function getBoKey(data) {
    const keyItems = Object.keys(data[0]);
    const key = keyItems.find(item => item === '所属实体' || item === '实体名称')
    return data[0][key];
}

puppeteer.launch().then(async browser => {
    const page = await browser.newPage();
    await login(page);

    const url = 'https://wiki.sdtdev.net/EXEED:质量反馈管理';
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
            await boManager.getBowerPage(page, key);
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
