
import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { Associate, Tip, CorporateEntity, ActionType, AppAction, CurrentUser, Message, JoinRequest, Toast } from '../types';
import { db, auth } from '../services/firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';


interface AppState {
  associates: Associate[];
  tips: Tip[];
  corporations: CorporateEntity[];
  messages: Message[];
  joinRequests: JoinRequest[];
  currentUser: CurrentUser | null;
  loading: boolean;
  toast: Toast | null;
}

const initialState: AppState = {
  associates: [],
  tips: [],
  corporations: [],
  messages: [],
  joinRequests: [],
  currentUser: null,
  loading: true,
  toast: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case ActionType.SET_LOADING:
      return { ...state, loading: action.payload };
      
    case ActionType.SET_DATA:
      return { ...state, ...action.payload };
    
    case ActionType.SET_MESSAGES:
        return { ...state, messages: action.payload };
    
    case ActionType.SET_JOIN_REQUESTS:
        return { ...state, joinRequests: action.payload };
    
    case ActionType.SEND_MESSAGE:
      if (db) {
        db.collection('messages').add({ ...action.payload, timestamp: new Date() });
      }
      return state;

    case ActionType.SET_CURRENT_USER:
      return { ...state, currentUser: action.payload, loading: false };
      
    case ActionType.LOGOUT:
      return { ...state, currentUser: null, messages: [], joinRequests: [] };

    case ActionType.DELETE_ASSOCIATE:
      if (db) {
        db.collection('associates').doc(action.payload.associateId).delete();
      }
      // Optimistic update handled by onSnapshot
      return state;

    case ActionType.DISTRIBUTE_TIPS: {
      if (db) {
          const { corporateId, associateId } = action.payload;
          const tipsRef = db.collection('tips');
          const q = associateId 
              ? tipsRef.where('associateId', '==', associateId)
              : tipsRef.where('corporateId', '==', corporateId); // Assuming tips have corporateId
          
          q.get().then(snapshot => {
              const batch = db.batch();
              snapshot.docs.forEach(doc => batch.delete(doc.ref));
              batch.commit();
          });
      }
      return state;
    }
    
    case ActionType.UPDATE_CORPORATE_SETTINGS:
      if (db) {
          db.collection('corporations').doc(action.payload.corporateId).update(action.payload.settings);
      }
      // Optimistic update handled by onSnapshot
      return state;
        
    case ActionType.UPDATE_ASSOCIATE_SETTINGS:
      if (db) {
          db.collection('associates').doc(action.payload.associateId).update(action.payload.settings);
      }
      // Optimistic update handled by onSnapshot
      return state;
    
    case ActionType.SHOW_TOAST:
        return { ...state, toast: action.payload };

    case ActionType.HIDE_TOAST:
        return { ...state, toast: null };
        
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  let unsubMessages: () => void = () => {};
  let unsubJoinRequests: () => void = () => {};

  useEffect(() => {
    if (!auth || !db) {
        dispatch({ type: ActionType.LOGOUT });
        dispatch({ type: ActionType.SET_CURRENT_USER, payload: null });
        dispatch({ type: ActionType.SET_LOADING, payload: false });
        return () => {};
    }

    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser: firebase.User | null) => {
      unsubMessages();
      unsubJoinRequests();
      
      if (firebaseUser) {
        const userProfileRef = db.collection('users').doc(firebaseUser.uid);
        const userProfileSnap = await userProfileRef.get();

        if (userProfileSnap.exists) {
          const userProfile = userProfileSnap.data()!;
          
          let profileData: Associate | CorporateEntity | {name: string, avatarUrl?: string} | null = null;
          let id = firebaseUser.uid;
          
          if (userProfile.type === 'associate' && userProfile.associateId) {
            const associateSnap = await db.collection('associates').doc(userProfile.associateId).get();
            if(associateSnap.exists) profileData = associateSnap.data() as Associate;
            id = userProfile.associateId;
          } else if (userProfile.type === 'corporate' && userProfile.corporateId) {
             const corpSnap = await db.collection('corporations').doc(userProfile.corporateId).get();
             if(corpSnap.exists) profileData = corpSnap.data() as CorporateEntity;
             id = userProfile.corporateId;
          } else if (userProfile.type === 'customer') {
            profileData = { name: userProfile.name, avatarUrl: userProfile.avatarUrl };
          }
          
          const currentUser: CurrentUser = {
            authUid: firebaseUser.uid,
            id: id,
            type: userProfile.type,
            avatarUrl: userProfile.avatarUrl || (profileData as Associate)?.avatarUrl
          };
          
          dispatch({ type: ActionType.SET_CURRENT_USER, payload: currentUser });

          const tipIdToClaim = sessionStorage.getItem('claimTipId');
          if (tipIdToClaim && userProfile.type === 'customer') {
            db.collection('tips').doc(tipIdToClaim).update({ customerAuthUid: firebaseUser.uid })
              .then(() => sessionStorage.removeItem('claimTipId'))
              .catch(e => console.error("Error claiming tip:", e));
          }

          unsubMessages = db.collection('messages').where('participantIds', 'array-contains', firebaseUser.uid).onSnapshot((snapshot) => {
              const messages = snapshot.docs.map(doc => {
                  const data = doc.data();
                  return { id: doc.id, ...data, timestamp: (data.timestamp as firebase.firestore.Timestamp).toDate() } as Message;
              });
              dispatch({ type: ActionType.SET_MESSAGES, payload: messages.sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime()) });
          });

          if (currentUser.type === 'corporate') {
              unsubJoinRequests = db.collection('joinRequests').where('corporateId', '==', currentUser.id).where('status', '==', 'pending').onSnapshot((snapshot) => {
                  const requests = snapshot.docs.map(doc => {
                      const data = doc.data();
                      return { id: doc.id, ...data, timestamp: (data.timestamp as firebase.firestore.Timestamp).toDate() } as JoinRequest;
                  });
                  dispatch({ type: ActionType.SET_JOIN_REQUESTS, payload: requests.sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime()) });
              });
          }

        } else {
           dispatch({ type: ActionType.SET_LOADING, payload: false });
        }
      } else {
        dispatch({ type: ActionType.LOGOUT });
        dispatch({ type: ActionType.SET_CURRENT_USER, payload: null });
      }
    });

    const unsubAssociates = db.collection('associates').onSnapshot((snapshot) => {
        const associates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Associate));
        dispatch({ type: ActionType.SET_DATA, payload: { ...state, associates } });
    });

    const unsubCorporations = db.collection('corporations').onSnapshot((snapshot) => {
        const corporations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CorporateEntity));
        dispatch({ type: ActionType.SET_DATA, payload: { ...state, corporations } });
    });

    const unsubTips = db.collection('tips').onSnapshot((snapshot) => {
        const tips = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: (data.timestamp as firebase.firestore.Timestamp).toDate() 
            } as Tip;
        });
        dispatch({ type: ActionType.SET_DATA, payload: { ...state, tips } });
    });

    return () => {
      unsubscribeAuth();
      unsubAssociates();
      unsubCorporations();
      unsubTips();
      unsubMessages();
      unsubJoinRequests();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
