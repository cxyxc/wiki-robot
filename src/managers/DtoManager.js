const YAML = require('json-to-pretty-yaml');
const {writeJSONFile, writeYAMLFile, uuid, genarateSwaggerItem, firstWordToLowerCase} = require('../utils');

// // 分辨表格数据是查询参数还是查询结果
// function checkIsParameters(data) {
// 	const keyItems = Object.keys(data[0]);
// 	const key = keyItems.find(item => item === '建议控件' || item === '默认值');
// 	return Boolean(key);
// }

class DtoManager {
	constructor() {
		this.data = {};
	}
	setOriginalData(key, data) {
		this.data[key] = {
			origin: data.map(item => ({...item, id: uuid()}))
		};
	}
	get(key) {
		return this.data[key];
	}
	genarate() {
		for(const key in this.data) {
			const data = this.data[key];

			// 生成 swagger api 文档 yaml Schemas
			const swagger = {
				yaml_schema: '',
				yaml_params: '',
			};
			data.origin.forEach(item => {
				const key = firstWordToLowerCase(item.代码名称 || item.id);
				swagger.json_schema[key] = {
					...genarateSwaggerItem(item),
					description: `${item.属性名称}`
				};
				swagger.json_params.push({
					name: key,
					in: 'query',
					description: `${item.属性名称}`,
					schema: genarateSwaggerItem(item),
				});
			});
			swagger.yaml_schema = YAML.stringify(swagger.json_schema);
			swagger.yaml_params = YAML.stringify(swagger.json_params);
			data.swagger = swagger;
		}
	}
	print() {
		writeJSONFile(this.data);
		const keys = Object.keys(this.data);
		keys.forEach(item => {
			writeYAMLFile(this.data[item].swagger.yaml, `${item}.yaml`);
		});
	}
}

const dtoManager = new DtoManager();
module.exports = dtoManager;
