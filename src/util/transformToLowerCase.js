/**
 * 大写开头的单词转化为小写开头
 * 包含对缩写词的处理
 * Vin -> vin
 * ERPCode -> ErpCode
 */
module.exports = function transformToLowerCase(str) {
	let strTemp = '';
	for(let i = 0; i < str.length; i++) {
		if(
			i == 0 || (str[i + 1] && /[A-Z]/.test(str[i]) && /[A-Z]/.test(str[i + 1]))
		) {
			strTemp += str[i].toLowerCase();
			continue;
		}
		strTemp += str[i];
	}
	return strTemp;
};
