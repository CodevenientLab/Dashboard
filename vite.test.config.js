import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
export default defineConfig({plugins:[{name:'mock-firebase-in-tests-only',enforce:'pre',resolveId(id){if(id.endsWith('/lib/firebase.js'))return fileURLToPath(new URL('./tests/browser/firebase.mock.js',import.meta.url));}},react()],base:'./',build:{outDir:'../firebase-ui-test-dist',emptyOutDir:true}});
