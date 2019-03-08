const {writeFile, writeJSONFile} = require('../util/writeFile');
const tabletojson = require('tabletojson');
const transformToLowerCase = require('../util/transformToLowerCase');
const log = require('../util/log');

const reg = /[^\u4e00-\u9fa5a-zA-Z0-9]/g; // 匹配所有标点符号

const defaultType = {
	C: item => `
// ${item.desc} ${item.url}
export const ${transformToLowerCase(item.name)} = Object.freeze({
	__proto__: Enum,
	${item.content.map(c => {
		if(reg.test(c.名称) || /[0-9]/.test(c.名称[0])) {
			reg.lastIndex = 0;
			return `'${c.名称}': ${c.数值}`;
		}
		return `${c.名称}: ${c.数值}`;
	}).join(',\n\t')},
	properties: Object.freeze({
		${item.content.map(c => `
		'${c.数值}': Object.freeze({
			__proto__: EnumItem,
			[CN]: '${c.名称}'
		})`.trim()).join(',\n\t\t')}
	})
});
`.trim(),
	S: item => `
// ${item.desc} ${item.url}
public enum ${item.name} {
	${item.content.map(c => {
		let rename = c.名称;
		if(reg.test(c.名称)) {
			reg.lastIndex = 0;
			rename = c.名称.replace(reg, '_');
		}
		if(/[0-9]/.test(c.名称[0]))
			rename = `_${rename}`;
		if(rename !== c.名称) return `[Display(Name = "${c.名称}")]\n\t${rename} = ${c.数值}`;
		return `${c.名称} = ${c.数值}`;
	}).join(',\n\t')}
};
`.trim(),
};

class EnumManager {
	constructor() {
		this.data = {};
	}
	set(url, data) {
		const key = decodeURI(url);
		this.data[key] = data;
	}
	get(url) {
		return this.data[url];
	}
	log() {
		writeJSONFile(this.data, 'EnumManager.json');
	}
	print(printType = 'C', outputPath) {
		const list = [];
		for(let url in this.data) {
			list.push({
				url,
				...this.data[url]
			});
		}
		writeFile(list.map(defaultType[printType]).join('\n'), outputPath);
	}
	has(url) {
		return Boolean(this.data[url]);
	}
	async getDataFromBowerPage(page, url) {
		if(this.has(url)) return this.get(url);

		try {
			if(page.url() !== url) {
				log.info('正在读取：', decodeURI(url));
				await page.goto(url);
				await page.waitForSelector('.firstHeading', {timeout: 3000});
				await page.waitForSelector('.wikitable', {timeout: 3000});
			}
			const firstHeading = await page.$eval('#firstHeading', node => node.innerHTML);
			const [desc, name] = firstHeading.split('-').map(item => item.trim());
			const tableData = await page.$eval('.wikitable', node => node.outerHTML.replace(/[\r\n]/g, ''));
			const jsonData = tabletojson.convert(tableData)[0];
			const data = {
				name,
				desc,
				content: jsonData
			};
			this.set(url, data);
		} catch (error) {
			log.info(error, `未找到：${decodeURI(url)}。请确认其是否存在。`);
			this.set(url, {});
		}
		return this.get(url); 
	}
}

const enumManager = new EnumManager();

module.exports = enumManager;
