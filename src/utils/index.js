const fs = require('fs');
const path = require('path');

// 工具方法（测试用）
// 将 JSON 字符串写入临时文件
function writeJSONFile(data) {
	fs.writeFile(path.join(process.cwd(), 'tmp', 'tmp.json'), JSON.stringify(data, null, 2), () => {
		console.log('写入完成');
	});
}

// 工具方法（测试用）
// 将 JSON 字符串写入临时文件
function writeYAMLFile(data, filename = 'tmp.yaml') {
	fs.writeFile(path.join(process.cwd(), 'tmp', filename), data.replace(/"/g, ''), () => {
		console.log('写入完成');
	});
}

// 工具方法（测试用）
// 将字符串写入临时文件
function writeFile(data, filename = 'tmp') {
	fs.writeFile(path.join(process.cwd(), 'tmp', filename), data, () => {
		console.log('写入完成');
	});
}

const uuid = () => 'xxxxxxxx'.replace(/[xy]/g, c => {
	let r = Math.random() * 16 | 0,
		v = c === 'x' ? r : (r & 0x3 | 0x8);
	return v.toString(16);
});


/**
 * 分析 swagger 数据项需要的字段
 * @param {*} data 
 * @example
 * {
 *    "属性名称": "编号",
 *    "代码名称": "Code",
 *    "数据类型": "String(30)",
 *    "不可为空": "✔",
 *    "是否唯一": "✔",
 *    "冗余属性": ""
 * }
 */
function genarateSwaggerItem(data) {
	const dataType = data['数据类型'] || '';
	const description = `${data.属性名称}`;
	let type = 'integer';
	let format = null;
	if(dataType.includes('String')) type = 'string';
	if(dataType.includes('DateTime')) {
		type = 'string';
		data = 'date-time';
	}
	if(dataType.includes('Integer')) type = 'integer';
	if(dataType.includes('Boolean')) type = 'boolean';
	if(dataType.includes('Money')) {
		type = 'number';
		format = 'float';
	}
	return format ? {type, format, description} : {type, description};
}


// 首字母转换成小写
function firstWordToLowerCase(str) {
	let strTemp = '';
	for(let i = 0; i < str.length; i++) {
		if(i == 0) {
			strTemp += str[i].toLowerCase();
			continue;
		}
		strTemp += str[i];
	}
	return strTemp;
}

module.exports = {
	writeJSONFile,
	writeYAMLFile,
	writeFile,
	genarateSwaggerItem,
	firstWordToLowerCase,
	uuid
};