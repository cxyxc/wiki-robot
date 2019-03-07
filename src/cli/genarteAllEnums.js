const puppeteer = require('puppeteer');
const enumManager = require('../manager/enumManager');
const login = require('../util/login');
const uniq = require('../util/uniq');
const tabletojson = require('tabletojson');
const log = global.console.log;

/** 定制化批量获取枚举值逻辑 */
const URL = 'https://wiki.sdtdev.net/SDT:EXEED设计交付';

module.exports = function({systemName, moduleName, printType, outputPath}) {
	puppeteer.launch().then(async browser => {
		const page = await browser.newPage();
		await login(page);
		
		log('正在读取：', URL);
		await page.goto(URL);
		await page.waitForSelector('.wikitable', {timeout: 1000});

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
			log(systemName, '未找到。');
			return;
		}
		const tableData = tableJsonDatas[tableIndex];
		
		// 查找已经交付的业务节点
		const reviewedPageUrls = tableData.filter(item => item.交付日期 !== '' && item.LV1 === moduleName)
			.map(item => item.LV3);

		if(reviewedPageUrls.length === 0) {
			log(moduleName, '未找到。');
			return;
		}

		// 查找业务节点中包含的 BO
		let boList = [];
		for(let i = 0; i < reviewedPageUrls.length;i++) {
			// 外层循环，节点首页
			const url = reviewedPageUrls[i];
			try {
				log('正在读取节点首页：', decodeURI(url));
				await page.goto(url);
				await page.waitForSelector('.modelbox tr', {timeout: 1000});
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

				for(let j = 0;j < hrefs.page.length;j++) {
					const url = hrefs.page[j];
					try {
						// 内层循环，假设业务节点只有两级，暂不考虑递归实现
						log('正在读取子页面：', decodeURI(url));
						await page.goto(url);
						await page.waitForSelector('.modelbox tr', {timeout: 1000});

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
					} catch (error) {
						log(`子页面： ${decodeURI(url)} 读取失败。请确认其是否存在。`);
						continue;
					}
				}
			} catch (error) {
				log(`节点首页： ${decodeURI(url)} 读取失败。请确认其是否存在。`);
				continue;
			}
		}
		boList = uniq(boList);

		// BO 遍历，查找相应的枚举值
		let enumList = [];
		for(let i = 0; i < boList.length;i++) {
			const url = boList[i];
			try {
				log('正在读取BO：', decodeURI(url));
				await page.goto(url);
				await page.waitForSelector('.wikitable', {timeout: 1000});

				const hrefs = await page.$$eval('.wikitable', nodes => {
					const urls = [];
					nodes[0].querySelectorAll('a').forEach(a => 
						urls.push(a.href)
					);
					return urls;
				});
				enumList = enumList.concat(hrefs);
			} catch (error) {
				log(`BO ${decodeURI(url)} 读取失败。请确认其是否存在。`);
				continue;
			}
		}
		enumList = uniq(enumList);
		
		for(let i = 0;i < enumList.length;i++) {
			const url = enumList[i];
			try {
				// 过滤关联到的 BO
				log('正在读取BO关联字段：', decodeURI(url));
				await page.goto(url);
				await page.waitForSelector('#mw-normal-catlinks', {timeout: 1000});
				const isEnum =  await page.$$eval('#mw-normal-catlinks', nodes => {
					let isEnum = false;
					nodes[0].querySelectorAll('a').forEach(a => {
						if(a.innerHTML === '枚举')
							isEnum = true;
					});
					return isEnum;
				});
				if(isEnum) {
					log('发现枚举：', decodeURI(url));
					await enumManager.getDataFromBowerPage(page, enumList[i]);
				}
			} catch (error) {
				log(`BO关联字段： ${decodeURI(url)} 读取失败。请确认其是否存在。`);
				continue;
			}
		}
		enumManager.print(printType, outputPath);
		await browser.close();
	});
};
