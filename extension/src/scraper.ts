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
  // Strategy 1: Try scoped search within transaction container
  const transactionContainers = [
    '[data-automation-id*="transaction"]',
    '[data-automation-id*="expense"]',
    '[data-automation-id*="invoice"]',
    '.transaction-form',
    '.expense-form',
    '.invoice-form',
    'form[data-automation-id*="form"]',
    '[role="main"]',
    '.main-content'
  ];

  // Amount selectors - prioritize input fields and more specific selectors
  const selectors = [
    // Input fields first (most reliable for current transaction)
    'input[data-automation-id*="amount"]',
    'input[name*="amount"]',
    'input[data-automation-id*="total"]',
    'input[name*="total"]',
    '.currency-input input',
    'input[type="number"]',
    
    // More specific form elements
    '[data-automation-id*="totalAmount"]',
    '[data-automation-id*="lineAmount"]',
    '[data-automation-id*="transactionAmount"]',
    '.amount-field input',
    '.total-amount input',
    
    // Display elements but avoid table cells
    '[data-automation-id*="total"]:not(td)',
    '[data-automation-id*="amount"]:not(td)',
    '[data-testid*="amount"]:not(td)',
    'span[data-automation-id*="total"]',
    '.amount-field',
    '.total-amount'
  ];

  // Helper function to check if element is likely from a list
  const isFromList = (element: Element): boolean => {
    return !!(element.closest('table') || 
              element.closest('[data-automation-id*="list"]') ||
              element.closest('[data-automation-id*="table"]') ||
              element.closest('.list-item') ||
              element.closest('.grid-row') ||
              element.closest('[role="grid"]'));
  };

  // Helper function to extract and validate amount
  const getAmountFromElement = (element: Element): number | null => {
    const text = element.textContent || (element as HTMLInputElement).value || '';
    const cleanText = text.replace(/[$,\s]/g, '').replace(/[^\d.-]/g, '');
    const amount = parseFloat(cleanText);
    
    if (!isNaN(amount) && amount >= 0.01) {
      return amount;
    }
    return null;
  };

  // Strategy 1: Try within transaction container first
  for (const containerSelector of transactionContainers) {
    const container = document.querySelector(containerSelector);
    if (container) {
      for (const selector of selectors) {
        try {
          const elements = container.querySelectorAll(selector);
          for (const element of elements) {
            if (!isFromList(element)) {
              const amount = getAmountFromElement(element);
              if (amount !== null) {
                return amount;
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
    }
  }

  // Strategy 2: Fallback to document-wide search but be more selective
  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      const validElements = Array.from(elements).filter(element => !isFromList(element));
      
      // Prefer input elements over display elements
      const inputElements = validElements.filter(el => el.tagName.toLowerCase() === 'input');
      const checkElements = inputElements.length > 0 ? inputElements : validElements;
      
      for (const element of checkElements) {
        const amount = getAmountFromElement(element);
        if (amount !== null) {
          return amount;
        }
      }
    } catch (e) {
      continue;
    }
  }

  // Strategy 3: Last resort - original simple approach but with list filtering
  const fallbackSelectors = [
    '[data-automation-id*="total"]',
    '[data-automation-id*="amount"]',
    '.amount-field',
    '.total-amount',
    'input[name*="amount"]',
    'input[type="number"]'
  ];

  for (const selector of fallbackSelectors) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (!isFromList(element)) {
          const amount = getAmountFromElement(element);
          if (amount !== null) {
            return amount;
          }
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
    // Expense/Bill-specific selectors for payee/vendor name - prioritize input elements
    selectors = [
      // Specific input field selectors first (most reliable)
      'input[data-automation-id*="payee"]:not([data-automation-id*="payeeLabel"])',
      'input[data-automation-id*="vendor"]:not([data-automation-id*="vendorLabel"])',
      'input[name*="vendor"]',
      'input[name*="payee"]',
      'input[placeholder*="payee" i]',
      'input[placeholder*="vendor" i]',
      'input[placeholder*="Payee" i]',
      'input[placeholder*="Vendor" i]',
      
      // Combo box and dropdown inputs
      '[data-automation-id="nameAddressComboBox"] input',
      '[data-automation-id*="payeeComboBox"] input',
      '[data-automation-id*="vendorComboBox"] input',
      '.vendor-field input',
      '.payee-field input',
      '.vendor-name input',
      '.payee-name input',
      
      // Specific automation IDs
      '[data-automation-id="vendorName"]',
      '[data-automation-id="payeeName"]',
      
      // Test IDs for inputs only
      'input[data-testid*="vendor"]',
      'input[data-testid*="payee"]',
      
      // Last resort - span elements but with stricter filtering
      'span[data-automation-id*="vendor"]:not([data-automation-id*="vendorLabel"]):not([data-automation-id*="label"])',
      'span[data-automation-id*="payee"]:not([data-automation-id*="payeeLabel"]):not([data-automation-id*="label"])'
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
            text !== 'Payee' &&
            text !== 'Vendor' &&
            text !== 'Customer' &&
            text !== 'payee' &&
            text !== 'vendor' &&
            text !== 'customer' &&
            !text.toLowerCase().includes('select') &&
            !text.toLowerCase().includes('choose') &&
            !text.toLowerCase().includes('label') &&
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

function extractInvoiceNumber(): string | null {
  const transactionType = getTransactionTypeFromUrl();
  
  // Transaction type specific selectors
  let selectors: string[] = [];
  
  if (transactionType === 'Invoice') {
    // Invoice-specific selectors for invoice number
    selectors = [
      'input[data-automation-id*="invoiceNumber"]',
      'input[data-automation-id*="invoice_number"]',
      'input[name*="invoiceNumber"]',
      'input[name*="invoice_number"]',
      'input[placeholder*="invoice number" i]',
      'input[placeholder*="invoice #" i]',
      '[data-automation-id*="invoiceNumber"] input',
      '.invoice-number input',
      '.invoice-field input',
      'span[data-automation-id*="invoiceNumber"]',
      '.invoice-number',
      '[data-testid*="invoice-number"]'
    ];
  } else if (transactionType === 'Expense' || transactionType === 'Bill') {
    // Expense/Bill-specific selectors for bill/reference number
    selectors = [
      'input[data-automation-id*="billNumber"]',
      'input[data-automation-id*="bill_number"]',
      'input[data-automation-id*="refNumber"]',
      'input[data-automation-id*="ref_number"]',
      'input[data-automation-id*="referenceNumber"]',
      'input[name*="billNumber"]',
      'input[name*="bill_number"]',
      'input[name*="refNumber"]',
      'input[name*="ref_number"]',
      'input[name*="referenceNumber"]',
      'input[placeholder*="bill number" i]',
      'input[placeholder*="bill #" i]',
      'input[placeholder*="ref number" i]',
      'input[placeholder*="ref #" i]',
      'input[placeholder*="reference number" i]',
      'input[placeholder*="reference #" i]',
      '[data-automation-id*="billNumber"] input',
      '[data-automation-id*="refNumber"] input',
      '[data-automation-id*="referenceNumber"] input',
      '.bill-number input',
      '.ref-number input',
      '.reference-number input',
      'span[data-automation-id*="billNumber"]',
      'span[data-automation-id*="refNumber"]',
      'span[data-automation-id*="referenceNumber"]',
      '.bill-number',
      '.ref-number',
      '.reference-number',
      '[data-testid*="bill-number"]',
      '[data-testid*="ref-number"]',
      '[data-testid*="reference-number"]'
    ];
  } else {
    // Generic selectors for other transaction types
    selectors = [
      'input[data-automation-id*="number"]',
      'input[name*="number"]',
      'input[placeholder*="number" i]',
      '.number-field input',
      '.document-number input'
    ];
  }

  // Helper function to check if element is likely from a list
  const isFromList = (element: Element): boolean => {
    return !!(element.closest('table') || 
              element.closest('[data-automation-id*="list"]') ||
              element.closest('[data-automation-id*="table"]') ||
              element.closest('.list-item') ||
              element.closest('.grid-row') ||
              element.closest('[role="grid"]'));
  };

  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element && !isFromList(element)) {
        const text = element.textContent || (element as HTMLInputElement).value || '';
        if (text.trim() && 
            text !== 'Enter number' && 
            text !== 'Number' &&
            text !== 'Invoice Number' &&
            text !== 'Bill Number' &&
            text !== 'Reference Number' &&
            text !== 'Ref Number' &&
            text !== 'Ref #' &&
            text !== 'Invoice #' &&
            text !== 'Bill #' &&
            !text.toLowerCase().includes('select') &&
            !text.toLowerCase().includes('choose') &&
            !text.toLowerCase().includes('label') &&
            text.length > 0) {
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
    invoice_number: extractInvoiceNumber(),
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