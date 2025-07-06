
import React, { useState, useMemo, useEffect } from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { useAppContext } from '../../context/AppContext';
import { Tip, Associate, Message, CurrentUser, ActionType } from '../../types';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import { UsersIcon, SparklesIcon, BuildingOfficeIcon, WalletIcon, DevicePhoneMobileIcon, PrinterIcon, LogoIcon, ChatBubbleLeftEllipsisIcon } from '../../components/icons';
import ConversationModal from '../../components/common/ConversationModal';
import ImageUploader from '../../components/common/ImageUploader';
import { uploadImage, db } from '../../services/firebase';


const FullscreenQrModal: React.FC<{
    associate: Associate;
    corporationName?: string;
    qrUrl: string;
    onClose: () => void;
}> = ({ associate, corporationName, qrUrl, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white p-8 rounded-2xl text-center flex flex-col items-center" onClick={e => e.stopPropagation()}>
                <QRCode value={qrUrl} size={256} />
                <h2 className="text-3xl font-bold text-dark-text mt-6">{associate.name}</h2>
                <p className="text-lg text-medium-text">{associate.role}</p>
                {corporationName && (
                    <div className="flex items-center space-x-2 mt-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                        <BuildingOfficeIcon className="h-5 w-5" />
                        <span className="font-semibold">{corporationName}</span>
                    </div>
                )}
                 <button onClick={onClose} className="mt-8 bg-primary text-white py-2 px-8 rounded-lg font-bold text-lg hover:bg-primary-hover transition-colors">
                    Close
                </button>
            </div>
        </div>
    );
};

const WalletModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const handleWalletClick = (walletType: 'Apple' | 'Google') => {
        alert(`${walletType} Wallet pass generation requires a server-side component which is not implemented in this demo. In a real app, a .pkpass file (for Apple) or a JWT (for Google) would be generated and sent to your device.`);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white p-6 sm:p-8 rounded-2xl text-center flex flex-col items-center max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <WalletIcon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-dark-text mt-4">Add to Digital Wallet</h2>
                <p className="mt-2 text-sm sm:text-base text-medium-text">Add your personal QR code to your phone's wallet for easy access.</p>
                <div className="mt-6 space-y-3 w-full">
                    <button onClick={() => handleWalletClick('Apple')} className="w-full bg-black text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-800 transition-colors">
                        <span> Apple Wallet</span>
                    </button>
                    <button onClick={() => handleWalletClick('Google')} className="w-full border border-gray-300 text-dark-text font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors">
                        <span>Add to Google Wallet</span>
                    </button>
                </div>
                 <button onClick={onClose} className="mt-6 text-sm font-medium text-medium-text hover:text-dark-text">
                    Maybe Later
                </button>
            </div>
        </div>
    );
};


