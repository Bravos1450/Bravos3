import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { ActionType } from '../../types';

const Toast: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { toast } = state;

  if (!toast) {
    return null;
  }

  const isSuccess = toast.type === 'success';
  const bgColor = isSuccess ? 'bg-secondary' : 'bg-red-500';
  const icon = isSuccess ? (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  return (
    <div 
      className={`fixed top-5 right-5 z-50 flex items-center w-full max-w-xs p-4 rounded-lg text-white shadow-lg ${bgColor} animate-fade-in-down`}
      role="alert"
    >
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div className="ml-3 text-sm font-semibold">
        {toast.message}
      </div>
      <button 
        onClick={() => dispatch({ type: ActionType.HIDE_TOAST })} 
        className="ml-auto -mx-1.5 -my-1.5 p-1.5 text-white rounded-lg inline-flex h-8 w-8 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Dismiss"
      >
        <span className="sr-only">Dismiss</span>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
