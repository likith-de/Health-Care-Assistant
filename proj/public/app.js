const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let D;try{D=JSON.parse(localStorage.getItem('hca'))}catch(e){}
D=D||{u:[],v:{},m:{},l:{},s:{}};
const save=()=>{try{localStorage.setItem('hca',JSON.stringify(D))}catch(e){}};
let me=null,tab='meds',sel=null,mode='in',ring=null,ctx=null;
try{me=sessionStorage.getItem('me')}catch(e){}
const U=id=>D.u.find(x=>x.id==id);
const lg=(p,y,x,t)=>{const a=D.l[p]=D.l[p]||[];a.unshift({t:t||Date.now(),y,x});a.length=Math.min(a.length,200);save()};
const ft=t=>new Date(t).toLocaleString([],{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const hs=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const rn=(a,b)=>a+Math.random()*(b-a);
function toast(m){const e=$('#toast');e.textContent=m;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,2600)}

/* ---------- 10 alarm sounds (synthesised, no files) ---------- */
const S=[
['Classic beep','square',[[880,0,.15],[880,.25,.15],[880,.5,.15]]],
['Digital chime','sine',[[1047,0,.3],[1319,.25,.3],[1568,.5,.5]]],
['Soft bells','triangle',[[523,0,.7],[659,.3,.7],[784,.6,.7],[1047,.9,.9]]],
['Morning birds','sine',[[2000,0,.08],[2600,.1,.08],[2200,.22,.08],[2900,.34,.1],[2400,.6,.08],[3000,.72,.1]]],
['Marimba','triangle',[[392,0,.25],[494,.2,.25],[587,.4,.25],[494,.6,.25],[784,.8,.4]]],
['Pulse','sawtooth',[[440,0,.1],[440,.2,.1],[440,.4,.1],[440,.6,.1],[440,.8,.1]]],
['Gentle siren','sine',[[600,0,.45],[800,.45,.45],[600,.9,.45],[800,1.35,.45]]],
['Harp','triangle',[[262,0,.5],[330,.12,.5],[392,.24,.5],[523,.36,.5],[659,.48,.5],[784,.6,.8]]],
['Alert buzz','sawtooth',[[220,0,.25],[220,.35,.25],[220,.7,.25]]],
['Rising tone','sine',[[400,0,.18],[500,.14,.18],[600,.28,.18],[700,.42,.18],[800,.56,.18],[950,.7,.4]]]];
function ac(){try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();ctx.resume()}catch(e){}}
function play(i,vol){ac();if(!ctx)return;const [,w,n]=S[i],t0=ctx.currentTime+.02;
for(const [f,s,d] of n){const o=ctx.createOscillator(),g=ctx.createGain();o.type=w;o.frequency.value=f;
g.gain.setValueAtTime(0,t0+s);g.gain.linearRampToValueAtTime(.25*vol,t0+s+.02);g.gain.exponentialRampToValueAtTime(.001,t0+s+d);
o.connect(g).connect(ctx.destination);o.start(t0+s);o.stop(t0+s+d+.05)}}
const snO=v=>S.map((s,i)=>`<option value=${i} ${i==v?'selected':''}>${s[0]}</option>`).join('');

