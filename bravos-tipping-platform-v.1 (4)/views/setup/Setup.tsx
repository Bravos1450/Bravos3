
import React, { useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ActionType, Associate, PaymentData, PayoutData } from '../../types';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import { IdentificationIcon, UserIcon, BuildingOfficeIcon, UsersIcon, HeartIcon, BanknotesIcon, CheckCircleIcon } from '../../components/icons';
import ImageUploader from '../../components/common/ImageUploader';
import { auth, db, uploadImage } from '../../services/firebase';
import PaymentOptions from '../../components/common/PaymentOptions';

type UserType = 'individual' | 'employee' | 'corporate' | 'customer';
type EmployeeStatus = 'check' | 'claim' | 'request' | 'pending' | 'error';

const PayoutAccountForm: React.FC<{ onDataChange: (data: Partial<PayoutData>) => void; }> = ({ onDataChange }) => {
    const inputStyles = "mt-1 block w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary";
    const [formData, setFormData] = useState<Partial<PayoutData>>({});
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            onDataChange(newData);
            return newData;
        });
    };
    return (
        <div className="border-t pt-6 mt-6">
            <div className="p-3 mb-4 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                <strong>Demo Only:</strong> Do not enter real financial information. This form is for demonstration purposes.
            </div>
            <div className="flex items-center space-x-2 mb-4">
                <BanknotesIcon className="h-6 w-6 text-secondary" />
                <h4 className="font-semibold text-dark-text">Payout Account</h4>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-dark-text">Account Holder Name</label>
                    <input type="text" name="accountHolderName" onChange={handleChange} placeholder="John Doe" className={inputStyles} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-dark-text">Routing Number</label>
                    <input type="text" name="routingNumber" onChange={handleChange} placeholder="123456789" className={inputStyles} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-dark-text">Account Number</label>
                    <input type="text" name="accountNumber" onChange={handleChange} placeholder="000123456789" className={inputStyles} />
                </div>
            </div>
        </div>
    );
};

const StepWrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <div className="animate-fade-in-down">
        {children}
    </div>
);

