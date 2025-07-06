
import React, { ReactNode, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import LandingPage from './views/LandingPage';
import CustomerView from './views/customer/CustomerView';
import AssociateDashboard from './views/associate/AssociateDashboard';
import CorporateDashboard from './views/corporate/CorporateDashboard';
import CorporateReports from './views/corporate/CorporateReports';
import Setup from './views/setup/Setup';
import Login from './views/login/Login';
import { LogoIcon, ArrowLeftStartOnRectangleIcon, UserIcon } from './components/icons';
import { useAppContext } from './context/AppContext';
import { ActionType } from './types';
import { auth } from './services/firebase';
import CustomerDashboard from './views/customer/CustomerDashboard';
import CustomerLogin from './views/customer/CustomerLogin';
import Toast from './components/common/Toast';

const AuthWrapper = ({ children, roles }: { children: ReactNode; roles: Array<'associate' | 'corporate' | 'customer'> }) => {
  const { state } = useAppContext();
  const location = useLocation();

  if (state.loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!state.currentUser) {
    const loginPath = roles.includes('customer') ? '/customer-login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (!roles.includes(state.currentUser.type)) {
    // If user is of wrong type, send them home, which will redirect to their correct dashboard
    let homePath = '/';
    switch (state.currentUser.type) {
      case 'associate':
        homePath = '/associate';
        break;
      case 'corporate':
        homePath = '/corporate';
        break;
      case 'customer':
        homePath = '/customer-dashboard';
        break;
    }
    return <Navigate to={homePath} replace />;
  }

  return <>{children}</>;
};


function App() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (state.toast) {
      const timer = setTimeout(() => {
        dispatch({ type: ActionType.HIDE_TOAST });
      }, 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [state.toast, dispatch]);

  const handleLogout = () => {
    if (auth) {
      auth.signOut().catch(error => console.error("Error signing out: ", error));
      // The onAuthStateChanged listener in AppContext will handle dispatching the LOGOUT action
    }
    navigate('/');
  };
  
  return (
    <div className="min-h-screen bg-light-bg font-sans">
      <Toast />
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <LogoIcon className="h-8 w-auto text-primary" />
              <span className="text-2xl font-fredoka text-fun-orange">Bravos!</span>
            </Link>
             <div className="flex items-center space-x-4">
              {state.currentUser ? (
                <>
                  {state.currentUser.avatarUrl ? (
                    <img src={state.currentUser.avatarUrl} alt="User" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <UserIcon className="h-8 w-8 text-gray-400 p-1 bg-gray-100 rounded-full"/>
                  )}
                  <button onClick={handleLogout} className="flex items-center space-x-2 text-medium-text hover:text-dark-text">
                    <ArrowLeftStartOnRectangleIcon className="h-6 w-6" />
                    <span className="font-semibold hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="font-semibold text-medium-text hover:text-dark-text transition-colors">
                    Login
                  </Link>
                  <Link to="/setup" className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-hover transition-colors">
                    Join Bravos!
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/customer-login" element={<CustomerLogin />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/customer" element={<CustomerView />} />
          <Route path="/customer/:associateId" element={<CustomerView />} />
          <Route path="/customer-dashboard" element={
            <AuthWrapper roles={['customer']}><CustomerDashboard /></AuthWrapper>
          } />
          <Route path="/associate" element={
            <AuthWrapper roles={['associate']}><AssociateDashboard /></AuthWrapper>
          } />
          <Route path="/corporate" element={
            <AuthWrapper roles={['corporate']}><CorporateDashboard /></AuthWrapper>
          } />
          <Route path="/corporate/reports" element={
            <AuthWrapper roles={['corporate']}><CorporateReports /></AuthWrapper>
          } />
        </Routes>
      </main>
    </div>
  );
}

const AppWrapper = () => (
  <HashRouter>
    <App />
  </HashRouter>
);

export default AppWrapper;
