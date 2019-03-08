const {writeFile, writeJSONFile} = require('../util/writeFile');
const tabletojson = require('tabletojson');
const log = require('../util/log');

function generateMaxLength(type) {
	if(type.includes(('String'))) {
		const result = /[0-9]+/.exec(type);
		return `\t\t[MaxLength(EntityDefault.FieldsLength${result && result[0]})]\n`;
	}
	return '';
}

function generateType(type) {
	if(type.includes(('String'))) {
		return 'string';
	}
	if(type === 'DateTime')	return type;
	if(type === 'Integer') return 'int';
	return type;
}

const defaultType = {
	S: item => `
namespace XXX {
	[Table("${item.name}")]
	public class ${item.name} : Entity<string> {
${item.content.map(c => {
		const isRequired = c.不可为空 === '✔' ? '\t\t[Required]\n' : '';
		const maxLangth = generateMaxLength(c.数据类型);
		const type = generateType(c.数据类型);
		const note = `\t\t// ${c.属性名称}${c.$link ? ' ' + decodeURI(c.$link) : ''}\n`;
		return `${isRequired}${maxLangth}${note}\t\tpublic ${type}${isRequired ? '' : '?'} ${c.代码名称} { get; set; }`;
	}).join('\n\n')}
	}
}`.trim(),
	CSV: item => `
${item.content.map(c => {
		let type = c.数据类型;
		if(/^http/.test(type)) type = c.数据类型.split('').slice(-1)[0];
		return `${item.desc},${item.name},${c.属性名称},${c.代码名称},${type}\n`.trim();
	})}`.trim()
};

class BoManager {
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
		writeJSONFile(this.data, 'BoManager.json');
	}
	print(printType = 'S', outputPath) {
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
				await page.waitForSelector('.firstHeading', {timeout: 5000});
				await page.waitForSelector('.wikitable', {timeout: 5000});
			}
			const firstHeading = await page.$eval('#firstHeading', node => node.innerHTML);
			const [desc, name] = firstHeading.split('-').map(item => item.trim());
			const tableData = await page.$eval('.wikitable', node => {
				node.querySelectorAll('a').forEach(a => {
					a.innerHTML = a.href;
				});
				return node.outerHTML;
			});
			const jsonData = tabletojson.convert(tableData)[0];
			const data = {
				name,
				desc,
				content: jsonData
			};
			this.set(url, data);
		} catch (error) {
			log.error(error, `未找到：${decodeURI(url)}。请确认其是否存在。`);
			this.set(url, {});
		}
		return this.get(url);
	}
	async generateLinks(page) {
		// TODO: 此处应与 EnumManager 建立关联，以实现缓存，暂简化处理
		const cache = {};
		// 处理 BO 中的关联值（可能是枚举或者另一个 BO）
		for(let key in this.data) {
			const content = this.data[key].content;
			for(let i = 0;i < content.length;i++) {
				if(/^http/.test(content[i].数据类型)) {
					const url = content[i].数据类型;
					let desc, name = '';
					if(cache[url]) {
						desc = cache[url].desc;
						name = cache[url].name;
					} else {
						log.info('正在读取关联值：', decodeURI(url));
						await page.goto(url);
						await page.waitForSelector('.firstHeading', {timeout: 5000});
						await page.waitForSelector('.wikitable', {timeout: 5000});
						const firstHeading = await page.$eval('#firstHeading', node => node.innerHTML);
						const result = firstHeading.split('-').map(item => item.trim());
						desc = result[0];
						name = result[1];
						cache[url] = {
							desc,
							name
						};
					}
					content[i].$link = content[i].数据类型;
					content[i].$linkDesc = desc;
					content[i].数据类型 = name;
					content[i].$linkName = name;
				}
			}
		}
	}
}

const boManager = new BoManager();

module.exports = boManager;
