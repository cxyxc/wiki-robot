const chalk = require('chalk');
const log = global.console.log;

module.exports = {
	info: (...data) => log(chalk.green(...data)),
	warn: (...data) => log(chalk.keyword('orange')(...data)),
	error: (...data) => log(chalk.bold.red(...data)),
};