const PrintPreviewModal: React.FC<{
    associate: Associate;
    corporationName?: string;
    qrUrl: string;
    onClose: () => void;
}> = ({ associate, corporationName, qrUrl, onClose }) => {
    
    /**
     * Printing functionality can be blocked by sandboxed environments.
     * Ensure the execution context has 'printing' permission.
     */
    const handlePrintNow = () => {
        window.print();
    };

    return (
        <div className="print-preview-backdrop fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="print-preview-content bg-white rounded-lg w-96 font-sans shadow-2xl" onClick={e => e.stopPropagation()}>
                <div id="printable-sticker-content" className="p-6 border-2 border-dashed border-gray-400 rounded-t-lg text-center bg-dark-text">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <LogoIcon className="h-8 w-auto text-white" />
                        <span className="text-2xl font-fredoka text-fun-orange">Bravos!</span>
                    </div>
                    <p className="text-xl font-semibold text-light-text mb-4">Scan to send a Bravo!</p>
                    <div className="flex justify-center p-2 bg-white rounded-lg border border-gray-200 inline-block">
                        <QRCode value={qrUrl} size={200} />
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-white">{associate.name}</h3>
                        <p className="text-lg text-light-text">{associate.role}</p>
                        {associate.aboutMe && <p className="text-sm text-light-text mt-2 italic">"{associate.aboutMe}"</p>}
                        {corporationName && (
                             <p className="text-base font-semibold text-indigo-300 mt-1">{corporationName}</p>
                        )}
                    </div>
                </div>
                <div className="no-print p-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
                     <button onClick={onClose} className="bg-gray-200 text-dark-text py-2 px-6 rounded-lg font-bold hover:bg-gray-300">
                        Cancel
                    </button>
                    <button onClick={handlePrintNow} className="bg-secondary text-white py-2 px-6 rounded-lg font-bold hover:bg-secondary-hover">
                        Print Now
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProfileEditor: React.FC<{ associate: Associate }> = ({ associate }) => {
    const { dispatch } = useAppContext();
    const [name, setName] = useState(associate.name);
    const [aboutMe, setAboutMe] = useState(associate.aboutMe);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const hasChanges = name !== associate.name || aboutMe !== associate.aboutMe || avatarFile !== null;

    const handleSave = async () => {
        if (!hasChanges || !db) return;

        setIsSaving(true);

        try {
            let avatarUrl = associate.avatarUrl;
            if (avatarFile) {
                avatarUrl = await uploadImage(avatarFile, `avatars/${associate.authUid}/${avatarFile.name}`);
            }

            const updatedSettings = {
                name,
                aboutMe,
                avatarUrl
            };
            
            const associateRef = db.collection('associates').doc(associate.id);
            await associateRef.update(updatedSettings);

            // Also update the user's root profile if they have one
            if(associate.authUid){
              const userRef = db.collection('users').doc(associate.authUid);
              await userRef.update({ avatarUrl });
            }

            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Profile updated successfully!', type: 'success' } });
            setAvatarFile(null); // Clear file after upload
        } catch (error) {
            console.error("Error updating profile:", error);
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Failed to update profile.', type: 'error' } });
        } finally {
            setIsSaving(false);
        }
    };
    
    const inputStyles = "mt-1 block w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary";

    return (
        <Card>
            <h3 className="text-lg font-semibold text-dark-text mb-4">Your Profile</h3>
            <div className="space-y-4">
                <ImageUploader
                    onImageUploaded={setAvatarFile}
                    currentImageUrl={associate.avatarUrl}
                    label="Profile Picture"
                />
                <div>
                    <label className="block text-sm font-medium text-dark-text">Your Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputStyles} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-dark-text">About Me</label>
                    <textarea value={aboutMe} onChange={e => setAboutMe(e.target.value)} rows={3} className={inputStyles} />
                </div>
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="w-full mt-4 py-2 px-4 rounded-md text-white bg-primary hover:bg-primary-hover disabled:bg-gray-400 font-semibold"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </Card>
    );
};


type Period = 'today' | 'week' | 'month' | 'total';

const PeriodButton: React.FC<{ 
    period: Period, 
    label: string, 
    selected: boolean, 
    onClick: (period: Period) => void 
}> = ({ period, label, selected, onClick }) => (
    <button
        onClick={() => onClick(period)}
        className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 ${
            selected
                ? 'bg-primary text-white shadow'
                : 'bg-gray-100 text-medium-text hover:bg-gray-200'
        }`}
    >
        {label}
    </button>
);

const AssociateDashboard: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { currentUser, messages } = state;
    const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');
    const [showFullscreenQr, setShowFullscreenQr] = useState(false);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [viewingConversationFor, setViewingConversationFor] = useState<Tip | null>(null);

    const associate = useMemo(() => {
      if (currentUser?.type !== 'associate') return null;
      return state.associates.find(a => a.id === currentUser.id);
    }, [state.associates, currentUser]);
    
    const corporation = useMemo(() => {
        if (associate?.isCorporate && associate.corporateId) {
            return state.corporations.find(c => c.id === associate.corporateId);
        }
        return null;
    }, [associate, state.corporations]);

    const myTips = useMemo(() => state.tips.filter(t => t.associateId === associate?.id).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()), [state.tips, associate]);
    
    const totalEarnings = useMemo(() => myTips.reduce((sum, tip) => sum + tip.amount, 0), [myTips]);

    const earningsData = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayTips = myTips.filter(t => t.timestamp >= todayStart);
        const weekTips = myTips.filter(t => t.timestamp >= weekStart);
        const monthTips = myTips.filter(t => t.timestamp >= monthStart);

        return {
            today: {
                amount: todayTips.reduce((sum, tip) => sum + tip.amount, 0),
                count: todayTips.length,
            },
            week: {
                amount: weekTips.reduce((sum, tip) => sum + tip.amount, 0),
                count: weekTips.length,
            },
            month: {
                amount: monthTips.reduce((sum, tip) => sum + tip.amount, 0),
                count: monthTips.length,
            },
            total: {
                amount: totalEarnings,
                count: myTips.length
            }
        };
    }, [myTips, totalEarnings]);


    if (!associate || !currentUser) {
        return <div className="p-8 text-center text-red-500">Could not load your profile. Please try logging in again.</div>;
    }

    const qrUrl = `${window.location.origin}${window.location.pathname}#/customer/${associate.id}`;
    
    return (
        <>
        {showFullscreenQr && (
            <FullscreenQrModal 
                associate={associate} 
                corporationName={corporation?.name} 
                qrUrl={qrUrl} 
                onClose={() => setShowFullscreenQr(false)} 
            />
        )}
        {showWalletModal && <WalletModal onClose={() => setShowWalletModal(false)} />}
        {showPrintPreview && (
            <PrintPreviewModal 
                 associate={associate} 
                corporationName={corporation?.name} 
                qrUrl={qrUrl} 
                onClose={() => setShowPrintPreview(false)}
            />
        )}
        {viewingConversationFor && (
             <ConversationModal
                tip={viewingConversationFor}
                associate={associate}
                messages={messages.filter(m => m.tipId === viewingConversationFor.id)}
                currentUser={currentUser}
                onClose={() => setViewingConversationFor(null)}
                dispatch={dispatch}
            />
        )}

        <div id="dashboard-content" className="container mx-auto px-4 py-12">
            <Header title={`Welcome, ${associate.name}!`} subtitle="Here's your Bravos dashboard." icon={<UsersIcon className="h-8 w-8 text-secondary" />} />
            
            {corporation && (
                <div className="mb-6 -mt-4">
                    <div className="inline-flex items-center space-x-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                        <BuildingOfficeIcon className="h-5 w-5" />
                        <span>{corporation.name}</span>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Stats & QR */}
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <h3 className="text-lg font-semibold text-dark-text mb-4">Earnings Summary</h3>
                        <div className="flex flex-wrap justify-between items-center gap-2 bg-light-bg p-1 rounded-lg mb-4">
                            <PeriodButton period="today" label="Today" selected={selectedPeriod === 'today'} onClick={setSelectedPeriod} />
                            <PeriodButton period="week" label="This Week" selected={selectedPeriod === 'week'} onClick={setSelectedPeriod} />
                            <PeriodButton period="month" label="This Month" selected={selectedPeriod === 'month'} onClick={setSelectedPeriod} />
                            <PeriodButton period="total" label="All Time" selected={selectedPeriod === 'total'} onClick={setSelectedPeriod} />
                        </div>
                        <div className="text-center sm:text-left">
                            <p className="text-4xl font-bold text-secondary">${earningsData[selectedPeriod].amount.toFixed(2)}</p>
                            <p className="text-medium-text">{earningsData[selectedPeriod].count} {earningsData[selectedPeriod].count === 1 ? 'Bravo' : 'Bravos'} received</p>
                        </div>
                    </Card>
                    <ProfileEditor associate={associate} />
                    <div>
                        <Card>
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-dark-text">Your QR Code</h3>
                                <div className="flex justify-center p-4 bg-white rounded-lg mt-2">
                                <QRCode value={qrUrl} size={180} />
                                </div>
                                <div className="grid grid-cols-1 gap-2 mt-4">
                                    <button onClick={() => setShowFullscreenQr(true)} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                                        <DevicePhoneMobileIcon className="h-5 w-5" />
                                        <span>Show on Phone</span>
                                    </button>
                                    <button onClick={() => setShowPrintPreview(true)} className="w-full bg-secondary hover:bg-secondary-hover text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                                        <PrinterIcon className="h-5 w-5" />
                                        <span>Print</span>
                                    </button>
                                    <button onClick={() => setShowWalletModal(true)} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                                        <WalletIcon className="h-5 w-5" />
                                        <span>Add to Wallet</span>
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Right Column: Tips Feed */}
                <div className="lg:col-span-2">
                    <Card>
                        <h3 className="text-lg font-semibold text-dark-text mb-4">Recent Bravos</h3>
                        <div className="space-y-4">
                            {myTips.length > 0 ? myTips.map(tip => (
                                <div key={tip.id} className="p-4 border rounded-lg bg-white">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-dark-text">
                                                <span className="text-secondary">${tip.amount.toFixed(2)}</span> from {tip.customerName}
                                            </p>
                                            <p className="text-medium-text mt-1">"{tip.message}"</p>
                                        </div>
                                        <span className="text-xs text-light-text whitespace-nowrap">{tip.timestamp.toLocaleDateString()}</span>
                                    </div>
                                    {tip.customerAuthUid && (
                                        <div className="mt-2 text-right">
                                            <button 
                                                onClick={() => setViewingConversationFor(tip)}
                                                className="flex items-center space-x-2 bg-blue-100 text-primary font-semibold py-2 px-3 rounded-lg hover:bg-blue-200 transition-colors text-sm ml-auto"
                                            >
                                                <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
                                                <span>View Conversation</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <p className="text-center text-medium-text py-8">You haven't received any Bravos yet.</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
        </>
    );
};

export default AssociateDashboard;
