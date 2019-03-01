const YAML = require('json-to-pretty-yaml');
const {writeJSONFile, writeFile, uuid, genarateSwaggerItem, firstWordToLowerCase} = require('../utils');

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
				json_schema: {},
				yaml_schema: '',
				json_params: [],
				yaml_params: '',
			};
			const formItems = [];
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

				if(item.可编辑 === '✔') {
					const label = item.显示文字 || item.属性名称;
					const notEmpty = item.不可为空 === '✔';
					let componentTag = '使用控件';
					if(!item[componentTag]) componentTag = '建议控件';
					const componentName = item[componentTag];
					let Component = '';
					if(componentName === '文本框')
						Component = `<TextInput
									name="${key}"
									value={detailData.${key}}
									onBlur={this.handleFilterChange} />`;
					if(componentName === '下拉框')
						Component = `<WrappedSelect
									name="${key}"
									options={Enum.toList()}
									value={detailData.${key}}
									onBlur={this.handleFilterChange} />`;
					if(componentName === '时间控件')
						Component = `<WrappedDatePicker
									name="${key}"
									value={detailData.${key}}
									onChange={this.handleFilterChange} />`;
					const Wrapper = `
						<Col {...FORM_OPTIONS.col}>
							<FormItem label="${label}" {...FORM_ROW_OPTIONS.item} ${notEmpty ? `validateStatus={this.state.isValidate && !detailData.${key} ? 'error' : null}` : ''}>
								${Component}
							</FormItem>
						</Col>`;
					formItems.push(Wrapper);
				}
			});
			swagger.yaml_schema = YAML.stringify(swagger.json_schema);
			swagger.yaml_params = YAML.stringify(swagger.json_params);
			data.swagger = swagger;
			data.formItems = formItems;
		}
	}
	print() {
		writeJSONFile(this.data);
		const keys = Object.keys(this.data);
		keys.forEach(item => {
			writeFile(this.data[item].formItems.join(''), item);
		});
	}
}

const dtoManager = new DtoManager();
module.exports = dtoManager;
