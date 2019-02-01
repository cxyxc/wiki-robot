const fs = require('fs');
const path = require('path');

// 工具方法（测试用）
// 将 JSON 字符串写入临时文件
function writeJSONFile(data) {
    fs.writeFile(path.join('./test', 'tmp.json'), JSON.stringify(data, null, 2), () => {
        console.log('写入完成');
    });
}

module.exports = {
    writeJSONFile
}