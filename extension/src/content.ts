import { injectButton } from './injectButton.js';
import { openModal } from './modal.js';
import { isQboTransactionPage } from './scraper.js';

function init() {
  if (!isQboTransactionPage()) {
    return;
  }

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