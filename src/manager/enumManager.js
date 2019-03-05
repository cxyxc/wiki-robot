const {writeJSONFile} = require('../util/writeFile');
const tabletojson = require('tabletojson');
const log = require('loglevel');

class EnumManager {
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
		writeJSONFile(this.data, 'EnumManager.json');
	}
	has(url) {
		return Boolean(this.data[url]);
	}
	async getDataFromBowerPage(page, url) {
		if(this.has(url)) return this.get(url);
		// 如 page 不在当前 url 跳转至枚举页面
		if(page.url() !== url) {
			await page.goto(url);
			await page.waitFor(1000);
		}

		// 获取数据
		try {
			const enumFirstHeading = await page.$eval('#firstHeading', node => node.innerHTML);
			const [desc, name] = enumFirstHeading.split('-').map(item => item.trim());
			const enumTableData = await page.$eval('.wikitable', node => node.outerHTML.replace(/[\r\n]/g, ''));
			const enumJsonData = tabletojson.convert(enumTableData)[0];
			const enumData = {
				name,
				desc,
				content: enumJsonData
			};
			this.set(url, enumData);
		} catch (error) {
			log.error(error, `未找到 Enum:${decodeURI(url)}`);
			this.set(url, {});
		}
		return this.get(url); 
	}
}

const enumManager = new EnumManager();

module.exports = enumManager;