/* ---------- vitals simulation + early-warning ---------- */
function flags(v){const b=[];if(v.hr>100||v.hr<60)b.push('heart rate '+v.hr);if(v.sp<95)b.push('SpO2 '+v.sp+'%');if(v.sy>=130||v.di>=85)b.push('BP '+v.sy+'/'+v.di);if(v.rr<12||v.rr>20)b.push('breathing '+v.rr);if(v.tp>37.5||v.tp<36.5)b.push('temp '+v.tp);return b}
function gen(p,t){const ab=Math.random()<.12;const v={t:t||Date.now(),hr:Math.round(rn(62,98)+(ab?35:0)),sp:Math.round(rn(95,99)-(ab?6:0)),sy:Math.round(rn(104,126)+(ab?35:0)),di:Math.round(rn(66,80)),rr:Math.round(rn(12,19)),tp:+rn(36.5,37.2).toFixed(1)};
const a=D.v[p]=D.v[p]||[];a.push(v);if(a.length>60)a.shift();const f=flags(v);if(f.length)lg(p,'alert','Early warning: '+f.join(', '),v.t);else if(!t)lg(p,'vital','Reading recorded: HR '+v.hr+', SpO2 '+v.sp+'%, BP '+v.sy+'/'+v.di,v.t);save();return v}
const adh=p=>{const l=D.l[p]||[],a=l.filter(x=>x.y=='taken').length,b=l.filter(x=>x.y=='missed').length;return a+b?Math.round(100*a/(a+b)):'-'};
const sp=(a,k,c)=>{if(a.length<2)return'<p class=mut>Not enough readings yet.</p>';const v=a.map(x=>x[k]),mn=Math.min(...v),mx=Math.max(...v)||1,r=mx-mn||1;
return`<svg viewBox="0 0 300 60" width="100%" height="60" role="img" aria-label="${k} trend"><polyline fill="none" stroke="${c}" stroke-width="2" points="${v.map((y,i)=>(i*300/(v.length-1)).toFixed(1)+','+(55-(y-mn)/r*50).toFixed(1)).join(' ')}"/></svg>`};
function cards(v){if(!v)return'<p class=mut>No readings yet.</p>';const f=flags(v).join('|');const c=(l,x,u,k)=>`<div class="vc ${f.includes(k)?'bad':''}"><small>${l}</small><br><b>${x}</b> <small>${u}</small></div>`;
return`<div class=grid>${c('Heart rate',v.hr,'bpm','heart')}${c('Oxygen',v.sp,'%','SpO2')}${c('Blood pressure',v.sy+'/'+v.di,'mmHg','BP')}${c('Breathing',v.rr,'/min','breathing')}${c('Temperature',v.tp,'°C','temp')}</div>`}

/* ---------- medicines ---------- */
function medRow(m,p,del){return`<div class=row>${del?`<b class=t>${m.time}</b>`:`<input type=time value="${m.time}" onchange="um('${p}','${m.id}','time',this.value)" aria-label="Alarm time">`}<div><b>${esc(m.name)}</b><br><small>${esc(m.dose||'')}${m.by?' prescribed by '+esc(m.by):''}</small></div>
${del?`<select onchange="um('${p}','${m.id}','snd',+this.value)" aria-label="Alarm sound">${snO(m.snd)}</select>`:`<small>Sound: ${S[m.snd][0]}</small>`}
${del?`<label style="margin:0"><input type=checkbox style="display:inline;width:auto" ${m.on?'checked':''} onchange="um('${p}','${m.id}','on',this.checked)"> On</label>`:'<span></span>'}
${del?'':`<button class=gh onclick="dm('${p}','${m.id}')">Remove</button>`}</div>`}
function addForm(p,own){const s=D.s[p]||{snd:0};return`<form class=add onsubmit="return am(event,'${p}',${own})"><label>Medicine<input id=mn required></label><label>Dose<input id=md placeholder="500 mg"></label><label>Time<input id=mt type=time value="${new Date(Date.now()+12e4).toTimeString().slice(0,5)}" required></label>${own?`<label>Sound<select id=ms>${snO(s.snd)}</select></label>`:'<span></span>'}<button class=pri>${own?'Add medicine':'Prescribe'}</button></form>`}
function am(e,p,own){e.preventDefault();if(U(me).role!='doctor')return false;const m={id:'m'+Date.now(),name:$('#mn').value.trim(),dose:$('#md').value.trim(),time:$('#mt').value,snd:own?+$('#ms').value:(D.s[p]||{snd:0}).snd,on:true};if(!own)m.by=U(me).name;
(D.m[p]=D.m[p]||[]).push(m);lg(p,'med',(own?'Added ':'Dr. '+U(me).name+' prescribed ')+m.name+' at '+m.time);save();R();return false}
function um(p,id,k,v){if(U(me).role!='doctor'&&k=='time')return;const m=D.m[p].find(x=>x.id==id);m[k]=v;if(k=='time')m.k='';lg(p,'med','Changed '+m.name+' '+k+' to '+(k=='snd'?S[v][0]:v));save();if(k=='snd')play(v,(D.s[p]||{vol:.8}).vol);toast('Saved')}
function dm(p,id){if(U(me).role!='doctor')return;const m=D.m[p].find(x=>x.id==id);D.m[p]=D.m[p].filter(x=>x.id!=id);lg(p,'med','Removed '+m.name);save();R()}

