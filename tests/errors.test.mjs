import test from 'node:test';
import assert from 'node:assert/strict';
import {friendlyError} from '../src/lib/errors.js';
test('sign-in network errors offer a safe recovery without claiming drafts were saved',()=>{
 const text=friendlyError({code:'auth/network-request-failed'});
 assert.match(text,/Sign-in could not reach Firebase/);assert.match(text,/private browser/);assert.doesNotMatch(text,/changes remain|saved/);
});
test('domain and credential errors identify the correct sign-in problem',()=>{
 assert.match(friendlyError({code:'auth/unauthorized-domain'}),/authorised domains/);
 assert.equal(friendlyError({code:'auth/invalid-credential'}),'The email or password is incorrect.');
});
test('cloud errors direct users to sync status without promising local persistence',()=>{
 assert.match(friendlyError({code:'unavailable'}),/sync status in Settings/);
 assert.match(friendlyError({code:'permission-denied'}),/workspace access/);
});
