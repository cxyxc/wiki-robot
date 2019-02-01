const YAML = require('json-to-pretty-yaml');
const {writeJSONFile, uuid, genarateSwaggerItem} = require('../utils');

// 首字母转换成小写
function firstWordToLowerCase(str) {
    let strTemp = "";
    for(let i = 0; i < str.length; i++) {
        if(i == 0) {
            strTemp += str[i].toLowerCase();
            continue;
        }
        strTemp += str[i];
    }
    return strTemp;
}

// 分辨表格数据是查询参数还是查询结果
function checkIsParameters(data) {
    const keyItems = Object.keys(data[0]);
    const key = keyItems.find(item => item === '建议控件' || item === '默认值');
    return Boolean(key);
}

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
            
            // 分辨当前表格数据是否是 Parameters
            const isParameters = checkIsParameters(data.origin); 

            // 生成 swagger api 文档 yaml Schemas
            const swagger = {
                json: isParameters ? [] : {},
                yaml: ''
            };
            data.origin.forEach(item => {
                const key = firstWordToLowerCase(item.代码名称 || item.id);
                if(isParameters) {
                    swagger.json.push({
                        name: key,
                        in: "query",
                        description: `${item.属性名称}`,
                        schema: genarateSwaggerItem(item),
                    });
                } else {
                    swagger.json[key] = {
                        ...genarateSwaggerItem(item),
                        description: `${item.属性名称}`
                    };
                }
            });
            swagger.yaml = YAML.stringify(swagger.json);
            data.swagger = swagger;
        }
    }
    print() {
        writeJSONFile(this.data);
    }
}

const dtoManager = new DtoManager();
module.exports = dtoManager;
