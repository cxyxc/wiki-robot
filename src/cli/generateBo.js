const puppeteer = require('puppeteer');
const boManager = require('../manager/boManager');
const login = require('../util/login');

module.exports = function({url, printType, outputPath}) {
	puppeteer.launch().then(async browser => {
		const page = await browser.newPage();
		await login(page);
		await boManager.getDataFromBowerPage(page, url);
		await boManager.generateLinks(page);
		boManager.print(printType, outputPath);
		await browser.close();
	});
};
