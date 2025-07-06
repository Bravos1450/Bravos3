
import React, { useState } from 'react';
import { CameraIcon, ApplePayIcon, GooglePayIcon, CreditCardIcon } from '../icons';
import CreditCardScanner from './CreditCardScanner';
import { PaymentData } from '../../types';

interface PaymentOptionsProps {
    onDataChange: (data: Partial<PaymentData>) => void;
    formData: Partial<PaymentData>;
}

const PaymentOptions: React.FC<PaymentOptionsProps> = ({ onDataChange, formData }) => {
    const [isScanning, setIsScanning] = useState(false);
    const inputStyles = "mt-1 block w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        onDataChange({ ...formData, [name]: value });
    };

    const handleScanSuccess = (scannedData: { cardNumber: string; expiry: string; cardHolderName: string; }) => {
        onDataChange({
            ...formData,
            ...scannedData
        });
        setIsScanning(false);
    };
    
    const handleWalletClick = (walletType: 'Apple' | 'Google') => {
        alert(`In a real application, this would launch the ${walletType} Pay payment flow. This feature is for demonstration only.`);
    };

    return (
        <div className="border-t pt-4 mt-4">
            {isScanning && (
                <CreditCardScanner
                    onScanSuccess={handleScanSuccess}
                    onClose={() => setIsScanning(false)}
                />
            )}
            <div className="p-3 mb-4 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                <strong>Demo Only:</strong> Do not enter real financial information. These features are for demonstration purposes.
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
                 <button type="button" onClick={() => handleWalletClick('Apple')} className="flex items-center justify-center space-x-2 w-full bg-black text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors">
                    <ApplePayIcon className="h-6 w-6" />
                    <span>Pay</span>
                </button>
                <button type="button" onClick={() => handleWalletClick('Google')} className="flex items-center justify-center space-x-2 w-full border border-gray-700 bg-white text-dark-text font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                    <GooglePayIcon className="h-6 w-6" />
                    <span>Pay</span>
                </button>
            </div>

            <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-sm">OR PAY WITH CARD</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-dark-text">Card Holder Name</label>
                    <input type="text" name="cardHolderName" value={formData.cardHolderName || ''} onChange={handleChange} placeholder="Jane Doe" className={inputStyles} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-dark-text">Card Number</label>
                    <div className="relative">
                        <input type="text" name="cardNumber" value={formData.cardNumber || ''} onChange={handleChange} placeholder="**** **** **** 1234" className={inputStyles + " pr-12"} />
                        <button type="button" onClick={() => setIsScanning(true)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white" title="Scan Card">
                            <CameraIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                        <label className="block text-sm font-medium text-dark-text">MM/YY</label>
                        <input type="text" name="expiry" value={formData.expiry || ''} onChange={handleChange} placeholder="01/25" className={inputStyles} />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-dark-text">CVC</label>
                        <input type="text" name="cvc" value={formData.cvc || ''} onChange={handleChange} placeholder="123" className={inputStyles} />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-dark-text">ZIP</label>
                        <input type="text" name="zip" value={formData.zip || ''} onChange={handleChange} placeholder="90210" className={inputStyles} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentOptions;