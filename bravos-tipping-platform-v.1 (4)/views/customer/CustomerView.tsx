
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Associate, ActionType, Tip, PaymentData } from '../../types';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import { GiftIcon } from '../../components/icons';
import PostBravoAuthPrompt from './PostBravoAuthPrompt';
import { db } from '../../services/firebase';
import PaymentOptions from '../../components/common/PaymentOptions';

const TipForm: React.FC<{ 
    associate: Associate, 
    onTipSent: (tip: Tip) => void, 
    corporationName?: string,
    allowTips: boolean 
}> = ({ associate, onTipSent, corporationName, allowTips }) => {
    const { state, dispatch } = useAppContext();
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [error, setError] = useState('');
    const [paymentData, setPaymentData] = useState<Partial<PaymentData>>({});
    const [showPayment, setShowPayment] = useState(false);

    const tipAmount = parseFloat(amount) || 0;

    useEffect(() => {
        if (allowTips && tipAmount > 0) {
            setShowPayment(true);
        } else {
            setShowPayment(false);
        }
    }, [tipAmount, allowTips]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (allowTips && isNaN(tipAmount) && message.trim() === '') {
             setError('Please enter a tip amount or a message.');
             return;
        }

        if (!customerName.trim()) {
            setError('Please enter your name.');
            return;
        }
        if (!allowTips && !message.trim()) {
            setError('Please enter a message for your Bravo.');
            return;
        }
        
        if (showPayment && (!paymentData.cardNumber || !paymentData.expiry || !paymentData.cvc)) {
             setError('Please complete the payment information.');
             return;
        }

        setError('');

        if (!db) {
            setError('Service is currently unavailable. Please try again later.');
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Service unavailable.', type: 'error' } });
            return;
        }

        const newTipPayload: Omit<Tip, 'id' | 'timestamp'> = {
            associateId: associate.id,
            amount: tipAmount,
            message: message || (allowTips ? 'Great job!' : 'Thank you!'),
            customerName: customerName,
            ...(state.currentUser?.type === 'customer' && { customerAuthUid: state.currentUser.authUid })
        };
        
        const docRef = await db.collection('tips').add({ ...newTipPayload, timestamp: new Date() });
        const finalTip: Tip = { ...newTipPayload, id: docRef.id, timestamp: new Date() };
        onTipSent(finalTip);
    };

    const submitButtonText = allowTips && tipAmount > 0 ? `Send Bravo & Pay $${tipAmount.toFixed(2)}` : 'Send Bravo';

    return (
        <Card>
            <div className="text-center mb-4">
                <img src={associate.avatarUrl} alt={associate.name} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-primary" />
                <h2 className="text-2xl font-bold text-dark-text">Sending a Bravo to {associate.name}</h2>
                <p className="text-medium-text">{associate.role}</p>
                {corporationName && (
                    <p className="text-sm text-medium-text font-semibold mt-1">{corporationName}</p>
                )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                {allowTips && (
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-dark-text">Amount ($)</label>
                        <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                            placeholder="10.00" step="0.01" />
                    </div>
                )}
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-dark-text">Message {allowTips ? '(Optional)' : ''}</label>
                    <textarea id="message" value={message} onChange={e => setMessage(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                        placeholder="Thank you for your excellent service!"></textarea>
                </div>
                <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-dark-text">Your Name</label>
                    <input type="text" id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                        placeholder="Alex" />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                {showPayment && (
                    <PaymentOptions
                        formData={paymentData}
                        onDataChange={setPaymentData}
                    />
                )}

                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    {submitButtonText}
                </button>
            </form>
        </Card>
    );
};

const ScannedAssociateCard: React.FC<{ associate: Associate; corporationName?: string }> = ({ associate, corporationName }) => {
    const navigate = useNavigate();
    return (
        <Card className="mb-8 border-2 border-primary ring-2 ring-primary">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <img src={associate.avatarUrl} alt={associate.name} className="w-20 h-20 rounded-full border-2 border-primary flex-shrink-0" />
                <div className="flex-grow">
                    <p className="text-sm text-medium-text">You Scanned:</p>
                    <h3 className="text-2xl font-bold text-dark-text">{associate.name}</h3>
                    <p className="text-medium-text">{associate.role}</p>
                    {corporationName && (
                        <p className="text-sm font-semibold text-indigo-600 mt-1">{corporationName}</p>
                    )}
                </div>
                <button 
                    onClick={() => navigate(`/customer/${associate.id}`)}
                    className="w-full sm:w-auto mt-4 sm:mt-0 bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-hover flex-shrink-0"
                >
                    Send a Bravo
                </button>
            </div>
        </Card>
    );
};


const CustomerView: React.FC = () => {
    const { state } = useAppContext();
    const { associateId } = useParams<{ associateId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const scannedId = searchParams.get('scanned');

    const [associateForTipping, setAssociateForTipping] = useState<Associate | null>(null);
    const [tipSent, setTipSent] = useState(false);
    const [lastSentTip, setLastSentTip] = useState<Tip | null>(null);

    
    useEffect(() => {
        if (!associateId && !scannedId) {
            navigate('/');
        }
    }, [associateId, scannedId, navigate]);

    useEffect(() => {
        if (associateId) {
            const associate = state.associates.find(a => a.id === associateId);
            setAssociateForTipping(associate || null);
        } else {
            setAssociateForTipping(null);
        }
    }, [associateId, state.associates]);
    
    const handleSelectAssociate = (associate: Associate) => {
        navigate(`/customer/${associate.id}`);
    };

    const resetAndGoHome = () => {
        setTipSent(false);
        setAssociateForTipping(null);
        setLastSentTip(null);
        navigate('/');
    };
    
    const handleTipSent = (tip: Tip) => {
        setTipSent(true);
        setLastSentTip(tip);
    };

    const scannedAssociateData = useMemo(() => {
        if (!scannedId) return null;

        const associate = state.associates.find(a => a.id === scannedId);
        if (!associate) return null;
        
        const corporation = associate.isCorporate
            ? state.corporations.find(c => c.id === associate.corporateId)
            : null;

        return { associate, corporationName: corporation?.name };
    }, [scannedId, state.associates, state.corporations]);


    if (tipSent) {
        if (state.currentUser) { // User is already logged in
             return (
                <div className="container mx-auto px-4 py-12 text-center">
                     <Card className="max-w-md mx-auto">
                        <GiftIcon className="h-16 w-16 mx-auto text-secondary" />
                        <h2 className="mt-4 text-3xl font-bold text-dark-text">Thank You!</h2>
                        <p className="mt-2 text-lg text-medium-text">Your Bravo has been sent.</p>
                        <button onClick={() => navigate('/customer-dashboard')} className="mt-6 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover">
                            Go to My Dashboard
                        </button>
                     </Card>
                </div>
            );
        }
        // Guest user, show auth prompt
        return (
            <div className="container mx-auto px-4 py-12">
                <PostBravoAuthPrompt 
                    tip={lastSentTip!} 
                    associate={associateForTipping!} 
                    onGuestContinue={resetAndGoHome} 
                />
            </div>
        );
    }
    
    if (associateForTipping) {
        const corporation = associateForTipping.isCorporate
            ? state.corporations.find(c => c.id === associateForTipping.corporateId)
            : null;
        const corporationName = corporation?.name;
        
        const corporationAllowsTips = corporation ? corporation.allowTips : true; // Independents can always receive tips
        const associateAllowsTips = associateForTipping.allowTips;
        const allowTips = corporationAllowsTips && associateAllowsTips;

        return (
             <div className="container mx-auto px-4 py-12">
                 <div className="max-w-md mx-auto">
                     <TipForm 
                        associate={associateForTipping} 
                        onTipSent={handleTipSent}
                        corporationName={corporationName} 
                        allowTips={allowTips}
                    />
                    <button onClick={() => navigate(-1)} className="text-center w-full mt-4 text-medium-text hover:text-dark-text">
                        Back
                    </button>
                 </div>
             </div>
        );
    }
    
    // View for corporate selection after a scan
    if (scannedAssociateData) {
        const corporateAssociates = state.associates.filter(
            a => a.isCorporate && a.corporateId === scannedAssociateData.associate.corporateId
        );
        return (
            <div className="container mx-auto px-4 py-12">
                <ScannedAssociateCard 
                    associate={scannedAssociateData.associate} 
                    corporationName={scannedAssociateData.corporationName} 
                />
                <Header 
                    title={`Or select from ${scannedAssociateData.corporationName || 'the Team'}`}
                    subtitle="Choose a different team member to send a Bravo to." 
                    icon={<GiftIcon className="h-8 w-8 text-primary" />} 
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {corporateAssociates.map(associate => {
                        const corporation = associate.isCorporate
                            ? state.corporations.find(c => c.id === associate.corporateId)
                            : null;
                        return (
                        <Card key={associate.id} className="text-center hover:shadow-xl transition-shadow cursor-pointer" onClick={() => handleSelectAssociate(associate)}>
                            <img src={associate.avatarUrl} alt={associate.name} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-gray-200" />
                            <h3 className="text-xl font-bold text-dark-text">{associate.name}</h3>
                            <p className="text-medium-text">{associate.role}</p>
                            {corporation && (
                                <p className="text-sm font-semibold text-medium-text mt-2">{corporation.name}</p>
                            )}
                        </Card>
                    );
                    })}
                </div>
            </div>
        );
    }

    // If no state matches, render nothing while the redirect effect runs.
    return null;
};

export default CustomerView;
