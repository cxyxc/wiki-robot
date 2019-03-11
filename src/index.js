#!/usr/bin/env node
const init = require('./cli/init');
const generateEnum = require('./cli/generateEnum');
const generateAllEnums = require('./cli/generateAllEnums');
const generateBo = require('./cli/generateBo');
const generateDto = require('./cli/generateDto');

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
	.command('allEnums [printType] [outputPath] [systemName] [moduleName]', 'genarte all enums', (yargs) => {
		yargs.positional('systemName', {
			type: 'string',
			describe: 'DCS/DMS/...'
		});
		yargs.positional('moduleName', {
			type: 'string',
			describe: '配件业务/售后业务/...'
		});
		yargs.positional('printType', {
			type: 'string',
			describe: '支持 C / S 两种输出形式'
		});
		yargs.positional('outputPath', {
			type: 'string',
			describe: '输出路径'
		});
	}, generateAllEnums)
	.command('enum [printType] [outputPath] [url]', 'genarte one enum', (yargs) => {
		yargs.positional('printType', {
			type: 'string',
			describe: '支持 C / S 两种输出形式'
		});
		yargs.positional('outputPath', {
			type: 'string',
			describe: '输出路径'
		});
		yargs.positional('url', {
			type: 'string',
			describe: '枚举值 url 地址'
		});
	}, generateEnum)
	.command('bo [printType] [outputPath] [url]', 'genarte one bo', (yargs) => {
		yargs.positional('printType', {
			type: 'string',
			describe: '支持 S 输出形式'
		});
		yargs.positional('outputPath', {
			type: 'string',
			describe: '输出路径'
		});
		yargs.positional('url', {
			type: 'string',
			describe: 'BO url 地址'
		});
	}, generateBo)
	.command('dto [printType] [outputPath] [url]', 'genarte one dto', (yargs) => {
		yargs.positional('printType', {
			type: 'string',
			describe: '支持 S 输出形式'
		});
		yargs.positional('outputPath', {
			type: 'string',
			describe: '输出路径'
		});
		yargs.positional('url', {
			type: 'string',
			describe: 'DTO url 地址'
		});
	}, generateDto)
	.help()
	.argv;
