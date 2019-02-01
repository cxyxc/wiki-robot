const puppeteer = require('puppeteer');
const boManager = require('./managers/BoManager');
const {writeYAMLFile, genarateSwaggerItem, firstWordToLowerCase} = require('./utils');
const login = require('./utils/login');
const BO_LIST = ['索赔申请单', '经销商', '人员信息'];
const YAML = require('json-to-pretty-yaml');

puppeteer.launch().then(async browser => {
    const page = await browser.newPage();
    await login(page);
    
    for(let i = 0;i < BO_LIST.length;i++)
        await boManager.getBowerPage(page, BO_LIST[i]);
    
    const data = {};    
    for(let key in boManager.data) {
        const properties = {};
        boManager.data[key].forEach(item => {
            const key = firstWordToLowerCase(item.代码名称);
            properties[key] = {
                ...genarateSwaggerItem(item),
                description: `${item.属性名称}`
            };
        });
        data[key] = {
            description: key,
            type: "object",
            required: "",
            properties
        }
    }

    writeYAMLFile(YAML.stringify(data));

    await browser.close();
});
