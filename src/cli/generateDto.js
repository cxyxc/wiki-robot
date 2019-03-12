const puppeteer = require('puppeteer');
const dtoManager = require('../manager/dtoManager');
const login = require('../util/login');
const path = require('path');
const process = global.process;
const log = require('../util/log');

module.exports = function({url, printType, outputPath}) {
	puppeteer.launch().then(async browser => {
		const page = await browser.newPage();
		await login(page);

		await dtoManager.getDataFromBowerPage(page, url);
		let typeList =  [];
		try {
			typeList = require(path.join(process.cwd(), './wikirobot.conf.js'));
		} catch (error) {
			log.info('无自定义配置文件');
		}
		dtoManager.log();
		dtoManager.print(typeList, printType, outputPath);
		await browser.close();
	});
};
