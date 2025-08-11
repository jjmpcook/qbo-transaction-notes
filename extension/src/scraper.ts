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
  const selectors = [
    '[data-automation-id*="customer"]',
    '[data-automation-id*="vendor"]',
    '[data-automation-id*="payee"]',
    'input[name*="customer"]',
    'input[name*="vendor"]',
    '.customer-field',
    '.vendor-field',
    'td[data-col="name"]',
    '[data-automation-id="nameAddressComboBox"] input',
    '[data-testid*="customer"]',
    '[data-testid*="vendor"]',
    '.name-field input',
    'span[data-automation-id*="customer"]',
    'span[data-automation-id*="vendor"]',
    'h1', // Sometimes company name is in page title
    '.entity-name'
  ];

  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || (element as HTMLInputElement).value || '';
        if (text.trim() && 
            text !== 'Select...' && 
            text !== 'Choose a customer' && 
            text !== 'Choose a vendor' &&
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
  return url.includes('qbo.intuit.com') && (
    url.includes('/invoice') ||
    url.includes('/bill') ||
    url.includes('/expense') ||
    url.includes('/journal') ||
    url.includes('/payment') ||
    url.includes('txnid=')
  );
}