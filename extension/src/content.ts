import { injectButton } from './injectButton.js';
import { openModal } from './modal.js';
import { isQboTransactionPage } from './scraper.js';
import { ensureAuthenticated } from './loginModal.js';

console.log('🚀 QBO Extension: Script loaded!', window.location.href);

function init() {
  console.log('QBO Extension: Init called for URL:', window.location.href);
  
  if (!isQboTransactionPage()) {
    console.log('QBO Extension: Not a transaction page, skipping button injection');
    return;
  }

  console.log('QBO Extension: Transaction page detected, injecting button');
  injectButton(async () => {
    // Lazy authentication check - only validate when user tries to use the feature
    console.log('🔑 Checking authentication before opening modal...');
    const isAuthenticated = await ensureAuthenticated();
    
    if (isAuthenticated) {
      console.log('🔑 Authentication successful, opening modal');
      openModal();
    } else {
      console.log('🔑 Authentication failed or cancelled');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(init, 1000);
  }
}).observe(document, { subtree: true, childList: true });