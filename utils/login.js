
const config = require('../config');
const {
    LOGIN_URL,
    USERNAME,
    PASSWORD,
} = config;

async function login(page) {
    await page.goto(LOGIN_URL);
    const usernameInput = await page.$('#wpName1');
    const passwordInput = await page.$('#wpPassword1');
    const submitButton = await page.$('#wpLoginAttempt');
    await usernameInput.type(USERNAME);
    await passwordInput.type(PASSWORD);
    await submitButton.click();
    await page.waitFor(1000);
}

module.exports = login;