/* ---------- alarm engine ---------- */
function startRing(m,test){const s=D.s[me]||{snd:0,vol:.8};const go=()=>play(m.snd>=0?m.snd:s.snd,s.vol);go();ring={m,t:Date.now(),test,iv:setInterval(go,2600)};
const e=$('#ring');e.hidden=false;e.innerHTML=`<div class=panel><h2>Time for your medicine</h2><p style="font-size:28px"><b>${esc(m.name)}</b><br><small>${esc(m.dose||'')}</small></p><button class=pri onclick="rd(1)">I took it</button> <button class=gh onclick="rd(0)">Snooze 5 min</button></div>`;
navigator.vibrate&&navigator.vibrate([400,200,400])}
function stopRing(){if(!ring)return;clearInterval(ring.iv);ring=null;$('#ring').hidden=true}
function rd(ok){const r=ring;stopRing();if(r.test)return;if(ok){lg(me,'taken',r.m.name+' taken');toast('Dose logged')}else{r.m.sn=Date.now()+3e5;lg(me,'snooze',r.m.name+' snoozed for 5 minutes');save();toast('Snoozed')}save();R()}
setInterval(()=>{const u=me&&U(me);if(!u||u.role!='patient')return;const n=new Date(),hm=n.toTimeString().slice(0,5),dk=n.toDateString()+hm;
for(const m of D.m[me]||[]){if(!m.on)continue;if((m.time==hm&&m.k!=dk)||(m.sn&&Date.now()>=m.sn)){m.k=dk;m.sn=0;save();if(!ring)startRing(m)}}
if(ring&&Date.now()-ring.t>3e5){const m=ring.m,t=ring.test;stopRing();if(!t){lg(me,'missed',m.name+' not confirmed after 5 minutes. Doctor notified.');R()}}},1000);
setInterval(()=>{if(me&&U(me)?.role=='patient'&&tab=='today'&&!ring){gen(me);R()}},15000);

/* ---------- auth ---------- */
function er(m){$('#er').textContent=m;return false}
async function go(e){e.preventDefault();ac();const em=$('#ae').value.trim().toLowerCase(),h=await hs($('#ap').value);
if(mode=='up'){if(D.u.some(u=>u.em==em))return er('That email is already registered. Log in instead.');const u={id:'u'+Date.now(),em,h,name:$('#an').value.trim(),role:$('#ar').value};D.u.push(u);if(u.role=='patient')D.s[u.id]={snd:0,vol:.8};save();login(u.id)}
else{const u=D.u.find(u=>u.em==em&&u.h==h);if(!u)return er('Email or password is incorrect.');login(u.id)}return false}
function login(id){me=id;try{sessionStorage.setItem('me',id)}catch(e){}tab='meds';sel=null;if(U(id).role=='patient'&&!(D.v[id]||[]).length)gen(id);R()}
function logout(){stopRing();me=null;try{sessionStorage.removeItem('me')}catch(e){}R()}
async function seed(){if(D.u.length)return;const P='p0',d='d0';D.u.push({id:d,em:'doctor@demo.com',h:await hs('doc123'),name:'Meera Rao',role:'doctor'},{id:P,em:'patient@demo.com',h:await hs('pat123'),name:'Ravi Kumar',role:'patient'});
D.s[P]={snd:2,vol:.8};D.m[P]=[{id:'m1',name:'Amlodipine',dose:'5 mg',time:'08:00',snd:2,on:true,by:'Meera Rao'},{id:'m2',name:'Metformin',dose:'500 mg',time:'20:00',snd:4,on:true,by:'Meera Rao'}];
for(let i=20;i>0;i--)gen(P,Date.now()-i*36e5);for(let i=3;i>0;i--){lg(P,'taken','Amlodipine taken',Date.now()-i*864e5);lg(P,'taken','Metformin taken',Date.now()-i*864e5+36e6)}lg(P,'missed','Metformin not confirmed after 5 minutes. Doctor notified.',Date.now()-4*864e5);save()}

