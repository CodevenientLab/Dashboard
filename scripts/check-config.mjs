import {readFileSync,appendFileSync,existsSync} from 'node:fs';
import {parseEnv} from 'node:util';
const names=['VITE_FIREBASE_API_KEY','VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_APP_ID'];
const defaults=existsSync('.env.production')?parseEnv(readFileSync('.env.production','utf8')):{};
const config=Object.fromEntries(names.map(name=>[name,process.env[name]||defaults[name]||'']));
const missing=names.filter(name=>!config[name]);
if(missing.length){console.error('Missing Firebase configuration:',missing.join(', '));process.exit(1);}
if(Object.values(config).some(value=>/[\r\n]/.test(value)))throw new Error('Firebase client configuration must use single-line values.');
// Public web-app identifiers only. Make the checked values available to the next CI step.
if(process.env.GITHUB_ENV)appendFileSync(process.env.GITHUB_ENV,names.map(name=>`${name}=${config[name]}\n`).join(''));
console.log('Firebase public configuration is present.');
