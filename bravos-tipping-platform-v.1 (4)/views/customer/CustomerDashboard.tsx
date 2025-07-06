
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Tip, Associate, ActionType } from '../../types';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import { HeartIcon, ChatBubbleLeftEllipsisIcon, UserIcon } from '../../components/icons';
import ConversationModal from '../../components/common/ConversationModal';
import ImageUploader from '../../components/common/ImageUploader';
import { uploadImage, db } from '../../services/firebase';


const CustomerProfile: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { currentUser } = state;
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!avatarFile || !currentUser || !db) return;

        setIsSaving(true);

        try {
            const avatarUrl = await uploadImage(avatarFile, `avatars/${currentUser.authUid}/${avatarFile.name}`);
            
            const userRef = db.collection('users').doc(currentUser.authUid);
            await userRef.update({ avatarUrl });

            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Profile picture updated!', type: 'success' } });
            setAvatarFile(null); // Clear file after upload
        } catch (error) {
            console.error("Error updating profile picture:", error);
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Failed to update profile picture.', type: 'error' } });
        } finally {
            setIsSaving(false);
        }
    };

    if (!currentUser) return null;
    
    return (
        <Card className="mb-8">
            <h3 className="text-lg font-semibold text-dark-text mb-4">My Profile</h3>
            <div className="space-y-4">
                <ImageUploader
                    onImageUploaded={setAvatarFile}
                    currentImageUrl={currentUser.avatarUrl}
                    label="Profile Picture"
                />
                {avatarFile && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full sm:w-auto mt-4 py-2 px-6 rounded-md text-white bg-primary hover:bg-primary-hover disabled:bg-gray-400 font-semibold"
                    >
                        {isSaving ? 'Saving...' : 'Save Picture'}
                    </button>
                )}
            </div>
        </Card>
    );
};


const CustomerDashboard: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { currentUser, tips, associates, messages } = state;
    const [viewingConversationFor, setViewingConversationFor] = useState<Tip | null>(null);

    const myBravos = useMemo(() => {
        if (!currentUser) return [];
        return tips
            .filter(tip => tip.customerAuthUid === currentUser.authUid)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [tips, currentUser]);
    
    const findAssociateForTip = (tip: Tip): Associate | undefined => {
        return associates.find(a => a.id === tip.associateId);
    };

    if (!currentUser) {
        return <div>Loading...</div>;
    }
    
    // The first bravo might not have a customer name if they created an account right after sending it
    const customerName = myBravos[0]?.customerName || 'Valued Customer';

    return (
        <>
            {viewingConversationFor && (
                <ConversationModal
                    tip={viewingConversationFor}
                    associate={findAssociateForTip(viewingConversationFor)!}
                    messages={messages.filter(m => m.tipId === viewingConversationFor.id)}
                    currentUser={currentUser}
                    onClose={() => setViewingConversationFor(null)}
                    dispatch={dispatch}
                />
            )}
            <div className="container mx-auto px-4 py-12">
                <Header
                    title={`Welcome, ${customerName}!`}
                    subtitle="Here are all the Bravos you've sent. Thank you for spreading joy!"
                    icon={<HeartIcon className="h-8 w-8 text-fun-orange" />}
                />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <CustomerProfile />
                    </div>
                    <div className="lg:col-span-2">
                        <Card>
                            <h3 className="text-lg font-semibold text-dark-text mb-4">My Bravo History ({myBravos.length})</h3>
                            <div className="space-y-4">
                                {myBravos.length > 0 ? (
                                    myBravos.map(tip => {
                                        const associate = findAssociateForTip(tip);
                                        if (!associate) return null;

                                        return (
                                            <div key={tip.id} className="p-4 border rounded-lg bg-light-bg/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div className="flex items-center space-x-4">
                                                     <img src={associate.avatarUrl} alt={associate.name} className="w-12 h-12 rounded-full" />
                                                    <div>
                                                        <p className="font-bold text-dark-text">
                                                            Bravo to {associate.name}
                                                        </p>
                                                        {tip.amount > 0 && 
                                                            <p className="text-secondary font-semibold">${tip.amount.toFixed(2)}</p>
                                                        }
                                                        <p className="text-medium-text mt-1 italic">"{tip.message}"</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 self-end sm:self-center">
                                                    <span className="text-xs text-light-text whitespace-nowrap">{new Date(tip.timestamp).toLocaleDateString()}</span>
                                                    <button
                                                        onClick={() => setViewingConversationFor(tip)}
                                                        disabled={!associate.authUid}
                                                        title={!associate.authUid ? "This associate has not set up their account for messaging." : "Start Conversation"}
                                                        className={`flex items-center space-x-2 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-hover transition-colors ${!associate.authUid ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
                                                        <span>Conversation</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                 ) : (
                                    <div className="text-center py-16">
                                        <HeartIcon className="h-12 w-12 mx-auto text-gray-300" />
                                        <p className="mt-4 text-lg text-medium-text">You haven't sent any Bravos yet.</p>
                                        <p className="text-medium-text">Time to make someone's day!</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CustomerDashboard;
