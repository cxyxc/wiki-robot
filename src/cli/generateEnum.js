const puppeteer = require('puppeteer');
const enumManager = require('../manager/enumManager');
const login = require('../util/login');

module.exports = function({url, printType, outputPath}) {
	puppeteer.launch().then(async browser => {
		const page = await browser.newPage();
		await login(page);
		await enumManager.getDataFromBowerPage(page, url);
		enumManager.print(printType, outputPath);
		await browser.close();
	});
};
