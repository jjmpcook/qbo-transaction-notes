import { injectButton } from './injectButton.js';
import { openModal } from './modal.js';
import { isQboTransactionPage } from './scraper.js';

console.log('🚀 QBO Extension: Script loaded!', window.location.href);

function init() {
  console.log('QBO Extension: Init called for URL:', window.location.href);
  
  if (!isQboTransactionPage()) {
    console.log('QBO Extension: Not a transaction page, skipping button injection');
    return;
  }

  console.log('QBO Extension: Transaction page detected, injecting button');
  injectButton(() => {
    openModal();
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