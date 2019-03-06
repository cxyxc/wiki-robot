const {writeJSONFile} = require('../util/writeFile');
const tabletojson = require('tabletojson');
const log = global.console.log;

class BoManager {
	constructor() {
		this.data = {};
	}
	set(url, data) {
		this.data[url] = data;
	}
	get(url) {
		return this.data[url];
	}
	print() {
		writeJSONFile(this.data, 'BoManager.json');
	}
	has(url) {
		return Boolean(this.data[url]);
	}
	async getDataFromBowerPage(page, url) {
		if(this.has(url)) return this.get(url);
		// 跳转至 Bp 页面
		await page.goto(url);
		await page.waitFor(1000);

		// 获取数据
		try {
			const boFirstHeading = await page.$eval('#firstHeading', node => node.innerHTML);
			const [desc, name] = boFirstHeading.split('-').map(item => item.trim());
			const boTableData = await page.$eval('.wikitable', node => node.outerHTML.replace(/[\r\n]/g, ''));
			const boJsonData = tabletojson.convert(boTableData)[0];
			const boData = {
				name,
				desc,
				content: boJsonData
			};
			this.set(url, boData);
		} catch (error) {
			log(error, `未找到 Bo:${url}`);
			this.set(url, {});
		}
		return this.get(url); 
	}
}

const boManager = new BoManager();

module.exports = boManager;
