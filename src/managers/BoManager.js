const {writeJSONFile} = require('../utils');
const tabletojson = require('tabletojson');

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
    async getDataFromBowerPage(page, key) {
        if(!this.data.key) {
            // 跳转至实体页面
            const url = `https://wiki.sdtdev.net/EXEED:${key}`
            await page.goto(url);
            await page.waitFor(1000);
    
            // 获取实体数据
            const boTableData = await page.$eval('.wikitable', node => node.outerHTML.replace(/[\r\n]/g, ""));
            const boJsonData = tabletojson.convert(boTableData)[0];
            boManager.set(key, boJsonData);
        }
    }
}

const boManager = new BoManager();

module.exports = boManager;
