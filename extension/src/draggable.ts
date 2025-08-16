// Utility functions for making modals draggable and resizable

export interface DraggableOptions {
  handle?: string; // CSS selector for drag handle
  constrainToViewport?: boolean;
}

export interface ResizableOptions {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  handles?: string[]; // Array of handle positions: 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'
}

/**
 * Makes an element draggable
 */
export function makeDraggable(element: HTMLElement, options: DraggableOptions = {}): void {
  const {
    handle = element,
    constrainToViewport = true
  } = options;

  const handleElement = typeof handle === 'string' 
    ? element.querySelector(handle) as HTMLElement
    : handle;

  if (!handleElement) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialX = 0;
  let initialY = 0;

  // Set initial position styles
  if (!element.style.position || element.style.position === 'static') {
    element.style.position = 'fixed';
  }

  handleElement.style.cursor = 'move';
  handleElement.style.userSelect = 'none';

  function onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return; // Only left mouse button

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = element.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;

    // Prevent text selection and other interactions during drag
    document.body.style.userSelect = 'none';
    document.body.style.pointerEvents = 'none';
    element.style.pointerEvents = 'auto'; // Keep modal interactive

    document.addEventListener('mousemove', onMouseMove, { passive: false });
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseUp); // Handle mouse leaving window
    
    e.preventDefault();
    e.stopPropagation();
  }

  function onMouseMove(e: MouseEvent): void {
    if (!isDragging) return;

    // Prevent text selection during drag
    e.preventDefault();

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    let newX = initialX + deltaX;
    let newY = initialY + deltaY;

    if (constrainToViewport) {
      const rect = element.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      // Constrain to viewport bounds - ensure at least 50px of the modal remains visible
      const minVisible = 50;
      newX = Math.max(-rect.width + minVisible, Math.min(newX, viewport.width - minVisible));
      newY = Math.max(0, Math.min(newY, viewport.height - minVisible));
    }

    element.style.left = `${newX}px`;
    element.style.top = `${newY}px`;
    element.style.right = 'auto';
    element.style.bottom = 'auto';
  }

  function onMouseUp(): void {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('mouseleave', onMouseUp);
    
    // Re-enable user selection
    document.body.style.userSelect = '';
    document.body.style.pointerEvents = '';
  }

  handleElement.addEventListener('mousedown', onMouseDown);
}

/**
 * Makes an element resizable
 */
export function makeResizable(element: HTMLElement, options: ResizableOptions = {}): void {
  const {
    minWidth = 300,
    minHeight = 200,
    maxWidth = window.innerWidth * 0.9,
    maxHeight = window.innerHeight * 0.9,
    handles = ['se'] // Default to southeast corner only
  } = options;

  // Set initial resize styles
  element.style.overflow = 'hidden';
  element.style.resize = 'none'; // We'll handle resizing manually

  handles.forEach(handle => {
    createResizeHandle(element, handle, {
      minWidth,
      minHeight,
      maxWidth,
      maxHeight
    });
  });
}

function createResizeHandle(
  element: HTMLElement, 
  position: string, 
  constraints: Required<Pick<ResizableOptions, 'minWidth' | 'minHeight' | 'maxWidth' | 'maxHeight'>>
): void {
  const handle = document.createElement('div');
  handle.className = `qbo-resize-handle qbo-resize-${position}`;
  
  // Base handle styles
  const baseStyles = {
    position: 'absolute',
    backgroundColor: 'transparent',
    zIndex: '10',
  };

  // Position-specific styles
  const positionStyles: Record<string, Record<string, string>> = {
    n: { top: '0px', left: '0px', right: '0px', height: '5px', cursor: 'n-resize' },
    s: { bottom: '0px', left: '0px', right: '0px', height: '5px', cursor: 's-resize' },
    e: { top: '0px', right: '0px', bottom: '0px', width: '5px', cursor: 'e-resize' },
    w: { top: '0px', left: '0px', bottom: '0px', width: '5px', cursor: 'w-resize' },
    ne: { top: '0px', right: '0px', width: '10px', height: '10px', cursor: 'ne-resize' },
    nw: { top: '0px', left: '0px', width: '10px', height: '10px', cursor: 'nw-resize' },
    se: { bottom: '0px', right: '0px', width: '10px', height: '10px', cursor: 'se-resize' },
    sw: { bottom: '0px', left: '0px', width: '10px', height: '10px', cursor: 'sw-resize' }
  };

  // Apply styles
  Object.assign(handle.style, baseStyles, positionStyles[position]);

  // Add visual indicator for corner handles
  if (['ne', 'nw', 'se', 'sw'].includes(position)) {
    handle.style.background = 'linear-gradient(-45deg, transparent 0%, transparent 30%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.1) 70%, transparent 70%)';
  }

  let isResizing = false;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;
  let startLeft = 0;
  let startTop = 0;

  function onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;

    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = element.getBoundingClientRect();
    startWidth = rect.width;
    startHeight = rect.height;
    startLeft = rect.left;
    startTop = rect.top;

    // Prevent text selection and other interactions during resize
    document.body.style.userSelect = 'none';
    document.body.style.pointerEvents = 'none';
    element.style.pointerEvents = 'auto'; // Keep modal interactive

    document.addEventListener('mousemove', onMouseMove, { passive: false });
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseUp); // Handle mouse leaving window
    
    e.preventDefault();
    e.stopPropagation();
  }

  function onMouseMove(e: MouseEvent): void {
    if (!isResizing) return;

    // Prevent text selection during resize
    e.preventDefault();

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;

    // Calculate new dimensions based on handle position
    if (position.includes('e')) newWidth = startWidth + deltaX;
    if (position.includes('w')) {
      newWidth = startWidth - deltaX;
      newLeft = startLeft + deltaX;
    }
    if (position.includes('s')) newHeight = startHeight + deltaY;
    if (position.includes('n')) {
      newHeight = startHeight - deltaY;
      newTop = startTop + deltaY;
    }

    // Apply constraints
    newWidth = Math.max(constraints.minWidth, Math.min(newWidth, constraints.maxWidth));
    newHeight = Math.max(constraints.minHeight, Math.min(newHeight, constraints.maxHeight));

    // Adjust position if we hit min/max constraints on w/n sides
    if (position.includes('w') && newWidth === constraints.minWidth) {
      newLeft = startLeft + startWidth - constraints.minWidth;
    }
    if (position.includes('n') && newHeight === constraints.minHeight) {
      newTop = startTop + startHeight - constraints.minHeight;
    }

    // Apply new styles
    element.style.width = `${newWidth}px`;
    element.style.height = `${newHeight}px`;
    
    if (position.includes('w') || position.includes('n')) {
      element.style.left = `${newLeft}px`;
      element.style.top = `${newTop}px`;
    }
  }

  function onMouseUp(): void {
    isResizing = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('mouseleave', onMouseUp);
    
    // Re-enable user selection
    document.body.style.userSelect = '';
    document.body.style.pointerEvents = '';
  }

  handle.addEventListener('mousedown', onMouseDown);
  element.appendChild(handle);
}

/**
 * Centers an element in the viewport
 */
export function centerElement(element: HTMLElement): void {
  const rect = element.getBoundingClientRect();
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };

  const left = (viewport.width - rect.width) / 2;
  const top = (viewport.height - rect.height) / 2;

  element.style.left = `${Math.max(0, left)}px`;
  element.style.top = `${Math.max(0, top)}px`;
  element.style.right = 'auto';
  element.style.bottom = 'auto';
}