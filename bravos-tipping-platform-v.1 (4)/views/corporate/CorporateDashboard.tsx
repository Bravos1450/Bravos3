
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Associate, ActionType, Tip, CorporateEntity, JoinRequest } from '../../types';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import { BuildingOfficeIcon, TrashIcon, ChatBubbleLeftEllipsisIcon, ChartBarIcon } from '../../components/icons';
import BulkImportModal from './BulkImportModal';
import { db, uploadImage } from '../../services/firebase';
import ImageUploader from '../../components/common/ImageUploader';

const TAX_WITHHOLDING_RATE = 0.22; // 22%

const AddAssociateModal: React.FC<{ corporateId: string, onClose: () => void, dispatch: React.Dispatch<any> }> = ({ corporateId, onClose, dispatch }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [aboutMe, setAboutMe] = useState('');
    const [allowTips, setAllowTips] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const inputStyles = "mt-1 block w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !role.trim() || !aboutMe.trim() || !email.trim()) {
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'All fields are required.', type: 'error' } });
            return;
        }
        
        setIsLoading(true);
        try {
            if (!db) throw new Error("Database not connected");
            // Admin-created associates get a placeholder avatar. The associate can upload their own later.
            const avatarUrl = `https://picsum.photos/seed/${name.toLowerCase().replace(/\s/g, '-')}/200`;

            const newAssociateData: Omit<Associate, 'id' > = {
                name, email, role, aboutMe, isCorporate: true, corporateId, allowTips, avatarUrl
            };
            
            await db.collection('associates').add(newAssociateData);
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Associate added successfully!', type: 'success' } });
            onClose();

        } catch (err) {
            console.error(err);
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Failed to add associate.', type: 'error' } });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-dark-text">Add New Associate</h3>
                    <p className="text-medium-text mt-1">Enter the details for your new team member.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-light-bg">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-dark-text">Full Name</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., John Smith" className={inputStyles} />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-dark-text">Email</label>
                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g., john.smith@example.com" className={inputStyles} />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-dark-text">Role</label>
                        <input type="text" id="role" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g., Concierge" className={inputStyles} />
                    </div>
                    <div>
                        <label htmlFor="aboutMeModal" className="block text-sm font-medium text-dark-text">About Me</label>
                        <textarea id="aboutMeModal" value={aboutMe} onChange={e => setAboutMe(e.target.value)} rows={2} className={inputStyles} placeholder="A short, friendly bio for their profile." />
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="allowTips"
                            checked={allowTips}
                            onChange={e => setAllowTips(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="allowTips" className="text-sm font-medium text-dark-text">
                            Allow this associate to receive tips
                        </label>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-dark-text font-semibold hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-hover font-semibold disabled:bg-gray-400">
                            {isLoading ? 'Adding...' : 'Add Associate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const BravosModal: React.FC<{ associate: Associate; tips: Tip[]; onClose: () => void; }> = ({ associate, tips, onClose }) => {
    const associateBravos = tips.filter(t => t.associateId === associate.id).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
    return (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                 <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-dark-text">Bravos for {associate.name}</h3>
                    <p className="text-medium-text">{associate.role}</p>
                </div>
                <div className="p-6 bg-light-bg overflow-y-auto" style={{maxHeight: '60vh'}}>
                    {associateBravos.length > 0 ? (
                        <div className="space-y-4">
                            {associateBravos.map(tip => (
                                <div key={tip.id} className="bg-white p-4 rounded-lg shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-dark-text">From: {tip.customerName}</p>
                                        <span className="text-xs text-light-text">{tip.timestamp.toLocaleDateString()}</span>
                                    </div>
                                    {tip.amount > 0 && <p className="text-secondary font-semibold">${tip.amount.toFixed(2)}</p>}
                                    <p className="text-medium-text mt-1 italic">"{tip.message}"</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-medium-text py-8">No Bravos received yet.</p>
                    )}
                </div>
                <div className="p-4 bg-gray-100 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary-hover">Close</button>
                </div>
            </div>
        </div>
    );
};


const CorporateDashboard: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { currentUser, joinRequests } = state;
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkImportModal, setShowBulkImportModal] = useState(false);
    const [viewingBravosFor, setViewingBravosFor] = useState<Associate | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [updatingRequest, setUpdatingRequest] = useState<string | null>(null);

    const corporation = useMemo(() => {
        if (currentUser?.type !== 'corporate') return null;
        return state.corporations.find(c => c.id === currentUser.id);
    }, [state.corporations, currentUser]);
    
    const myAssociates = useMemo(() => state.associates.filter(a => a.isCorporate && a.corporateId === corporation?.id), [state.associates, corporation]);
    const myAssociateIds = useMemo(() => myAssociates.map(a => a.id), [myAssociates]);
    const myTips = useMemo(() => state.tips.filter(t => myAssociateIds.includes(t.associateId)), [state.tips, myAssociateIds]);

    const sortedAssociates = useMemo(() => {
        return [...myAssociates].sort((a, b) => {
            const bravosA = myTips.filter(t => t.associateId === a.id).length;
            const bravosB = myTips.filter(t => t.associateId === b.id).length;
            return bravosB - bravosA;
        });
    }, [myAssociates, myTips]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const dailyTips = useMemo(() => myTips.filter(t => t.timestamp >= todayStart), [myTips]);

    const totalTipsCollected = useMemo(() => myTips.reduce((sum, tip) => sum + tip.amount, 0), [myTips]);
    const taxWithheld = totalTipsCollected * TAX_WITHHOLDING_RATE;
    const netDistribution = totalTipsCollected - taxWithheld;

    const handleDelete = (associateId: string) => {
        if (window.confirm('Are you sure you want to remove this associate? This action cannot be undone.')) {
            dispatch({ type: ActionType.DELETE_ASSOCIATE, payload: { associateId } });
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Associate removed.', type: 'success' } });
        }
    };
    
    const handleDisperseAll = () => {
        if (!corporation) return;
        if (window.confirm(`This will mark $${netDistribution.toFixed(2)} as distributed and clear the current tip pool for all associates. Proceed?`)) {
            dispatch({ type: ActionType.DISTRIBUTE_TIPS, payload: { corporateId: corporation.id } });
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'All tips have been marked as distributed.', type: 'success' } });
        }
    };

    const handleDisperseSingle = (associate: Associate) => {
        if (!corporation) return;
        const associateTips = myTips.filter(t => t.associateId === associate.id).reduce((sum, t) => sum + t.amount, 0);
        const associateTax = associateTips * TAX_WITHHOLDING_RATE;
        const associateNet = associateTips - associateTax;
        if (window.confirm(`This will mark $${associateNet.toFixed(2)} as distributed for ${associate.name} and clear their tip pool. Proceed?`)) {
            dispatch({ type: ActionType.DISTRIBUTE_TIPS, payload: { corporateId: corporation.id, associateId: associate.id } });
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: `Tips for ${associate.name} have been distributed.`, type: 'success' } });
        }
    };
    
    const handleToggleAllowTips = () => {
        if (!corporation) return;
        dispatch({
            type: ActionType.UPDATE_CORPORATE_SETTINGS,
            payload: { corporateId: corporation.id, settings: { allowTips: !corporation.allowTips } }
        });
    };

    const handleToggleAssociateTips = (associateId: string, currentStatus: boolean) => {
        dispatch({
            type: ActionType.UPDATE_ASSOCIATE_SETTINGS,
            payload: { associateId, settings: { allowTips: !currentStatus } }
        });
    };
    
    const handleApproveRequest = async (request: JoinRequest) => {
        if (!db) return;
        setUpdatingRequest(request.id);
        const newAssociateData: Omit<Associate, 'id' | 'authUid'> = {
            name: request.name,
            email: request.email,
            role: 'New Member', // Default role
            aboutMe: 'Welcome to the team!', // Default bio
            isCorporate: true,
            corporateId: request.corporateId,
            allowTips: true,
            avatarUrl: request.avatarUrl
        };
        try {
            await db.collection('associates').add(newAssociateData);
            await db.collection('joinRequests').doc(request.id).update({ status: 'approved' });
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Request approved!', type: 'success' } });
        } catch (error) {
            console.error("Error approving request: ", error);
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Error approving request.', type: 'error' } });
        } finally {
            setUpdatingRequest(null);
        }
    };
    
    const handleDenyRequest = async (requestId: string) => {
        if (!db) return;
        setUpdatingRequest(requestId);
         try {
            await db.collection('joinRequests').doc(requestId).update({ status: 'denied' });
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Request denied.', type: 'success' } });
        } catch (error) {
            console.error("Error denying request: ", error);
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Error denying request.', type: 'error' } });
        } finally {
            setUpdatingRequest(null);
        }
    };

    const handleLogoUpload = async () => {
        if (!logoFile || !corporation) return;
        try {
            const logoUrl = await uploadImage(logoFile, `logos/${corporation.id}/${logoFile.name}`);
            dispatch({ type: ActionType.UPDATE_CORPORATE_SETTINGS, payload: { corporateId: corporation.id, settings: { logoUrl } } });
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Logo updated successfully!', type: 'success' } });
            setLogoFile(null);
        } catch (error) {
            console.error("Error uploading logo:", error);
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Failed to upload logo.', type: 'error' } });
        }
    };


    if (!corporation) {
        return <div className="p-8 text-center text-red-500">Error: Could not load corporation profile. Please try logging in again.</div>;
    }

    return (
        <>
            {showAddModal && <AddAssociateModal corporateId={corporation.id} onClose={() => setShowAddModal(false)} dispatch={dispatch} />}
            {showBulkImportModal && <BulkImportModal corporateId={corporation.id} onClose={() => setShowBulkImportModal(false)} />}
            {viewingBravosFor && <BravosModal associate={viewingBravosFor} tips={myTips} onClose={() => setViewingBravosFor(null)} />}

            <div className="container mx-auto px-4 py-12">
                <Header title={corporation.name} subtitle="Manage your team, settings, and tip distributions." icon={<BuildingOfficeIcon className="h-8 w-8 text-indigo-600" />} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left Column */}
                    <div className="lg:col-span-1 space-y-8">
                        <Card>
                            <h3 className="text-lg font-semibold text-dark-text mb-4">Company Profile</h3>
                            <ImageUploader onImageUploaded={setLogoFile} currentImageUrl={corporation.logoUrl} label="Company Logo" />
                            {logoFile && (
                                <button onClick={handleLogoUpload} className="w-full mt-4 py-2 px-4 rounded-md text-white bg-primary hover:bg-primary-hover font-semibold">
                                    Save Logo
                                </button>
                            )}
                        </Card>
                        <Card>
                            <h3 className="text-lg font-semibold text-dark-text">Settings</h3>
                            <div className="mt-4 flex items-center justify-between bg-light-bg p-4 rounded-lg">
                                <div>
                                    <p className="font-medium text-dark-text">Accept Tips</p>
                                    <p className="text-sm text-medium-text">Allow customers to add money to their Bravos.</p>
                                </div>
                                <button onClick={handleToggleAllowTips} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${corporation.allowTips ? 'bg-primary' : 'bg-gray-300'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${corporation.allowTips ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </Card>

                        <Card>
                            <div className="flex items-center space-x-3 mb-4">
                               <div className="p-2 bg-indigo-100 rounded-full">
                                    <ChartBarIcon className="h-6 w-6 text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-dark-text">Analytics & Reports</h3>
                            </div>
                            <p className="text-sm text-medium-text mb-4">View detailed performance metrics, track trends, and download reports for your team.</p>
                            <Link 
                                to="/corporate/reports" 
                                className="w-full flex justify-center items-center space-x-2 py-2 px-4 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 font-semibold transition-colors"
                            >
                                <span>Go to Reports</span>
                            </Link>
                        </Card>

                        <Card>
                            <h3 className="text-lg font-semibold text-dark-text">Team-wide Distribution</h3>
                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-medium-text">Total Undistributed Tips</span>
                                    <span className="font-bold text-dark-text">${totalTipsCollected.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-medium-text">Tax Withheld ({TAX_WITHHOLDING_RATE * 100}%)</span>
                                    <span className="font-bold text-red-500">-${taxWithheld.toFixed(2)}</span>
                                </div>
                                <hr className="my-2" />
                                <div className="flex justify-between text-lg">
                                    <span className="font-semibold text-dark-text">Net for Distribution</span>
                                    <span className="font-bold text-secondary">${netDistribution.toFixed(2)}</span>
                                </div>
                            </div>
                            <button 
                                onClick={handleDisperseAll}
                                disabled={totalTipsCollected <= 0}
                                className="w-full mt-6 py-2 px-4 rounded-md text-white bg-secondary hover:bg-secondary-hover disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold">
                                Disperse All Tips
                            </button>
                        </Card>
                    </div>
                    {/* Right Column: Employees & Requests */}
                    <div className="lg:col-span-2 space-y-8">
                        {joinRequests.length > 0 && (
                             <Card>
                                <h3 className="text-lg font-semibold text-dark-text mb-4">Join Requests ({joinRequests.length})</h3>
                                <div className="space-y-3">
                                    {joinRequests.map(req => (
                                        <div key={req.id} className="p-4 bg-light-bg/50 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <img src={req.avatarUrl} alt={req.name} className="w-10 h-10 rounded-full" />
                                                <div>
                                                    <p className="font-bold text-dark-text">{req.name}</p>
                                                    <p className="text-sm text-medium-text">{req.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                  onClick={() => handleApproveRequest(req)}
                                                  disabled={updatingRequest === req.id}
                                                  className="px-3 py-1 text-sm font-semibold text-white bg-secondary rounded-md hover:bg-secondary-hover disabled:bg-gray-400"
                                                >
                                                  {updatingRequest === req.id ? '...' : 'Approve'}
                                                </button>
                                                <button
                                                  onClick={() => handleDenyRequest(req.id)}
                                                  disabled={updatingRequest === req.id}
                                                  className="px-3 py-1 text-sm font-semibold text-dark-text bg-gray-200 rounded-md hover:bg-gray-300 disabled:bg-gray-400"
                                                >
                                                  {updatingRequest === req.id ? '...' : 'Deny'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                        <Card>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-dark-text">Team Members ({myAssociates.length})</h3>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => setShowBulkImportModal(true)} className="text-sm font-semibold text-primary hover:underline">Bulk Import</button>
                                    <span className="text-gray-300">|</span>
                                    <button onClick={() => setShowAddModal(true)} className="text-sm font-semibold text-primary hover:underline">+ Add Manually</button>
                                </div>
                            </div>
                            
                            <div className="mt-4 space-y-3">
                                {sortedAssociates.map(associate => {
                                    const associateTotalTips = myTips.filter(t => t.associateId === associate.id).reduce((sum,t) => sum + t.amount, 0);
                                    const bravoCount = myTips.filter(t => t.associateId === associate.id).length;

                                    return (
                                        <div key={associate.id} className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 p-4 border rounded-lg bg-light-bg/50">
                                            <img src={associate.avatarUrl} alt={associate.name} className="w-12 h-12 rounded-full" />
                                            <div className="flex-grow">
                                                <p className="font-bold text-dark-text">{associate.name}</p>
                                                <p className="text-sm text-medium-text">{associate.role}</p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                     <button
                                                        onClick={() => handleToggleAssociateTips(associate.id, associate.allowTips)}
                                                        disabled={!corporation.allowTips}
                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:cursor-not-allowed ${associate.allowTips ? 'bg-primary' : 'bg-gray-300'} disabled:opacity-50`}
                                                    >
                                                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${associate.allowTips ? 'translate-x-5' : 'translate-x-1'}`} />
                                                    </button>
                                                    <span className={`text-xs font-medium ${!corporation.allowTips ? 'text-gray-400' : 'text-medium-text'}`}>
                                                        Tips {associate.allowTips ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full sm:w-auto text-left sm:text-right border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-4 border-gray-200">
                                                <p className="text-sm font-semibold text-primary">{bravoCount} {bravoCount === 1 ? 'Bravo' : 'Bravos'}</p>
                                                <p className="text-sm font-semibold text-dark-text mt-1">Total Tips: ${associateTotalTips.toFixed(2)}</p>
                                            </div>
                                            <div className="flex w-full sm:w-auto space-x-2 justify-end">
                                                <button onClick={() => setViewingBravosFor(associate)} title="View Bravos" className="p-2 text-medium-text hover:text-primary hover:bg-blue-100 rounded-full"><ChatBubbleLeftEllipsisIcon className="h-5 w-5" /></button>
                                                <button onClick={() => handleDisperseSingle(associate)} disabled={associateTotalTips <= 0} title="Disperse Tips" className="p-2 text-medium-text hover:text-secondary hover:bg-green-100 rounded-full disabled:text-gray-300 disabled:hover:bg-transparent"><BuildingOfficeIcon className="h-5 w-5" /></button>
                                                <button onClick={() => handleDelete(associate.id)} title="Remove Associate" className="p-2 text-medium-text hover:text-red-500 hover:bg-red-100 rounded-full"><TrashIcon className="h-5 w-5" /></button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {myAssociates.length === 0 && <p className="text-center text-medium-text py-8">No associates found. Add one to get started.</p>}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CorporateDashboard;
