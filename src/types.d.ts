export interface IProtection {
  sheetEditors: string[];
  rangeEditors: IRangeEditors[];
}
export interface IRangeEditors {
  range: number[];
  editors: string[];
  name: string;
}
export interface ISheetData {
  values: Array<Array<number | string>>;
  formulas: IFormulas[];
  validation: IValidation[];
  // conditional: IConditional[];
}

export interface IFormulas {
  range: number[];
  formulaValues: string[][];
}
export interface IValidation {
  range: number[];
  formula: string;
  helpText: string;
}

// export interface IConditional {
//   range: number[];
//   conditions: ICondition[];
// }

// export interface ICondition {
//   textContains: string;
//   background: string;
// }
