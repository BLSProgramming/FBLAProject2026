import { useState, useCallback, createContext, useContext } from 'react';

const ModalContext = createContext();

/**
 * Reusable styled modal system to replace native confirm() and alert().
 * 
 * Usage:
 *   const { showAlert, showConfirm } = useModal();
 *   await showAlert('Something happened');
 *   const ok = await showConfirm('Delete this item?');
 */
export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null);

  const showAlert = useCallback((message, title = 'Notice') => {
    return new Promise((resolve) => {
      setModal({ type: 'alert', title, message, resolve });
    });
  }, []);

  const showConfirm = useCallback((message, title = 'Confirm') => {
    return new Promise((resolve) => {
      setModal({ type: 'confirm', title, message, resolve });
    });
  }, []);

  const close = useCallback((result) => {
    if (modal?.resolve) modal.resolve(result);
    setModal(null);
  }, [modal]);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {modal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => close(modal.type === 'confirm' ? false : undefined)}
          />
          {/* Modal */}
          <div className="relative bg-gray-900 border border-yellow-500/30 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">{modal.title}</h3>
            <p className="text-yellow-200 mb-6 leading-relaxed">{modal.message}</p>
            <div className="flex justify-end gap-3">
              {modal.type === 'confirm' && (
                <button
                  onClick={() => close(false)}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => close(modal.type === 'confirm' ? true : undefined)}
                className="px-4 py-2 rounded-lg bg-yellow-500 text-black hover:bg-yellow-400 transition-colors font-semibold"
                autoFocus
              >
                {modal.type === 'confirm' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
