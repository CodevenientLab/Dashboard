const names=['VITE_FIREBASE_API_KEY','VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_APP_ID'];
const missing=names.filter(k=>!process.env[k]);if(missing.length){console.error('Missing repository variables:',missing.join(', '));process.exit(1);}console.log('Firebase public configuration is present.');
