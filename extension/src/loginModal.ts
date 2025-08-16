import { AuthService } from './auth.js';
import { LoginResult } from './types.js';
import { makeDraggable, makeResizable, centerElement } from './draggable.js';

function createLoginModalHTML(): string {
  return `
    <div id="qbo-login-modal-overlay" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10002;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div id="qbo-login-modal" style="
        background: white;
        border-radius: 8px;
        padding: 32px;
        width: 400px;
        min-width: 350px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        position: fixed;
        border: 1px solid #ddd;
      ">
        <div id="qbo-login-header" style="text-align: center; margin-bottom: 24px; cursor: move; padding: 8px; margin: -8px -8px 16px -8px; border-radius: 8px 8px 0 0; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
          <div style="color: #0077C5; font-size: 48px; margin-bottom: 16px;">🔐</div>
          <h2 style="margin: 0 0 8px 0; color: #333; font-size: 24px;">Authentication Required</h2>
          <p style="margin: 0; color: #666; font-size: 14px;">
            Please sign in to use QBO Transaction Notes
          </p>
        </div>
        
        <form id="qbo-login-form">
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; color: #333; font-weight: 500;">Email Address</label>
            <input 
              id="qbo-login-email" 
              type="email" 
              required
              placeholder="Enter your email address"
              style="
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #ddd;
                border-radius: 6px;
                font-size: 16px;
                box-sizing: border-box;
                transition: border-color 0.2s ease;
              "
            >
          </div>
          
          <div id="qbo-login-error" style="
            color: #dc3545;
            margin-bottom: 20px;
            font-size: 14px;
            display: none;
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            padding: 12px;
          "></div>
          
          <div style="display: flex; gap: 12px; justify-content: stretch;">
            <button 
              id="qbo-login-cancel" 
              type="button"
              style="
                flex: 1;
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 12px 20px;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.2s ease;
              "
            >Cancel</button>
            
            <button 
              id="qbo-login-submit" 
              type="submit"
              style="
                flex: 2;
                background: #0077C5;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 12px 20px;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.2s ease;
                font-weight: 500;
              "
            >Sign In</button>
          </div>
        </form>
        
        <div id="qbo-login-loading" style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.95);
          display: none;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        ">
          <div style="text-align: center;">
            <div style="
              width: 32px;
              height: 32px;
              border: 3px solid #f3f3f3;
              border-top: 3px solid #0077C5;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 16px auto;
            "></div>
            <div style="color: #333; font-size: 16px;">Validating subscription...</div>
          </div>
        </div>
      </div>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      #qbo-login-email:focus {
        outline: none;
        border-color: #0077C5;
        box-shadow: 0 0 0 3px rgba(0, 119, 197, 0.2);
      }
      
      #qbo-login-submit:hover {
        background: #005a9a;
      }
      
      #qbo-login-cancel:hover {
        background: #5a6268;
      }
      
      #qbo-login-submit:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
    </style>
  `;
}

function showError(message: string): void {
  const errorElement = document.getElementById('qbo-login-error');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

function hideError(): void {
  const errorElement = document.getElementById('qbo-login-error');
  if (errorElement) {
    errorElement.style.display = 'none';
  }
}

function showLoading(show: boolean): void {
  const loadingElement = document.getElementById('qbo-login-loading');
  if (loadingElement) {
    loadingElement.style.display = show ? 'flex' : 'none';
  }
}

function closeLoginModal(): void {
  const overlay = document.getElementById('qbo-login-modal-overlay');
  if (overlay) {
    overlay.remove();
  }
}

function setupEventListeners(
  resolve: (result: LoginResult) => void,
  _reject: (error: Error) => void
): void {
  const form = document.getElementById('qbo-login-form') as HTMLFormElement;
  const emailInput = document.getElementById('qbo-login-email') as HTMLInputElement;
  const cancelButton = document.getElementById('qbo-login-cancel') as HTMLButtonElement;
  const overlay = document.getElementById('qbo-login-modal-overlay') as HTMLElement;

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    if (!email) {
      showError('Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      showError('Please enter a valid email address');
      return;
    }

    showLoading(true);
    hideError();

    try {
      // Store credentials
      await AuthService.setUserCredentials({ email });
      
      // Validate subscription
      const isValid = await AuthService.validateSubscription();
      
      if (isValid) {
        // Success - close modal and resolve
        closeLoginModal();
        resolve({ success: true });
      } else {
        showLoading(false);
        showError('Invalid subscription. Please check your account status or contact support.');
      }
    } catch (error) {
      showLoading(false);
      console.error('🔑 Login: Validation error:', error);
      showError('Unable to validate subscription. Please check your internet connection and try again.');
    }
  });

  // Cancel button
  cancelButton.addEventListener('click', () => {
    closeLoginModal();
    resolve({ success: false, error: 'User cancelled login' });
  });

  // Escape key and overlay click
  const handleCancel = () => {
    closeLoginModal();
    resolve({ success: false, error: 'User cancelled login' });
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      handleCancel();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  });

  // Focus email input
  setTimeout(() => emailInput.focus(), 100);
}

/**
 * Show login modal and return promise that resolves when user completes login
 */
export function showLoginModal(): Promise<LoginResult> {
  return new Promise((resolve, reject) => {
    // Don't show multiple modals
    if (document.getElementById('qbo-login-modal-overlay')) {
      resolve({ success: false, error: 'Modal already open' });
      return;
    }

    // Create and inject modal
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = createLoginModalHTML();
    document.body.appendChild(modalContainer.firstElementChild!);

    // Setup event listeners
    setupEventListeners(resolve, reject);

    // Make modal draggable and resizable
    const modal = document.getElementById('qbo-login-modal') as HTMLElement;
    if (modal) {
      // Center the modal initially
      centerElement(modal);
      
      // Make it draggable by the header
      makeDraggable(modal, { 
        handle: '#qbo-login-header',
        constrainToViewport: true 
      });
      
      // Make it resizable
      makeResizable(modal, {
        minWidth: 350,
        minHeight: 300,
        handles: ['se', 's', 'e']
      });
    }
  });
}

/**
 * Check if user needs to login and show modal if needed
 */
export async function ensureAuthenticated(): Promise<boolean> {
  try {
    // Check if user has stored credentials
    const hasCredentials = await AuthService.hasStoredCredentials();
    
    if (!hasCredentials) {
      // No credentials - show login modal
      const result = await showLoginModal();
      return result.success;
    }

    // Has credentials - validate subscription
    const isValid = await AuthService.validateSubscription();
    
    if (!isValid) {
      // Invalid subscription - show login modal for re-auth
      const result = await showLoginModal();
      return result.success;
    }

    return true;
  } catch (error) {
    console.error('🔑 Auth: Error ensuring authentication:', error);
    return false;
  }
}