const ProgressIndicator: React.FC<{ steps: { title: string }[]; currentStep: number }> = ({ steps, currentStep }) => {
    return (
        <nav aria-label="Progress">
            <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0 mb-12">
                {steps.map((step, index) => (
                    <li key={step.title} className="md:flex-1">
                        {currentStep > index ? (
                            <div className="group flex w-full flex-col border-l-4 border-primary py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                                <span className="text-sm font-medium text-primary transition-colors ">{step.title}</span>
                            </div>
                        ) : currentStep === index ? (
                            <div className="flex w-full flex-col border-l-4 border-primary py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4" aria-current="step">
                                <span className="text-sm font-medium text-primary">{step.title}</span>
                            </div>
                        ) : (
                            <div className="group flex w-full flex-col border-l-4 border-gray-200 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                                <span className="text-sm font-medium text-gray-500 transition-colors">{step.title}</span>
                            </div>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};


const Setup = () => {
    const { state, dispatch } = useAppContext();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(0);
    const [userType, setUserType] = useState<UserType | null>(null);
    const [employeeStatus, setEmployeeStatus] = useState<EmployeeStatus>('check');

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [aboutMe, setAboutMe] = useState('');
    const [employerId, setEmployerId] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [foundAssociate, setFoundAssociate] = useState<Associate | null>(null);
    const [financialData, setFinancialData] = useState<Partial<PaymentData & PayoutData>>({});

    const [isLoading, setIsLoading] = useState(false);

    const stepsConfig = {
        customer: [{ title: 'Account Type' }, { title: 'Your Info' }, { title: 'Payment' }, { title: 'Finish' }],
        individual: [{ title: 'Account Type' }, { title: 'Profile' }, { title: 'Account' }, { title: 'Payout' }, { title: 'Finish' }],
        corporate: [{ title: 'Account Type' }, { title: 'Business Info' }, { title: 'Admin Account' }, { title: 'Payout' }, { title: 'Finish' }],
        employee: [{ title: 'Account Type' }, { title: 'Verify' }, { title: 'Complete Setup' }, { title: 'Finish' }],
    };

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);
    const resetFlow = () => {
        setCurrentStep(0);
        setUserType(null);
        // also reset all form fields
    };
    
    const handleUserTypeSelect = (type: UserType) => {
        setUserType(type);
        nextStep();
    };

    const handleEmployeeCheck = async () => {
        setIsLoading(true);
        try {
            if (!db) throw new Error("Firestore not initialized");
            const q = db.collection('associates')
                .where('corporateId', '==', employerId)
                .where('email', '==', email);

            const querySnapshot = await q.get();
            if (!querySnapshot.empty) {
                const associateDoc = querySnapshot.docs[0];
                const associateData = { id: associateDoc.id, ...associateDoc.data() } as Associate;
                if (associateData.authUid) {
                    dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'This account has already been claimed. Please log in.', type: 'error' } });
                    setEmployeeStatus('error');
                } else {
                    setFoundAssociate(associateData);
                    setName(associateData.name);
                    setAboutMe(associateData.aboutMe);
                    setEmployeeStatus('claim');
                }
            } else {
                setEmployeeStatus('request');
            }
            nextStep();
        } catch (err) {
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: "Could not verify employee. Please check the Employer ID.", type: 'error' } });
            setEmployeeStatus('error');
            nextStep();
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinRequest = async () => {
        setIsLoading(true);
        try {
            if (!db) throw new Error("Firestore not initialized");
            // For join requests, we upload to a public 'requests' path that doesn't require auth.
            let avatarUrl = `https://picsum.photos/seed/${name.toLowerCase().replace(/\s/g, '-')}/200`;
            if (avatarFile) avatarUrl = await uploadImage(avatarFile, `requests/${employerId}/${Date.now()}_${avatarFile.name}`);

            await db.collection('joinRequests').add({
                corporateId: employerId, email, name, avatarUrl, status: 'pending', timestamp: new Date()
            });
            setEmployeeStatus('pending');
        } catch (err) {
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: "Failed to send join request.", type: 'error' } });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCreateFirebaseAccount = async () => {
        if (!auth || !db) {
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: "Firebase services are not available.", type: 'error' } });
            return;
        }

        if (!email || !password || !name) {
            dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Email, Password, and Name are required.', type: 'error' } });
            return;
        }

        // 1. Create the user in Firebase Auth. This is the first step.
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const authUser = userCredential.user;
        if (!authUser) throw new Error("Failed to create user.");
        
        // 2. Now that the user exists and is authenticated, upload the avatar if one was provided.
        // The security rules will now pass because the user's UID matches.
        let avatarUrl = `https://picsum.photos/seed/${name.toLowerCase().replace(/\s/g, '-')}/200`;
        if (avatarFile) {
            avatarUrl = await uploadImage(avatarFile, `avatars/${authUser.uid}/${avatarFile.name}`);
        }

        let homePath = '/';

        // 3. With the final avatarURL, create the corresponding Firestore documents.
        if (userType === 'individual') {
            const newAssociateData: Omit<Associate, 'id' > = {
                name, role, aboutMe, email, isCorporate: false, allowTips: true, authUid: authUser.uid, avatarUrl
            };
            const associateRef = await db.collection('associates').add(newAssociateData);
            await db.collection('users').doc(authUser.uid).set({ type: 'associate', associateId: associateRef.id, avatarUrl });
            homePath = '/associate';
        } 
        else if (userType === 'employee' && foundAssociate) {
            const associateRef = db.collection('associates').doc(foundAssociate.id);
            await associateRef.update({ authUid: authUser.uid, name, aboutMe, avatarUrl: foundAssociate.avatarUrl }); // Use existing avatar unless they can upload a new one here
            await db.collection('users').doc(authUser.uid).set({ type: 'associate', associateId: foundAssociate.id, avatarUrl: foundAssociate.avatarUrl });
            homePath = '/associate';
        }
        else if (userType === 'corporate') {
            // For corporate, the uploaded image is the logo. The path needs to be different.
            // The logic must be slightly different to handle the logo upload permissions.
            const corpRef = db.collection('corporations').doc();
            
            // First, create the user document, so the security rule can check the corporateId.
            await db.collection('users').doc(authUser.uid).set({ 
                type: 'corporate', 
                corporateId: corpRef.id, 
                avatarUrl: `https://picsum.photos/seed/${name.toLowerCase().replace(/\s/g, '-')}/200` // Placeholder for admin avatar
            });

            // Now, with the user doc in place, upload the logo. The storage rule will pass.
            let logoUrl = `https://picsum.photos/seed/${companyName.toLowerCase().replace(/\s/g, '-')}/200`;
            if (avatarFile) {
                logoUrl = await uploadImage(avatarFile, `logos/${corpRef.id}/${avatarFile.name}`);
            }

            // Create the corporation and admin associate documents with the final logoUrl.
            await corpRef.set({ name: companyName, allowTips: true, logoUrl: logoUrl });

            const adminAssociateRef = db.collection('associates').doc();
            await adminAssociateRef.set({
                name, role: 'Administrator', isCorporate: true, corporateId: corpRef.id,
                email, authUid: authUser.uid, avatarUrl: logoUrl, // Use company logo as admin avatar by default
                allowTips: true, aboutMe: `Administrator for ${companyName}.`
            });

            homePath = '/corporate';
        } 
        else if (userType === 'customer') {
             await db.collection('users').doc(authUser.uid).set({ type: 'customer', name, avatarUrl });
             const tipIdToClaim = sessionStorage.getItem('claimTipId');
             if (tipIdToClaim) {
                 const tipRef = db.collection('tips').doc(tipIdToClaim);
                 await tipRef.update({ customerAuthUid: authUser.uid });
                 sessionStorage.removeItem('claimTipId');
             }
             homePath = '/customer-dashboard';
        }

        navigate(homePath);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        if (userType === 'employee' && employeeStatus === 'request') {
            await handleJoinRequest();
            nextStep();
            setIsLoading(false);
            return;
        }

        try {
            await handleCreateFirebaseAccount();
        } catch (err: any) {
             if (err.code === 'auth/email-already-in-use') dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'This email is already registered. Please log in.', type: 'error' } });
             else if (err.code === 'auth/weak-password') dispatch({ type: ActionType.SHOW_TOAST, payload: { message: 'Password should be at least 6 characters long.', type: 'error' } });
             else dispatch({ type: ActionType.SHOW_TOAST, payload: { message: err.message || 'An unexpected error occurred.', type: 'error' } });
        }
        setIsLoading(false);
    };

    const inputStyles = "mt-1 block w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary";

    const renderStepContent = () => {
        if (!userType) { // Initial selection screen is step 0
            return (
                <StepWrapper>
                    <Header title="Welcome to Bravos!" subtitle="Let's get you set up. What best describes you?" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card onClick={() => handleUserTypeSelect('customer')} className="text-center cursor-pointer hover:shadow-xl hover:border-fun-orange border-2 border-transparent transition-all">
                            <HeartIcon className="h-12 w-12 mx-auto text-fun-orange" />
                            <h3 className="mt-4 text-xl font-bold text-dark-text">I'm a Customer</h3>
                            <p className="text-medium-text mt-1 text-sm">I want to send Bravos and track my appreciation.</p>
                        </Card>
                        <Card onClick={() => handleUserTypeSelect('individual')} className="text-center cursor-pointer hover:shadow-xl hover:border-primary border-2 border-transparent transition-all">
                            <UserIcon className="h-12 w-12 mx-auto text-secondary" />
                            <h3 className="mt-4 text-xl font-bold text-dark-text">I'm an Individual Pro</h3>
                            <p className="text-medium-text mt-1 text-sm">A barista, musician, valet, or any solo service provider.</p>
                        </Card>
                        <Card onClick={() => handleUserTypeSelect('employee')} className="text-center cursor-pointer hover:shadow-xl hover:border-primary border-2 border-transparent transition-all">
                             <UsersIcon className="h-12 w-12 mx-auto text-blue-500" />
                            <h3 className="mt-4 text-xl font-bold text-dark-text">I'm an Employee</h3>
                            <p className="text-medium-text mt-1 text-sm">I'm joining a company that already uses Bravos.</p>
                        </Card>
                        <Card onClick={() => handleUserTypeSelect('corporate')} className="text-center cursor-pointer hover:shadow-xl hover:border-primary border-2 border-transparent transition-all">
                             <BuildingOfficeIcon className="h-12 w-12 mx-auto text-indigo-600" />
                            <h3 className="mt-4 text-xl font-bold text-dark-text">I'm a Business</h3>
                            <p className="text-medium-text mt-1 text-sm">I want to set up Bravos for my team of employees.</p>
                        </Card>
                    </div>
                </StepWrapper>
            );
        }
        
        const NavButtons = ({ onNext = nextStep, onBack = prevStep, nextText = 'Next', finalStep = false, submitHandler = handleSubmit }) => (
             <div className="flex items-center justify-between pt-6 border-t mt-6">
                <button type="button" onClick={onBack} className="text-sm font-semibold text-medium-text hover:text-dark-text">
                    &larr; Back
                </button>
                <button
                    type="button"
                    onClick={finalStep ? submitHandler : onNext}
                    disabled={isLoading}
                    className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-hover font-semibold disabled:bg-gray-400"
                >
                    {isLoading ? 'Processing...' : nextText}
                </button>
            </div>
        );
        
        // --- Customer Flow ---
        if (userType === 'customer') {
            if (currentStep === 1) return (<StepWrapper><Card className="max-w-lg mx-auto"><Header title="Create Your Account" />
                <ImageUploader onImageUploaded={setAvatarFile} label="Profile Picture (optional)" />
                <div className="space-y-4 mt-4">
                    <div><label className="block text-sm font-medium text-dark-text">Your Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Alex Smith" className={inputStyles} required /></div>
                    <div><label className="block text-sm font-medium text-dark-text">Email Address</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inputStyles} required/></div>
                    <div><label className="block text-sm font-medium text-dark-text">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6+ characters" className={inputStyles} required /></div>
                </div>
                <NavButtons onBack={resetFlow} /></Card></StepWrapper>);
            if (currentStep === 2) return (<StepWrapper><Card className="max-w-lg mx-auto"><Header title="Add a Payment Method" /><PaymentOptions onDataChange={setFinancialData} formData={financialData} /><NavButtons nextText="Create Account" finalStep={true} /></Card></StepWrapper>);
        }

        // --- Individual Pro Flow ---
        if (userType === 'individual') {
             if (currentStep === 1) return (<StepWrapper><Card className="max-w-lg mx-auto"><Header title="Your Public Profile"/>
                 <ImageUploader onImageUploaded={setAvatarFile} label="Profile Picture"/>
                 <div className="space-y-4 mt-4">
                     <div><label className="block text-sm font-medium text-dark-text">Your Full Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Jane Doe" className={inputStyles} required /></div>
                     <div><label className="block text-sm font-medium text-dark-text">Your Role</label><input type="text" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g., Barista" className={inputStyles} required /></div>
                     <div><label className="block text-sm font-medium text-dark-text">About Me</label><textarea value={aboutMe} onChange={e => setAboutMe(e.target.value)} rows={3} placeholder="A short bio for customers to see." className={inputStyles} required /></div>
                 </div><NavButtons onBack={resetFlow}/></Card></StepWrapper>);
            if (currentStep === 2) return (<StepWrapper><Card className="max-w-lg mx-auto"><Header title="Your Account Info"/>
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-dark-text">Email Address</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inputStyles} required/></div>
                    <div><label className="block text-sm font-medium text-dark-text">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6+ characters" className={inputStyles} required /></div>
                </div><NavButtons/></Card></StepWrapper>);
            if (currentStep === 3) return (<StepWrapper><Card className="max-w-lg mx-auto"><Header title="Payout Method" /><PayoutAccountForm onDataChange={setFinancialData} /><NavButtons nextText="Create Account" finalStep={true} /></Card></StepWrapper>);
        }
        
        // --- Corporate Flow ---
        if (userType === 'corporate') {
            if (currentStep === 1) return (<StepWrapper><Card className="max-w-lg mx-auto"><Header title="Business Information"/>
                <ImageUploader onImageUploaded={setAvatarFile} label="Company Logo" />
                <div className="space-y-4 mt-4">
                    <div><label className="block text-sm font-medium text-dark-text">Company Name</label><input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g., The Grand Hotel" className={inputStyles} required /></div>
                </div><NavButtons onBack={resetFlow} /></Card></StepWrapper>);
            if (currentStep === 2) return (<StepWrapper><Card className="max-w-lg mx-auto"><Header title="Administrator Account"/>
                <div className="space-y-4">
                     <div><label className="block text-sm font-medium text-dark-text">Your Full Name (Admin)</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="The administrator's name" className={inputStyles} required /></div>
                     <div><label className="block text-sm font-medium text-dark-text">Administrator Email Address</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@company.com" className={inputStyles} required/></div>
                     <div><label className="block text-sm font-medium text-dark-text">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6+ characters" className={inputStyles} required /></div>
                </div><NavButtons/></Card></StepWrapper>);
            if (currentStep === 3) return (<StepWrapper><Card className="max-w-lg mx-auto"><Header title="Business Payout Account" /><PayoutAccountForm onDataChange={setFinancialData} /><NavButtons nextText="Create Account" finalStep={true} /></Card></StepWrapper>);
        }

        // --- Employee Flow ---
        if (userType === 'employee') {
            if (currentStep === 1) return (<StepWrapper><Card className="max-w-lg mx-auto"><Header title="Join Your Team" subtitle="Enter your email and Employer ID to find your profile."/>
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-dark-text">Work Email Address</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className={inputStyles} required/></div>
                    <div><label className="block text-sm font-medium text-dark-text">Employer ID</label><input type="text" value={employerId} onChange={e => setEmployerId(e.target.value)} placeholder="Get this from your manager" className={inputStyles} required/></div>
                </div><NavButtons onBack={resetFlow} onNext={handleEmployeeCheck} nextText={isLoading ? "Verifying..." : "Verify"} /></Card></StepWrapper>);
            if (currentStep === 2) {
                if (employeeStatus === 'claim' && foundAssociate) return (<StepWrapper><Card className="max-w-lg mx-auto"><Header title="Welcome, we found you!" subtitle="Your profile is ready. Create a password and add a payout account to finish."/>
                     <div className="p-4 rounded-lg bg-light-bg mb-4 flex items-center space-x-4">
                        <img src={foundAssociate.avatarUrl} alt={foundAssociate.name} className="w-16 h-16 rounded-full"/>
                        <div><p className="font-bold text-dark-text text-xl">{foundAssociate.name}</p><p className="text-medium-text">{foundAssociate.role}</p></div>
                     </div>
                     <div className="space-y-4">
                        <div><label className="block text-sm font-medium text-dark-text">Full Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Confirm or update your name" className={inputStyles} required /></div>
                        <div><label className="block text-sm font-medium text-dark-text">About Me</label><textarea value={aboutMe} onChange={e => setAboutMe(e.target.value)} rows={2} placeholder="Update your bio" className={inputStyles} required /></div>
                        <div><label className="block text-sm font-medium text-dark-text">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6+ characters" className={inputStyles} required /></div>
                        <PayoutAccountForm onDataChange={setFinancialData} />
                     </div>
                     <NavButtons onBack={() => { setEmployeeStatus('check'); prevStep(); }} nextText="Claim Account" finalStep={true}/></Card></StepWrapper>);
                if (employeeStatus === 'request') return (<StepWrapper><Card className="max-w-lg mx-auto"><Header title="Profile Not Found" subtitle="No problem. Fill out your info and we'll send a request to your manager to add you." />
                     <p className="text-sm p-3 bg-blue-50 rounded-md">Your email <strong className="text-primary">{email}</strong> and employer ID have been pre-filled.</p>
                     <div className="space-y-4 mt-4">
                        <ImageUploader onImageUploaded={setAvatarFile} label="Profile Picture" />
                        <div><label className="block text-sm font-medium text-dark-text">Your Full Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Jane Doe" className={inputStyles} required /></div>
                     </div>
                     <NavButtons onBack={() => { setEmployeeStatus('check'); prevStep(); }} nextText="Send Join Request" finalStep={true} /></Card></StepWrapper>);
                // Error / Already Claimed
                return (<StepWrapper><Card className="max-w-lg mx-auto text-center"><Header title="Account Issue" />
                    <p className="text-medium-text">We couldn't proceed with your request. This may be because the Employer ID is incorrect, or the account has already been claimed.</p>
                    <div className="mt-6"><button onClick={() => { setEmployeeStatus('check'); prevStep(); }} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary-hover font-semibold">Try Again</button></div>
                </Card></StepWrapper>);
            }
        }
        
        // Final "Thank You" / "Finished" screen for all flows
        return (<StepWrapper><Card className="max-w-lg mx-auto text-center"><Header title="You're All Set!" />
             <CheckCircleIcon className="w-24 h-24 text-secondary mx-auto"/>
             <p className="text-lg text-medium-text mt-4">
                {employeeStatus === 'pending'
                    ? "Your request to join has been sent to your administrator. You'll be notified via email once it's approved."
                    : "Your account has been created successfully!"
                }
             </p>
             <div className="mt-8"><button onClick={() => navigate('/')} className="w-full px-6 py-3 rounded-md text-white bg-primary hover:bg-primary-hover font-semibold">Go to Home</button></div>
        </Card></StepWrapper>);
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
                {userType && currentStep < stepsConfig[userType].length -1 && (
                    <ProgressIndicator steps={stepsConfig[userType]} currentStep={currentStep} />
                )}
                {renderStepContent()}
            </div>
        </div>
    );
};

export default Setup;
