// 首字母转换成小写
module.exports = function firstWordToLowerCase(str) {
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
