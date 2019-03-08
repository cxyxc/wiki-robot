/* eslint-disable no-undef */
const transformToLowerCase = require('./transformToLowerCase');

test('transform Vin to vin', () => {
	expect(transformToLowerCase('Vin')).toBe('vin');
});

test('transform ERPCode to erpCode', () => {
	expect(transformToLowerCase('ERPCode')).toBe('erpCode');
});
