export interface IProtection {
  sheetEditors: Array<string>;
  rangeEditors: Array<IRangeEditors>;
}
export interface IRangeEditors {
  range: Array<string | number>;
  editors: Array<string>;
  name: string;
}
