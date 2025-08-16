export function createChangeRequestButton(onClickHandler: () => void): HTMLElement {
  const button = document.createElement('button');
  button.id = 'qbo-change-request-btn';
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
    <span style="margin-left: 5px;">Request Change</span>
  `;
  button.className = 'qbo-change-request-toolbar-btn';
  
  button.style.cssText = `
    background: #0077C5;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    white-space: nowrap;
  `;
  
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#005a9e';
    button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = '#0077C5';
    button.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
  });
  
  button.addEventListener('click', onClickHandler);
  
  return button;
}

export function injectButton(onClickHandler: () => void): void {
  if (document.getElementById('qbo-change-request-btn')) {
    return;
  }

  const button = createChangeRequestButton(onClickHandler);
  
  // Debug: Log what we're looking for
  console.log('QBO Extension: Looking for toolbar...');
  
  // Try to find the toolbar - look for tabs area or action buttons
  const toolbarSelectors = [
    // Invoice/Expense page specific selectors
    '[data-automation-id*="actions"]',
    '[data-automation-id*="more-actions"]',
    '.invoice-actions',
    '.expense-actions',
    '.bill-actions',
    '.transaction-header-actions',
    '.page-header-actions',
    '.form-actions',
    
    // General toolbar selectors
    'div[role="tablist"]',
    '[data-automation-id*="tab"]',
    '.transaction-tabs',
    '.edit-toolbar',
    'div[class*="tab"]',
    'nav[class*="tab"]',
    '[data-automation-id*="toolbar"]',
    '.toolbar',
    '[role="toolbar"]',
    
    // Header area selectors for invoice/expense pages
    '.transaction-header',
    '.page-header',
    '.form-header',
    'header[class*="transaction"]',
    '.content-header'
  ];
  
  let toolbar = null;
  for (const selector of toolbarSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const htmlElement = element as HTMLElement;
      // Look for visible elements that might be toolbars/action areas
      const isVisible = htmlElement.offsetWidth > 0 && htmlElement.offsetHeight > 0;
      const hasReasonableSize = htmlElement.offsetWidth > 100 && htmlElement.offsetHeight > 15;
      const isNotTooTall = htmlElement.offsetHeight < 120; // Allow taller elements for invoice pages
      
      if (isVisible && hasReasonableSize && isNotTooTall) {
        console.log('QBO Extension: Found potential toolbar:', selector, {
          element: htmlElement,
          width: htmlElement.offsetWidth,
          height: htmlElement.offsetHeight,
          classes: htmlElement.className
        });
        toolbar = htmlElement;
        break;
      }
    }
    if (toolbar) break;
  }
  
  if (toolbar) {
    console.log('QBO Extension: Injecting into toolbar');
    // Create a container div for proper spacing
    const container = document.createElement('div');
    container.style.cssText = `
      display: inline-flex;
      align-items: center;
      margin: 0 12px;
      vertical-align: middle;
    `;
    container.appendChild(button);
    toolbar.appendChild(container);
  } else {
    console.log('QBO Extension: No toolbar found, trying fallback positions');
    
    // Try to find a good fallback position specific to the page type
    const url = window.location.href.toLowerCase();
    const pageType = url.includes('/invoice') ? 'invoice' : 
                    url.includes('/expense') ? 'expense' : 
                    url.includes('/bill') ? 'bill' : 'unknown';
    
    console.log('QBO Extension: Page type detected:', pageType);
    
    // Try to find a form header or main content area to attach to
    const fallbackSelectors = [
      '.form-content',
      '.main-content',
      '.transaction-form',
      '[class*="form-container"]',
      '[class*="page-content"]',
      '.content',
      'main'
    ];
    
    let fallbackContainer = null;
    for (const selector of fallbackSelectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element && element.offsetWidth > 300) {
        fallbackContainer = element;
        console.log('QBO Extension: Found fallback container:', selector);
        break;
      }
    }
    
    if (fallbackContainer) {
      // Insert at the top of the container
      const container = document.createElement('div');
      container.style.cssText = `
        display: flex;
        justify-content: flex-end;
        padding: 10px 20px;
        background: rgba(240, 240, 240, 0.5);
        border-bottom: 1px solid #e0e0e0;
        margin-bottom: 10px;
      `;
      container.appendChild(button);
      fallbackContainer.insertBefore(container, fallbackContainer.firstChild);
    } else {
      // Ultimate fallback: Fixed position
      console.log('QBO Extension: Using fixed position fallback');
      button.style.position = 'fixed';
      button.style.top = '120px';
      button.style.right = '20px'; // Changed from left to right for better visibility
      button.style.zIndex = '10000';
      document.body.appendChild(button);
    }
  }
}