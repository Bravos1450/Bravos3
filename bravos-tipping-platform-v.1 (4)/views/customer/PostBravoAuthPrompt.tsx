
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import { GiftIcon, SparklesIcon } from '../../components/icons';
import { Tip, Associate } from '../../types';

interface PostBravoAuthPromptProps {
    tip: Tip;
    associate: Associate;
    onGuestContinue: () => void;
}

const PostBravoAuthPrompt: React.FC<PostBravoAuthPromptProps> = ({ tip, associate, onGuestContinue }) => {
    const navigate = useNavigate();

    const handleLogin = () => {
        // Store the tip ID so it can be associated with the user after login/signup
        sessionStorage.setItem('claimTipId', tip.id);
        navigate('/customer-login');
    };

    return (
        <div className="max-w-md mx-auto">
            <Card>
                <div className="text-center">
                    <GiftIcon className="h-16 w-16 mx-auto text-secondary" />
                    <h2 className="mt-4 text-3xl font-bold text-dark-text">Thank You!</h2>
                    <p className="mt-2 text-lg text-medium-text">Your Bravo has been sent to {associate.name}.</p>
                </div>
                <div className="mt-8 p-6 bg-blue-50 rounded-lg text-center">
                    <SparklesIcon className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="mt-2 text-xl font-bold text-dark-text">Continue the conversation!</h3>
                    <p className="mt-2 text-medium-text">Create a free account to track your Bravos and get a thank you back from {associate.name}.</p>
                    <div className="mt-6 space-y-3">
                        <button
                            onClick={handleLogin}
                            className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover"
                        >
                            Create Account or Login
                        </button>
                        <button
                            onClick={onGuestContinue}
                            className="w-full py-2 px-4 text-sm font-medium text-medium-text hover:text-dark-text"
                        >
                            No Thanks, Continue as Guest
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PostBravoAuthPrompt;