/* ---------- views ---------- */
const LG=l=>(l||[]).slice(0,40).map(x=>`<div class=lg><small>${ft(x.t)}</small><span class="t ${x.y}">${esc(x.x)}</span></div>`).join('')||'<p class=mut>No activity yet.</p>';
function Auth(){const up=mode=='up';return`<section class=hero><div><h1 class=big>Never miss a dose.<br>Your doctor stays in the loop.</h1><p>Health Care Assistant monitors vital signs, rings a medicine alarm you choose with the medicine name on screen, and lets your doctor prescribe and follow everything.</p><p class=mut>Demo patient: patient@demo.com, password pat123<br>Demo doctor: doctor@demo.com, password doc123</p></div>
<form class=panel onsubmit="return go(event)"><h2>${up?'Create account':'Log in'}</h2>${up?`<label>Full name<input id=an required></label><label>I am a<select id=ar><option value=patient>Patient<option value=doctor>Doctor</select></label>`:''}<label>Email<input id=ae type=email required autocomplete=email></label><label>Password<input id=ap type=password required minlength=4 autocomplete=current-password></label><button class=pri>${up?'Create account':'Log in'}</button><p class=err id=er></p><button type=button class=lk onclick="mode='${up?'in':'up'}';R()">${up?'I already have an account':'Create a new account'}</button></form></section>`}
function Pv(){const p=me,a=D.v[p]||[],v=a[a.length-1],ms=(D.m[p]||[]).slice().sort((x,y)=>x.time<y.time?-1:1),s=D.s[p]||{snd:0,vol:.8};let b='';
if(tab=='today')b=`<div class=panel><h2>Live vitals</h2>${cards(v)}<button class=gh onclick="gen('${p}');R()">Take a reading now</button><p class=mut style="margin-top:10px">Readings are simulated every 15 seconds. Connect your ESP32 sensors to send real values.</p></div>
<div class=panel style="margin-top:16px"><h2>Today's medicines</h2><p>Adherence: <b>${adh(p)}${adh(p)=='-'?'':'%'}</b></p>${ms.filter(m=>m.on).map(m=>`<div class=lg><small>${m.time}</small><span class=t>${esc(m.name)} ${esc(m.dose||'')}</span></div>`).join('')||'<p class=mut>Your doctor has not added medicines yet.</p>'}<p class=mut style="margin-top:10px">Keep this page open so the alarm can ring.</p></div>`;
if(tab=='meds'){const per=h=>h<12?'Morning':h<17?'Afternoon':'Evening';
b=`<div class=panel><h2>My medicines</h2><p class=mut>Your doctor adds your medicines. You can only change the alarm sound.</p>${['Morning','Afternoon','Evening'].map(n=>{const l=ms.filter(m=>per(+m.time.slice(0,2))==n);return l.length?`<h3 style="margin-top:14px">${n}</h3>`+l.map(m=>medRow(m,p,1)).join(''):''}).join('')||'<p class=mut>Your doctor has not added any medicines yet.</p>'}</div>`}
if(tab=='sounds')b=`<div class=panel><h2>Alarm sounds</h2><p class=mut>Pick a default sound, or set a different one for each medicine.</p>${S.map((x,i)=>`<div class=lg style="align-items:center;justify-content:space-between"><span class="t ${i==s.snd?'taken':''}">${x[0]}${i==s.snd?' (default)':''}</span><span><button class=gh onclick="play(${i},D.s['${p}'].vol)">Preview</button> <button class=gh onclick="D.s['${p}'].snd=${i};save();R()">Make default</button></span></div>`).join('')}
<label style="margin-top:14px">Volume<input type=range min=.1 max=1 step=.1 value=${s.vol} onchange="D.s['${p}'].vol=+this.value;save();play(D.s['${p}'].snd,+this.value)"></label><button class=pri onclick="startRing({name:'Test alarm',dose:'This is how your alarm will ring',snd:-1},1)">Test full alarm</button></div>`;
if(tab=='log')b=`<div class=panel><h2>My activity</h2>${LG(D.l[p])}</div>`;
return`<nav>${[['meds','My medicines'],['sounds','Alarm sounds'],['today','Health & vitals'],['log','Activity']].map(x=>`<button class="${tab==x[0]?'on':''}" onclick="tab='${x[0]}';R()">${x[1]}</button>`).join('')}</nav>${b}`}
function PD(p){const u=U(p),a=D.v[p]||[],v=a[a.length-1],ms=(D.m[p]||[]).slice().sort((x,y)=>x.time<y.time?-1:1),al=(D.l[p]||[]).filter(x=>x.y=='alert'||x.y=='missed').length;
return`<div class=panel><h2>${esc(u.name)}</h2><p class=mut>${esc(u.em)}. Adherence ${adh(p)}${adh(p)=='-'?'':'%'}. ${al} alerts logged.</p>${cards(v)}<div class=grid><div><small>Heart rate trend</small>${sp(a,'hr','#3de0c4')}</div><div><small>Systolic BP trend</small>${sp(a,'sy','#ffb454')}</div></div></div>
<div class=panel style="margin-top:16px"><h2>Medicines and prescriptions</h2>${ms.map(m=>medRow(m,p,0)).join('')||'<p class=mut>No medicines yet.</p>'}${addForm(p,0)}</div>
<div class=panel style="margin-top:16px"><h2>All activity</h2>${LG(D.l[p])}</div>`}
function Dv(){const ps=D.u.filter(u=>u.role=='patient');if(!sel||!U(sel))sel=ps[0]&&ps[0].id;
return`<div class=split><aside class=panel><h2>Patients</h2>${ps.map(p=>`<button class="pt ${p.id==sel?'on':''}" onclick="sel='${p.id}';R()"><span class=t>${esc(p.name)}</span><br><small>${adh(p.id)}${adh(p.id)=='-'?'':'%'} adherence</small></button>`).join('')||'<p class=mut>No patients have registered yet.</p>'}</aside><div>${sel?PD(sel):''}</div></div>`}
function R(){const u=me&&U(me),a=$('#app');if(!u){a.innerHTML=`<div class=top><span class=brand>Health Care Assistant</span></div>`+Auth();return}
const keep=document.activeElement&&document.activeElement.tagName=='INPUT'&&document.activeElement.type!='range';if(keep&&ring==null&&0)return;
a.innerHTML=`<div class=top><span class=brand>Health Care Assistant</span><span><span class=t>${u.role=='doctor'?'Dr. ':''}${esc(u.name)}</span> <button class=gh onclick="logout()">Log out</button></span></div>`+(u.role=='doctor'?Dv():Pv())}
addEventListener('storage',e=>{if(e.key=='hca'){try{D=JSON.parse(e.newValue)}catch(x){}if(!ring&&!document.activeElement.matches('input,select'))R()}});
document.addEventListener('touchstart',e=>{const t=e.target.closest('.t,h1,h2,h3,p,label,li,button,small,b');if(t){t.classList.add('sh');setTimeout(()=>t.classList.remove('sh'),700)}},{passive:true});

seed().then(R);
