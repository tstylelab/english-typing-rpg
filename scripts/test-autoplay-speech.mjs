import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpile(fs.readFileSync('src/autoPlaySpeech.ts', 'utf8'), {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});
function setup({text='hello',lang='en-US',rate=1,throwSpeak=false,voice=null,onSpeak}={}) {
  let now=0,id=0,ends=0,failures=0,retries=0,resumes=0,cancels=0;
  const timers=new Map(),listeners=new Set(),spoken=[],failureReasons=[];
  const document={visibilityState:'visible',addEventListener(_,fn){listeners.add(fn);},removeEventListener(_,fn){listeners.delete(fn);}};
  const synth={paused:false,speak(u){spoken.push(u);if(throwSpeak)throw Error('speech unavailable');onSpeak?.(u);},cancel(){cancels++;spoken.at(-1)?.onerror?.({error:'canceled'});},resume(){resumes++;this.paused=false;}};
  const module={exports:{}};
  vm.runInNewContext(code,{exports:module.exports,Date:{now:()=>now},document,
    SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},
    window:{speechSynthesis:synth,setTimeout(fn,ms){timers.set(++id,{fn,at:now+ms});return id;},clearTimeout(i){timers.delete(i);}}});
  const dispose=module.exports.speakAutoPlayEntry(text,{lang,voice,rate,onend(){ends++;},onfailure(reason){failures++;failureReasons.push(reason);},onretry(){retries++;}});
  return {spoken,timers,listeners,synth,dispose,failureReasons,
    counts:()=>({ends,failures,retries,resumes,cancels}),
    tick(ms){const end=now+ms;for(;;){const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;timers.delete(next[0]);now=next[1].at;next[1].fn();}now=end;},
    visibility(value){document.visibilityState=value;[...listeners].forEach(fn=>fn());}};
}
const normal=setup();const end=normal.spoken[0].onend,err=normal.spoken[0].onerror;
end();err({error:'interrupted'});end();normal.tick(120000);
assert.equal(normal.counts().ends,1);assert.equal(normal.counts().failures,0);assert.equal(normal.timers.size,0);assert.equal(normal.listeners.size,0);

const missing=setup();const stale=missing.spoken[0].onend;
missing.tick(30300);assert.equal(missing.spoken.length,2);stale();assert.equal(missing.counts().ends,0);
missing.spoken[1].onend();assert.equal(missing.counts().ends,1);assert.equal(missing.timers.size,0);
const stuck=setup();stuck.tick(1000000);assert.equal(stuck.spoken.length,2);assert.equal(stuck.counts().failures,1);assert.equal(stuck.timers.size,0);
const error=setup();error.spoken[0].onerror({error:'network'});error.tick(300);error.spoken[1].onend();assert.equal(error.counts().ends,1);
const denied=setup();denied.spoken[0].onerror({error:'not-allowed'});denied.tick(60000);assert.equal(denied.spoken.length,1);assert.equal(denied.counts().failures,1);
const throwing=setup({throwSpeak:true});throwing.tick(60000);assert.equal(throwing.counts().failures,1);assert.equal(throwing.spoken.length,2);
const paused=setup();paused.synth.paused=true;paused.tick(5000);assert.equal(paused.counts().resumes,1);paused.dispose();
const hidden=setup();hidden.visibility('hidden');hidden.spoken[0].onerror({error:'interrupted'});hidden.tick(120000);assert.equal(hidden.spoken.length,1);hidden.visibility('visible');hidden.tick(300);assert.equal(hidden.spoken.length,2);hidden.spoken[1].onend();assert.equal(hidden.counts().ends,1);
const suspended=setup();suspended.visibility('hidden');suspended.tick(120000);suspended.visibility('visible');suspended.tick(300);assert.equal(suspended.spoken.length,2);suspended.dispose();
const stopped=setup();stopped.tick(30000);stopped.dispose();stopped.tick(120000);stopped.visibility('visible');assert.equal(stopped.spoken.length,1);assert.equal(stopped.listeners.size,0);assert.equal(stopped.timers.size,0);
const long=setup({text:'x'.repeat(400),rate:0.75});long.tick(120000);assert.equal(long.spoken.length,1,'Long slow speech must not be cut at a fixed short timeout');long.spoken[0].onboundary();long.tick(200000);assert.equal(long.spoken.length,1);long.spoken[0].onend();

// A voice advertised by the phone can fail while its language's default still works.
const unavailable=setup({voice:{name:'Unavailable English voice',lang:'en-US'},onSpeak(u){
  if(u.voice)u.onerror({error:'voice-unavailable'});else u.onend();
}});
unavailable.tick(300);
assert.equal(unavailable.spoken.length,2);
assert.equal(unavailable.spoken[1].voice??null,null,'Retry must release the failing explicit voice');
assert.equal(unavailable.spoken[1].lang,'en-US','Default fallback must retain the requested language');
assert.equal(unavailable.counts().ends,1);
assert.equal(unavailable.counts().failures,0);
assert.equal(unavailable.timers.size,0);
const japanese=setup({lang:'ja-JP',voice:{name:'Unavailable Japanese voice',lang:'ja-JP'},onSpeak(u){if(u.voice)u.onerror({error:'synthesis-failed'});else u.onend();}});
japanese.tick(300);assert.equal(japanese.spoken[1].lang,'ja-JP');assert.equal(japanese.counts().ends,1);
const noVoice=setup({voice:{name:'Missing voice',lang:'en-US'},onSpeak(u){u.onerror({error:'voice-unavailable'});}});
noVoice.tick(60000);assert.equal(noVoice.spoken.length,2);assert.equal(noVoice.counts().failures,1);assert.deepEqual(noVoice.failureReasons,['voice-unavailable']);assert.equal(noVoice.timers.size,0);
assert.deepEqual(denied.failureReasons,['not-allowed']);assert.deepEqual(stuck.failureReasons,['timeout']);
const blocked=setup({voice:{name:'Present voice'},onSpeak(u){u.onerror({error:'not-allowed'});}});
blocked.tick(60000);assert.equal(blocked.spoken.length,1);assert.deepEqual(blocked.failureReasons,['not-allowed']);
const unsupported={exports:{}};vm.runInNewContext(code,{exports:unsupported.exports,window:{},document:{}});
let unavailableReason;unsupported.exports.speakAutoPlayEntry('hello',{onfailure(reason){unavailableReason=reason;}});assert.equal(unavailableReason,'unsupported');
assert.notEqual(unsupported.exports.getAutoPlaySpeechFailureMessage('network'),unsupported.exports.getAutoPlaySpeechFailureMessage('not-allowed'));
console.log('PASS: missing/duplicate/stale events, bounded retry, errors, denial, exceptions, pause, hidden/visible, stop cleanup, long slow speech, device-default English/Japanese fallback, explicit failure reasons, unsupported browser');
