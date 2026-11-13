/**
 * Fallback stub for xlsx in environments where xlsx binary/package is not bundled.
 */
export const utils = {
  json_to_sheet: (data) => ({ '!ref': 'A1:A1' }),
  book_new: () => ({ SheetNames: [], Sheets: {} }),
  book_append_sheet: (wb, ws, name) => {
    wb.SheetNames = wb.SheetNames || [];
    wb.Sheets = wb.Sheets || {};
    wb.SheetNames.push(name);
    wb.Sheets[name] = ws;
  },
  sheet_to_csv: (ws) => '',
  sheet_to_json: (ws, opts) => [],
};

export const write = (wb, opts) => new Uint8Array();
export const read = (buf, opts) => ({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } });

export default {
  utils,
  write,
  read,
};

