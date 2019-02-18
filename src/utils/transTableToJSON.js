const tabletojson = require('tabletojson');
const jsdom = require('jsdom');
const {
	JSDOM
} = jsdom;

// 将 table DOM 处理为 JSON 字符串
function transTableToJSON(table) {
	const dom = new JSDOM(table);
	const document = dom.window.document;
	// 单元格解除合并
	const tableArray = [];
	const trs = document.querySelectorAll('tr');
	for (let i = 0; i < trs.length; i++) {
		const tds = i === 0 ? trs[i].querySelectorAll('th') : trs[i].querySelectorAll('td');
		tableArray[i] = [];
		for (let j = 0; j < tds.length; j++) {
			tableArray[i].push(tds[j]);
		}
	}

	for (let i = 0; i < tableArray.length; i++) {
		const trArray = tableArray[i];
		for (let j = 0; j < trArray.length; j++) {
			const td = trArray[j];
			const rowspan = parseInt(td.getAttribute('rowspan'), 10);
			const colspan = parseInt(td.getAttribute('colspan'), 10);
			if (isNaN(rowspan) && isNaN(colspan)) continue;
			if (rowspan) {
				// 当前行往下 rowspan - 1 行对应位置填充空格
				for(let k = 0; k < rowspan - 1; k++) {
					if(!tableArray[i + k + 1]) break;
					tableArray[i + k + 1].splice(j, 0, document.createElement('td'));
				}
			}
			if(colspan) {
				trArray.splice(j, colspan - 1, document.createElement('td'));
			}
		}
	}

	const tableDom = document.createElement('table');
	tableArray.forEach((tr) => {
		const trDom = document.createElement('tr');
		tr.forEach(td => {
			trDom.append(td);
		});
		tableDom.append(trDom);
	});

	return tabletojson.convert(tableDom.outerHTML)[0];
}

module.exports = transTableToJSON;
