const Configstore = require('configstore');
const pkg = require('../../package.json');

const LOGIN_URL = 'https://wiki.sdtdev.net/特殊:用户登录';
const conf = new Configstore(pkg.name);

async function login(page) {
	await page.goto(LOGIN_URL);
	const usernameInput = await page.$('#wpName1');
	const passwordInput = await page.$('#wpPassword1');
	const submitButton = await page.$('#wpLoginAttempt');
	await usernameInput.type(conf.get('username'));
	await passwordInput.type(conf.get('password'));
	await submitButton.click();
	await page.waitFor(1000);
}

module.exports = login;

