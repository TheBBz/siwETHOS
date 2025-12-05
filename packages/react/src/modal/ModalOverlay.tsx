/**
 * Modal Overlay Component
 */

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  portalTarget?: HTMLElement | null;
  disablePortal?: boolean;
}

/**
 * Modal overlay with backdrop and positioning
 */
export function ModalOverlay({
  isOpen,
  onClose,
  children,
  portalTarget,
  disablePortal = false,
}: ModalOverlayProps) {
  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Backdrop with blur */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal content - Glassmorphism style */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '400px',
          maxHeight: '90vh',
          overflow: 'hidden',
          animation: 'modalFadeIn 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );

  // Render with or without portal
  if (disablePortal) {
    return content;
  }

  const target = portalTarget ?? (typeof document !== 'undefined' ? document.body : null);
  
  if (!target) {
    return content;
  }

  return createPortal(content, target);
}
