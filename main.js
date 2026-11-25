const media={"room": "images/room.jpg", "apple": "images/apple.png", "water": "images/water.png", "toy": "images/toy.png"};
const items=[['apple','تفّاحة','أريد تفاحة'],['water','ماي','أريد ماي'],['toy','لعبة','أريد اللعبة']];
const $=s=>document.querySelector(s),v=$('#view');
const pic=(key,alt='')=>'<img draggable="false" src="'+media[key]+'" alt="'+alt+'">';
const dots=n=>'<div aria-hidden="true">'+items.map((_,i)=>'<i class="dot '+(i<=n?'on':'')+'"></i>').join('')+'</div>';
const row=()=>'<div class="choices">'+items.map(([k,n],i)=>'<button class="choice" data-i="'+i+'" aria-label="'+n+'">'+pic(k,n)+'</button>').join('')+'</div>';
const recordings={"apple": "sounds/apple.mp3", "water": "sounds/water.mp3", "toy": "sounds/toy.mp3", "praise": "sounds/praise.mp3", "sim": "sounds/sim.mp3", "real": "sounds/real.mp3", "done": "sounds/done.mp3"};
let player,muted=false,replay=()=>{},round=0,chosen=null,pauseId;
function stop(){if(player){player.pause();player=null}}
function speakSequence(keys){stop();if(muted)return;function playAt(i){if(i>=keys.length)return;const sound=recordings[keys[i]];if(!sound)return;const a=new Audio(sound);player=a;a.onended=()=>{if(player===a&&!muted)playAt(i+1)};a.play().catch(()=>{})}playAt(0)}
function say(key){speakSequence([key])}
function prompt(key){replay=()=>say(key);replay()}
let cleanupRoom=null,pauseRoom=null;
function reset(){cleanupRoom?.();clearTimeout(pauseId);stop();replay=()=>{};v.onclick=null}
function title(t,icon=''){return '<div class="title"><h1>'+t+'</h1>'+icon+'<button class="icon" id="repeat" aria-label="أعد سماع التعليمات">↻</button></div>'}
function wire(){const b=$('#repeat');if(b)b.onclick=()=>replay()}
const activityCards=[["أتعرّف على الأشياء", "images/activity-learn.jpg"], ["أستكشف البيت", "images/activity-simulation.jpg"], ["أطلب في الواقع", "images/activity-real.jpg"]];
function nav(){reset();v.innerHTML='<section class="activity-menu"><h1>اختر نشاطًا</h1><div class="activity-grid">'+activityCards.map(([name,image],i)=>'<button class="activity-card" data-stage="'+i+'"><img src="'+image+'" alt="" draggable="false"><strong>'+name+'</strong></button>').join('')+'</div></section>';v.onclick=e=>{let b=e.target.closest('[data-stage]');if(!b)return;round=0;chosen=null;[learn,sim,real][+b.dataset.stage]()}}
function nextButton(fn,label='التالي'){const b=$('#next');b.hidden=false;b.onclick=fn}
function learn(){reset();const [key,name]=items[round];v.innerHTML=title('أتعرّف')+'<div class="panel">'+dots(round)+'<button class="target" id="sample" aria-label="اسمع اسم '+name+'">'+pic(key,name)+'</button>'+row()+'<div class="feedback" id="mark" role="status"></div><button hidden id="next" class="action" aria-label="التالي">←</button></div>';wire();stop();replay=()=>say(key);$('#sample').onclick=replay;v.querySelectorAll('.choice').forEach((b,i)=>b.onclick=()=>{const selectedKey=items[i][0];if(i!==round){say(selectedKey);v.querySelectorAll('.choice')[round].classList.add('hint');return}v.querySelectorAll('.choice').forEach(c=>c.disabled=true);b.className='choice correct';$('#mark').textContent='✓';replay=()=>say('praise');speakSequence([selectedKey,'praise']);nextButton(()=>{if(++round<3)learn();else{round=0;sim()} })})}
// Geometry uses metres, with the tabletop at y = 0.78.
const tableY=.78, objectsAt=[[-.95,.92],[0,1.12],[.95,.92]];
const goals=[[-.86,tableY+.037,-.20],[-.045,tableY+.008,-.20],[.989,tableY+.065,-.13]];
const floorCupY=.068;
function insideGoal(index,x,z){const [gx,,gz]=goals[index];if(index===1)return Math.abs(x)<1.53&&Math.abs(z)<.63&&!insideGoal(0,x,z)&&!insideGoal(2,x,z);return index===2?Math.abs(x-gx)<.38&&Math.abs(z-gz)<.31:Math.hypot(x-gx,z-gz)<.33}

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function meshBuilder(){
 const faces=[];
 function tri(a,b,c,color,id=0){
  let u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);
  let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n)||1;
  let light=.77+.23*Math.abs((-.4*n[0]+.82*n[1]+.4*n[2])/l);
  let rgb=[0,2,4].map(i=>parseInt(color.slice(i,i+2),16)/255*light);
  faces.push({points:[a,b,c],rgb,id});
 }
 function quad(a,b,c,d,col,id){tri(a,b,c,col,id);tri(a,c,d,col,id)}
 function box(x,y,z,w,h,d,col,id=0){
  let vertices=[];for(let j of [-1,1])for(let k of [-1,1])for(let i of [-1,1])vertices.push([x+i*w/2,y+j*h/2,z+k*d/2]);
  for(const f of [[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]])quad(...f.map(i=>vertices[i]),col,id)
 }
 function lathe(x,y,z,profile,color,id=0,scaleZ=1,segments=24){
  for(let j=1;j<profile.length;j++){const [r0,h0]=profile[j-1],[r1,h1]=profile[j];
   for(let i=0;i<segments;i++){const point=(r,h,k)=>[x+r*Math.cos(k*2*Math.PI/segments),y+h,z+r*scaleZ*Math.sin(k*2*Math.PI/segments)];
    quad(point(r0,h0,i),point(r0,h0,i+1),point(r1,h1,i+1),point(r1,h1,i),typeof color==='string'?color:color[j-1],id)}}
 }
 function oval(x,y,z,w,h,d,col,id=0){let p=[];for(let j=0;j<=10;j++){let t=j*Math.PI/10;p.push([Math.sin(t)*w,-Math.cos(t)*h])}lathe(x,y,z,p,col,id,d/w,20)}
 return {faces,tri,quad,box,lathe,oval};
}
function furnishedRoom(){
 const m=meshBuilder(),{box,oval,quad,lathe}=m;
 box(0,-.08,0,9,.16,10,'d9c4a6');box(0,1.95,-3.65,9,3.9,.15,'edcfaa');
 for(const x of [-4.5,4.5])box(x,1.95,.7,.14,3.9,8.8,'ddc2a0');
 box(0,3.95,0,9,.12,10,'f0ddc8');box(0,1.95,5,9,3.9,.15,'dfc7a9');
 box(0,.025,.02,4.8,.025,3.85,'a95743');box(0,.042,.02,4.59,.012,3.62,'ead3aa');box(0,.052,.02,4.43,.01,3.46,'955446');
 for(let i=-5;i<=5;i++){for(const z of [-1.52,1.52]){const x=i*.37;quad([x-.11,.061,z],[x,.061,z-.095],[x+.11,.061,z],[x,.061,z+.095],'e0bb80')}}
 box(0,.26,-2.45,5.3,.44,1.04,'947152');box(0,.51,-2.38,5.25,.24,.96,'3d837e');box(0,.94,-2.86,5.3,1.05,.24,'377873');

 for(const x of [-2.64,2.64])box(x,.68,-2.42,.24,.44,1.03,'33706d');
 m.quad([-4.43,0,-3.55],[4.43,0,-3.55],[4.43,3.90,-3.55],[-4.43,3.90,-3.55],'e8cba4',7);
 box(0,.715,0,3.18,.13,1.36,'c39460');box(0,.625,0,2.98,.11,1.18,'a4774b');
 for(const x of [-1.4,1.4])for(const z of [-.5,.5])box(x,.34,z,.12,.62,.12,'a77649');
 return m.faces
}
const skinProfiles=[[[0.0218, 0.5663, 0.6198], [0.0436, 0.5564, 0.6337], [0.0673, 0.5465, 0.6139], [0.0891, 0.5366, 0.5901], [0.1129, 0.301, 0.6851], [0.1347, 0.2257, 0.7842], [0.1584, 0.1822, 0.8317], [0.1802, 0.1505, 0.8634], [0.204, 0.1208, 0.8931], [0.2257, 0.097, 0.9129], [0.2495, 0.0812, 0.9327], [0.2713, 0.0673, 0.9446], [0.295, 0.0515, 0.9584], [0.3168, 0.0416, 0.9683], [0.3406, 0.0317, 0.9743], [0.3624, 0.0257, 0.9822], [0.3861, 0.0178, 0.9881], [0.4079, 0.0158, 0.9881], [0.4317, 0.0079, 0.9921], [0.4535, 0.0079, 0.9921], [0.4772, 0.0079, 0.9921], [0.499, 0.0079, 0.9921], [0.5208, 0.0079, 0.9881], [0.5446, 0.0119, 0.9842], [0.5663, 0.0158, 0.9782], [0.5901, 0.0218, 0.9723], [0.6119, 0.0277, 0.9644], [0.6356, 0.0356, 0.9545], [0.6574, 0.0416, 0.9465], [0.6812, 0.0515, 0.9366], [0.703, 0.0614, 0.9228], [0.7267, 0.0733, 0.9129], [0.7485, 0.0871, 0.899], [0.7723, 0.101, 0.8812], [0.7941, 0.1168, 0.8634], [0.8178, 0.1327, 0.8475], [0.8396, 0.1505, 0.8297], [0.8634, 0.1723, 0.8376], [0.8851, 0.1941, 0.8416], [0.9089, 0.2158, 0.8693], [0.9307, 0.2059, 0.8535], [0.9545, 0.2416, 0.802], [0.9762, 0.3069, 0.7089]], [[0.0218, 0.2356, 0.7683], [0.0436, 0.1267, 0.8772], [0.0673, 0.0594, 0.9446], [0.0891, 0.0257, 0.9743], [0.1129, 0.0099, 0.9901], [0.1347, 0.0178, 0.9861], [0.1584, 0.0178, 0.9822], [0.1802, 0.0178, 0.9782], [0.204, 0.0218, 0.9743], [0.2257, 0.0257, 0.9723], [0.2495, 0.0277, 0.9703], [0.2713, 0.0277, 0.9683], [0.295, 0.0317, 0.9644], [0.3168, 0.0356, 0.9604], [0.3406, 0.0396, 0.9564], [0.3624, 0.0436, 0.9525], [0.3861, 0.0475, 0.9485], [0.4079, 0.0515, 0.9446], [0.4317, 0.0535, 0.9406], [0.4535, 0.0554, 0.9366], [0.4772, 0.0594, 0.9327], [0.499, 0.0634, 0.9287], [0.5208, 0.0673, 0.9248], [0.5446, 0.0713, 0.9208], [0.5663, 0.0713, 0.9168], [0.5901, 0.0752, 0.9149], [0.6119, 0.0792, 0.9109], [0.6356, 0.0832, 0.9069], [0.6574, 0.0851, 0.903], [0.6812, 0.0891, 0.899], [0.703, 0.0931, 0.895], [0.7267, 0.097, 0.8911], [0.7485, 0.101, 0.8871], [0.7723, 0.105, 0.8792], [0.7941, 0.1089, 0.8792], [0.8178, 0.1129, 0.8752], [0.8396, 0.1168, 0.8752], [0.8634, 0.1208, 0.9228], [0.8851, 0.1327, 0.9485], [0.9089, 0.1564, 0.9327], [0.9307, 0.1861, 0.9129], [0.9545, 0.2455, 0.8614], [0.9762, 0.3426, 0.7505]], [[0.0218, 0.4693, 0.697], [0.0436, 0.4079, 0.7564], [0.0673, 0.3703, 0.7921], [0.0891, 0.3485, 0.8119], [0.1129, 0.3327, 0.8297], [0.1347, 0.3208, 0.8396], [0.1584, 0.3069, 0.8515], [0.1802, 0.297, 0.8574], [0.204, 0.2871, 0.8673], [0.2257, 0.2752, 0.8752], [0.2495, 0.2653, 0.8832], [0.2713, 0.2099, 0.8891], [0.295, 0.2059, 0.9069], [0.3168, 0.2079, 0.9287], [0.3406, 0.2178, 0.9426], [0.3624, 0.1663, 0.9564], [0.3861, 0.1228, 0.9644], [0.4079, 0.099, 0.9663], [0.4317, 0.0752, 0.9703], [0.4535, 0.0614, 0.9723], [0.4772, 0.0931, 0.9723], [0.499, 0.095, 0.9782], [0.5208, 0.0931, 0.9921], [0.5446, 0.0851, 0.9941], [0.5663, 0.0752, 0.9941], [0.5901, 0.0614, 0.9881], [0.6119, 0.0257, 0.9743], [0.6356, 0.0257, 0.9743], [0.6574, 0.0178, 0.9723], [0.6812, 0.0079, 0.9703], [0.703, 0.0059, 0.9644], [0.7267, 0.0099, 0.9584], [0.7485, 0.0119, 0.9505], [0.7723, 0.0238, 0.9386], [0.7941, 0.0475, 0.9386], [0.8178, 0.0772, 0.899], [0.8396, 0.097, 0.7208], [0.8634, 0.105, 0.6673], [0.8851, 0.1307, 0.6178], [0.9089, 0.1822, 0.6059], [0.9307, 0.2475, 0.604], [0.9545, 0.3248, 0.5842], [0.9762, 0.3861, 0.5485]]];
const surfaceAtlas="images/materials.jpg";
function skinProp(m,idx,at){
 const [x,y,z]=at,[w,h,d]=[[.37,.4,.34],[.30,.39,.28],[.49,.35,.26]][idx],rows=skinProfiles[idx],sections=28;
 function vertex(row,k){const [v,l,r]=row,t=k*2*Math.PI/sections,u=(l+r)/2+(r-l)*.5*Math.cos(t);
 return {p:[x+(u-.5)*w,y+(1-v)*h,z+Math.sin(t)*d*.5*Math.min(1,(r-l)*1.4)],uv:[(idx*512+3+u*505)/2048,(3+v*505)/1024]}}
 function face(a,b,c){m.tri(a.p,b.p,c.p,'ffffff',idx+1);m.faces[m.faces.length-1].uv=[a.uv,b.uv,c.uv]}
 for(let j=1;j<rows.length;j++)for(let k=0;k<sections;k++){const a=vertex(rows[j-1],k),b=vertex(rows[j-1],k+1),c=vertex(rows[j],k+1),d=vertex(rows[j],k);face(a,b,c);face(a,c,d)}
}
function surfaceTile(face){
 if(face.id>=1&&face.id<=3||face.id===7||face.id===8)return -1;
 const [x,y,z]=face.points[0];
 if(face.id===6&&Math.max(...face.rgb)-Math.min(...face.rgb)>.12)return 6;
 if(face.id===5||face.id===0&&Math.abs(x)<1.61&&Math.abs(z)<.70&&y>.10&&y<.79)return 3;
 if(face.id===0&&z<-1.8&&y<1.4&&face.rgb[1]>face.rgb[0]*1.25)return 4;
 if(face.id===0&&Math.abs(x)>4.3&&y>.1)return 5;
 return -1
}
function surfaceUV(face){
 const [xx,yy,zz]=face.points[0];if(face.id===0&&zz< -2.7&&zz> -3.1&&yy>=.413&&face.rgb[1]>face.rgb[0]*1.25){
 return face.points.map(([x,y])=>[(1539+Math.max(0,Math.min(1,x/5.3+.5))*505)/2048,(515+Math.max(0,Math.min(1,1-(y-.415)/1.05))*505)/1024])}
 if(face.id===0&&yy>.048&&yy<.059)return face.points.map(([x,y,z])=>[(515+505*Math.max(0,Math.min(1,.5+x/4.45)))/2048,(515+505*Math.max(0,Math.min(1,.5+z/3.55)))/1024]);
 const t=surfaceTile(face);if(t<0)return null;
 const a=face.points[0],b=face.points[1],c=face.points[2],ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]);
 const n=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]].map(Math.abs);
 return face.points.map(([x,y,z])=>{let u=n[0]>n[1]&&n[0]>n[2]?z:x,v=n[1]>n[2]&&n[1]>=n[0]?z:y;
 u=Math.max(0,Math.min(1,.5+u/(t===6?3:9)));v=Math.max(0,Math.min(1,.42+v/(t===6?3:6)));
 return [((t%4)*512+3+505*u)/2048,(Math.floor(t/4)*512+3+505*v)/1024]})
}
function addProps(m,positions,activeGoal){
 const {oval,box,lathe}=m;
 for(let i=0;i<positions.length;i++){
 const [x,y,z]=positions[i],floor=z>.70,base=floor?.064:tableY+.005;
 if(floor||Math.abs(z)<.62){const r=[.16,.13,.22][i];m.lathe(x+.025+(y-base)*.15,base,z+.018,[[0,0],[r,.0003]],floor?'9e7560':'a77c52',0,.56,20)}
 skinProp(m,i,positions[i])}
 const [px,,pz]=goals[0], [wx2,,wz2]=goals[1], [bx,,bz]=goals[2];
 const ceramic=activeGoal===0?'ffe475':'edeae1';
 lathe(px,tableY+.004,pz,[[0,0],[.21,0],[.32,.04],[.32,.052],[.29,.053],[.19,.024],[0,.024]],ceramic,4,1,36);
 // The receiving area is flush with the tabletop. The cue appears only on pickup.
 box(wx2,tableY+.001,wz2,.68,.004,.50,'c39460',5);
 const lit=activeGoal===2,cardboard=lit?'f2ca6a':'c99863';
 box(bx,tableY+.024,bz,.64,.045,.48,'b78c61',6);
 for(const sign of [-1,1]){box(bx+sign*.312,tableY+.13,bz,.02,.26,.49,cardboard,6);
 m.quad([bx+sign*.32,tableY+.258,bz-.24],[bx+sign*.32,tableY+.258,bz+.24],[bx+sign*.45,tableY+.21,bz+.24],[bx+sign*.45,tableY+.21,bz-.24],cardboard,6)}
 box(bx,tableY+.15,bz-.235,.64,.30,.018,cardboard,6);
 box(bx,tableY+.065,bz+.235,.64,.13,.018,cardboard,6);
 m.quad([bx-.31,tableY+.13,bz+.244],[bx+.31,tableY+.13,bz+.244],[bx+.31,tableY+.085,bz+.34],[bx-.31,tableY+.085,bz+.34],cardboard,6);
 if(activeGoal>=0){const [gx,gy,gz]=goals[activeGoal],id=4+activeGoal,gold='ffe680';
 if(activeGoal===0)lathe(gx,tableY+.06,gz,[[.303,0],[.344,0]],gold,id,1,40);
 else {const halfX=activeGoal===1?.335:.333,halfZ=activeGoal===1?.245:.255,h=activeGoal===1?tableY+.008:tableY+.014;
 for(const sign of [-1,1]){box(gx+sign*halfX,h,gz,.034,.012,halfZ*2+.038,gold,id);box(gx,h,gz+sign*halfZ,halfX*2+.034,.012,.034,gold,id)}}
 // A two-tone stationary down arrow. It can also be tapped as a destination.
 const h=gy+(activeGoal===2?.40:.28);
 lathe(gx,h,gz,[[0,0],[.095,.12],[.042,.12],[.042,.23],[0,.23]],'257d65',id,1,16);
 }

}
function cameraMath(cam,aspect){
 const sy=Math.sin(cam.yaw),cy=Math.cos(cam.yaw),sp=Math.sin(cam.pitch),cp=Math.cos(cam.pitch),f=1/Math.tan(.54);
 function view(p){let x=p[0]-cam.x,y=p[1]-cam.y,z=p[2]-cam.z,r=x*cy+z*sy,fw=x*sy-z*cy;return [r,y*cp-fw*sp,y*sp+fw*cp]}
 function floorPoint(nx,ny,height){let u=nx*aspect/f,v=ny/f,dy=v*cp+sp,fw=cp-v*sp,t=(height-cam.y)/dy;if(t<0||!isFinite(t))return null;return [cam.x+t*(u*cy+fw*sy),height,cam.z+t*(u*sy-fw*cy)]}
 return {view,f,floorPoint}
}
const illustratedWall="images/majlis-wall.jpg";
function roomRenderer(canvas){
 if(typeof location!=='undefined'&&location.protocol==='file:')return softwareRoom(canvas);
 const gl=canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:true});
 if(!gl)return softwareRoom(canvas);
 const shader=(type,src)=>{let sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh};
 const prog=gl.createProgram();
 gl.attachShader(prog,shader(gl.VERTEX_SHADER,'precision mediump float;attribute vec3 pos,col;attribute vec2 uv;varying vec2 texUV; attribute float obj; uniform vec3 eye; uniform vec4 rot; uniform vec2 lens; uniform float pick; varying vec3 tint; varying vec3 world; varying float kind; void main(){texUV=uv;world=pos;kind=obj;vec3 p=pos-eye;float r=p.x*rot.y+p.z*rot.x;float d=p.x*rot.x-p.z*rot.y;float h=p.y*rot.w-d*rot.z;float z=p.y*rot.z+d*rot.w;gl_Position=vec4(r*lens.x,h*lens.y,1.005*z-0.10,z);tint=mix(col,vec3(obj/255.,0.,0.),pick);}'));
 gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec3 tint;varying vec3 world;varying float kind;varying vec2 texUV;uniform sampler2D girl;uniform float girlReady;uniform sampler2D atlas;uniform float atlasReady;uniform sampler2D wall;uniform float pick;uniform float hasWall;void main(){vec3 c=tint;if(pick<0.5){if(kind>6.5 && kind<7.5 && hasWall>0.5){c=texture2D(wall,vec2(clamp(world.x/8.86+0.5,0.0,1.0),clamp(1.0-world.y/3.90,0.0,1.0))).rgb;}else if(world.y>0.64 && world.y<0.794 && abs(world.x)<1.60 && abs(world.z)<0.69 && (kind<0.5||abs(kind-5.0)<0.5)){float grain=sin(world.z*182.0+4.0*sin(world.x*3.5)+sin(world.x*8.0+world.z*28.0));c*=0.99+0.029*grain;}float light=0.97+0.065*exp(-0.25*distance(world,vec3(2.4,1.9,-2.0)));c*=light;if(texUV.x>=0.0&&atlasReady>0.5){vec3 paint=texture2D(atlas,texUV).rgb;c=kind>0.5&&kind<3.5?paint*light:mix(c,paint,0.70)*light;}}if(kind>7.5&&kind<8.5){if(girlReady<0.5)discard;vec4 sprite=texture2D(girl,texUV);if(sprite.a<0.1)discard;gl_FragColor=sprite;}else gl_FragColor=vec4(c,1.0);}'));
 gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error('WebGL program');
 gl.useProgram(prog);const wallTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,wallTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,1,1,0,gl.RGB,gl.UNSIGNED_BYTE,new Uint8Array([232,202,164]));for(const k of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);for(const k of [gl.TEXTURE_MAG_FILTER,gl.TEXTURE_MIN_FILTER])gl.texParameteri(gl.TEXTURE_2D,k,gl.LINEAR);
 let lastCam=null,destroyed=false;const wallImage=new Image();wallImage.onload=()=>{if(destroyed)return;gl.useProgram(prog);gl.bindTexture(gl.TEXTURE_2D,wallTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,wallImage);gl.uniform1f(gl.getUniformLocation(prog,'hasWall'),1);if(lastCam)render(lastCam)};wallImage.src=illustratedWall;
 const skinTex=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,skinTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,1,1,0,gl.RGB,gl.UNSIGNED_BYTE,new Uint8Array([210,190,167]));for(const k of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);for(const k of [gl.TEXTURE_MAG_FILTER,gl.TEXTURE_MIN_FILTER])gl.texParameteri(gl.TEXTURE_2D,k,gl.LINEAR);gl.uniform1i(gl.getUniformLocation(prog,'atlas'),1);gl.activeTexture(gl.TEXTURE0);
 const skinImage=new Image();skinImage.onload=()=>{if(destroyed)return;gl.useProgram(prog);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,skinTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,skinImage);gl.activeTexture(gl.TEXTURE0);gl.uniform1f(gl.getUniformLocation(prog,'atlasReady'),1);if(lastCam)render(lastCam)};skinImage.src=surfaceAtlas;
 const girlTex=gl.createTexture();gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,girlTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));for(const k of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);for(const k of [gl.TEXTURE_MAG_FILTER,gl.TEXTURE_MIN_FILTER])gl.texParameteri(gl.TEXTURE_2D,k,gl.LINEAR);gl.uniform1i(gl.getUniformLocation(prog,'girl'),2);gl.activeTexture(gl.TEXTURE0);
 const girlImage=new Image();girlImage.onload=()=>{if(destroyed)return;gl.useProgram(prog);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,girlTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,girlImage);gl.activeTexture(gl.TEXTURE0);gl.uniform1f(gl.getUniformLocation(prog,'girlReady'),1);if(lastCam)render(lastCam)};girlImage.src=girlAtlas;
 const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
 for(const [n,size,off] of [['pos',3,0],['col',3,12],['obj',1,24],['uv',2,28]]){let a=gl.getAttribLocation(prog,n);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,36,off)}
 const U=n=>gl.getUniformLocation(prog,n),uEye=U('eye'),uRot=U('rot'),uLens=U('lens'),uPick=U('pick');
 gl.enable(gl.DEPTH_TEST);gl.disable(gl.DITHER);let count=0;
 function render(cam,pick=false){
 lastCam=cam;gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(...(pick?[0,0,0,1]:[.89,.8,.68,1]));gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 gl.uniform3f(uEye,cam.x,cam.y,cam.z);gl.uniform4f(uRot,Math.sin(cam.yaw),Math.cos(cam.yaw),Math.sin(cam.pitch),Math.cos(cam.pitch));
 const f=1/Math.tan(.54);gl.uniform2f(uLens,f*canvas.height/canvas.width,f);gl.uniform1f(uPick,pick?1:0);gl.drawArrays(gl.TRIANGLES,0,count)
 }
 return {set(faces){let data=new Float32Array(faces.length*27),i=0;for(const face of faces){const uv=face.uv||surfaceUV(face);face.points.forEach((p,j)=>{data.set(p,i);data.set(face.rgb,i+3);data[i+6]=face.id;data.set(uv?uv[j]:[-1,-1],i+7);i+=9})}count=faces.length*3;gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW)},draw:render,
 hit(cam,x,y){render(cam,true);let px=new Uint8Array(4);gl.readPixels(clamp(Math.floor(x*canvas.width),0,canvas.width-1),clamp(Math.floor((1-y)*canvas.height),0,canvas.height-1),1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);render(cam);return px[0]},dispose(){destroyed=true;gl.deleteTexture(girlTex);gl.deleteTexture(skinTex);gl.deleteTexture(wallTex);gl.deleteBuffer(buf);gl.deleteProgram(prog);gl.getExtension('WEBGL_lose_context')?.loseContext()}}
}
function softwareRoom(canvas){
 const ctx=canvas.getContext('2d');let faces=[],screen=[],lastView=null,disposed=false;const illustration=typeof Image==='function'?new Image():null;
 const girlImage=illustration?new Image():null;if(girlImage){girlImage.onload=()=>{if(lastView&&!disposed)draw(lastView)};girlImage.src=girlAtlas}
 const skinImage=illustration?new Image():null;if(skinImage){skinImage.onload=()=>{if(lastView&&!disposed)draw(lastView)};skinImage.src=surfaceAtlas} if(illustration){illustration.onload=()=>{if(lastView&&!disposed)draw(lastView)};illustration.src=illustratedWall}
 function draw(cam){
 lastView=cam;const w=canvas.width,h=canvas.height,{view,f}=cameraMath(cam,w/h);screen=[];
 for(const face of faces){let poly=face.points.map(view),clipped=[];
 for(let i=0;i<3;i++){const a=poly[i],b=poly[(i+1)%3];if(a[2]>=.05)clipped.push(a);if((a[2]>=.05)!==(b[2]>=.05)){let t=(.05-a[2])/(b[2]-a[2]);clipped.push(a.map((v,j)=>v+(b[j]-v)*t))}}
 if(clipped.length<3)continue;
 screen.push({poly:clipped.map(([x,y,z])=>[w/2+h*f*x/(2*z),h/2-h*f*y/(2*z)]),depth:clipped.reduce((s,p)=>s+p[2],0)/clipped.length,face})}
 screen.sort((a,b)=>b.depth-a.depth);ctx.fillStyle='#e8cfb0';ctx.fillRect(0,0,w,h);for(const {face,poly} of screen){ctx.beginPath();poly.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle='rgb('+face.rgb.map(x=>Math.round(x*255)).join(',')+')';if(face.id!==8)ctx.fill();
 const coords=face.uv||surfaceUV(face),img=face.id===8?girlImage:coords?skinImage:illustration; if((coords||face.id===7)&&img?.naturalWidth&&poly.length===3&&face.points.every(p=>view(p)[2]>.05)){
 const uv=coords?coords.map(([u,v])=>[u*img.width,v*img.height]):face.points.map(([x,y])=>[(x/8.86+.5)*img.width,(1-y/3.9)*img.height]);
 const [[u,v],[u1,v1],[u2,v2]]=uv,[[x,y],[x1,y1],[x2,y2]]=poly,det=(u1-u)*(v2-v)-(u2-u)*(v1-v);
 if(Math.abs(det)>.0001){const a=((x1-x)*(v2-v)-(x2-x)*(v1-v))/det,b=((y1-y)*(v2-v)-(y2-y)*(v1-v))/det,c=((x2-x)*(u1-u)-(x1-x)*(u2-u))/det,d=((y2-y)*(u1-u)-(y1-y)*(u2-u))/det;ctx.save();ctx.clip();ctx.transform(a,b,c,d,x-a*u-c*v,y-b*u-d*v);ctx.drawImage(img,0,0);ctx.restore()}}}
 }
 return {set(f){faces=f},draw,hit(cam,x,y){const p=[x*canvas.width,y*canvas.height];for(let i=screen.length-1;i>=0;i--){let {poly,face}=screen[i];ctx.beginPath();poly.forEach(([a,b],j)=>j?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.closePath();if(ctx.isPointInPath(...p))return face.id}return 0},dispose(){disposed=true}}
}
// Three equal atlas frames: waiting, happy open hands, happy closed hands.
const girlAtlas='images/girl-states.png';
function addOmaniChild(m,frame){
 const x=.0,z=-1.05,w=1.32,h=2.64,u=frame/3;
 const points=[[-w/2,0,z],[w/2,0,z],[w/2,h,z],[-w/2,h,z]];
 m.quad(...points,'ffffff',8);
 const uv=[[u,1],[u+1/3,1],[u+1/3,0],[u,0]];
 m.faces[m.faces.length-2].uv=[uv[0],uv[1],uv[2]];m.faces[m.faces.length-1].uv=[uv[0],uv[2],uv[3]];
}
function sim(){
 reset();const order=[1,0,2];let turn=0,target=order[turn],key=items[target][0],advanceAt=0;
 v.innerHTML=title('أستكشف البيت','<div class="task" id="goal">'+pic(key,items[target][1])+'</div>')+
 '<div class="room-frame"><canvas id="room3" tabindex="0" aria-label="مجلس ثلاثي الأبعاد. اسحب لتلتفت، واستعمل الأسهم للمشي. اسحب الغرض المطلوب إلى مكانه قرب الطفلة: التفاحة في الصحن، الماء على الطاولة، واللعبة في الكرتون."></canvas><div class="move-pad" dir="ltr"><button data-m="left" aria-label="تحرك يسارًا">◀</button><button data-m="forward" aria-label="تقدّم">▲</button><button data-m="right" aria-label="تحرك يمينًا">▶</button><button data-m="back" aria-label="تراجع">▼</button></div><button id="centerCamera" aria-label="واجه الطاولة">⌖</button></div><div class="footer"><span id="mark" class="feedback" role="status"></span>'+'<span id="steps">'+dots(turn)+'</span>'+'<button class="action" hidden id="next" aria-label="التالي">←</button></div>';
 wire();const instructions=document.createElement('p');instructions.className='info sim-instructions';instructions.textContent='اسمع الطلب، ثم اسحب الغرض إلى الطفل';v.querySelector('.room-frame').before(instructions);const canvas=$('#room3'),renderer=roomRenderer(canvas),fixed=furnishedRoom(),starts=objectsAt.map(([x,z])=>[x,floorCupY,z]),pos=starts.map(p=>p.slice());
 const cam={x:0,y:1.48,z:2.85,yaw:0,pitch:-.22};
 let held=false,complete=false,gesture=null,frame=0,dirty=true,active=true,prev=0,resizeObs,aspect=1;
 let girlFrame=0;const reducedMotion=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;const movements=new Map();
 function updateGeometry(){const m=meshBuilder();addProps(m,pos,held?target:-1);addOmaniChild(m,girlFrame);renderer.set(fixed.concat(m.faces));dirty=true}
 function size(){const r=canvas.getBoundingClientRect(),dpr=Math.min(1.7,window.devicePixelRatio||1);canvas.width=Math.max(2,Math.round(r.width*dpr));canvas.height=Math.max(2,Math.round(r.height*dpr));aspect=canvas.width/canvas.height;dirty=true}
 function center(){cam.x=0;cam.z=Math.max(3.1,2.85/aspect);cam.z=clamp(cam.z,2.1,4.55);cam.yaw=0;cam.pitch=Math.atan2(-.80,cam.z);dirty=true}
 function move(dir,dt){const speed=1.45*dt,f=dir==='forward'?1:dir==='back'?-1:0,r=dir==='right'?1:dir==='left'?-1:0;
 const x=clamp(cam.x+speed*(r*Math.cos(cam.yaw)+f*Math.sin(cam.yaw)),-3.95,3.95),z=clamp(cam.z+speed*(r*Math.sin(cam.yaw)-f*Math.cos(cam.yaw)),-1.64,4.55);
 const legal=(a,b)=>Math.abs(a)>1.84||Math.abs(b)>.94;
 if(legal(x,cam.z))cam.x=x;if(legal(cam.x,z))cam.z=z;dirty=true}
 function tick(now){if(!active)return;if(complete&&advanceAt&&performance.now()>=advanceAt&&!$('#config').open){advance();if(!active)return}const nextFrame=complete?(reducedMotion?2:1+Math.floor(now/230)%2):0;if(girlFrame!==nextFrame){girlFrame=nextFrame;updateGeometry()}const dt=Math.min(.045,(now-prev)/1000||0);prev=now;for(const dir of new Set(movements.values()))move(dir,dt);if(dirty){renderer.draw(cam);dirty=false}frame=requestAnimationFrame(tick)}
 const xy=e=>{const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]};
 function place(){if(!held||complete)return;held=false;complete=true;pos[target]=goals[target].slice();girlFrame=1;updateGeometry();$('#mark').textContent='أحسنت! ✓';replay=()=>{};say('praise');advanceAt=performance.now()+(muted?2400:4500);if(player){const reward=player;reward.onended=()=>{if(active&&player===reward&&complete)advanceAt=performance.now()+1800}}}
 function destination(nx,ny){const p=cameraMath(cam,aspect).floorPoint(2*nx-1,1-2*ny,goals[target][1]);return p&&insideGoal(target,p[0],p[2])}
 function dragPoint(nx,ny){const f=1/Math.tan(.54),u=(2*nx-1)*aspect/f,v=(1-2*ny)/f,cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch),sy=Math.sin(cam.yaw),cy=Math.cos(cam.yaw),fw=cp-v*sp,dz=u*sy-fw*cy,t=(.50-cam.z)/dz;
 if(t<=0||!isFinite(t))return null;return [cam.x+t*(u*cy+fw*sy),cam.y+t*(v*cp+sp)-.15,.50]}
 function returnProp(){held=false;pos[target]=starts[target].slice();updateGeometry()}

 function advance(){advanceAt=0;if(++turn===order.length){real();return}
 target=order[turn];key=items[target][0];complete=false;girlFrame=0;held=false;gesture=null;
 $('#goal').innerHTML=pic(key,items[target][1]);$('#steps').innerHTML=dots(turn);$('#mark').textContent='';updateGeometry();childRequest()}
 function pick(id){if(complete||held||id<1||id>3)return;if(id!==target+1)return;held=true;pos[target][1]+=.23;$('#mark').textContent='';updateGeometry()}
 canvas.onpointerdown=e=>{if(gesture)return;e.preventDefault();const [nx,ny]=xy(e);const id=renderer.hit(cam,nx,ny);
 gesture={pointer:e.pointerId,id,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,drag:false,carrying:false};canvas.setPointerCapture(e.pointerId)};
 canvas.onpointermove=e=>{const g=gesture;if(!g||e.pointerId!==g.pointer)return;
 if(!g.drag&&Math.hypot(e.clientX-g.x,e.clientY-g.y)>6){g.drag=true;if(!complete&&g.id===target+1){if(!held)pick(g.id);g.carrying=held}}
 if(g.drag){if(g.carrying){const [nx,ny]=xy(e);const p=dragPoint(nx,ny);if(p){pos[target]=p;updateGeometry()}}
 else{cam.yaw-=(e.clientX-g.lastX)*.006;cam.pitch=clamp(cam.pitch+(e.clientY-g.lastY)*.005,-.94,.65);dirty=true}}
 g.lastX=e.clientX;g.lastY=e.clientY};
 canvas.onpointerup=e=>{const g=gesture;if(!g||e.pointerId!==g.pointer)return;gesture=null;
 const [nx,ny]=xy(e);
 if(!g.drag){if(!held)pick(g.id);else if(destination(nx,ny))place()}
 if(g.carrying){if(destination(nx,ny))place();else returnProp()}
 if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId)};
 canvas.onpointercancel=canvas.onlostpointercapture=e=>{if(gesture?.pointer===e.pointerId){if(gesture.carrying)returnProp();gesture=null}};

 for(const b of v.querySelectorAll('[data-m]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);move(b.dataset.m,.12);movements.set(e.pointerId,b.dataset.m)};b.onpointerup=b.onpointercancel=b.onlostpointercapture=e=>movements.delete(e.pointerId);b.onclick=e=>{if(e.detail===0)move(b.dataset.m,.22)}}
 const arrows={ArrowUp:'forward',ArrowDown:'back',ArrowLeft:'left',ArrowRight:'right'};
 canvas.onkeydown=e=>{if(arrows[e.key]){e.preventDefault();movements.set(e.key,arrows[e.key])}};canvas.onkeyup=e=>movements.delete(e.key);canvas.onblur=()=>movements.clear();
 $('#centerCamera').onclick=center;
 size();center();updateGeometry();renderer.draw(cam);if(typeof ResizeObserver!=='undefined'){resizeObs=new ResizeObserver(size);resizeObs.observe(canvas)}
 pauseRoom=()=>{movements.clear();if(held&&!complete)returnProp();gesture=null};cleanupRoom=()=>{active=false;cancelAnimationFrame(frame);resizeObs?.disconnect();renderer.dispose();pauseRoom=null;cleanupRoom=null};
 function childRequest(){const request=['أبا تفاح','أبا ماي','أبا اللعبة'][target];instructions.textContent=request+' — '+['حط التفاحة في الصحن','حط الماي فوق الطاولة','حط اللعبة في الكرتون'][target];replay=()=>say(items[target][0]);replay()}
 childRequest();frame=requestAnimationFrame(tick)
}
function real(){reset();v.innerHTML=title('أطلب في البيت')+'<div class="panel"><p class="info">للمرافق · ضع الأغراض الحقيقية أمام الطفل، ثم دعه يطلب ما يريد.</p>'+row()+'<div id="give"></div></div>';wire();prompt('real','الحين نجرّب بالحقيقة. شو تريد؟');v.querySelectorAll('.choice').forEach((b,i)=>b.onclick=()=>{chosen=i;const [k,n,q]=items[i];v.querySelectorAll('.choice').forEach(c=>c.classList.toggle('correct',c===b));prompt(k,q);$('#give').innerHTML='<div class="realbox"><span class="big">🤲</span>'+pic(k,n)+'</div><p class="info">للمرافق · أعطِ الطفل ما طلبه، ثم أكّد الاستلام.</p><div class="footer"><button class="action" id="got">✓ استلم الغرض</button></div>';$('#got').onclick=()=>{reset();v.innerHTML=title('اكتمل الطلب')+'<div class="panel"><div class="realbox">'+pic(k,n)+'<span class="big">✓</span></div><div class="footer"><button class="action" id="again" aria-label="طلب آخر">↻</button><button class="icon" id="end" aria-label="العودة للبداية">⌂</button></div></div>';wire();prompt('done','تمّ');$('#again').onclick=real;$('#end').onclick=nav}})}
$('#home').onclick=nav;$('#sound').onclick=()=>{muted=!muted;stop();$('#sound').textContent=muted?'🔇':'🔊';$('#sound').setAttribute('aria-label',muted?'تشغيل الصوت':'كتم الصوت');if(!muted)replay()};$('#settings').onclick=()=>{pauseRoom?.();stop();$('#config').showModal()};$('#close').onclick=()=>$('#config').close();
nav();
