const puppeteer = require('puppeteer');
const enumManager = require('../manager/enumManager');
const login = require('../util/login');
const uniq = require('../util/uniq');
const tabletojson = require('tabletojson');
const log = global.console.log;

/** 定制化批量获取枚举值逻辑 */
const URL = 'https://wiki.sdtdev.net/SDT:EXEED设计交付';

module.exports = function({systemName, moduleName}) {
	puppeteer.launch().then(async browser => {
		const page = await browser.newPage();
		await login(page);
		
		await page.goto(URL);
		await page.waitFor(1000);

		const tableDatas = await page.$$eval('.wikitable', nodes => {
			return nodes.map(node => {
				node.querySelectorAll('a').forEach(a => {
					a.innerHTML = a.href;
				});
				return node.outerHTML;
			});
		});

		const tableJsonDatas = tableDatas.map(data => tabletojson.convert(data)[0]);
		const tableTitle = await page.$$eval('.mw-headline', nodes => nodes.map(node => node.innerHTML));
		if(tableJsonDatas.length !== tableTitle.length) log(`检测到 ${URL} 功能模块标题与表格无法一一对应，可能导致解析出错。`);

		const tableIndex = tableTitle.findIndex(item => item === systemName);
		if(tableIndex === -1) {
			log('系统名未找到。');
			return;
		}
		const tableData = tableJsonDatas[tableIndex];
		
		// 查找已经评审过的业务节点
		const reviewedPageUrls = tableData.filter(item => item.交付日期 !== '' && item.LV1 === moduleName)
			.map(item => item.LV3);

		if(reviewedPageUrls.length === 0) {
			log('领域名未找到。');
			return;
		}
		// console.log(reviewedPageUrls.map(item => decodeURI(item)))

		// 查找业务节点中包含的 BO
		let boList = [];
		for(let i = 0; i < reviewedPageUrls.length;i++) {
			// 外层循环，节点首页
			await page.goto(reviewedPageUrls[i]);
			await page.waitFor(1000);
			const hrefs = await page.$$eval('.modelbox tr', nodes => {
				const result = {
					bo: [],
					page: []
				};
				nodes.forEach(tr => {
					const title = tr.querySelector('td').innerHTML;
					
					if(title === '目的实体' || title === '相关实体') {
						tr.querySelectorAll('a').forEach(a => {
							result.bo.push(a.href);
						});
					}
					if(title === '子级界面') {
						tr.querySelectorAll('a').forEach(a => {
							result.page.push(a.href);
						});
					}
				});
				return result; 
			});
			boList = boList.concat(hrefs.bo);
			for(let j = 0;j < hrefs.page;j++) {
				// 内层循环，假设业务节点只有两级，暂不考虑递归实现
				await page.goto(hrefs.page[j]);
				await page.waitFor(1000);
				const bos = await page.$$eval('.modelbox tr', nodes => {
					const bo = [];
					nodes.forEach(tr => {
						const title = tr.querySelector('td').innerHTML;
						if(title === '目的实体' || title === '相关实体') {
							tr.querySelectorAll('a').forEach(a => {
								bo.push(a.href);
							});
						}
					});
					return bo; 
				});
				boList = boList.concat(bos);
			}
		}
		boList = uniq(boList);
		// console.log(boList.map(item => decodeURI(item)))

		// BO 遍历，查找相应的枚举值
		let enumList = [];
		for(let i = 0; i < boList.length;i++) {
			await page.goto(boList[i]);
			await page.waitFor(1000);

			const hrefs = await page.$$eval('.wikitable', nodes => {
				const urls = [];
				nodes[0].querySelectorAll('a').forEach(a => 
					urls.push(a.href)
				);
				return urls;
			});
			enumList = enumList.concat(hrefs);
		}
		enumList = uniq(enumList);
		
		for(let i = 0;i < enumList.length;i++) {
			await page.goto(enumList[i]);
			await page.waitFor(1000);
			// 过滤到关联的 BO
			const isEnum =  await page.$$eval('#mw-normal-catlinks', nodes => {
				let isEnum = false;
				nodes[0].querySelectorAll('a').forEach(a => {
					if(a.innerHTML === '枚举')
						isEnum = true;
				});
				return isEnum;
			});
			if(isEnum)
				await enumManager.getDataFromBowerPage(page, enumList[i]);
		}
		enumManager.print();
		await browser.close();
	});
};
