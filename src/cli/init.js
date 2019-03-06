
const Configstore = require('configstore');
const pkg = require('../../package.json');
const log = global.console.log;

function init({username, password}) {
	if(!username || !password) {
		log('需要填写 wiki 登陆信息');
		return;
	}
	new Configstore(pkg.name, {username, password});
}

module.exports = init;