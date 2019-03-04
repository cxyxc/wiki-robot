const puppeteer = require('puppeteer');
const boManager = require('./managers/BoManager');
const {writeFile, genarateSwaggerItem, firstWordToLowerCase} = require('./utils');
const login = require('./utils/login');
const BO_LIST = [
	'购车年龄'
];
// '证件类型', '客户属性', '行业类型', '车辆属性', '整车购车用途', 
// '整车付款方式', '整车是否特销', '性别', '兴趣爱好',
// '家庭年收入', '家庭人数', '单位客户类型', '教育程度', '婚姻状况'
// '证件类型', '客户属性', '行业类型',  '性别', '兴趣爱好',
// 	'家庭年收入', '家庭人数', '单位客户类型', '教育程度', '婚姻状况'
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

	let string = '';
	for(let key in boManager.data) {
		let boString = '';
		boManager.data[key].forEach(item => {
			boString += `${item.名称},`;
		});
		string += `${key}\n${boString}\n`;
	}
	writeFile(string);

	await browser.close();
});