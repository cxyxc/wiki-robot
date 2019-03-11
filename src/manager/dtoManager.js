const {writeFile, writeJSONFile} = require('../util/writeFile');
const transTableToJSON = require('../util/transTableToJSON');
const log = require('../util/log');
const genarateSwaggerItem = require('../util/genarateSwaggerItem');
const boManager = require('../manager/boManager');
const transformToLowerCase = require('../util/transformToLowerCase');
const YAML = require('json-to-pretty-yaml');

function getBoString(keyItems) {
	return keyItems.find(item => item === '所属实体' || item === '实体名称');
}

// 分析表头中是否包含实体标识并返回实体名
function genarateBoKeys(data) {
	if(!data || !data[0]) return [false];
	const key = getBoString(Object.keys(data[0]));
	if(!data[0][key]) return [false];
	let lastBoName = null;
	return [true, data.map(item => {
		if(item[key]) {
			lastBoName = item[key];
			return item;
		}
		return {
			...item,
			[key]: lastBoName
		};
	})];
}

const defaultType = {
	SCHEMA: data => {
		const result = {};
		data.forEach(item => {
			const key = transformToLowerCase(item.代码名称 || item.属性名称);
			result[key] = {
				...genarateSwaggerItem(item),
				description: `${item.属性名称}`
			};
		});
		return YAML.stringify(result);
	},
};

class DtoManager {
	constructor() {
		this.data = {};
	}
	set(key, data) {
		this.data[key] = data;
	}
	get(key) {
		return this.data[key];
	}
	log() {
		writeJSONFile(this.data, 'DtoManager.json');
	}
	print(typeList, printType, outputPath) {
		const types = {
			...defaultType,
			...typeList
		};
		const list = [];
		for(let key in this.data) {
			list.push(
				this.data[key]
			);
		}
		writeFile(list.map(types[printType]).join('\n'), outputPath);
	}
	has(key) {
		return Boolean(this.data[key]);
	}
	async getDataFromBowerPage(page, url) {
		if(this.has(url)) return this.get(url);

		try {
			if(page.url() !== url) {
				log.info('正在读取：', decodeURI(url));
				await page.goto(url);
				await page.waitForSelector('.wikitable', {timeout: 5000});
			}
			const tableDatas = await page.$$eval('.wikitable', nodes => nodes.map(node => {
				node.querySelectorAll('a').forEach(a => {
					a.innerHTML = a.href;
				});
				return node.outerHTML;
			}));
			const jsonDatas = tableDatas.map(data => transTableToJSON(data));
			// 实体数据填充
			for(let i = 0;i < jsonDatas.length;i++) {
				const tmpData = jsonDatas[i];
				const [isBo, data] = genarateBoKeys(tmpData); // 判断数据中是否包含 BO key
				if(!isBo) continue;
				const result = [];
				for(let j = 0;j < data.length;j++) {
					const item = data[j];
					const boUrl = item[getBoString(Object.keys(item))];
					const bo = await boManager.getDataFromBowerPage(page, boUrl);
					const prop = bo.content.find(b => b.属性名称 === item.属性名称);
					result.push(Object.assign({}, prop, item));
				}
				dtoManager.set(`Untitled${i}`, result);
			}
		} catch (error) {
			log.error(error);
		}
		return this.get(url);
	}
}

const dtoManager = new DtoManager();

module.exports = dtoManager;
