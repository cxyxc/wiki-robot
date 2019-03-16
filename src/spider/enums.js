const results = require('./enums.json').results; // 枚举字典，从 wiki 中导出
const log = require('../util/log');
const puppeteer = require('puppeteer');
const tabletojson = require('tabletojson');
const login = require('../util/login');
const fetch = require('node-fetch');

function stringify(array) {
	return array.map(item => {
		const lines = [];
		for (let key in item) {
			const value = typeof item[key] === 'string' ? `"${item[key]}"` : item[key];
			lines.push(`${key}: ${value}`);
		}
		return `{${lines.join(',')}}`;
	}).join(',');
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
			await page.waitForSelector('.firstHeading', {
				timeout: 3000
			});
		}
		const firstHeading = await page.$eval('#firstHeading', node => node.innerHTML);
		const [desc, name] = firstHeading.split('-').map(item => item.trim());
		const tableData = await page.$eval('.wikitable', node => node.outerHTML.replace(/[\r\n]/g, ''));
		const jsonData = tabletojson.convert(tableData)[0];
		const data = {
			wikiUrl: fulltext,
			name,
			desc,
			content: jsonData
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
	// let i = 1;
	for (const key in results) {
		// if (i <= 0) break;
		// i--;
		const data = await getDataFromBowerPage(page, results[key]);
		data.content = data.content ? data.content.map(item => ({
			key: item.名称,
			value: parseInt(item.数值, 10)
		})) : [];

		const body = {
			query: `mutation {
				createEnumType(
				  data: {
					name: "${data.name}",
					desc: "${data.desc}",
					wikiUrl: "${data.wikiUrl}",
					props: {
						create: ${stringify(data.content)}
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
		if (json.error) {
			log.error(json.error);
			log.error('写入失败：', data.wikiUrl);
		} else {
			log.info('写入成功：', json.data.createEnumType.wikiUrl);
		}
	}
	await browser.close();
});
