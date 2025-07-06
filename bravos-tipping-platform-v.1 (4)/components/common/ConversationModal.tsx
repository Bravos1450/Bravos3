

import React, { useState, useEffect, useRef } from 'react';
import { Tip, Associate, Message, CurrentUser, ActionType } from '../../types';
import { SparklesIcon } from '../icons';
import { generateThankYouNote } from '../../services/geminiService';


interface ConversationModalProps {
    tip: Tip;
    associate: Associate;
    messages: Message[];
    currentUser: CurrentUser;
    onClose: () => void;
    dispatch: React.Dispatch<any>;
}

const ConversationModal: React.FC<ConversationModalProps> = ({ tip, associate, messages, currentUser, onClose, dispatch }) => {
    const [newMessage, setNewMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isUserAssociate = currentUser.type === 'associate';

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const recipientAuthUid = isUserAssociate ? tip.customerAuthUid : associate.authUid;

        if (!recipientAuthUid) {
            console.error("Cannot send message, recipient authentication ID is missing.");
            // In a real app, you might want to show an error to the user.
            return;
        }

        const messagePayload: Omit<Message, 'id' | 'timestamp'> = {
            tipId: tip.id,
            fromId: currentUser.authUid,
            toId: recipientAuthUid,
            participantIds: [currentUser.authUid, recipientAuthUid],
            text: newMessage,
        };
        dispatch({ type: ActionType.SEND_MESSAGE, payload: messagePayload });
        setNewMessage('');
    };
    
    const handleGenerateNote = async () => {
        setIsGenerating(true);
        const note = await generateThankYouNote(tip);
        setNewMessage(note);
        setIsGenerating(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose} aria-modal="true">
            <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 sm:p-6 border-b">
                    <h3 className="text-xl font-bold text-dark-text">Conversation with {isUserAssociate ? tip.customerName : associate.name}</h3>
                    <p className="text-sm text-medium-text">Regarding Bravo on {tip.timestamp.toLocaleDateString()}</p>
                    <p className="mt-2 text-sm italic bg-gray-50 p-3 rounded-md">"{tip.message}"</p>
                </div>

                <div className="p-4 sm:p-6 bg-light-bg/50 overflow-y-auto flex-grow">
                    <div className="space-y-4">
                        {messages.map(msg => {
                            const isFromMe = msg.fromId === currentUser.authUid;
                            return (
                                <div key={msg.id} className={`flex items-end gap-2 ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${isFromMe ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-dark-text rounded-bl-none'}`}>
                                        <p>{msg.text}</p>
                                    </div>
                                </div>
                            );
                        })}
                         <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="p-4 border-t bg-white">
                    {isUserAssociate && (
                        <button 
                            onClick={handleGenerateNote} 
                            disabled={isGenerating}
                            className="flex items-center space-x-1 text-xs text-primary hover:underline mb-2 disabled:opacity-50"
                        >
                            <SparklesIcon className="h-4 w-4" />
                            <span>{isGenerating ? 'Generating with AI...' : 'Generate Thank You Note'}</span>
                        </button>
                    )}
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                        <textarea
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            rows={1}
                            className="flex-grow p-2 border border-gray-600 rounded-full resize-none bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button type="submit" className="px-5 py-2 rounded-full text-white bg-primary hover:bg-primary-hover font-semibold disabled:bg-gray-400" disabled={!newMessage.trim()}>
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ConversationModal;
