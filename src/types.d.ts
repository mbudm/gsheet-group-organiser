export interface IProtection {
  sheetEditors: Array<string>;
  rangeEditors: Array<IRangeEditors>;
}
export interface IRangeEditors {
  range: Array<number>;
  editors: Array<string>;
  name: string;
}