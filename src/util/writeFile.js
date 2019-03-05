const fs = require('fs');
const path = require('path');
const log = require('loglevel');
const process = global.process;

// 工具方法（测试用）
// 将 JSON 字符串写入临时文件
function writeJSONFile(data, filename = 'temp.json') {
	fs.writeFile(path.join(process.cwd(), 'temp', filename), JSON.stringify(data, null, 2), () => {
		log.info('写入完成');
	});
}

// 工具方法（测试用）
// 将 JSON 字符串写入临时文件
function writeYAMLFile(data, filename = 'temp.yaml') {
	fs.writeFile(path.join(process.cwd(), 'temp', filename), data.replace(/"/g, ''), () => {
		log.info('写入完成');
	});
}

// 工具方法（测试用）
// 将字符串写入临时文件
function writeFile(data, filename = 'temp') {
	fs.writeFile(path.join(process.cwd(), 'temp', filename), data, () => {
		log.info('写入完成');
	});
}

module.exports = {
	writeJSONFile,
	writeYAMLFile,
	writeFile
};