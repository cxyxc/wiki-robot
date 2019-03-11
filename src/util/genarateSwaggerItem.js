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

module.exports = genarateSwaggerItem;
