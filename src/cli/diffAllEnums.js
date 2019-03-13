const puppeteer = require('puppeteer');
const enumManager = require('../manager/enumManager');
const login = require('../util/login');
const uniq = require('../util/uniq');
const log = require('../util/log');
const {writeJSONFile} = require('../util/writeFile');
var jsdiff = require('diff');

module.exports = function({url1, url2}) {
	puppeteer.launch().then(async browser => {
		const page = await browser.newPage();
		await login(page);

		const getData = async (url) => {
			enumManager.data = {};
			let boList = [];
			// 外层循环，节点首页
			try {
				log.info('正在读取节点首页：', decodeURI(url));
				await page.goto(url);
				await page.waitForSelector('.modelbox tr', {timeout: 3000});
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
						log.info('正在读取子页面：', decodeURI(url));
						await page.goto(url);
						await page.waitForSelector('.modelbox tr', {timeout: 3000});
    
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
						log.error(`子页面： ${decodeURI(url)} 读取失败。请确认其是否存在。`);
						continue;
					}
				}
			} catch (error) {
				log.error(`节点首页： ${decodeURI(url)} 读取失败。请确认其是否存在。`);
			}
			boList = uniq(boList);
    
			// BO 遍历，查找相应的枚举值
			let enumList = [];
			for(let i = 0; i < boList.length;i++) {
				const url = boList[i];
				try {
					log.info('正在读取BO：', decodeURI(url));
					await page.goto(url);
					await page.waitForSelector('.wikitable', {timeout: 3000});
    
					const hrefs = await page.$$eval('.wikitable', nodes => {
						const urls = [];
						nodes[0].querySelectorAll('a').forEach(a => 
							urls.push(a.href)
						);
						return urls;
					});
					enumList = enumList.concat(hrefs);
				} catch (error) {
					log.error(`BO ${decodeURI(url)} 读取失败。请确认其是否存在。`);
					continue;
				}
			}
			enumList = uniq(enumList);
            
			for(let i = 0;i < enumList.length;i++) {
				const url = enumList[i];
				try {
					// 过滤关联到的 BO
					log.info('正在读取BO关联字段：', decodeURI(url));
					await page.goto(url);
					await page.waitForSelector('#mw-normal-catlinks', {timeout: 3000});
					const isEnum =  await page.$$eval('#mw-normal-catlinks', nodes => {
						let isEnum = false;
						nodes[0].querySelectorAll('a').forEach(a => {
							if(a.innerHTML === '枚举')
								isEnum = true;
						});
						return isEnum;
					});
					if(isEnum) {
						log.info('发现枚举：', decodeURI(url));
						await enumManager.getDataFromBowerPage(page, enumList[i]);
					}
				} catch (error) {
					log.error(`BO关联字段： ${decodeURI(url)} 读取失败。请确认其是否存在。`);
					continue;
				}
			}
			return enumManager.data;
		};

		const data1 = await getData(url1);
		const data2 = await getData(url2);
        
		const result1 = {};
		for(let url in data1) {
			result1[data1[url].desc] = {
				...data1[url]
			};
		}
        
		const result2 = {};
		for(let url in data2) {
			result2[data2[url].desc] = {
				...data2[url]
			};
		}
		writeJSONFile(result1, 'result1.js');
		writeJSONFile(result2, 'result2.js');
		writeJSONFile(jsdiff.diffJson(result1, result2));

		await browser.close();
	});
};
