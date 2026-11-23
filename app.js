
const stages = ['home','stage1','stage2','stage3'];
const state = {current:'home', round:0, score1:0, help1:0, roomIndex:0, target3:'water', success3:0, help3:0};
const sounds = {};
const objects = {
  water:{img:'assets/images/obj_water.svg',sound:'water',name:'water'},
  apple:{img:'assets/images/obj_apple.svg',sound:'apple',name:'apple'},
  ball:{img:'assets/images/obj_ball.svg',sound:'ball',name:'ball'},
  book:{img:'assets/images/obj_book.svg',sound:'book',name:'book'},
  blanket:{img:'assets/images/obj_blanket.svg',sound:'blanket',name:'blanket'},
  help:{img:'assets/images/obj_help.svg',sound:'help',name:'help'},
  toy:{img:'assets/images/obj_toy.svg',sound:'toy',name:'toy'},
  none:{img:'assets/images/obj_none.svg',sound:'none',name:'none'},
};
const rounds1 = [
  {prompt:'choose', good:'water', bad:'apple'},
  {prompt:'choose', good:'ball', bad:'book'},
  {prompt:'choose', good:'blanket', bad:'help'},
  {prompt:'choose', good:'toy', bad:'none'},
  {prompt:'choose', good:'apple', bad:'water'},
];
const rooms = [
  {scene:'assets/images/room_house.svg',intro:'sim',hotspots:[{obj:'water',x:34,y:66},{obj:'ball',x:53,y:68},{obj:'book',x:68,y:67}]},
  {scene:'assets/images/room_kitchen.svg',intro:'kitchen',hotspots:[{obj:'water',x:39,y:64},{obj:'apple',x:63,y:63}]},
  {scene:'assets/images/room_majlis.svg',intro:'majlis',hotspots:[{obj:'ball',x:40,y:68},{obj:'book',x:59,y:68}]},
  {scene:'assets/images/room_bedroom.svg',intro:'bedroom',hotspots:[{obj:'blanket',x:53,y:53},{obj:'help',x:82,y:61}]},
];
const realTargets=['water','ball','blanket','help'];
function $(s){return document.querySelector(s)}
function el(tag,cls){const e=document.createElement(tag); if(cls)e.className=cls; return e}
function showStage(name){state.current=name; document.querySelectorAll('.stage').forEach(s=>s.classList.remove('active')); $('#'+name).classList.add('active'); $('#backBtn').classList.toggle('hidden', name==='home'); if(name==='stage1') initStage1(); if(name==='stage2') initStage2(); if(name==='stage3') initStage3();}
function preload(){['start','choose','sim','real','kitchen','majlis','bedroom','water','apple','ball','book','blanket','help','toy','none','praise','another','finish','done'].forEach(k=>{const a=new Audio('assets/sounds/'+k+'.mp3'); a.preload='auto'; sounds[k]=a;});}
function play(name){const a=sounds[name]; if(!a) return; try{a.currentTime=0; a.play();}catch(e){}}
function toast(msg=''){const t=$('#toast'); if(msg) t.textContent=msg; t.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer=setTimeout(()=>t.classList.remove('show'),1500)}
function buildHome(){ document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>showStage(b.dataset.open))); }
// Stage1
function initStage1(){ state.round=0; state.score1=0; state.help1=0; renderRound1(); }
function renderDots(container,count,active){ container.innerHTML=''; for(let i=0;i<count;i++){const d=el('div','dot'+(i===active?' active':'')); container.appendChild(d)} }
function renderRound1(){ const board=$('#choiceBoard'); board.innerHTML=''; const r=rounds1[state.round]; renderDots($('#dots1'), rounds1.length, state.round); [r.good,r.bad].sort(()=>Math.random()-0.5).forEach(key=>{ const card=el('button','choiceCard'); card.innerHTML=`<img src="${objects[key].img}" alt="">`; card.onclick=()=>check1(card,key===r.good,key); board.appendChild(card); }); play(r.good); }
function check1(card,correct,key){ [...document.querySelectorAll('#choiceBoard .choiceCard')].forEach(c=>c.disabled=true); card.classList.add(correct?'correct':'wrong'); play(correct ? (state.round%2===0?'praise':'another') : key); if(correct){ state.score1++; setTimeout(next1,900);} else { state.help1++; toast('✨'); setTimeout(()=>{[...document.querySelectorAll('#choiceBoard .choiceCard')].forEach(c=>c.disabled=false); card.classList.remove('wrong');},900);} }
function next1(){ if(state.round<rounds1.length-1){ state.round++; renderRound1(); } else { $('#stage1Summary').innerHTML=`<div class="summary"><div class="stat"><b>${state.score1}</b></div><div class="stat"><b>${state.help1}</b></div></div>`; $('#stage1Done').showModal?null:null; toast('⭐'); play('finish'); }}
// Stage2
function initStage2(){ state.roomIndex=0; buildRooms(); setRoom(0); }
function buildRooms(){ const strip=$('#roomStrip'); if(strip.dataset.built) return; strip.dataset.built='1'; rooms.forEach((room,idx)=>{ const pane=el('div','room'); pane.innerHTML=`<img class="scene" src="${room.scene}" alt="">`; room.hotspots.forEach(h=>{const hs=el('button','hotspot'); hs.style.left=`calc(${h.x}% - 60px)`; hs.style.top=`calc(${h.y}% - 60px)`; hs.innerHTML=`<img src="${objects[h.obj].img}" alt="">`; hs.onclick=()=>showPopup(h.obj); pane.appendChild(hs);}); strip.appendChild(pane);}); const tabs=$('#roomTabs'); rooms.forEach((room,idx)=>{const tab=el('button','tab'); tab.innerHTML=`<img src="${room.scene}" alt="">`; tab.onclick=()=>setRoom(idx); tabs.appendChild(tab);}); }
function setRoom(i){ state.roomIndex=(i+rooms.length)%rooms.length; $('#roomStrip').style.transform=`translateX(-${state.roomIndex*100}%)`; document.querySelectorAll('.tab').forEach((t,idx)=>t.classList.toggle('active',idx===state.roomIndex)); play(rooms[state.roomIndex].intro); }
function showPopup(obj){ const ov=$('#overlay'); ov.classList.add('show'); $('#popupImg').src=objects[obj].img; $('#popupUse').onclick=()=>{ play(objects[obj].sound); toast('⭐'); ov.classList.remove('show'); }; $('#popupClose').onclick=()=>ov.classList.remove('show'); }
// Stage3
function initStage3(){ state.success3=0; state.help3=0; state.target3 = realTargets[Math.floor(Math.random()*realTargets.length)]; renderReal(); }
function renderReal(){ $('#realTargetImg').src=objects[state.target3].img; const grid=$('#realCardGrid'); grid.innerHTML=''; const pool=[state.target3,...Object.keys(objects).filter(k=>k!==state.target3)].sort(()=>Math.random()-0.5).slice(0,3); pool.sort(()=>Math.random()-0.5).forEach(k=>{ const c=el('button','smallCard'); c.innerHTML=`<img src="${objects[k].img}" alt="">`; c.onclick=()=>{ play(objects[k].sound); if(k===state.target3){ c.classList.add('match'); state.success3++; toast('⭐'); } else { state.help3++; toast('🔁'); } }; grid.appendChild(c);}); $('#realStats').innerHTML=`<div class="summary"><div class="stat"><b>${state.success3}</b></div><div class="stat"><b>${state.help3}</b></div></div>`; }
window.addEventListener('DOMContentLoaded',()=>{ preload(); buildHome(); showStage('home'); $('#backBtn').onclick=()=>showStage('home'); $('#globalSound').onclick=()=>play(state.current==='stage1' ? rounds1[state.round]?.good || 'start' : state.current==='stage2' ? rooms[state.roomIndex].intro : state.current==='stage3' ? 'real' : 'start'); $('#simLeft').onclick=()=>setRoom(state.roomIndex-1); $('#simRight').onclick=()=>setRoom(state.roomIndex+1); $('#realNext').onclick=()=>{ state.target3=realTargets[(realTargets.indexOf(state.target3)+1)%realTargets.length]; renderReal();}; $('#markIndependent').onclick=()=>{ state.success3++; $('#realStats').innerHTML=`<div class="summary"><div class="stat"><b>${state.success3}</b></div><div class="stat"><b>${state.help3}</b></div></div>`; play('praise');}; $('#markHelp').onclick=()=>{ state.help3++; $('#realStats').innerHTML=`<div class="summary"><div class="stat"><b>${state.success3}</b></div><div class="stat"><b>${state.help3}</b></div></div>`; play('another');}; });
