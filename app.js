(() => {
'use strict';
const ROOT = 'assets/images/';
const SOUND = 'assets/sounds/';
const data = {
  water:{name:'ماي',voice:'water'}, apple:{name:'تفاحة',voice:'apple'},
  ball:{name:'كرة',voice:'ball'}, book:{name:'كتاب',voice:'book'},
  blanket:{name:'بطانية',voice:'blanket'}, toy:{name:'لعبة',voice:'toy'},
  none:{name:'لا أريد',voice:'none'}, done:{name:'خلصت',voice:'done'}
};
const voiceLabels = {
 start:'يلا نبدأ',choose:'شو تريد',real:'الحين نجرب في الحقيقة',
 water:'أريد ماي',apple:'أريد تفاحة',ball:'أريد الكرة',book:'أريد الكتاب',
 blanket:'أريد البطانية',toy:'أريد اللعبة',none:'لا أريد',done:'خلصت',
 praise:'أحسنت',another:'ممتاز',finish:'خلصنا! أحسنت'
};
const pairs=[['water','apple'],['ball','book'],['blanket','toy'],['water','ball'],['apple','book']];
const titles=['أشوف وأختار','أطلب اللي أريده','أطلب في الحقيقة'];
const screen = document.getElementById('screen');
const dialog = document.getElementById('adultDialog');
const adultBody = document.getElementById('adultBody');
const dots = document.getElementById('progressStages');
const msg = document.getElementById('announcer');
const state = {stage:-1,turn:0,phase:'home',selected:null,session:Date.now(),recordId:null,adultTab:'session',message:'',soundKey:'choose'};
const urlMap=new Map();
let db=null, currentAudio=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let records=[];
try{const v=JSON.parse(localStorage.getItem('communication_activity_records_v1')||'[]'); if(Array.isArray(v))records=v.slice(-1200);}catch{}
function save(){try{localStorage.setItem('communication_activity_records_v1',JSON.stringify(records.slice(-1200)));}catch{}}
function src(key){return key==='none'||key==='done' ? ROOT+key+'.svg' : ROOT+key+'.webp';}
function photo(key,cls=''){return `<img class="${cls}" src="${src(key)}" alt="${esc(data[key]?.name||'صورة')}" draggable="false">`;}
function audio(key){
 if(!voiceLabels[key])return;
 try{if(currentAudio){currentAudio.pause();currentAudio.currentTime=0;} const a=new Audio(urlMap.get(key)||SOUND+key+'.mp3');a.volume=.88;currentAudio=a; a.play().catch(()=>{});}catch{}
}
function setStage(n,play=true){
 state.stage=n;state.turn=0;state.phase='pick';state.selected=null;state.recordId=null;
 render(); if(play)audio(n===2?'real':'choose');
}
function startAll(){state.session=Date.now();setStage(0,false);audio('start');}
function goHome(){state.stage=-1;state.phase='home';state.selected=null;state.recordId=null;render();}
function stageDots(){dots.innerHTML=[0,1,2].map(i=>`<span class="${i===state.stage?'active':(state.stage>i?'done':'')}"></span>`).join('');}
function dotsTrials(){return `<div class="trial-dots" aria-label="تقدم الفرص">${pairs.map((_,i)=>`<span class="${i<state.turn?'filled':i===state.turn?'current':''}"></span>`).join('')}</div>`;}
function playPrompt(){return `<div class="play-top"><button type="button" class="play-sound" data-voice="${state.stage===2?'real':'choose'}" aria-label="اسمع التعليمات">🔊</button>${dotsTrials()}</div>`;}
function homeHTML(){
 return `<section class="screen intro" aria-label="الأنشطة المصورة">
 <div class="preview-duo"><div class="preview-tile">${photo('water')}</div><div class="preview-tile">${photo('apple')}</div></div>
 <button class="primary-round" data-command="begin" aria-label="ابدأ الأنشطة">▶</button>
 <div class="mini-sequence" aria-label="اختر نشاطًا للتجربة">
 <button class="mini-step" data-open-stage="0" aria-label="النشاط الأول: أشوف وأختار">${photo('ball')}${photo('apple')}</button>
 <button class="mini-step" data-open-stage="1" aria-label="النشاط الثاني: أطلب اللي أريده">${photo('water')}<span class="symbol" aria-hidden="true">🔊</span></button>
 <button class="mini-step" data-open-stage="2" aria-label="النشاط الثالث: أطلب في الحقيقة">${photo('book')}<span class="symbol" aria-hidden="true">🤲</span></button></div>
 </section>`;
}
function chooseButtons(scene=false){
 const pair=state.turn%2===1?[...pairs[state.turn]].reverse():pairs[state.turn];
 const items=pair.map(k=>`<button class="image-choice" type="button" data-choice="${k}" aria-label="${esc(data[k].name)}">${photo(k)}</button>`).join('');
 return scene ? `<div class="scene" aria-label="مشهد تفاعلي لاختيار الطلب"><span class="scene-hand" aria-hidden="true">🤲</span>${items}</div>` : `<div class="image-choice-grid">${items}</div>`;
}
function choiceHTML(){
 if(state.stage===0)return `${playPrompt()}${chooseButtons()}${bottomButtons()}`;
 if(state.stage===1)return `${playPrompt()}<div class="simulation-prompt" aria-hidden="true">🤲</div>${chooseButtons(true)}${bottomButtons()}`;
 return `${playPrompt()}<div class="simulation-prompt" aria-hidden="true">🤲</div>${chooseButtons()}${bottomButtons()}`;
}
function bottomButtons(){return `<div class="under-controls"><button class="refuse" type="button" data-choice="none" aria-label="لا أريد">${photo('none')}</button><button class="skip" type="button" data-command="skip" aria-label="تجاوز الفرصة">⤴</button></div>`;}
function record(item){
 state.selected=item;
 const id=`${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
 records.push({id,session:state.session,stage:state.stage+1,turn:state.turn+1,time:new Date().toISOString(),selected:item,
 independence:'لم يُقيّم',intent:'لم يُقيّم',delivery:'لم يُقيّم',medium:'لمس الصورة',place:'لم يُحدّد'});
 state.recordId=id;save();state.phase='result';render();audio(item);
}
function latest(){return records.find(r=>r.id===state.recordId)||null;}
function resultHTML(){
 const item=state.selected;
 return `<div class="result"><div class="result-burst" aria-hidden="true">✦</div>${photo(item,'result-photo')}
 ${state.stage===1?`<div class="handoff" aria-hidden="true"><span>🤲</span><span class="arrow">←</span>${photo(item)}</div>`:''}
 ${state.stage===2?`<div class="scenario-note" aria-hidden="true"><span class="gesture">🤲</span>${photo(item)}<span class="gesture">✅</span></div>`:''}
 <div class="result-actions"><button class="result-audio" type="button" data-voice="${item}" aria-label="اسمع طلبي">🔊</button><button class="next-step" type="button" data-command="next" aria-label="التالي">←</button></div></div>`;
}
function endHTML(){const last=state.stage===2;return `<div class="end-visual"><div class="stars" aria-hidden="true">✦ ✦ ✦</div><div class="finish-circle" aria-hidden="true">${last?'✓':'★'}</div><div class="end-actions"><button class="primary" data-command="${last?'home':'nextStage'}" type="button" aria-label="${last?'الرئيسية':'النشاط التالي'}">${last?'⌂':'←'}</button><button data-command="repeat" type="button" aria-label="العب مرة أخرى">↻</button></div></div>`;}
function render(){stageDots();if(state.stage<0){screen.innerHTML=homeHTML();return;}screen.innerHTML=`<section class="screen screen-play" aria-label="${titles[state.stage]}">${state.phase==='pick'?choiceHTML():state.phase==='result'?resultHTML():endHTML()}</section>`;}
function next(){state.turn++;state.selected=null;state.recordId=null;if(state.turn>=5){state.phase='end';render();audio('finish');return;} state.phase='pick';render();audio(state.stage===2?'real':'choose');}
function skip(){records.push({id:`${Date.now()}-skip-${state.turn}`,session:state.session,stage:state.stage+1,turn:state.turn+1,time:new Date().toISOString(),selected:'تجاوز',independence:'لم يستجب',intent:'لا',delivery:'لا',medium:'—',place:'لم يُحدّد'});save();next();}
screen.addEventListener('click',e=>{
 const el=e.target.closest('button');if(!el)return;
 if(el.dataset.voice){audio(el.dataset.voice);return;}
 if(el.dataset.choice){record(el.dataset.choice);return;}
 if(el.dataset.openStage!==undefined){state.session=Date.now();setStage(Number(el.dataset.openStage));return;}
 switch(el.dataset.command){case 'begin':startAll();break;case 'next':next();break;case 'nextStage':setStage(Math.min(2,state.stage+1));break;case 'repeat':setStage(state.stage);break;case 'home':goHome();break;case 'skip':skip();break;}
});
document.getElementById('goHome').addEventListener('click',goHome);
document.getElementById('openSettings').addEventListener('click',()=>{state.adultTab='session';updateAdult();dialog.showModal();});
document.getElementById('closeSettings').addEventListener('click',()=>dialog.close());
document.querySelectorAll('[data-tab]').forEach(x=>x.addEventListener('click',()=>{state.adultTab=x.dataset.tab;updateAdult();}));
function updateAdult(){document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('selected',x.dataset.tab===state.adultTab));adultBody.innerHTML=state.adultTab==='session'?sessionTab():state.adultTab==='audio'?audioTab():infoTab();}
function count(){const rs=records.filter(r=>r.session===state.session);return {all:rs.length,ind:rs.filter(r=>r.independence==='مستقل'&&r.intent==='نعم'&&r.delivery==='نعم'&&r.stage===3).length,indAll:rs.filter(r=>r.independence==='مستقل').length,pending:rs.filter(r=>r.independence==='لم يُقيّم').length};}
function sessionTab(){const t=count();const r=latest();const all=records.slice(-35).reverse();return `<div class="panel"><h3>تقييم التواصل الوظيفي</h3><p>الضغط على الصورة لا يُعد وحده دليلًا على طلب مقصود. تابعي المبادرة، والمساعدة، وما إذا حصل الطفل على ما طلبه في الواقع.</p><div class="stats"><div><strong>${t.all}</strong>فرصة</div><div><strong>${t.indAll}</strong>مستقل</div><div><strong>${t.ind}</strong>طلب واقعي مستقل</div></div></div>
 ${r?`<div class="panel"><h3>آخر استجابة: ${esc(data[r.selected]?.name||r.selected)}</h3><div class="adults-grid"><button data-rmark="مستقل" class="${r.independence==='مستقل'?'on':''}">مستقل</button><button data-rmark="بمساعدة" class="${r.independence==='بمساعدة'?'on':''}">بمساعدة</button><button data-rmark="لم يستجب" class="${r.independence==='لم يستجب'?'on':''}">لم يستجب</button></div>
 <label for="intentVal">هل كان الطلب مقصودًا؟</label><select id="intentVal" data-rfield="intent">${selectOptions(r.intent,['لم يُقيّم','نعم','لا','غير واضح'])}</select>
 <label for="deliveryVal">هل استجاب المرافق للطلب وقدّم الشيء أو النشاط؟</label><select id="deliveryVal" data-rfield="delivery">${selectOptions(r.delivery,['لم يُقيّم','نعم','لا','غير متاح'])}</select>
 <label for="mediumVal">وسيلة التواصل</label><select id="mediumVal" data-rfield="medium">${selectOptions(r.medium,['لمس الصورة','إشارة','بطاقة مصورة','إيماءة','صوت مقصود','كلام'])}</select>
 <label for="placeVal">مكان التجربة</label><select id="placeVal" data-rfield="place">${selectOptions(r.place,['لم يُحدّد','المركز','المنزل','مكان آخر'])}</select></div>`:''}
 <div class="panel"><h3>سجل المحاولات</h3><div class="log-wrap"><table><thead><tr><th>النشاط</th><th>الفرصة</th><th>الاختيار</th><th>الاستقلالية</th><th>تعديل</th></tr></thead><tbody>${all.map(a=>`<tr><td>${a.stage}</td><td>${a.turn}</td><td>${esc(data[a.selected]?.name||a.selected)}</td><td>${esc(a.independence)}</td><td><button data-edit="${esc(a.id)}">تعديل</button></td></tr>`).join('')}</tbody></table></div>${!all.length?'<p>لم تُسجَّل محاولات بعد.</p>':''}</div>
 <div class="panel"><button type="button" data-admin="export">تنزيل النتائج CSV</button><button type="button" data-admin="clear">حذف النتائج من هذا الجهاز</button></div>`;}
function selectOptions(current,opts){return opts.map(o=>`<option ${o===current?'selected':''}>${esc(o)}</option>`).join('');}
function audioTab(){return `<div class="panel"><h3>الأصوات العُمانية المسجلة</h3><p>الأصوات الأساسية مرفقة بالموقع وتعمل من مجلد assets/sounds. ويمكن استبدال أي تسجيل محليًا للاختبار على هذا الجهاز فقط.</p><label for="voiceKey">اختر العبارة</label><select id="voiceKey">${Object.entries(voiceLabels).map(([k,v])=>`<option value="${k}" ${k===state.soundKey?'selected':''}>${esc(v)}</option>`).join('')}</select><label for="voiceUpload">إضافة تسجيل جديد</label><input type="file" id="voiceUpload" accept="audio/*"><button data-admin="listen">🔊 استمع</button><button data-admin="remove">استعادة الملف الأصلي</button><p class="muted">${esc(state.message)}</p></div>`;}
function infoTab(){return `<div class="panel"><h3>مراحل الخطة الفردية</h3><ol><li><b>أشوف وأختار:</b> يختار الطفل ما يفضله من صورتين، ويستجيب المرافق لطلبه.</li><li><b>أطلب اللي أريده:</b> تفاعل محاكى مع صورة على سطح واضح. يتبع الاختيار نطق العبارة المسجلة وعرض الغرض.</li><li><b>أطلب في الحقيقة:</b> تُجهَّز أغراض حقيقية مشابهة للصور. يختار الطفل أو يشير أو يستخدم بطاقة، ثم يقدم المرافق ما طلبه مع توثيق استقلاليته.</li></ol><p>خمس فرص في كل نشاط، دون مؤقت أو اشتراط للقراءة أو الكلام. يمكن بدء أي نشاط مباشرة من الصفحة الرئيسية.</p></div><div class="adult-warning"><b>مهم:</b> النجاح في التطبيق لا يثبت تعميم التواصل. يُعتمد الحكم التربوي على الملاحظات الواقعية المتكررة. لا تحفظي بيانات تعريفية عن الطفل داخل المشروع.</div>`;}
adultBody.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.edit){state.recordId=b.dataset.edit;updateAdult();return;}
 const r=latest();if(b.dataset.rmark&&r){r.independence=b.dataset.rmark;save();updateAdult();return;}
 switch(b.dataset.admin){case 'listen':audio(state.soundKey);break;case 'remove':await resetSound(state.soundKey);state.message='عادت النسخة الأصلية من التسجيل.';updateAdult();break;case 'clear':if(confirm('هل تريد حذف نتائج الجلسات المخزنة على هذا الجهاز؟')){records=[];save();state.recordId=null;updateAdult();}break;case 'export':exportData();break;}
});
adultBody.addEventListener('change',async e=>{const t=e.target;const r=latest();if(t.dataset.rfield&&r){r[t.dataset.rfield]=t.value;save();return;}if(t.id==='voiceKey'){state.soundKey=t.value;updateAdult();return;}if(t.id==='voiceUpload'&&t.files?.[0]){const f=t.files[0];if(f.size>5*1024*1024||!f.type.startsWith('audio/')){state.message='اختاري تسجيلًا صوتيًا أصغر من 5 ميجابايت.';updateAdult();return;}await saveSound(state.soundKey,f);state.message='تم حفظ الصوت محليًا على هذا الجهاز.';updateAdult();}});
function exportData(){if(!records.length){alert('لا توجد نتائج بعد.');return;}const keys=[['time','التاريخ'],['stage','النشاط'],['turn','الفرصة'],['selected','الاختيار'],['independence','الاستقلالية'],['intent','طلب مقصود'],['delivery','استجابة للطلب'],['medium','وسيلة التواصل'],['place','مكان التطبيق']];function q(s){return '"'+String(s??'').replace(/"/g,'""')+'"';}let csv='\ufeff'+keys.map(k=>q(k[1])).join(',')+'\r\n'+records.map(r=>keys.map(k=>q(k[0]==='selected'?data[r.selected]?.name||r.selected:r[k[0]])).join(',')).join('\r\n');const link=document.createElement('a'),u=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));link.href=u;link.download='communication_observations.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(u),2500);}
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('communication_audio_v1',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('media'))r.result.createObjectStore('media');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function getAllAudio(database){return new Promise(resolve=>{const o=database.transaction('media').objectStore('media');const req=o.openCursor();req.onsuccess=()=>{const c=req.result;if(c){if(c.value instanceof Blob)urlMap.set(c.key,URL.createObjectURL(c.value));c.continue();}else resolve();};req.onerror=()=>resolve();});}
async function saveSound(key,f){if(!db)return;try{await new Promise((resolve,reject)=>{const r=db.transaction('media','readwrite').objectStore('media').put(f,key);r.onsuccess=resolve;r.onerror=()=>reject(r.error);});if(urlMap.has(key))URL.revokeObjectURL(urlMap.get(key));urlMap.set(key,URL.createObjectURL(f));}catch{state.message='تعذر حفظ التسجيل على هذا المتصفح.';}}
async function resetSound(key){if(!db)return;try{await new Promise((resolve,reject)=>{const r=db.transaction('media','readwrite').objectStore('media').delete(key);r.onsuccess=resolve;r.onerror=()=>reject(r.error);});if(urlMap.has(key))URL.revokeObjectURL(urlMap.get(key));urlMap.delete(key);}catch{}}
render();if('indexedDB' in window){openDB().then(x=>{db=x;return getAllAudio(x);}).catch(()=>{});}
})();