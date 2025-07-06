
export interface CurrentUser {
  id: string; // This will be the associate, corporate, or auth ID from Firestore
  type: 'associate' | 'corporate' | 'customer';
  authUid: string; // Firebase Auth User ID
  avatarUrl?: string; // User's profile picture
}

export interface Associate {
  id: string;
  authUid?: string; // Firebase Auth User ID for this associate. Optional until claimed.
  email: string; // Email is now required and the primary link for claiming an account.
  name: string;
  role: string;
  isCorporate: boolean;
  corporateId?: string;
  avatarUrl: string;
  allowTips: boolean;
  aboutMe: string;
}

export interface Tip {
  id:string;
  associateId: string;
  amount: number;
  message: string;
  customerName: string;
  timestamp: Date;
  customerAuthUid?: string; // Link to the customer who sent the tip, if they are logged in
}

export interface CorporateEntity {
  id:string;
  name: string;
  allowTips: boolean;
  logoUrl?: string;
}

export interface Message {
    id: string;
    tipId: string; // Link to the original Bravo
    participantIds: string[]; // [fromId, toId] for easy querying
    fromId: string; // authUid of sender
    toId: string; // authUid of receiver
    text: string;
    timestamp: Date;
}

export interface JoinRequest {
    id: string;
    corporateId: string;
    email: string;
    name: string;
    avatarUrl: string;
    status: 'pending' | 'approved' | 'denied';
    timestamp: Date;
}

export interface Toast {
    message: string;
    type: 'success' | 'error';
}

export interface PaymentData {
    cardNumber: string;
    expiry: string;
    cvc: string;
    cardHolderName: string;
    zip: string;
}

export interface PayoutData {
    accountHolderName: string;
    routingNumber: string;
    accountNumber: string;
}


export enum ActionType {
    DELETE_ASSOCIATE = 'DELETE_ASSOCIATE',
    DISTRIBUTE_TIPS = 'DISTRIBUTE_TIPS',
    UPDATE_CORPORATE_SETTINGS = 'UPDATE_CORPORATE_SETTINGS',
    UPDATE_ASSOCIATE_SETTINGS = 'UPDATE_ASSOCIATE_SETTINGS',
    SET_CURRENT_USER = 'SET_CURRENT_USER',
    LOGOUT = 'LOGOUT',
    // New actions for Firebase integration
    SET_LOADING = 'SET_LOADING',
    SET_DATA = 'SET_DATA',
    SEND_MESSAGE = 'SEND_MESSAGE',
    SET_MESSAGES = 'SET_MESSAGES',
    SET_JOIN_REQUESTS = 'SET_JOIN_REQUESTS',
    SHOW_TOAST = 'SHOW_TOAST',
    HIDE_TOAST = 'HIDE_TOAST',
}

export type AppAction =
    | { type: ActionType.DELETE_ASSOCIATE; payload: { associateId: string } }
    | { type: ActionType.DISTRIBUTE_TIPS; payload: { corporateId: string; associateId?: string; } }
    | { type: ActionType.UPDATE_CORPORATE_SETTINGS; payload: { corporateId: string; settings: Partial<Pick<CorporateEntity, 'allowTips' | 'logoUrl'>> } }
    | { type: ActionType.UPDATE_ASSOCIATE_SETTINGS; payload: { associateId: string; settings: Partial<Pick<Associate, 'allowTips' | 'name' | 'aboutMe' | 'avatarUrl'>> } }
    | { type: ActionType.SET_CURRENT_USER; payload: CurrentUser | null }
    | { type: ActionType.LOGOUT }
    | { type: ActionType.SET_LOADING; payload: boolean }
    | { type: ActionType.SET_DATA, payload: { associates: Associate[], tips: Tip[], corporations: CorporateEntity[] } }
    | { type: ActionType.SEND_MESSAGE, payload: Omit<Message, 'id' | 'timestamp'> }
    | { type: ActionType.SET_MESSAGES, payload: Message[] }
    | { type: ActionType.SET_JOIN_REQUESTS, payload: JoinRequest[] }
    | { type: ActionType.SHOW_TOAST, payload: Toast }
    | { type: ActionType.HIDE_TOAST };
