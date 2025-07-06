
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ActionType, CurrentUser } from '../../types';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import { UsersIcon, BuildingOfficeIcon } from '../../components/icons';
import { auth, db } from '../../services/firebase';


const Login: React.FC = () => {
    const { dispatch } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleFirebaseLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Please enter both email and password.', type: 'error' } });
            return;
        }
        if (!auth || !db) {
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Firebase service is not available.', type: 'error' } });
            return;
        }
        setIsLoading(true);
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            if (!userCredential.user) throw new Error("Login failed, user not found.");
            
            const userDoc = await db.collection('users').doc(userCredential.user.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data()!;
                
                if (userData.type === 'customer') {
                    await auth.signOut();
                    dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'This form is for Business or Associate logins. Please use the customer login page.', type: 'error' } });
                    setIsLoading(false);
                    return;
                }
                
                let homePath = '/';
                switch (userData.type) {
                    case 'associate': homePath = '/associate'; break;
                    case 'corporate': homePath = '/corporate'; break;
                }
                // onAuthStateChanged in AppContext will handle state update.
                // Navigate to intended page or user's dashboard.
                navigate(location.state?.from?.pathname || homePath, { replace: true });
            } else {
                 dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'User profile not found. Please complete setup.', type: 'error' } });
                 setIsLoading(false);
            }
        } catch (err) {
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Failed to login. Please check your credentials.', type: 'error' } });
            setIsLoading(false);
        }
    };
    
    const inputStyles = "appearance-none block w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm";

    return (
        <div className="container mx-auto px-4 py-12">
            <Header
                title="Business & Associate Login"
                subtitle="Access your corporate or personal associate dashboard."
                icon={<BuildingOfficeIcon className="h-8 w-8 text-primary" />}
            />
            
            <Card className="max-w-md mx-auto">
                <form onSubmit={handleFirebaseLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-dark-text">
                            Email Address
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={inputStyles}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-dark-text">
                            Password
                        </label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={inputStyles}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>
                </form>
                <div className="mt-6 text-center text-sm">
                    <p className="text-medium-text">
                        Are you a customer?{' '}
                        <Link to="/customer-login" className="font-semibold text-primary hover:underline">
                            Login here
                        </Link>
                    </p>
                </div>
            </Card>

            <div className="text-center mt-12">
                 <p className="text-medium-text">Don't have an account?</p>
                 <Link to="/setup" className="font-semibold text-primary hover:underline mt-1">
                    Join Bravos!
                 </Link>
            </div>
        </div>
    );
};

export default Login;
