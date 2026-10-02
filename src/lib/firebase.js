import { initializeApp } from 'firebase/app';
import {getAuth,onAuthStateChanged,setPersistence,browserLocalPersistence,browserSessionPersistence,signInWithEmailAndPassword,sendPasswordResetEmail,signOut} from 'firebase/auth';
import {getFirestore,doc,onSnapshot,runTransaction,serverTimestamp} from 'firebase/firestore';
import {encodeWorkspace,normalise} from './workspace.js';
const config={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID};
export const configured=Object.values(config).every(Boolean);
export const app=configured?initializeApp(config):null;
export const auth=app?getAuth(app):null;
const db=app?getFirestore(app):null;
export const observeUser=(next,error)=>onAuthStateChanged(auth,next,error);
export async function login(email,password,remember){await setPersistence(auth,remember?browserLocalPersistence:browserSessionPersistence);return signInWithEmailAndPassword(auth,email.trim(),password);}
export const resetPassword=email=>sendPasswordResetEmail(auth,email.trim());
export const logout=()=>signOut(auth);
export function friendlyError(error){const code=error?.code||'';if(code.includes('invalid-credential')||code.includes('user-not-found')||code.includes('wrong-password'))return 'The email or password is incorrect.';if(code.includes('too-many-requests'))return 'Too many attempts. Please wait before trying again.';if(code.includes('permission-denied'))return 'This account does not have workspace access. Check its approvedUsers entry and Firestore rules.';if(code.includes('network')||code.includes('unavailable'))return 'Cannot reach the cloud. Your unsynced changes remain on this device.';return error?.message||'Something went wrong. Please try again.';}
function decode(snapshot){if(!snapshot.exists())return null;const raw=snapshot.data();return {version:raw.version,data:normalise(JSON.parse(raw.payload))};}
export function adapterFor(uid){const ref=doc(db,'users',uid,'workspace','main');return {
 subscribe: (onData,onError)=>onSnapshot(ref,{includeMetadataChanges:true},snap=>{if(snap.metadata.fromCache||snap.metadata.hasPendingWrites)return;try{onData(decode(snap));}catch(e){onError(e);}},onError),
 save: async (data,expectedVersion)=>{const payload=encodeWorkspace(data);return runTransaction(db,async tx=>{const snap=await tx.get(ref);const current=decode(snap);if((current?.version||0)!==expectedVersion){const e=new Error('Another device saved a newer version.');e.code='sync/conflict';e.remote=current;throw e;}const version=expectedVersion+1;tx.set(ref,{payload,version,updatedAt:serverTimestamp()});return version;});}
};}
