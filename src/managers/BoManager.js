const {writeJSONFile} = require('../utils');
const tabletojson = require('tabletojson');
const {BASE_URL} = require('../config');

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
		if(!this.get(key)) {
			// 跳转至实体页面
			const url = `${BASE_URL}${key}`;
			await page.goto(url);
			await page.waitFor(1000);

			// 获取实体数据
			try {
				const boTableData = await page.$eval('.wikitable', node => node.outerHTML.replace(/[\r\n]/g, ''));
				const boJsonData = tabletojson.convert(boTableData)[0];
				boManager.set(key, boJsonData);
			} catch (error) {
				console.log(error, `未找到BO${key}`);
				boManager.set(key, {});
			}
		}
	}
}

const boManager = new BoManager();

module.exports = boManager;
