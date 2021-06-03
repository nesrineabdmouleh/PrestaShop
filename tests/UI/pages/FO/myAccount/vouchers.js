require('module-alias/register');
const FOBasePage = require('@pages/FO/FObasePage');

class Vouchers extends FOBasePage {
  constructor() {
    super();

    this.pageTitle = 'Discount';

    // Selectors
    this.vouchersTable = '#content table.table';
    this.vouchersTableBody = `${this.vouchersTable} tbody`;
    this.vouchersTableRows = `${this.vouchersTableBody} tr`;
    this.vouchersTableRow = row => `${this.vouchersTableRows}:nth-child(${row})`;
    this.vouchersTableCodeColumn = row => `${this.vouchersTableRow(row)} th`;
    this.vouchersTableColumn = (row, columnID) => `${this.vouchersTableRow(row)} td:nth-child(${columnID})`;
  }

  /*
  Methods
   */
  /**
   * Get text column from table
   * @param page {Page} Browser tab
   * @param row {number} Row number in vouchers table
   * @returns {string}
   */
  getTextColumnFromTable(page, row, columnName) {
    let columnSelector;

    switch (columnName) {
      case 'code':
        columnSelector = this.vouchersTableCodeColumn(row);
        break;

      case 'description':
        columnSelector = this.vouchersTableColumn(row, 2);
        break;

      case 'quantity':
        columnSelector = this.vouchersTableColumn(row, 3);
        break;

      case 'value':
        columnSelector = this.vouchersTableColumn(row, 4);
        break;

      case 'minimum':
        columnSelector = this.vouchersTableColumn(row, 5);
        break;

      case 'cumulative':
        columnSelector = this.vouchersTableColumn(row, 6);
        break;

      case 'expiration_date':
        columnSelector = this.vouchersTableColumn(row, 7);
        break;

      default:
        throw new Error(`Column ${columnName} was not found`);
    }

    return this.getTextContent(page, columnSelector);
  }
}

module.exports = new Vouchers();
