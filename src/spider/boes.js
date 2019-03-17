const results = require('./boes.json').results; // BO字典，从 wiki 中导出
const log = require('../util/log');
const puppeteer = require('puppeteer');
const tabletojson = require('tabletojson');
const login = require('../util/login');
const fetch = require('node-fetch');

function stringify(array) {
	if(!array || array.length === 0) return null;
	return `[
	${array.map(item => {
		const lines = [];
		for (let key in item) {
			const value = typeof item[key] === 'string' ? `"${item[key].replace(/"/g, '\\"')}"` : item[key];
			lines.push(`${key}: ${value}`);
		}
		return `{${lines.join(',')}}`;
	}).join(',')
}]`;
}

async function getDataFromBowerPage(page, enumOrigin) {
	const url = enumOrigin.fullurl;
	const fulltext = enumOrigin.fulltext;

	try {
		if (page.url() !== url) {
			log.info('正在读取：', decodeURI(url));
			await page.goto(url);
			await page.waitForSelector('.wikitable', {
				timeout: 3000
			});
			await page.waitForSelector('.modelbox', {
				timeout: 3000
			});
		}
		const firstHeading = await page.$eval('#firstHeading', node => node.innerHTML);
		const [desc, name] = firstHeading.split('-').map(item => item.trim());
		const tableData = await page.$eval('.wikitable', node => {
			node.querySelectorAll('a').forEach(a => {
				a.innerHTML = `URL${a.title}`;
			});
			return node.outerHTML;
		});
		const details = await page.$$eval('.modelbox caption a', nodes => {
			const list = [];
			nodes.forEach(a => {
				list.push(a.title);
			});
			return list;
		});
		const jsonData = tabletojson.convert(tableData)[0] || [];
		
		const content = jsonData.map(item => {
			let type = item.数据类型 || '';
			let wikiUrl = null;
			if(/^URL/.test(type)) {
				wikiUrl = type.replace('URL', '');
				type = null;
			}

			return ({
				name: item.代码名称,
				desc: item.属性名称	,
				type,
				wikiUrl,
				required: item.不可为空 === '✔',
				unique: item.是否唯一 === '✔',
				redundant: item.冗余属性 === '✔',
			});
		});

		const data = {
			wikiUrl: fulltext,
			name,
			desc,
			content,
			details
		};

		return data;
	} catch (error) {
		log.error(`未找到：${decodeURI(url)}。请确认其是否存在。`);
		log.error(error);
	}
}

puppeteer.launch().then(async browser => {
	const page = await browser.newPage();
	await login(page);
	// let i = 5;
	for (const key in results) {
		// if (i <= 0) break;
		// i--;
		const data = await getDataFromBowerPage(page, results[key]);
		const body = {
			query: `mutation {
				createBo(
				  data: {
					name: "${data.name}",
					desc: "${data.desc}",
					wikiUrl: "${data.wikiUrl}",
					props: {
						create: ${stringify(data.content)}
					},
					details: {
						set: ${JSON.stringify(data.details)}
					}
				  }
				) {
				  wikiUrl
				}
			  }`
		};
		const res = await fetch('http://localhost:4466/', {
			method: 'post',
			body: JSON.stringify(body),
			headers: {
				'Content-Type': 'application/json'
			},
		});

		const json = await res.json();
		if (json.errors) {
			log.error(json.errors.map(item => item.message).join('\n'));
			log.error('写入失败：', data.wikiUrl);
			await browser.close();
			throw new Error('写入失败终止进程');
		} else {
			log.info('写入成功：', json.data.createBo.wikiUrl);
		}
	}
	await browser.close();
});
