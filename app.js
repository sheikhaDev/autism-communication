/* «في بيتنا العُماني» — تطبيق تعليمي مستقل دون حسابات أو بيانات شخصية */
(() => {
  'use strict';
  const IMG = 'assets/images/';
  const SOUND = 'assets/sounds/';
  // تسجيلات المستخدم المضافة إلى نسخة النشر؛ البقية تنتظر التسجيل.
  const bundledSounds = new Set(['start','choose','sim','real','kitchen','majlis','bedroom','water','apple','ball','book','blanket','help','toy','none','done','praise','another','finish']);
  function hasSound(key){return bundledSounds.has(key) || mediaUrls.has('audio:'+key);}
  const labels = {
    water: 'الماي', apple: 'التفاحة', ball: 'الكرة', book: 'الكتاب',
    blanket: 'البطانية', help: 'مساعدة', toy: 'اللعبة', none: 'لا أريد', done: 'خلصت'
  };
  const phrases = {
    water: 'أريد ماي', apple: 'أريد تفاحة', ball: 'أريد الكرة',
    book: 'أريد الكتاب', blanket: 'أريد البطانية', help: 'أريد مساعدة',
    toy: 'أريد اللعبة', none: 'لا أريد', done: 'خلصت'
  };
  const voiceLabels = {
    start: 'يلا نبدأ!', choose: 'شو تريد؟', sim: 'يلا ندخل البيت',
    real: 'الحين نجرب في الحقيقة', kitchen: 'هذا المطبخ', majlis: 'هذا المجلس', bedroom: 'هذي غرفة النوم',
    water: 'أريد ماي', apple: 'أريد تفاحة', ball: 'أريد الكرة', book: 'أريد الكتاب',
    blanket: 'أريد البطانية', help: 'أريد مساعدة', toy: 'أريد اللعبة',
    none: 'لا أريد', done: 'خلصت', praise: 'أحسنت!', another: 'ممتاز!', finish: 'خلصنا! أحسنت!'
  };
  const activityInfo = {
    choose: {title:'أشوف وأتواصل',sub:'أختار اللي أريده',img:'water'},
    sim: {title:'ألعب في بيتنا',sub:'أطلب من غرف البيت',img:'kitchen'},
    real: {title:'أجرب في الحقيقة',sub:'أستخدم صورتي مع الأشياء الحقيقية',img:'ball'}
  };
  const choosePairs = [ ['water','apple'], ['ball','book'], ['blanket','toy'], ['apple','ball'], ['water','book'] ];
  const roomInfo = {
    kitchen:{title:'المطبخ',img:'kitchen',items:['water','apple']},
    majlis:{title:'المجلس',img:'majlis',items:['ball','book']},
    bedroom:{title:'غرفة النوم',img:'bedroom',items:['blanket','help']}
  };
  const roomKeys = ['kitchen','majlis','bedroom'];
  const main = document.getElementById('mainContent');
  const dialog = document.getElementById('adultDialog');
  const adultContent = document.getElementById('adultContent');
  const state = {
    activity:'home', phase:'start', turn:0, room:'kitchen', item:null,
    entryId:null, sessionId:Date.now(), adultTab:'session',
    soundKey:'choose', imageKey:'water', editId:null, message:''
  };
  let history = [];
  try { history = JSON.parse(localStorage.getItem('fi_baytina_history_v2') || '[]'); if (!Array.isArray(history)) history=[]; } catch { history=[]; }
  const mediaUrls = new Map();
  let activeAudio = null;
  let mediaDb = null;
  function escapeHTML(str){ return String(str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  const realisticImages = new Set(['home','kitchen','majlis','bedroom','water','apple','ball','book','blanket']);
  function urlImage(key){return mediaUrls.get('image:'+key) || (IMG+key+(realisticImages.has(key)?'.webp':'.svg'));}
  function image(key,cls='',alt=''){ return `<img class="${cls}" src="${urlImage(key)}" alt="${escapeHTML(alt||labels[key]||'مشهد منزلي')}" loading="eager">`; }
  function save(){try{localStorage.setItem('fi_baytina_history_v2',JSON.stringify(history.slice(-600)));}catch{} }
  function getLast(){return history.find(e=>e.id===state.entryId);}
  function editableRecord(){return history.find(e=>e.id===state.editId) || getLast() || history[history.length-1];}
  function sound(key){
    if (!key || !voiceLabels[key] || !hasSound(key)) return;
    const src = mediaUrls.get('audio:'+key) || SOUND+key+'.mp3';
    try { if(activeAudio){activeAudio.pause();activeAudio.currentTime=0;} const a = new Audio(src); activeAudio=a; a.volume=.86; a.play().catch(()=>{}); } catch {}
  }
  function pips(){
    return `<div class="pips" aria-label="تقدم النشاط">${Array.from({length:5},(_,i)=>`<span class="pip ${i < state.turn?'full':i === state.turn?'current':''}"></span>`).join('')}</div>`;
  }
  function header(){return `<div class="game-head"><div class="game-title-box"><button class="back-home" data-action="home" aria-label="العودة للصفحة الرئيسية">⌂</button><div><h1>${activityInfo[state.activity].title}</h1><small>${activityInfo[state.activity].sub}</small></div></div>${pips()}</div>`;}
  function prompt(text,key){const ready=hasSound(key); return `<div class="prompt-strip"><span class="prompt-text">${text}</span><button class="sound-btn" type="button" aria-label="${ready?'استمع':'لم يُضف الصوت بعد'}" ${ready?`data-audio="${key}"`:'disabled'} title="${ready?'استمع للتسجيل':'يمكن للمرافق نطق السؤال مؤقتًا'}">${ready?'🔊':'🔇'}</button></div>`;}
  function controls(extra=''){return `<div class="game-bottom">${extra}<button type="button" data-action="finish" class="quiet-btn">✓ خلصت</button></div>`;}
  function homepage(){
    state.activity='home'; state.phase='start'; state.turn=0; state.entryId=null;
    main.innerHTML=`<section class="home-hero"><div class="hero-copy"><span class="eyebrow">لعبة تعليمية تفاعلية 🎮</span><h1>أهلًا في <span>بيتنا العُماني!</span></h1><p>نلعب ونختار ونتواصل!</p></div><div class="hero-art">${image('home','','رسم كرتوني لبيت عُماني')}<div class="hero-bubble">🌟 كل اختيار له معنى!</div></div></section>
    <div class="section-heading"><h2>نلعب ونتواصل</h2><div class="line"></div></div>
    <section class="game-grid" aria-label="الأنشطة التعليمية">
    ${['choose','sim','real'].map((key,i)=>`<button class="game-card" type="button" data-start="${key}">${image(activityInfo[key].img,'',activityInfo[key].title)}<div style="flex:1;min-width:0"><div class="game-label"><h3>${['١ · ','٢ · ','٣ · '][i]}${activityInfo[key].title}</h3><span class="go" aria-hidden="true">←</span></div><div class="game-desc">${activityInfo[key].sub}</div></div></button>`).join('')}</section>
    `;
  }
  function start(key){
    state.activity=key;state.phase=key==='sim'?'chooseRoom':'pick';state.turn=0;state.item=null;state.entryId=null;state.editId=null; state.sessionId=Date.now();
    render(); sound('start');
  }
  function startNew(){const key=state.activity; if(key==='home'){homepage();return;} start(key);}
  function finish(){ if(state.activity==='home'){homepage();return;} state.phase='end'; state.entryId=null;render();sound('finish'); }
  function recordChoice(item){
    state.item=item;
    const record={id:Date.now()+'-'+Math.floor(Math.random()*100000),session:state.sessionId,
      time:new Date().toISOString(),activity:state.activity,opportunity:state.turn+1,
      scene:state.activity==='sim'?state.room:(state.activity==='real'?'واقع':'اختيار'),
      selected:item,method:'لم يُحدد',support:'لم يُقيّم',setting:'لم يُحدد',functional:'لم يُقيّم'};
    history.push(record);save();state.entryId=record.id;state.editId=record.id;state.phase='feedback';render();sound(item==='none'?'none':(state.turn%2?'another':'praise'));
  }
  function next(){state.turn++;state.item=null;state.entryId=null;
    if(state.turn >= 5){finish();return;}
    state.phase=state.activity==='sim'?'chooseRoom':'pick';render();
  }
  function displayChoose(){
    const pair=state.turn%2===0?choosePairs[state.turn]:[...choosePairs[state.turn]].reverse();
    return `${prompt('شو تريد؟','choose')}<div class="choice-grid">${pair.map(x=>`<button class="choice" data-pick="${x}" type="button" aria-label="${labels[x]}">${image(x)}<span class="object-name">${labels[x]}</span></button>`).join('')}</div>
      ${controls('<button data-pick="none" type="button" class="soft-btn">✋ لا أريد</button>')}`;
  }
  function displaySim(){
    if(state.phase==='chooseRoom') return `${prompt('نروح أي غرفة؟','sim')}<div class="rooms-list">${roomKeys.map(k=>`<button class="room-pick" data-room="${k}" type="button">${image(roomInfo[k].img,'',roomInfo[k].title)}<b>${roomInfo[k].title}</b></button>`).join('')}</div>${controls()}`;
    const r=roomInfo[state.room];
    return `<div class="room-stage">${image(r.img,'',r.title)}${r.items.map((key,i)=>`<button class="room-hotspot ${i===0?'right':'left'}" data-pick="${key}" aria-label="${labels[key]}" type="button">${image(key)}</button>`).join('')}</div>
      <div class="room-tools"><button class="current" type="button" ${hasSound(state.room)?`data-audio="${state.room}"`:'disabled'}>${hasSound(state.room)?'🔊':'🔇'} ${r.title}</button><button type="button" data-action="backRooms">↩ الغرف</button><button type="button" data-pick="none">✋ لا أريد</button></div>
      `;
  }
  function displayReal(){
    return `${prompt('شو تريد في الحقيقة؟','real')}<div class="real-scene">${image('home','real-house','البيت العُماني')}${image('water','real-obj','كوب الماء')}</div>
      <div class="game-bottom" style="margin:15px 0 12px"><strong style="font-size:clamp(19px,3vw,24px)">اختر الشيء اللي تريده</strong></div>
      <div class="real-choices">${['water','ball','help'].map(x=>`<button data-pick="${x}" type="button" aria-label="${phrases[x]}">${image(x)}<b>${labels[x]}</b></button>`).join('')}</div>
      ${controls('<button type="button" data-pick="none" class="soft-btn">✋ لا أريد</button>')}`;
  }
  function displayFeedback(){
    const item=state.item;const phrase=phrases[item];
    const intro= item==='none' ? 'اختيارك مهم' : (state.turn%2?'يا سلام!':'أحسنت!');

    return `<div class="feedback"><span class="star" aria-hidden="true">★</span><h2>${intro}</h2>
      <div class="speech-card">${image(item)}<strong>${phrase}</strong><button ${hasSound(item)?`data-audio="${item}"`:'disabled'} class="play-speech" type="button" aria-label="${hasSound(item)?'استمع إلى عبارة الطلب':'لم يُضف الصوت بعد'}">${hasSound(item)?'🔊':'🔇'}</button></div>
      <button class="primary-btn" data-action="next" type="button">${state.turn===4?'خلصنا':'التالي'} <span aria-hidden="true">←</span></button></div>`;
  }
  function displayEnd(){
    return `<div class="feedback"><div class="finish-summary">${Array.from({length:5},(_,i)=>`<span class="tiny-star" style="animation-delay:${i*60}ms">★</span>`).join('')}</div>
      ${image('bird','finish-art','رمز تشجيعي')}
      <h2 class="finish-title">خلصنا! 🌟</h2><p class="sub-feedback">كل محاولة تواصل تستحق الاهتمام. راجع الملاحظات من إعدادات المرافق.</p>
      <div class="game-bottom"><button type="button" class="primary-btn" data-action="repeat">العب مرة ثانية ↻</button><button class="quiet-btn" type="button" data-action="home">⌂ الرئيسية</button></div></div>`;
  }
  function render(){
    if(state.activity==='home'){homepage();return;}
    let content='';
    if(state.phase==='end')content=displayEnd();
    else if(state.phase==='feedback')content=displayFeedback();
    else if(state.activity==='choose')content=displayChoose();
    else if(state.activity==='sim')content=displaySim();
    else if(state.activity==='real')content=displayReal();
    main.innerHTML=`<section class="game-shell">${header()}<div class="game-surface">${content}</div></section>`;
  }
  main.addEventListener('click',(e)=>{
    const b=e.target.closest('button'); if(!b)return;
    if(b.dataset.start){start(b.dataset.start);return;}
    if(b.dataset.audio){sound(b.dataset.audio);return;}
    if(b.dataset.room){state.room=b.dataset.room;state.phase='scene';render();sound(b.dataset.room);return;}
    if(b.dataset.pick){recordChoice(b.dataset.pick);return;}
    switch(b.dataset.action){
      case 'home':homepage();break;
      case 'finish':finish();break;
      case 'next':next();break;
      case 'repeat':startNew();break;
      case 'backRooms':state.phase='chooseRoom';render();break;
    }
  });
  document.getElementById('homeBtn').addEventListener('click',homepage);
  document.getElementById('adultBtn').addEventListener('click',()=>{
    state.adultTab='session';showAdult();
    if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','open');
  });
  document.getElementById('closeAdult').addEventListener('click',()=>dialog.close());
  document.querySelectorAll('.tab').forEach(el=>el.addEventListener('click',()=>{
    state.adultTab=el.dataset.tab;
    document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===state.adultTab));
    showAdult();
  }));
  function getCurrentRecords(){return history.filter(r=>r.session===state.sessionId && r.activity===state.activity);}
  function latestRecord(){return editableRecord();}
  function tally(){
    const entries=getCurrentRecords();
    const independent=entries.filter(r=>r.support==='مستقل').length;
    const aided=entries.filter(r=>r.support==='بمساعدة').length;
    return {total:entries.length,independent,aided,unknown:entries.length-independent-aided};
  }
  function adultSession(){
    const t=tally();const last=latestRecord();
    const row=last?`<div class="panel"><h3>تسجيل الاستجابة</h3>
      <p>النشاط: ${activityInfo[last.activity].title} · الاختيار: <strong>${labels[last.selected]}</strong></p>
      <label class="panel-label">هل تواصل الطفل بصورة مستقلة؟</label>
      <div class="mark-buttons">${[['مستقل','✓ مستقل'],['بمساعدة','↗ بمساعدة'],['غير واضح','؟ غير واضح']].map(a=>`<button type="button" data-mark="${a[0]}" class="${last.support===a[0]?'selected':''}">${a[1]}</button>`).join('')}</div>
      <label class="panel-label" for="methodSelect" style="margin-top:12px">وسيلة التواصل</label>
      <select id="methodSelect" data-field="method">${['لم يُحدد','لمس الشاشة','إشارة','بطاقة مصورة','إيماءة','صوت مقصود','كلام'].map(x=>`<option ${last.method===x?'selected':''}>${x}</option>`).join('')}</select>
      <label class="panel-label" for="envSelect" style="margin-top:12px">البيئة (للموقف الواقعي)</label>
      <select id="envSelect" data-field="setting">${['لم يُحدد','المركز','المنزل','غير ذلك'].map(x=>`<option ${last.setting===x?'selected':''}>${x}</option>`).join('')}</select>
      <label class="panel-label" for="functionalSelect" style="margin-top:12px">هل كان الطلب مقصودًا وتبعه تواصل فعلي؟</label>
      <select id="functionalSelect" data-field="functional">${['لم يُقيّم','نعم','لا','غير واضح'].map(x=>`<option ${last.functional===x?'selected':''}>${x}</option>`).join('')}</select>
    </div>`:'';
    const entries=history.slice(-20).reverse();
    const historyHtml=entries.length?`<div class="log-wrap"><table class="log-table"><thead><tr><th>المحاولة</th><th>الاختيار</th><th>المساعدة</th><th>التواصل الفعلي</th><th>تعديل</th></tr></thead><tbody>${entries.map(r=>`<tr><td>${r.opportunity}</td><td>${labels[r.selected]}</td><td>${r.support}</td><td>${r.functional}</td><td><button type="button" data-edit-id="${r.id}" style="padding:6px 8px;border-radius:9px;background:#eaf6ff;border:1px solid #dce6fa;">تعديل</button></td></tr>`).join('')}</tbody></table></div>`:'<p>لا توجد محاولات مسجلة في هذه الجلسة بعد.</p>';
    return `<div class="panel"><h3>تسجيل حقيقي، وليس درجات تلقائية</h3><p>اختيار الصورة لا يعني إتقان التواصل الوظيفي. حدّد مستوى الاستقلالية فقط بعد الملاحظة.</p>
      <div class="status"><strong>${t.total}</strong> فرصة مسجلة · <strong>${t.independent}</strong> مستقل · <strong>${t.aided}</strong> بمساعدة · <strong>${t.unknown}</strong> غير محدد</div></div>${row}
      <div class="panel"><h3>نتائج الجلسة الحالية</h3>${historyHtml}</div>
      <div class="adult-actions"><button type="button" data-admin="csv">⬇ تصدير كل النتائج CSV</button><button class="important" type="button" data-admin="clear">حذف كل النتائج المحفوظة</button></div>
      <p class="source-note">لا يخزن الموقع أسماء الأطفال أو أرقامهم. يتم حفظ الملاحظات على هذا الجهاز فقط، ويمكن تصديرها وحذفها.</p>`;
  }
  function adultSounds(){
    return `<div class="panel"><h3>إضافة الصوت العُماني</h3><p>اكتملت تسجيلات الأصوات باللهجة العُمانية ضمن الموقع. يمكن استبدال أي تسجيل هنا للتجربة على الجهاز الحالي، أو استبدال الملف في <code>assets/sounds</code> لتحديثه لجميع الزوار.</p>
      <label class="panel-label" for="soundSelect">العبارة</label>
      <select id="soundSelect">${Object.entries(voiceLabels).map(([key,v])=>`<option value="${key}" ${state.soundKey===key?'selected':''}>${v} — ${key}.mp3</option>`).join('')}</select>
      <label class="panel-label" for="uploadSound" style="margin-top:12px">اختاري تسجيل MP3 أو WAV</label><input id="uploadSound" type="file" accept="audio/*">
      <div class="adult-actions" style="margin-top:12px"><button type="button" data-admin="previewSound">🔊 سماع العبارة</button><button type="button" data-admin="removeSound">حذف التسجيل المحلي</button></div>
      <div class="status">${escapeHTML(state.message||'اكتملت التسجيلات الصوتية التسعة عشر باللهجة العُمانية.')}</div>
    </div>`;
  }
  const editableImages = ['home','kitchen','majlis','bedroom','water','apple','ball','book','blanket','help','toy','none','done','bird'];
  function adultPictures(){
    return `<div class="panel"><h3>تغيير الصور</h3><p>يمكنك اختيار صورة أو رسمة جديدة. التغيير يُحفظ على هذا الجهاز فقط؛ الصور الأساسية الأصلية موجودة في <code>assets/images</code>.</p>
      <label class="panel-label" for="pictureSelect">الصورة التي تريدين تعديلها</label>
      <select id="pictureSelect">${editableImages.map(k=>`<option value="${k}" ${state.imageKey===k?'selected':''}>${roomInfo[k]?.title || labels[k] || (k==='home'?'البيت':k==='bird'?'الشخصية':'رمز')}</option>`).join('')}</select>
      <div style="display:grid;place-items:center;border:1px solid #e8e8ee;border-radius:16px;background:#fff;margin:12px auto;padding:7px;max-width:270px">${image(state.imageKey,'','معاينة الصورة')}</div>
      <label class="panel-label" for="uploadPicture">صورة جديدة (PNG / JPG / WEBP / SVG)</label><input id="uploadPicture" type="file" accept="image/*">
      <div class="adult-actions" style="margin-top:11px"><button type="button" data-admin="removePicture">إعادة الصورة الأصلية</button></div>
      <div class="status">${escapeHTML(state.message||'الصور الواقعية والرموز المساندة موجودة داخل ملفات المشروع.')}</div>
    </div>`;
  }
  function showAdult(){
    adultContent.innerHTML=state.adultTab==='sounds'?adultSounds():state.adultTab==='pictures'?adultPictures():adultSession();
  }
  function exportCsv(){
    if(!history.length){alert('لا توجد نتائج لتصديرها بعد.');return;}
    const cols=[['time','التاريخ'],['activity','النشاط'],['opportunity','المحاولة'],['scene','المشهد'],['selected','الاختيار'],['method','وسيلة التواصل'],['support','نوع المساعدة'],['functional','الطلب الوظيفي'],['setting','مكان التطبيق']];
    function q(x){return '"'+String(x??'').replace(/"/g,'""')+'"';}
    const csv='\uFEFF'+cols.map(c=>q(c[1])).join(',')+'\r\n'+history.map(r=>cols.map(c=>q(c[0]==='activity'?activityInfo[r.activity]?.title||r.activity:c[0]==='selected'?labels[r.selected]||r.selected:r[c[0]])).join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='oman_home_session_results.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),3000);
  }
  adultContent.addEventListener('click',async e=>{
    const b=e.target.closest('button'); if(!b)return;
    const last=latestRecord();
    if(b.dataset.editId){state.editId=b.dataset.editId;showAdult();return;}
    if(b.dataset.mark && last){last.support=b.dataset.mark;save();showAdult();return;}
    switch(b.dataset.admin){
      case 'csv': exportCsv();break;
      case 'clear': if(confirm('هل تريدين حذف جميع النتائج المخزنة على هذا الجهاز؟')){history=[];save();showAdult();}break;
      case 'previewSound': sound(state.soundKey);break;
      case 'removeSound': await removeMedia('audio:'+state.soundKey);state.message='حُذف التسجيل المحلي المحدد.';showAdult();break;
      case 'removePicture':await removeMedia('image:'+state.imageKey);state.message='عادت الصورة الأصلية.';showAdult();if(!dialog.open)render();break;
    }
  });
  adultContent.addEventListener('change',async e=>{
    const target=e.target;
    const last=latestRecord();
    if(target.dataset.field && last){last[target.dataset.field]=target.value;save();return;}
    if(target.id==='soundSelect'){state.soundKey=target.value;state.message='';showAdult();return;}
    if(target.id==='pictureSelect'){state.imageKey=target.value;state.message='';showAdult();return;}
    if(target.id==='uploadSound' && target.files?.[0]){
      const f=target.files[0];if(!f.type.startsWith('audio/')){state.message='اختاري ملفًا صوتيًا مناسبًا.';showAdult();return;}
      await saveMedia('audio:'+state.soundKey,f);state.message='تمت إضافة التسجيل على هذا الجهاز. جرّبي زر السماعة.';showAdult();return;
    }
    if(target.id==='uploadPicture' && target.files?.[0]){
      const f=target.files[0];if(!f.type.startsWith('image/')){state.message='اختاري صورة صحيحة.';showAdult();return;}
      if(f.size>10*1024*1024){state.message='هذه الصورة كبيرة جدًا؛ اختاري صورة أقل من 10 ميجابايت.';showAdult();return;}
      await saveMedia('image:'+state.imageKey,f);state.message='تمت إضافة الصورة على هذا الجهاز.';render();showAdult();return;
    }
  });
  function openMediaDB(){return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){reject(new Error('غير مدعوم'));return;}
    const req=indexedDB.open('fi_baytina_omani_media_v2',1);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('media'))db.createObjectStore('media');};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });}
  function putMedia(key,blob){return new Promise((resolve,reject)=>{
    if(!mediaDb){resolve();return;}
    const req=mediaDb.transaction('media','readwrite').objectStore('media').put(blob,key);
    req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error);
  });}
  function deleteMedia(key){return new Promise((resolve,reject)=>{
    if(!mediaDb){resolve();return;}
    const req=mediaDb.transaction('media','readwrite').objectStore('media').delete(key);
    req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error);
  });}
  async function saveMedia(key,blob){
    await putMedia(key,blob).catch(()=>{});
    const old=mediaUrls.get(key);if(old)URL.revokeObjectURL(old);
    mediaUrls.set(key,URL.createObjectURL(blob));
  }
  async function removeMedia(key){
    await deleteMedia(key).catch(()=>{});
    if(mediaUrls.has(key)){URL.revokeObjectURL(mediaUrls.get(key));mediaUrls.delete(key);}
    if(key.startsWith('image:'))render();
  }
  async function restoreMedia(){
    try{
      mediaDb=await openMediaDB();
      const blobs=await new Promise((resolve,reject)=>{
        const found=[];const req=mediaDb.transaction('media','readonly').objectStore('media').openCursor();
        req.onsuccess=()=>{const cur=req.result;if(cur){found.push([cur.key,cur.value]);cur.continue();}else resolve(found);};
        req.onerror=()=>reject(req.error);
      });
      blobs.forEach(([key,blob])=>{if(blob instanceof Blob)mediaUrls.set(key,URL.createObjectURL(blob));});
      if(state.activity==='home')homepage();else render();
    }catch{ /* Can still play static offline activities without IndexedDB. */ }
  }
  homepage();restoreMedia();
})();
