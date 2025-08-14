import { getTransactionData } from './scraper.js';
import { NotePayload, TransactionData, ApiError } from './types.js';

declare const process: any;
const BACKEND_URL = 'https://qbo-transaction-notes.onrender.com';

function createModalHTML(transactionData: TransactionData): string {
  return `
    <div id="qbo-note-modal-overlay" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div id="qbo-note-modal" style="
        background: white;
        border-radius: 8px;
        padding: 24px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        position: relative;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333; font-size: 20px;">Add Transaction Note</h2>
          <button id="qbo-modal-close" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">&times;</button>
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 4px; color: #333; font-weight: 500;">Transaction URL</label>
          <input type="text" value="${transactionData.transaction_url}" readonly style="
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: #f8f9fa;
            color: #666;
            box-sizing: border-box;
          ">
        </div>
        
        <div style="display: flex; gap: 16px; margin-bottom: 16px;">
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 4px; color: #333; font-weight: 500;">Type</label>
            <input id="qbo-transaction-type" type="text" value="${transactionData.transaction_type}" style="
              width: 100%;
              padding: 8px 12px;
              border: 1px solid #ccc;
              border-radius: 4px;
              background: white;
              color: #333;
              box-sizing: border-box;
            ">
          </div>
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 4px; color: #333; font-weight: 500;">Transaction ID</label>
            <input id="qbo-transaction-id" type="text" value="${transactionData.transaction_id || ''}" style="
              width: 100%;
              padding: 8px 12px;
              border: 1px solid #ccc;
              border-radius: 4px;
              background: white;
              color: #333;
              box-sizing: border-box;
            ">
          </div>
        </div>
        
        <div style="display: flex; gap: 16px; margin-bottom: 16px;">
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 4px; color: #333; font-weight: 500;">Date</label>
            <input id="qbo-date" type="text" value="${transactionData.date || ''}" style="
              width: 100%;
              padding: 8px 12px;
              border: 1px solid #ccc;
              border-radius: 4px;
              background: white;
              color: #333;
              box-sizing: border-box;
            ">
          </div>
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 4px; color: #333; font-weight: 500;">Amount</label>
            <input id="qbo-amount" type="number" step="0.01" value="${transactionData.amount || ''}" style="
              width: 100%;
              padding: 8px 12px;
              border: 1px solid #ccc;
              border-radius: 4px;
              background: white;
              color: #333;
              box-sizing: border-box;
            ">
          </div>
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 4px; color: #333; font-weight: 500;">Customer/Vendor</label>
          <input id="qbo-customer-vendor" type="text" value="${transactionData.customer_vendor || ''}" style="
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            background: white;
            color: #333;
            box-sizing: border-box;
          ">
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 4px; color: #333; font-weight: 500;">Note *</label>
          <textarea id="qbo-note-textarea" placeholder="Enter your note here..." style="
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            min-height: 100px;
            resize: vertical;
            font-family: inherit;
            box-sizing: border-box;
          "></textarea>
        </div>
        
        <div id="qbo-error-message" style="
          color: #dc3545;
          margin-bottom: 16px;
          font-size: 14px;
          display: none;
        "></div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="qbo-modal-cancel" style="
            background: #6c757d;
            color: white;
            border: 2px solid transparent;
            border-radius: 4px;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
          ">Cancel</button>
          <button id="qbo-modal-submit" disabled style="
            background: #0077C5;
            color: white;
            border: 2px solid transparent;
            border-radius: 4px;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
          ">Send Note</button>
        </div>
        
        <div id="qbo-loading" style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          display: none;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        ">
          <div style="text-align: center;">
            <div style="margin-bottom: 8px;">Sending...</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function showError(message: string): void {
  const errorElement = document.getElementById('qbo-error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

function hideError(): void {
  const errorElement = document.getElementById('qbo-error-message');
  if (errorElement) {
    errorElement.style.display = 'none';
  }
}

function showLoading(show: boolean): void {
  const loadingElement = document.getElementById('qbo-loading');
  if (loadingElement) {
    loadingElement.style.display = show ? 'flex' : 'none';
  }
}

function updateSubmitButton(): void {
  const textarea = document.getElementById('qbo-note-textarea') as HTMLTextAreaElement;
  const submitButton = document.getElementById('qbo-modal-submit') as HTMLButtonElement;
  
  if (textarea && submitButton) {
    const hasNote = textarea.value.trim().length > 0;
    submitButton.disabled = !hasNote;
    submitButton.style.opacity = hasNote ? '1' : '0.5';
    submitButton.style.cursor = hasNote ? 'pointer' : 'not-allowed';
  }
}

async function submitNote(transactionData: TransactionData, note: string): Promise<void> {
  // Get updated values from form fields
  const transactionTypeInput = document.getElementById('qbo-transaction-type') as HTMLInputElement;
  const transactionIdInput = document.getElementById('qbo-transaction-id') as HTMLInputElement;
  const dateInput = document.getElementById('qbo-date') as HTMLInputElement;
  const amountInput = document.getElementById('qbo-amount') as HTMLInputElement;
  const customerVendorInput = document.getElementById('qbo-customer-vendor') as HTMLInputElement;

  const payload: NotePayload = {
    transaction_url: transactionData.transaction_url,
    transaction_id: transactionIdInput?.value || transactionData.transaction_id || '',
    transaction_type: transactionTypeInput?.value || transactionData.transaction_type,
    date: dateInput?.value || transactionData.date || '',
    amount: parseFloat(amountInput?.value) || transactionData.amount || 0,
    customer_vendor: customerVendorInput?.value || transactionData.customer_vendor || '',
    note: note,
    created_by: transactionData.created_by || ''
  };

  try {
    const response = await fetch(`${BACKEND_URL}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    await response.json();
    
    const modal = document.getElementById('qbo-note-modal');
    if (modal) {
      modal.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="color: #28a745; font-size: 48px; margin-bottom: 16px;">✓</div>
          <h3 style="margin: 0 0 8px 0; color: #333;">Note Sent Successfully!</h3>
          <p style="margin: 0; color: #666;">Your note has been saved and team notifications sent.</p>
        </div>
      `;
      
      setTimeout(closeModal, 2000);
    }

  } catch (error) {
    showError(`Failed to send note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

function closeModal(): void {
  const overlay = document.getElementById('qbo-note-modal-overlay');
  if (overlay) {
    overlay.remove();
  }
}

export function openModal(): void {
  if (document.getElementById('qbo-note-modal-overlay')) {
    return;
  }

  const transactionData = getTransactionData();
  const modalHTML = createModalHTML(transactionData);
  
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer.firstElementChild!);

  const textarea = document.getElementById('qbo-note-textarea') as HTMLTextAreaElement;
  const submitButton = document.getElementById('qbo-modal-submit') as HTMLButtonElement;
  const cancelButton = document.getElementById('qbo-modal-cancel') as HTMLButtonElement;
  const closeButton = document.getElementById('qbo-modal-close') as HTMLButtonElement;
  const overlay = document.getElementById('qbo-note-modal-overlay') as HTMLElement;

  textarea.addEventListener('input', () => {
    updateSubmitButton();
    hideError();
  });

  submitButton.addEventListener('click', async () => {
    const note = textarea.value.trim();
    if (!note) return;

    showLoading(true);
    hideError();

    try {
      await submitNote(transactionData, note);
    } catch (error) {
      showLoading(false);
    }
  });

  cancelButton.addEventListener('click', closeModal);
  closeButton.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
    // Handle Enter key to submit (Ctrl+Enter or just Enter when not in textarea)
    if (e.key === 'Enter' && (e.ctrlKey || e.target !== textarea)) {
      e.preventDefault();
      if (!submitButton.disabled) {
        submitButton.click();
      }
    }
  });

  // Handle Tab key navigation and Enter key in textarea
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      submitButton.focus();
    }
    // Allow Ctrl+Enter to submit from textarea
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      if (!submitButton.disabled) {
        submitButton.click();
      }
    }
  });

  // Handle keyboard navigation for submit button
  submitButton.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      textarea.focus();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!submitButton.disabled) {
        submitButton.click();
      }
    }
  });

  // Add focus indicators for buttons
  submitButton.addEventListener('focus', () => {
    submitButton.style.border = '2px solid #FFD700';
    submitButton.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.3)';
  });

  submitButton.addEventListener('blur', () => {
    submitButton.style.border = '2px solid transparent';
    submitButton.style.boxShadow = 'none';
  });

  cancelButton.addEventListener('focus', () => {
    cancelButton.style.border = '2px solid #FFD700';
    cancelButton.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.3)';
  });

  cancelButton.addEventListener('blur', () => {
    cancelButton.style.border = '2px solid transparent';
    cancelButton.style.boxShadow = 'none';
  });

  // Add focus indicator for textarea
  textarea.addEventListener('focus', () => {
    textarea.style.border = '2px solid #0077C5';
    textarea.style.boxShadow = '0 0 0 3px rgba(0, 119, 197, 0.2)';
  });

  textarea.addEventListener('blur', () => {
    textarea.style.border = '1px solid #ddd';
    textarea.style.boxShadow = 'none';
  });

  setTimeout(() => textarea.focus(), 100);
}