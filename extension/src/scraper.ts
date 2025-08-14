import { TransactionData } from './types.js';

function getTransactionTypeFromUrl(): string {
  const url = window.location.href.toLowerCase();
  
  if (url.includes('/invoice')) return 'Invoice';
  if (url.includes('/bill')) return 'Bill';
  if (url.includes('/expense')) return 'Expense';
  if (url.includes('/journal')) return 'JournalEntry';
  if (url.includes('/payment')) return 'Payment';
  
  return 'Unknown';
}

function getTransactionIdFromUrl(): string | null {
  const url = window.location.href;
  const txnIdMatch = url.match(/[?&]txnId=([^&]+)/);
  return txnIdMatch ? txnIdMatch[1] : null;
}

function extractAmount(): number | null {
  const selectors = [
    '[data-automation-id*="total"]',
    '[data-automation-id*="amount"]',
    '.amount-field',
    '.total-amount',
    'td[data-col="amount"]',
    'input[name*="amount"]',
    'input[data-automation-id*="amount"]',
    '[data-testid*="amount"]',
    '.currency-input input',
    'input[type="number"]',
    'span[data-automation-id*="total"]'
  ];

  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent || (element as HTMLInputElement).value || '';
        const cleanText = text.replace(/[$,\s]/g, '').replace(/[^\d.-]/g, '');
        const amount = parseFloat(cleanText);
        if (!isNaN(amount) && amount > 0) {
          return amount;
        }
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function extractDate(): string | null {
  const selectors = [
    'input[data-automation-id*="date"]',
    'input[name*="date"]',
    '.date-field',
    '[data-automation-id="transaction-date"]',
    'td[data-col="date"]',
    '[data-testid*="date"]',
    'input[type="date"]',
    '.date-picker input',
    'span[data-automation-id*="date"]'
  ];

  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || (element as HTMLInputElement).value || '';
        if (text.trim() && text.trim() !== 'Date' && text.trim() !== 'Select date') {
          return text.trim();
        }
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function extractCustomerVendor(): string | null {
  const transactionType = getTransactionTypeFromUrl();
  
  // Transaction type specific selectors
  let selectors: string[] = [];
  
  if (transactionType === 'Invoice') {
    // Invoice-specific selectors for customer name
    selectors = [
      '[data-automation-id*="customer"]',
      'input[name*="customer"]',
      '.customer-field',
      '[data-automation-id="nameAddressComboBox"] input',
      '[data-testid*="customer"]',
      'span[data-automation-id*="customer"]',
      '[data-automation-id="customerName"]',
      '.bill-to input',
      '.customer-name input',
      'input[placeholder*="customer" i]',
      'input[placeholder*="Customer" i]'
    ];
  } else if (transactionType === 'Expense' || transactionType === 'Bill') {
    // Expense/Bill-specific selectors for payee/vendor name
    selectors = [
      '[data-automation-id*="payee"]',
      '[data-automation-id*="vendor"]',
      'input[name*="vendor"]',
      'input[name*="payee"]',
      '.vendor-field',
      '.payee-field',
      '[data-automation-id="nameAddressComboBox"] input',
      '[data-testid*="vendor"]',
      '[data-testid*="payee"]',
      'span[data-automation-id*="vendor"]',
      'span[data-automation-id*="payee"]',
      '[data-automation-id="vendorName"]',
      '[data-automation-id="payeeName"]',
      '.vendor-name input',
      '.payee-name input',
      'input[placeholder*="payee" i]',
      'input[placeholder*="vendor" i]',
      'input[placeholder*="Payee" i]',
      'input[placeholder*="Vendor" i]'
    ];
  } else {
    // Generic selectors for other transaction types
    selectors = [
      '[data-automation-id*="customer"]',
      '[data-automation-id*="vendor"]',
      '[data-automation-id*="payee"]',
      'input[name*="customer"]',
      'input[name*="vendor"]',
      '.customer-field',
      '.vendor-field',
      '[data-automation-id="nameAddressComboBox"] input',
      '[data-testid*="customer"]',
      '[data-testid*="vendor"]',
      'span[data-automation-id*="customer"]',
      'span[data-automation-id*="vendor"]'
    ];
  }

  // Add common selectors that might work across types
  selectors.push(
    'td[data-col="name"]',
    '.name-field input',
    '.entity-name'
  );

  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || (element as HTMLInputElement).value || '';
        if (text.trim() && 
            text !== 'Select...' && 
            text !== 'Choose a customer' && 
            text !== 'Choose a vendor' &&
            text !== 'Choose a payee' &&
            text !== 'Invoice' &&
            text !== 'Expense' &&
            text !== 'Bill' &&
            text.length > 1) {
          return text.trim();
        }
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function extractCreatedBy(): string | null {
  const selectors = [
    '.user-name',
    '.current-user',
    '[data-automation-id*="user"]',
    '.user-badge'
  ];

  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent?.trim();
        if (text) {
          return text;
        }
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

export function getTransactionData(): TransactionData {
  return {
    transaction_url: window.location.href,
    transaction_id: getTransactionIdFromUrl(),
    transaction_type: getTransactionTypeFromUrl(),
    date: extractDate(),
    amount: extractAmount(),
    customer_vendor: extractCustomerVendor(),
    created_by: extractCreatedBy()
  };
}

export function isQboTransactionPage(): boolean {
  const url = window.location.href.toLowerCase();
  const isQbo = url.includes('qbo.intuit.com');
  
  // More specific detection - must have txnId or be in edit/create mode
  const isTransactionPage = (
    url.includes('txnid=') ||  // Most reliable - specific transaction ID
    (url.includes('/invoice') && !url.includes('/invoices')) ||  // Single invoice, not list
    (url.includes('/bill') && !url.includes('/bills')) ||        // Single bill, not list  
    (url.includes('/expense') && !url.includes('/expenses')) ||  // Single expense, not list
    (url.includes('/journal') && !url.includes('/journals')) || // Single journal, not list
    (url.includes('/payment') && !url.includes('/payments')) || // Single payment, not list
    url.includes('/transaction/') ||  // Direct transaction URLs
    url.includes('create') ||         // Creating new transactions
    url.includes('edit')              // Editing transactions
  );
  
  // Exclude list pages explicitly
  const isListPage = (
    url.includes('/invoices') ||
    url.includes('/bills') ||
    url.includes('/expenses') ||
    url.includes('/journals') ||
    url.includes('/payments') ||
    url.includes('/customers') ||
    url.includes('/vendors') ||
    url.includes('/items') ||
    url.includes('/reports')
  );
  
  console.log('QBO Extension: Page detection -', {
    url: url,
    isQbo: isQbo,
    isTransactionPage: isTransactionPage,
    isListPage: isListPage,
    hasTxnId: url.includes('txnid='),
    hasInvoice: url.includes('/invoice'),
    hasBill: url.includes('/bill'),
    hasExpense: url.includes('/expense'),
    hasJournal: url.includes('/journal'),
    hasPayment: url.includes('/payment'),
    hasTransaction: url.includes('/transaction'),
    finalResult: isQbo && isTransactionPage && !isListPage
  });
  
  return isQbo && isTransactionPage && !isListPage;
}