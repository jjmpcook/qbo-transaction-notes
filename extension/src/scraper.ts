import { TransactionData } from './types.js';

function getTransactionTypeFromUrl(): string {
  const url = window.location.href.toLowerCase();
  
  if (url.includes('/invoice')) return 'Invoice';
  if (url.includes('/bill')) return 'Bill';
  if (url.includes('/expense')) return 'Expense';
  if (url.includes('/journal')) return 'JournalEntry';
  if (url.includes('/payment')) return 'Payment';
  if (url.includes('/deposit')) return 'Bank Deposit';
  
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
    '[data-automation-id*="deposit"]',
    '.transaction-form',
    '.expense-form',
    '.invoice-form',
    '.deposit-form',
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
    'input[data-automation-id*="deposit"]',
    'input[name*="deposit"]',
    '.currency-input input',
    'input[type="number"]',
    
    // More specific form elements
    '[data-automation-id*="totalAmount"]',
    '[data-automation-id*="lineAmount"]',
    '[data-automation-id*="transactionAmount"]',
    '[data-automation-id*="depositAmount"]',
    '.amount-field input',
    '.total-amount input',
    '.deposit-amount input',
    
    // Display elements but avoid table cells
    '[data-automation-id*="total"]:not(td)',
    '[data-automation-id*="amount"]:not(td)',
    '[data-automation-id*="deposit"]:not(td)',
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
  
  // Helper function to check if element is likely from a list
  const isFromList = (element: Element): boolean => {
    return !!(element.closest('table') || 
              element.closest('[data-automation-id*="list"]') ||
              element.closest('[data-automation-id*="table"]') ||
              element.closest('.list-item') ||
              element.closest('.grid-row') ||
              element.closest('[role="grid"]'));
  };

  // Helper function to validate extracted text
  const isValidNumber = (text: string): boolean => {
    const trimmed = text.trim();
    
    // For Bill transactions, be extra strict about numeric patterns
    if (transactionType === 'Bill') {
      // Must be mostly digits, can have some letters/symbols but should look like a bill number
      return trimmed.length >= 3 &&
             trimmed.length <= 20 &&
             /[\d]/.test(trimmed) && // Contains at least one digit
             trimmed !== 'Enter number' && 
             trimmed !== 'Number' &&
             trimmed !== 'Invoice Number' &&
             trimmed !== 'Bill Number' &&
             trimmed !== 'Reference Number' &&
             trimmed !== 'Ref Number' &&
             trimmed !== 'Ref #' &&
             trimmed !== 'Invoice #' &&
             trimmed !== 'Bill #' &&
             !trimmed.toLowerCase().includes('select') &&
             !trimmed.toLowerCase().includes('choose') &&
             !trimmed.toLowerCase().includes('label') &&
             !trimmed.toLowerCase().includes('placeholder') &&
             !trimmed.toLowerCase().includes('transaction') &&
             !trimmed.toLowerCase().includes('all') &&
             !trimmed.toLowerCase().includes('vendor') &&
             !trimmed.toLowerCase().includes('customer') &&
             !trimmed.toLowerCase().includes('main') &&
             !trimmed.toLowerCase().includes('street') &&
             !trimmed.toLowerCase().includes('address') &&
             !trimmed.toLowerCase().includes('inc') &&
             !trimmed.toLowerCase().includes('llc') &&
             !trimmed.toLowerCase().includes('corp');
    }
    
    // For other transaction types, use the original validation
    return trimmed.length > 0 &&
           trimmed !== 'Enter number' && 
           trimmed !== 'Number' &&
           trimmed !== 'Invoice Number' &&
           trimmed !== 'Bill Number' &&
           trimmed !== 'Reference Number' &&
           trimmed !== 'Ref Number' &&
           trimmed !== 'Ref #' &&
           trimmed !== 'Invoice #' &&
           trimmed !== 'Bill #' &&
           !trimmed.toLowerCase().includes('select') &&
           !trimmed.toLowerCase().includes('choose') &&
           !trimmed.toLowerCase().includes('label') &&
           !trimmed.toLowerCase().includes('placeholder');
  };

  // Strategy 1: Transaction-specific selectors
  let specificSelectors: string[] = [];
  
  if (transactionType === 'Invoice') {
    specificSelectors = [
      // Most specific invoice number selectors first
      'input[data-automation-id*="invoiceNumber"]',
      'input[data-automation-id*="invoice_number"]',
      'input[data-automation-id*="invoiceno"]',
      'input[name*="invoiceNumber"]',
      'input[name*="invoice_number"]',
      'input[name*="invoiceno"]',
      'input[id*="invoiceNumber"]',
      'input[id*="invoice_number"]',
      'input[placeholder*="invoice number" i]',
      'input[placeholder*="invoice #" i]',
      '[data-automation-id*="invoiceNumber"] input',
      '[data-automation-id*="invoice_number"] input',
      '.invoice-number input',
      '.invoice-field input',
      '.invoiceno input'
    ];
  } else if (transactionType === 'Expense') {
    // Expense-specific selectors (focusing on reference numbers)
    specificSelectors = [
      'input[data-automation-id*="refNum"]',
      'input[data-automation-id*="ref_num"]',
      'input[data-automation-id*="refNumber"]',
      'input[data-automation-id*="ref_number"]',
      'input[data-automation-id*="referenceNumber"]',
      'input[name*="refNum"]',
      'input[name*="ref_num"]',
      'input[name*="refNumber"]',
      'input[name*="ref_number"]',
      'input[name*="referenceNumber"]',
      'input[placeholder*="ref" i]',
      'input[placeholder*="reference" i]',
      '.ref-number input',
      '.ref-num input',
      '.reference-number input'
    ];
  } else if (transactionType === 'Bill') {
    // Bill-specific selectors (focusing on bill numbers) - targeting the actual QBO field structure
    specificSelectors = [
      // QBO-specific patterns for bill number fields
      'input[data-automation-id*="billNo"]',
      'input[data-automation-id*="bill_no"]',
      'input[data-automation-id*="billNumber"]',
      'input[data-automation-id*="bill_number"]',
      'input[data-automation-id*="billNum"]',
      'input[data-automation-id*="bill_num"]',
      'input[data-automation-id*="vendorBillNumber"]',
      'input[data-automation-id*="vendor_bill_number"]',
      
      // Name attribute patterns
      'input[name*="billNo"]',
      'input[name*="bill_no"]',
      'input[name*="billNumber"]',
      'input[name*="bill_number"]',
      'input[name*="billNum"]',
      'input[name*="bill_num"]',
      'input[name*="vendorBillNumber"]',
      'input[name*="vendor_bill_number"]',
      
      // ID attribute patterns
      'input[id*="billNo"]',
      'input[id*="bill_no"]',
      'input[id*="billNumber"]',
      'input[id*="bill_number"]',
      'input[id*="billNum"]',
      'input[id*="bill_num"]',
      
      // Placeholder patterns
      'input[placeholder*="bill no" i]',
      'input[placeholder*="bill number" i]',
      'input[placeholder*="bill #" i]',
      'input[placeholder*="vendor bill" i]',
      
      // Container-based selectors
      '[data-automation-id*="billNo"] input',
      '[data-automation-id*="bill_no"] input',
      '[data-automation-id*="billNumber"] input',
      '[data-automation-id*="bill_number"] input',
      '[data-automation-id*="billNum"] input',
      '[data-automation-id*="bill_num"] input',
      
      // CSS class patterns
      '.bill-number input',
      '.bill-no input',
      '.bill-num input',
      '.vendor-bill-number input',
      '.vendor-bill input',
      
      // Fallback to reference number selectors for bills
      'input[data-automation-id*="refNum"]',
      'input[data-automation-id*="ref_num"]',
      'input[data-automation-id*="refNumber"]',
      'input[data-automation-id*="ref_number"]',
      'input[data-automation-id*="referenceNumber"]',
      'input[name*="refNum"]',
      'input[name*="ref_num"]',
      'input[name*="refNumber"]',
      'input[name*="ref_number"]',
      'input[name*="referenceNumber"]',
      'input[placeholder*="ref" i]',
      'input[placeholder*="reference" i]',
      '.ref-number input',
      '.ref-num input',
      '.reference-number input'
    ];
  }

  // Strategy 1A: For Bill transactions, try to find input near "Bill no." text - more precise approach
  if (transactionType === 'Bill') {
    try {
      // Look specifically for labels or text that exactly matches "Bill no." pattern
      const possibleLabels = document.querySelectorAll('label, span, div, td, th');
      for (const element of possibleLabels) {
        const text = element.textContent?.trim() || '';
        
        // Match exactly "Bill no." or "Bill no" (but not longer phrases containing it)
        if (text === 'Bill no.' || text === 'Bill no' || text === 'Bill #' || 
            (text.startsWith('Bill no') && text.length <= 10)) {
          
          // Look for input in the same container or nearby
          let container = element.parentElement;
          
          // Try multiple container levels
          for (let level = 0; level < 3; level++) {
            if (container) {
              const inputs = container.querySelectorAll('input[type="text"], input:not([type])');
              for (const input of inputs) {
                if (!isFromList(input)) {
                  const value = (input as HTMLInputElement).value?.trim() || '';
                  // Make sure it's a number-like value and not text
                  if (value && /^\d+$/.test(value) && value.length >= 3) {
                    return value;
                  }
                }
              }
              container = container.parentElement;
            }
          }
          
          // Also check next siblings for input fields
          let sibling = element.nextElementSibling;
          let siblingCount = 0;
          while (sibling && siblingCount < 3) {
            if (sibling.tagName === 'INPUT') {
              const value = (sibling as HTMLInputElement).value?.trim() || '';
              if (value && /^\d+$/.test(value) && value.length >= 3) {
                return value;
              }
            }
            // Check for input within sibling
            const siblingInput = sibling.querySelector('input');
            if (siblingInput) {
              const value = (siblingInput as HTMLInputElement).value?.trim() || '';
              if (value && /^\d+$/.test(value) && value.length >= 3) {
                return value;
              }
            }
            sibling = sibling.nextElementSibling;
            siblingCount++;
          }
        }
      }
    } catch (e) {
      // Continue to next strategy
    }
  }

  // Strategy 1B: Try transaction-specific selectors
  for (const selector of specificSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && !isFromList(element)) {
        const text = element.textContent || (element as HTMLInputElement).value || '';
        if (isValidNumber(text)) {
          return text.trim();
        }
      }
    } catch (e) {
      continue;
    }
  }

  // Strategy 2: Generic "number" field selectors
  const genericSelectors = [
    'input[data-automation-id*="number"]:not([data-automation-id*="phone"]):not([data-automation-id*="account"])',
    'input[name*="number"]:not([name*="phone"]):not([name*="account"])',
    'input[id*="number"]:not([id*="phone"]):not([id*="account"])',
    'input[placeholder*="number" i]:not([placeholder*="phone" i]):not([placeholder*="account" i])',
    '.number-field input',
    '.document-number input',
    '.doc-number input'
  ];

  for (const selector of genericSelectors) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (!isFromList(element)) {
          const text = element.textContent || (element as HTMLInputElement).value || '';
          if (isValidNumber(text)) {
            return text.trim();
          }
        }
      }
    } catch (e) {
      continue;
    }
  }

  // Strategy 3: Broader search for any input that might contain a number
  const broadSelectors = [
    'input[type="text"]',
    'input:not([type])'
  ];

  for (const selector of broadSelectors) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (!isFromList(element)) {
          // Check if the input field looks like it could be a number field
          const placeholder = (element as HTMLInputElement).placeholder?.toLowerCase() || '';
          const name = (element as HTMLInputElement).name?.toLowerCase() || '';
          const id = (element as HTMLInputElement).id?.toLowerCase() || '';
          const className = (element as HTMLInputElement).className?.toLowerCase() || '';
          
          const looksLikeNumberField = 
            placeholder.includes('number') ||
            placeholder.includes('ref') ||
            placeholder.includes('bill') ||
            placeholder.includes('#') ||
            name.includes('number') ||
            name.includes('ref') ||
            name.includes('bill') ||
            id.includes('number') ||
            id.includes('ref') ||
            id.includes('bill') ||
            className.includes('number') ||
            className.includes('ref') ||
            className.includes('bill');
            
          // Special handling for Bill transactions
          if (transactionType === 'Bill') {
            const looksLikeBillField = 
              placeholder.includes('bill') ||
              name.includes('bill') ||
              id.includes('bill') ||
              className.includes('bill') ||
              looksLikeNumberField;
              
            if (looksLikeBillField) {
              const text = (element as HTMLInputElement).value || '';
              if (isValidNumber(text)) {
                return text.trim();
              }
            }
          } else if (looksLikeNumberField) {
            const text = (element as HTMLInputElement).value || '';
            if (isValidNumber(text)) {
              return text.trim();
            }
          }
        }
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function extractCreatedBy(): string | null {
  // Strategy 1: Look for user/profile information
  const userSelectors = [
    // Common user profile selectors
    '.user-name',
    '.current-user',
    '[data-automation-id*="user"]',
    '.user-badge',
    '.profile-name',
    '.account-name',
    '.user-info',
    '[data-testid*="user"]',
    '[data-testid*="profile"]',
    '.user-menu',
    '.profile-menu',
    
    // QBO specific user selectors
    '[data-automation-id*="profile"]',
    '[data-automation-id*="account"]',
    '.qbo-user',
    '.user-display-name',
    '.current-user-name',
    '.logged-in-user',
    
    // Navigation/header user info
    'header .user',
    'nav .user',
    '.top-bar .user',
    '.navigation .user',
    '.header-user',
    '.nav-user'
  ];

  for (const selector of userSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent?.trim();
        if (text && text.length > 2 && text.length < 50 && 
            !text.toLowerCase().includes('menu') &&
            !text.toLowerCase().includes('dropdown') &&
            !text.toLowerCase().includes('button')) {
          return text;
        }
      }
    } catch (e) {
      continue;
    }
  }

  // Strategy 2: Look for company information from page title or header
  try {
    // Check page title for company name
    const pageTitle = document.title;
    if (pageTitle) {
      // QBO page titles often have format: "Transaction - Company Name | QuickBooks"
      const titleParts = pageTitle.split(' | ');
      if (titleParts.length >= 2) {
        const companyPart = titleParts[titleParts.length - 2]; // Get part before "QuickBooks"
        if (companyPart && companyPart !== 'QuickBooks' && companyPart.length > 2) {
          // Check if it contains transaction type, if so, look for company after dash
          if (companyPart.includes(' - ')) {
            const dashParts = companyPart.split(' - ');
            const possibleCompany = dashParts[dashParts.length - 1];
            if (possibleCompany && possibleCompany.length > 2) {
              return possibleCompany.trim();
            }
          } else {
            return companyPart.trim();
          }
        }
      }
    }
  } catch (e) {
    // Continue to next strategy
  }

  // Strategy 3: Look for company name in common locations
  const companySelectors = [
    '.company-name',
    '.business-name',
    '.organization-name',
    '[data-automation-id*="company"]',
    '[data-automation-id*="business"]',
    '[data-automation-id*="organization"]',
    '.qbo-company',
    '.company-info',
    '.business-info',
    '.header-company',
    '.nav-company'
  ];

  for (const selector of companySelectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent?.trim();
        if (text && text.length > 2 && text.length < 100 &&
            !text.toLowerCase().includes('select') &&
            !text.toLowerCase().includes('choose') &&
            !text.toLowerCase().includes('menu')) {
          return text;
        }
      }
    } catch (e) {
      continue;
    }
  }

  // Strategy 4: Extract from URL if it contains identifiable information
  try {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Look for company ID or realmId in URL parameters
    const realmId = urlParams.get('realmId');
    if (realmId) {
      return `Company ${realmId}`;
    }
  } catch (e) {
    // Continue
  }

  // Strategy 5: Look for any element in the header that might contain user/company info
  try {
    const headerElements = document.querySelectorAll('header *, nav *, .top-bar *, .navigation *');
    for (const element of headerElements) {
      const text = element.textContent?.trim() || '';
      if (text && text.length >= 3 && text.length <= 50 &&
          /^[A-Za-z0-9\s\-&.,()]+$/.test(text) && // Only allow reasonable characters
          !text.toLowerCase().includes('quickbooks') &&
          !text.toLowerCase().includes('menu') &&
          !text.toLowerCase().includes('search') &&
          !text.toLowerCase().includes('help') &&
          !text.toLowerCase().includes('settings') &&
          !text.toLowerCase().includes('logout') &&
          !text.toLowerCase().includes('sign') &&
          !text.toLowerCase().includes('toggle') &&
          !text.toLowerCase().includes('button') &&
          !text.toLowerCase().includes('dropdown') &&
          !text.match(/^\d+$/)) { // Not just numbers
        
        // If it looks like a person's name (has space) or company name, return it
        if (text.includes(' ') || text.match(/^[A-Z][a-z]+ [A-Z][a-z]+/) || 
            text.includes('LLC') || text.includes('Inc') || text.includes('Corp')) {
          return text;
        }
      }
    }
  } catch (e) {
    // Continue
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
    (url.includes('/deposit') && !url.includes('/deposits')) || // Single deposit, not list
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
    url.includes('/deposits') ||
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
    hasDeposit: url.includes('/deposit'),
    hasTransaction: url.includes('/transaction'),
    finalResult: isQbo && isTransactionPage && !isListPage
  });
  
  return isQbo && isTransactionPage && !isListPage;
}