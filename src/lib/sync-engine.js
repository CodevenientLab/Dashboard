// A small state machine separates local editing from acknowledged cloud writes.
// Whole-workspace updates use compare-and-swap; conflicts never overwrite silently.
import {emptyWorkspace,normalise,encodeWorkspace} from './workspace.js';
export class SyncEngine {
 constructor({adapter,cache,onChange,online=true,delay=600}){this.adapter=adapter;this.cache=cache;this.onChange=onChange;this.online=online;this.delay=delay;this.data=emptyWorkspace();this.version=0;this.ready=false;this.dirty=false;this.saving=false;this.conflict=null;this.error='';this.localError='';this.disposed=false;this.timer=null;this.retry=null;
  try{const saved=cache.load();if(saved){this.data=normalise(saved.data);this.version=saved.version||0;this.dirty=!!saved.dirty;this.cached=true;this.ready=true;}}catch{this.error='Saved draft is damaged. Download a recovery file before restoring a backup.';this.blocked=true;this.ready=true;}
 }
 start(){this.unsubscribe=this.adapter.subscribe(r=>this.receive(r),e=>{this.error=e.message;this.accessDenied=e.code==='permission-denied';this.emit();});this.emit();}
 status(){return this.conflict?'conflict':this.error?'error':!this.online?'offline':!this.ready?'loading':!this.confirmed?'connecting':this.saving?'saving':this.dirty?'pending':'synced';}
 emit(){if(this.disposed)return;this.onChange({data:this.data,version:this.version,ready:this.ready,status:this.status(),dirty:this.dirty,saving:this.saving,conflict:this.conflict,error:this.error,localError:this.localError,accessDenied:this.accessDenied});}
 persist(){try{this.cache.save({data:this.data,version:this.version,dirty:this.dirty});this.localError='';}catch{this.localError='Device storage failed. Export a backup before closing; unsynced edits may be lost.';}}
 receive(remote){if(this.disposed)return;if(this.saving){this.deferred=remote;this.hasDeferred=true;return;}this.confirmed=true;this.accessDenied=false;
  if(this.blocked){this.remote=remote;this.emit();return;}
  const version=remote?.version||0;if(version<this.version){this.error='Cloud version moved backwards. Export your draft and contact the workspace owner.';this.emit();return;}
  if(this.dirty&&version!==this.version){this.conflict=remote||{version:0,data:emptyWorkspace()};this.ready=true;this.persist();this.emit();return;}
  if(!this.dirty){this.data=remote?normalise(remote.data):emptyWorkspace();this.version=version;}
  this.ready=true;this.error='';this.persist();this.emit();this.schedule();
 }
 change(data){if(!this.ready||this.blocked||this.accessDenied)throw new Error('Workspace is not ready for editing.');encodeWorkspace(data);this.data=data;this.dirty=true;this.error='';this.persist();this.emit();this.schedule();}
 schedule(){clearTimeout(this.timer);if(this.dirty&&this.online&&this.confirmed&&!this.saving&&!this.conflict&&!this.blocked)this.timer=setTimeout(()=>this.flush(),this.delay);}
 async flush(){if(this.disposed||!this.dirty||!this.online||!this.confirmed||this.saving||this.conflict||this.blocked)return;clearTimeout(this.timer);this.saving=true;const sent=this.data;this.emit();let failed=false;
  try{const version=await this.adapter.save(sent,this.version);if(this.disposed)return;this.version=version;this.dirty=this.data.revision!==sent.revision;this.error='';}
  catch(e){if(this.disposed)return;failed=true;if(e.code==='sync/conflict')this.conflict=e.remote||{version:0,data:emptyWorkspace()};else{this.error=e.message||'Cloud save failed.';this.accessDenied=e.code==='permission-denied';}}
  finally{if(!this.disposed){this.saving=false;this.persist();if(this.hasDeferred){const r=this.deferred;this.hasDeferred=false;if(failed||(r?.version||0)>=this.version)this.receive(r);}this.emit();if(!failed)this.schedule();else if(!this.conflict&&!this.accessDenied){clearTimeout(this.retry);this.retry=setTimeout(()=>{this.error='';this.flush();},10000);}}}
 }
 setOnline(value){this.online=value;this.emit();if(value)this.schedule();}
 useCloud(){if(!this.conflict)return;this.data=normalise(this.conflict.data);this.version=this.conflict.version;this.conflict=null;this.dirty=false;this.error='';this.persist();this.emit();}
 keepLocal(){if(!this.conflict)return;this.version=this.conflict.version;this.conflict=null;this.error='';this.dirty=true;this.persist();this.emit();this.schedule();}
 recover(data){this.blocked=false;this.confirmed=true;this.version=this.remote?.version||this.version;this.ready=true;this.change(data);}
 dispose(){this.disposed=true;clearTimeout(this.timer);clearTimeout(this.retry);this.unsubscribe?.();}
}
