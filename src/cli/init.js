
const Configstore = require('configstore');
const pkg = require('../../package.json');
const log = require('../util/log');


function init({username, password}) {
	if(!username || !password) {
		log.info('需要填写 wiki 登陆信息');
		return;
	}
	new Configstore(pkg.name, {username, password});
}

module.exports = init;