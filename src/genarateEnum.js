const puppeteer = require('puppeteer');
const boManager = require('./managers/BoManager');
const {writeFile, genarateSwaggerItem, firstWordToLowerCase} = require('./utils');
const login = require('./utils/login');
const BO_LIST = ['购车年龄'];

// 车辆档案,车辆档案扩展信息,客户档案与车辆关系,客户档案,经销商整车库存
// 客户档案,客户档案扩展信息,客户档案与车辆关系,车辆档案,车辆档案扩展信息
// 车辆档案,车辆档案扩展信息,客户档案与车辆关系,客户档案,经销商整车库存
// 车辆档案,车辆档案扩展信息,客户档案与车辆关系,客户档案,经销商整车库存

// const YAML = require('json-to-pretty-yaml');
// public string ContactAddress  { get; set; }
puppeteer.launch().then(async browser => {
	const page = await browser.newPage();
	await login(page);
    
	for(let i = 0;i < BO_LIST.length;i++)
		await boManager.getDataFromBowerPage(page, BO_LIST[i]);

	for(let key in boManager.data) {
		let boString = `// ${key}
export const ${key} = Object.freeze({
	__proto__: Enum,
`;
		boManager.data[key].forEach(item => {
			boString += `	'${item.名称}': ${item.数值},\n`;
		});
		
		boString += '    properties: Object.freeze({';

		boManager.data[key].forEach(item => {
			boString += `
		'${item.数值}': Object.freeze({
			__proto__: EnumItem,
			[CN]: '${item.名称}'
		}),	`;
		});
	
		boString += `
	})
});`;

		writeFile(boString, key);
	}

	await browser.close();
});