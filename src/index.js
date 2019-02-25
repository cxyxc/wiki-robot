const puppeteer = require('puppeteer');
const dtoManager = require('./managers/DtoManager');
const boManager = require('./managers/BoManager');
const transTableToJSON = require('./utils/transTableToJSON');
const login = require('./utils/login');
const {BASE_URL} = require('./config');

function getBoString(keyItems) {
	return keyItems.find(item => item === '所属实体' || item === '实体名称');
}

// 分析表头中是否包含实体标识并返回实体名
function genarateBoKeys(data) {
	if(!data || !data[0]) return [false];
	const key = getBoString(Object.keys(data[0]));
	if(!data[0][key]) return [false];
	let lastBoName = null;
	return [true, data.map(item => {
		if(item[key]) {
			lastBoName = item[key];
			return item;
		}
		return {
			...item,
			[key]: lastBoName
		};
	})];
}

puppeteer.launch().then(async browser => {
	const page = await browser.newPage();
	await login(page);

	const url = `${BASE_URL}客户档案管理`;
	await page.goto(url);
	await page.waitFor(1000);

	// 已进入业务节点界面
    
	// 格式化所有表格数据
	const tableDatas = await page.$$eval('.wikitable', nodes => nodes.map(node => node.outerHTML));
	const jsonDatas = tableDatas.map(data => transTableToJSON(data));
	
	// 实体数据填充
	for(let i = 0;i < jsonDatas.length;i++) {
		const tmpData = jsonDatas[i];
		const [isBo, data] = genarateBoKeys(tmpData); // 判断数据中是否包含 BO key
		if(!isBo) continue;
		const result = [];
		for(let j = 0;j < data.length;j++) {
			const item = data[j];
			const boName = item[getBoString(Object.keys(item))];
			await boManager.getDataFromBowerPage(page, boName);
			const bo = boManager.get(boName);
			const prop = bo.find(b => b.属性名称 === item.属性名称);
			result.push(Object.assign({}, prop, item));
		}
		dtoManager.setOriginalData(`Untitled${i}`, result);
	}

	dtoManager.genarate();
	dtoManager.print();
	await browser.close();
});
