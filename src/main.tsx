import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import './styles/global.css';

// Handle mobile viewport height for keyboard
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Detect keyboard open/close on mobile
function handleKeyboardEvents() {
  let initialViewportHeight = window.innerHeight;
  
  function checkKeyboard() {
    const currentHeight = window.innerHeight;
    const heightDifference = initialViewportHeight - currentHeight;
    
    // If viewport height reduced by more than 150px, likely keyboard is open
    if (heightDifference > 150) {
      document.body.classList.add('keyboard-open');
    } else {
      document.body.classList.remove('keyboard-open');
      initialViewportHeight = currentHeight; // Update baseline
    }
    
    setViewportHeight();
  }
  
  // Debounce resize events
  let resizeTimer: ReturnType<typeof setTimeout>;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(checkKeyboard, 150);
  });
  
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      initialViewportHeight = window.innerHeight;
      checkKeyboard();
    }, 500);
  });
  
  // Handle focus events on inputs
  document.addEventListener('focusin', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      // Small delay to let keyboard animation start
      setTimeout(checkKeyboard, 300);
    }
  });
  
  document.addEventListener('focusout', () => {
    setTimeout(() => {
      document.body.classList.remove('keyboard-open');
      checkKeyboard();
    }, 300);
  });
}

setViewportHeight();
handleKeyboardEvents();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
