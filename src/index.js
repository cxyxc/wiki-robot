#!/usr/bin/env node
const init = require('./cli/init');
const genarteAllEnums = require('./cli/genarteAllEnums');

require('yargs')
	.scriptName('wiki-robot')
	.usage('$0 <cmd> [args]')
	.command('init [username] [password]', 'init wiki-robot', (yargs) => {
		yargs.positional('username', {
			type: 'string',
			describe: 'wiki username'
		});
		yargs.positional('password', {
			type: 'string',
			describe: 'wiki username'
		});
	}, init)
	.command('allEnums [systemName] [moduleName]', 'genarte all enums', (yargs) => {
		yargs.positional('systemName', {
			type: 'string',
			describe: 'DCS/DMS/...'
		});
		yargs.positional('moduleName', {
			type: 'string',
			describe: '配件业务/售后业务/...'
		});
	}, genarteAllEnums)
	.help()
	.argv;
