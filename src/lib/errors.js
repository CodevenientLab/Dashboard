export function friendlyError(error){
 const code=error?.code||'';
 if(code==='auth/network-request-failed')return 'Sign-in could not reach Firebase. Check your connection or try a private browser window. Keep your original window open to preserve any local drafts.';
 if(code==='auth/unauthorized-domain')return 'This website is not authorised for Firebase sign-in. Check the project’s authorised domains.';
 if(code.includes('invalid-credential')||code.includes('user-not-found')||code.includes('wrong-password'))return 'The email or password is incorrect.';
 if(code.includes('too-many-requests'))return 'Too many attempts. Please wait before trying again.';
 if(code.includes('permission-denied'))return 'This account does not have workspace access. Check its approvedUsers entry and Firestore rules.';
 if(code.includes('network')||code.includes('unavailable'))return 'Cannot reach the cloud. Check your connection and the sync status in Settings.';
 return error?.message||'Something went wrong. Please try again.';
}
