export function createAddNoteButton(onClickHandler: () => void): HTMLElement {
  const button = document.createElement('button');
  button.id = 'qbo-add-note-btn';
  button.textContent = 'Add Note';
  button.className = 'qbo-add-note-button';
  
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    background: #0077C5;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 119, 197, 0.3);
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#005a9e';
    button.style.transform = 'translateY(-1px)';
    button.style.boxShadow = '0 4px 12px rgba(0, 119, 197, 0.4)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = '#0077C5';
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 2px 8px rgba(0, 119, 197, 0.3)';
  });
  
  button.addEventListener('click', onClickHandler);
  
  return button;
}

export function injectButton(onClickHandler: () => void): void {
  if (document.getElementById('qbo-add-note-btn')) {
    return;
  }

  const button = createAddNoteButton(onClickHandler);
  document.body.appendChild(button);
}