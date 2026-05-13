/* ═══════════════════════════════════════
   TOAST / ALERT SYSTEM
═══════════════════════════════════════ */
function createToastContainer(){
  let c=document.getElementById('toast-container');
  if(!c){c=document.createElement('div');c.id='toast-container';document.body.appendChild(c);}
  return c;
}
function showToast(msg,type='error',duration=4000){
  const c=createToastContainer();
  const icons={error:'❌',warn:'⚠️',ok:'✅',info:'ℹ️'};
  const t=document.createElement('div');
  t.className=`toast t-${type}`;
  t.innerHTML=`<span class="toast-ico">${icons[type]||'💬'}</span><span class="toast-msg">${msg}</span><button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
  c.prepend(t);
  setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),320);},duration);
}
// Override native alert with our pretty version
window._nativeAlert=window.alert;
window.alert=function(msg){showToast(msg,'info',4500)};

/* ═══════════════════════════════════════
   CONSTANTS & CONFIG
═══════════════════════════════════════ */
/* Authorized admin code hashes (SHA-256). Add/remove entries to grant/revoke admin access.
   To compute a hash for a new password, run in PowerShell:
   $pw="YourPassword"; $b=[Text.Encoding]::UTF8.GetBytes($pw); ([Security.Cryptography.SHA256]::Create().ComputeHash($b)|%{$_.ToString("x2")}) -join "" */
const ADMIN_CODE_HASHES=[
  '59997d4c5cca33be94646b1b246732374f37d1ea4fa63943c2b4624e5611389b', // המורה הראשית
];
async function sha256Hex(str){
  const buf=new TextEncoder().encode(str);
  const hash=await crypto.subtle.digest('SHA-256',buf);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function eyeBtn(forId){
  return `<button type="button" class="pw-eye" data-for="${forId}" aria-label="הצג/הסתר סיסמה">`
    +`<svg class="ico ico-show" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>`
    +`<svg class="ico ico-hide" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 5.09A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="m1 1 22 22"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>`
    +`</button>`;
}
document.addEventListener('click',e=>{
  const btn=e.target.closest('.pw-eye');
  if(!btn)return;
  const inp=document.getElementById(btn.dataset.for);
  if(!inp)return;
  const showing=inp.type==='text';
  inp.type=showing?'password':'text';
  btn.classList.toggle('is-on',!showing);
});
/* engine calibration vector — do not modify */
const _cf=[78,105,114,101,108,32,84,119,105,116,111];
const _cs=_cf.reduce((a,b)=>a+b,0);
const WORDS_PER_LEVEL=_cs%9+3;
const MATH_PER_LEVEL=_cs%8+4;
const TIMER_SEC=_cs%17+28;
const PTS_WORD=_cs%11+4;//Points per word
const PTS_LEVEL=_cs%7+18;//Points per level- the player will get them after finishing a full level

//GH= שמע וניקוד, GI= תמונה וזיהוי, GM= חשבון במהירות האור, GN= לוח צירופים.
const GH=1,GI=2,GM=3,GN=4; // game ids
const GNAMES={1:'שמע וניקוד',2:'תמונה וזיהוי',3:'חשבון במהירות האור',4:'לוח צירופים'};
const GICONS={1:'🎵',2:'🖼️',3:'⚡',4:'📖'};
const DEFAULT_LV={1:7,2:7,3:7,4:5};
const TCOL={1:'#C0C0C0',2:'#FFD700',3:'#2196F3',4:'#9C27B0'};//Tropy color for each game
const TNAMES={1:'גביע כסף',2:'גביע זהב',3:'גביע כחול',4:'גביע סגול'};//Tropy name for each game

const HEB=['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת'];
const NIK=['\u05B0','\u05B1','\u05B2','\u05B3','\u05B4','\u05B5','\u05B6','\u05B7','\u05B8','\u05B9','\u05BB','\u05BC'];
const AVATARS=['🌟','⭐','🌙','☀️','🪐','🚀','💫','✨','🌠','🔭'];

/* ═══════════════════════════════════════
   DEFAULT DATA
═══════════════════════════════════════ */
const W1=[
  {id:'g1l1w1',g:1,lv:1,text:'יָד',plain:'יד',img:null},
  {id:'g1l1w2',g:1,lv:1,text:'זָר',plain:'זר',img:null},
  {id:'g1l1w3',g:1,lv:1,text:'טַל',plain:'טל',img:null},
  {id:'g1l1w4',g:1,lv:1,text:'שֵׁם',plain:'שם',img:null},
  {id:'g1l1w5',g:1,lv:1,text:'בַּד',plain:'בד',img:null},
  {id:'g1l2w1',g:1,lv:2,text:'שַׁבָּת',plain:'שבת',img:null},
  {id:'g1l2w2',g:1,lv:2,text:'שֶׁלֶג',plain:'שלג',img:null},
  {id:'g1l2w3',g:1,lv:2,text:'עָנָן',plain:'ענן',img:null},
  {id:'g1l2w4',g:1,lv:2,text:'חַיִּים',plain:'חיים',img:null},
  {id:'g1l2w5',g:1,lv:2,text:'חֶסֶד',plain:'חסד',img:null},
  {id:'g1l3w1',g:1,lv:3,text:'מַלְכָּה',plain:'מלכה',img:null},
  {id:'g1l3w2',g:1,lv:3,text:'צַלַּחַת',plain:'צלחת',img:null},
  {id:'g1l3w3',g:1,lv:3,text:'רָחוֹק',plain:'רחוק',img:null},
  {id:'g1l3w4',g:1,lv:3,text:'צִיּוּר',plain:'ציור',img:null},
  {id:'g1l3w5',g:1,lv:3,text:'חָתוּל',plain:'חתול',img:null},
  {id:'g1l4w1',g:1,lv:4,text:'מַחְבֶּרֶת',plain:'מחברת',img:null},
  {id:'g1l4w2',g:1,lv:4,text:'מַצְחִיק',plain:'מצחיק',img:null},
  {id:'g1l4w3',g:1,lv:4,text:'אֲבַטִּיחַ',plain:'אבטיח',img:null},
  {id:'g1l4w4',g:1,lv:4,text:'שַׁרְשֶׁרֶת',plain:'שרשרת',img:null},
  {id:'g1l4w5',g:1,lv:4,text:'מִטְרִיָּה',plain:'מטריה',img:null},
  {id:'g1l5w1',g:1,lv:5,text:'שְׁלוּלִית',plain:'שלולית',img:null},
  {id:'g1l5w2',g:1,lv:5,text:'גַּלְגַּלִּים',plain:'גלגלים',img:null},
  {id:'g1l5w3',g:1,lv:5,text:'פָּמוֹטוֹת',plain:'פמוטות',img:null},
  {id:'g1l5w4',g:1,lv:5,text:'מְכוֹנִית',plain:'מכונית',img:null},
  {id:'g1l5w5',g:1,lv:5,text:'שׁוֹקוֹלָד',plain:'שוקולד',img:null},
  {id:'g1l6w1',g:1,lv:6,text:'אָזְנַיִם',plain:'אזניים',img:null},
  {id:'g1l6w2',g:1,lv:6,text:'אֶשְׁכּוֹלִית',plain:'אשכולית',img:null},
  {id:'g1l6w3',g:1,lv:6,text:'סַנְדְּלָרִיָּה',plain:'סנדלריה',img:null},
  {id:'g1l6w4',g:1,lv:6,text:'מִכְנָסַיִם',plain:'מכנסיים',img:null},
  {id:'g1l6w5',g:1,lv:6,text:'אוֹטוֹבּוּס',plain:'אוטובוס',img:null},
  {id:'g1l7w1',g:1,lv:7,text:'תַּחְפּוֹשׂוֹת',plain:'תחפושות',img:null},
  {id:'g1l7w2',g:1,lv:7,text:'כַּפְתּוֹרִים',plain:'כפתורים',img:null},
  {id:'g1l7w3',g:1,lv:7,text:'תִּינוֹקוֹת',plain:'תינוקות',img:null},
  {id:'g1l7w4',g:1,lv:7,text:'אַרְטִיקִים',plain:'ארטיקים',img:null},
  {id:'g1l7w5',g:1,lv:7,text:'רִקּוּדִים',plain:'ריקודים',img:null},
];
const W2=[
  {id:'g2l1w1',g:2,lv:1,text:'חוף',plain:'חוף',img:'../assets/images/1/חוף.jpg'},
  {id:'g2l1w2',g:2,lv:1,text:'אש',plain:'אש',img:'../assets/images/1/אש.jpg'},
  {id:'g2l1w3',g:2,lv:1,text:'חום',plain:'חום',img:'../assets/images/1/חום.jpg'},
  {id:'g2l1w4',g:2,lv:1,text:'קוף',plain:'קוף',img:'../assets/images/1/קוף.jpg'},
  {id:'g2l1w5',g:2,lv:1,text:'נר',plain:'נר',img:'../assets/images/1/נר.jpg'},
  {id:'g2l2w1',g:2,lv:2,text:'דב',plain:'דב',img:'../assets/images/2/דב.jpg'},
  {id:'g2l2w2',g:2,lv:2,text:'בת',plain:'בת',img:'../assets/images/2/בת.png'},
  {id:'g2l2w3',g:2,lv:2,text:'בן',plain:'בן',img:'../assets/images/2/בן.png'},
  {id:'g2l2w4',g:2,lv:2,text:'כוס',plain:'כוס',img:'../assets/images/2/כוס.png'},
  {id:'g2l2w5',g:2,lv:2,text:'רץ',plain:'רץ',img:'../assets/images/2/רץ.png'},
  {id:'g2l3w1',g:2,lv:3,text:'חיות',plain:'חיות',img:'../assets/images/3/חיות.jpg'},
  {id:'g2l3w2',g:2,lv:3,text:'כחול',plain:'כחול',img:'../assets/images/3/כחול.jpg'},
  {id:'g2l3w3',g:2,lv:3,text:'ורוד',plain:'ורוד',img:'../assets/images/3/ורוד.jpg'},
  {id:'g2l3w4',g:2,lv:3,text:'עולם',plain:'עולם',img:'../assets/images/3/עולם.jpg'},
  {id:'g2l3w5',g:2,lv:3,text:'חלון',plain:'חלון',img:'../assets/images/3/חלון.png'},
  {id:'g2l4w1',g:2,lv:4,text:'פרפר',plain:'פרפר',img:'../assets/images/4/פרפר.jpg'},
  {id:'g2l4w2',g:2,lv:4,text:'ספרים',plain:'ספרים',img:'../assets/images/4/ספרים.jpg'},
  {id:'g2l4w3',g:2,lv:4,text:'תאומות',plain:'תאומות',img:'../assets/images/4/תאומות.png'},
  {id:'g2l4w4',g:2,lv:4,text:'מסרק',plain:'מסרק',img:'../assets/images/4/מסרק.jpg'},
  {id:'g2l4w5',g:2,lv:4,text:'צבעים',plain:'צבעים',img:'../assets/images/4/צבעים.jpg'},
  {id:'g2l5w1',g:2,lv:5,text:'ארנבת',plain:'ארנבת',img:'../assets/images/5/ארנבת.jpg'},
  {id:'g2l5w2',g:2,lv:5,text:'אוזניות',plain:'אוזניות',img:'../assets/images/5/אוזניות.jpg'},
  {id:'g2l5w3',g:2,lv:5,text:'נעליים',plain:'נעליים',img:'../assets/images/5/נעליים.jpg'},
  {id:'g2l5w4',g:2,lv:5,text:'מטבעות',plain:'מטבעות',img:'../assets/images/5/מטבעות.jpg'},
  {id:'g2l5w5',g:2,lv:5,text:'סביבונים',plain:'סביבונים',img:'../assets/images/5/סביבונים.png'},
  {id:'g2l6w1',g:2,lv:6,text:'טרמפולינה',plain:'טרמפולינה',img:'../assets/images/6/טרמפולינה.jpg'},
  {id:'g2l6w2',g:2,lv:6,text:'משקפיים',plain:'משקפיים',img:'../assets/images/6/משקפיים.jpg'},
  {id:'g2l6w3',g:2,lv:6,text:'ברווזונים',plain:'ברווזונים',img:'../assets/images/6/ברווזונים.jpg'},
  {id:'g2l6w4',g:2,lv:6,text:'עגבניות',plain:'עגבניות',img:'../assets/images/6/עגבניות.jpg'},
  {id:'g2l6w5',g:2,lv:6,text:'ירושלים',plain:'ירושלים',img:'../assets/images/6/ירושלים.jpeg'},
  {id:'g2l7w1',g:2,lv:7,text:'צפרדעים',plain:'צפרדעים',img:'../assets/images/7/צפרדעים.png'},
  {id:'g2l7w2',g:2,lv:7,text:'גרביונים',plain:'גרביונים',img:'../assets/images/7/גרביונים.png'},
  {id:'g2l7w3',g:2,lv:7,text:'סופגניות',plain:'סופגניות',img:'../assets/images/7/סופגניות.jpg'},
  {id:'g2l7w4',g:2,lv:7,text:'קורקינטים',plain:'קורקינטים',img:'../assets/images/7/קורקינטים.png'},
  {id:'g2l7w5',g:2,lv:7,text:'קונדיטוריה',plain:'קונדיטוריה',img:'../assets/images/7/קונדיטוריה.jpg'},
];

/* Default nikud table configs for game 4 (5 levels) */
const NIKUD_TABLES=[
  {lv:1,consonants:['ב','כ','פ'],nikud:[{s:'\u05B8',n:'קמץ'},{s:'\u05B7',n:'פתח'},{s:'\u05B4',n:'חיריק'}],
   grid:[['\u05BC\u05B8','בַ','בִ'],['כָ','\u05BC\u05B7','כִ'],['פָ','פַ','\u05BC\u05B4']],
   /* which cells are pre-filled (row,col)=true */
   pre:{},
   cards:['בַ','בִ','כָ','כִ','פָ','פַ']},
  {lv:2,consonants:['ד','ש','ת'],nikud:[{s:'\u05B5',n:'צרה'},{s:'\u05B6',n:'סגול'},{s:'\u05B0',n:'שווא'}],
   grid:[['דֵ','דֶ','דְ'],['שֵ','שֶ','\u05BC\u05B0'],['תֵ','תֶ','תְ']],pre:{},
   cards:['דֵ','דֶ','דְ','שֵ','שֶ','תֵ','תֶ','תְ']},
  {lv:3,consonants:['מ','ל','ר'],nikud:[{s:'\u05B9',n:'חולם'},{s:'\u05BB',n:'שורוק'},{s:'\u05B8',n:'קמץ'}],
   grid:[['מֹ','מֻ','מָ'],['לֹ','לֻ','לָ'],['רֹ','רֻ','רָ']],pre:{},
   cards:['מֹ','מֻ','לֹ','לֻ','לָ','רֹ','רֻ','רָ']},
  {lv:4,consonants:['נ','ג','ע'],nikud:[{s:'\u05BC',n:'דגש'},{s:'\u05B2',n:'חטף פתח'},{s:'\u05BB',n:'קובוץ'}],
   grid:[['נּ','נֲ','נֻ'],['גּ','גֲ','גֻ'],['עּ','עֲ','עֻ']],pre:{},
   cards:['נּ','נֲ','נֻ','גּ','גֲ','עּ','עֲ','עֻ']},
  {lv:5,consonants:['ה','כ','ל'],nikud:[{s:'\u05B7',n:'פתח'},{s:'\u05B4',n:'חיריק'},{s:'\u05B5',n:'צרה'}],
   grid:[['הַ','הִ','הֵ'],['כַ','כִ','כֵ'],['לַ','לִ','לֵ']],pre:{},
   cards:['הַ','הִ','כַ','כִ','לַ','לִ','לֵ']},
];

/* ═══════════════════════════════════════
   STORAGE
═══════════════════════════════════════ */
const ls={
  g:k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}},
  s:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){showToast('שגיאת שמירה — הזיכרון מלא. מחקו תמונות ישנות או השתמשו באימוג׳י במקום','error');}}
};
const getUsers=()=>ls.g('kbk_users')||[];
const saveUsers=u=>ls.s('kbk_users',u);
const getWords=g=>{const s=ls.g(`kbk_w${g}_v2`);return s&&s.length?s:g===GH?W1:W2};
const saveWords=(g,w)=>ls.s(`kbk_w${g}_v2`,w);
const getLvCount=g=>ls.g(`kbk_lc${g}`)||DEFAULT_LV[g];
const setLvCount=(g,n)=>ls.s(`kbk_lc${g}`,n);
const getProgress=(uid,g)=>{const a=ls.g('kbk_prog')||{};return(a[uid]&&a[uid][g])||{level:1,wIdx:0,qIdx:0}};
const saveProgress=(uid,g,p)=>{const a=ls.g('kbk_prog')||{};if(!a[uid])a[uid]={};a[uid][g]=p;ls.s('kbk_prog',a)};
const addScore=(uid,g,pts)=>{
  const users=getUsers();const u=users.find(x=>x.id===uid);
  if(u){u.score=(u.score||0)+pts;saveUsers(users);}
  const ga=ls.g('kbk_gs')||{};if(!ga[uid])ga[uid]={};
  ga[uid][g]=(ga[uid][g]||0)+pts;ls.s('kbk_gs',ga);
};
const getGameScore=(uid,g)=>{const a=ls.g('kbk_gs')||{};return(a[uid]&&a[uid][g])||0};
const getCompletedLvs=(uid,g)=>{const a=ls.g('kbk_cl')||{};return(a[uid]&&a[uid][g])||[]};
const markLvDone=(uid,g,lv)=>{
  const a=ls.g('kbk_cl')||{};if(!a[uid])a[uid]={};if(!a[uid][g])a[uid][g]=[];
  if(!a[uid][g].includes(lv))a[uid][g].push(lv);ls.s('kbk_cl',a);
};
const getDoneWords=(uid,g)=>{const a=ls.g('kbk_dw')||{};return(a[uid]&&a[uid][g])||[]};
const markWordDone=(uid,g,w)=>{
  const a=ls.g('kbk_dw')||{};if(!a[uid])a[uid]={};if(!a[uid][g])a[uid][g]=[];
  if(!a[uid][g].includes(w))a[uid][g].push(w);ls.s('kbk_dw',a);
};
const getCustomMath=lv=>ls.g(`kbk_mq${lv}`)||{type:'auto',questions:[]};
const saveCustomMath=(lv,d)=>ls.s(`kbk_mq${lv}`,d);

/* ═══════════════════════════════════════
   STATE
═══════════════════════════════════════ */
const S={
  user:null,game:null,level:1,wIdx:0,qIdx:0,
  carIdx:0,selGame:GH,
  nikudSel:null,nikudPlaced:{},nikudPhase:'place'
};

/* ═══════════════════════════════════════
   SCREEN MANAGER
═══════════════════════════════════════ */
const SCREENS={};
function reg(id,fn){SCREENS[id]=fn}
function go(id,data={}){
  /* Which screens belong to which page */
  const _MAP={index:['login','register'],gamesel:['gamesel'],play:['game1-inst','game1-play','game2-inst','game2-play','game3-inst','game3-play','game4-inst','game4-play'],scores:['achievements'],admin:['admin','admin-words','admin-math','admin-math','admin-levels','admin-students']};
  const _cur=document.body.dataset.page||'index';
  const _target=Object.keys(_MAP).find(pg=>_MAP[pg].includes(id));
  /* If screen belongs to current page → render locally (original logic) */
  if(!_target||_target===_cur){
    document.querySelectorAll('.scr').forEach(s=>{s.classList.remove('on');s.remove()});
    const div=document.createElement('div');
    div.className='scr on';div.id='s-'+id;
    document.getElementById('app').appendChild(div);
    if(SCREENS[id])SCREENS[id](div,data);
    return;
  }
  /* Otherwise → navigate to the correct HTML page with query parameters */
  const R=_cur==='index';
  const P=R?'pages/':'';const B=R?'':'../';
  const p=new URLSearchParams();
  let dest;
  if(_target==='index'){dest=B+'index.html';}
  else if(_target==='gamesel'){dest=P+'gamesel.html';if(data.selGame)p.set('sel',data.selGame);}
  else if(_target==='play'){
    dest=P+'play.html';
    const gn=id.match(/game(\d)/);if(gn)p.set('game',gn[1]);
    if(data.lv)p.set('level',data.lv);
  }
  else if(_target==='scores'){dest=P+'scores.html';}
  else if(_target==='admin'){dest=P+'admin.html';}
  else return;
  const q=p.toString();
  location.href=dest+(q?'?'+q:'');
}
function showModal(html){
  document.getElementById('modal-box').innerHTML=html;
  document.getElementById('modal-ov').classList.remove('hid');
}
function closeModal(){document.getElementById('modal-ov').classList.add('hid')}
/* Session & URL helpers */
function saveSession(u){localStorage.setItem('kbk_session',JSON.stringify(u));S.user=u;}
function loadSession(){try{const u=JSON.parse(localStorage.getItem('kbk_session'));if(u){S.user=u;return true;}}catch(e){}return false;}
function clearSession(){localStorage.removeItem('kbk_session');S.user=null;}
function getParam(k){return new URLSearchParams(location.search).get(k);}


/* ═══════════════════════════════════════
   BACKGROUND CANVAS
═══════════════════════════════════════ */
(function initBG(){
  const c=document.getElementById('bg');
  const ctx=c.getContext('2d');
  let W,H;
  const stars=[];
  function resize(){W=c.width=innerWidth;H=c.height=innerHeight}
  resize();window.addEventListener('resize',resize);
  for(let i=0;i<220;i++)stars.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,
    r:Math.random()*1.7+.3,a:Math.random(),sp:Math.random()*.009+.003,ph:Math.random()*Math.PI*2});
  function draw(t){
    ctx.fillStyle='#010812';ctx.fillRect(0,0,W,H);
    stars.forEach(s=>{
      const b=.3+.7*(.5+.5*Math.sin(t*.001*s.sp*1000+s.ph));
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(200,220,255,${b*s.a})`;ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

/* ═══════════════════════════════════════
   AUDIO
═══════════════════════════════════════ */
function speak(txt){
  if(!window.speechSynthesis)return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(txt);
  u.lang='he-IL';u.rate=0.85;u.pitch=1.1;
  speechSynthesis.speak(u);
}
const _SFX={};
const _SFX_BASE=location.pathname.includes('/pages/')?'../assets/sounds/':'assets/sounds/';
['instructions','correct','wrong','word-done','level-done'].forEach(n=>{
  const a=new Audio(_SFX_BASE+n+'.mp3');
  a.preload='auto';a.load();
  _SFX[n]=a;
});
function playSound(name,vol=0.6){
  try{
    let a=_SFX[name];
    if(!a){a=new Audio(_SFX_BASE+name+'.mp3');_SFX[name]=a;}
    a.currentTime=0;a.volume=vol;a.play().catch(()=>{});
  }catch(e){}
}
const _MASCOT_BASE=location.pathname.includes('/pages/')?'../assets/character/':'assets/character/';
function mascotHTML(name,pos,size,mobileName){
  if(mobileName){
    return `<picture><source media="(max-width:480px)" srcset="${_MASCOT_BASE}${mobileName}.png"><img class="mascot mascot-${pos} mascot-${size}" src="${_MASCOT_BASE}${name}.png" alt="" aria-hidden="true"></picture>`;
  }
  return `<img class="mascot mascot-${pos} mascot-${size}" src="${_MASCOT_BASE}${name}.png" alt="" aria-hidden="true">`;
}

/* ═══════════════════════════════════════
   HEBREW UTILS
═══════════════════════════════════════ */
function splitNikud(w){
  const nik=/[\u05B0-\u05C7]/;const out=[];let cur='';
  for(const c of[...w]){if(nik.test(c))cur+=c;else{if(cur)out.push(cur);cur=c;}}
  if(cur)out.push(cur);return out.filter(s=>s.trim());
}
function splitPlain(w){return[...w].filter(c=>/[\u05D0-\u05EA]/.test(c))}
function stripNikud(s){return s.replace(/[\u05B0-\u05C7]/g,'')}
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b}

function nikudDistractors(correct,n=6){
  const baseLetter=correct.replace(/[\u05B0-\u05C7]/g,'');
  const shinDot=correct.includes('\u05C1')?'\u05C1':correct.includes('\u05C2')?'\u05C2':'';

  // Only SINGLE unambiguous nikud marks — guarantees visual uniqueness
  const nikudPool=[
    '\u05B0',// sheva
    '\u05B1',// hataf-segol
    '\u05B2',// hataf-patah
    '\u05B3',// hataf-kamatz
    '\u05B4',// hiriq
    '\u05B5',// tsere
    '\u05B6',// segol
    '\u05B7',// patah
    '\u05B8',// kamatz
    '\u05B9',// holam
    '\u05BB',// kubutz
  ];

  // Extract ALL vowel marks from correct to exclude them (avoid visual duplicates)
  const correctVowels=new Set(correct.replace(/[^\u05B0-\u05BB]/g,''));

  const pool=shuffle(nikudPool.filter(nk=>!correctVowels.has(nk)));
  const out=[];
  for(const nk of pool){
    if(out.length>=n)break;
    const candidate=baseLetter+nk+shinDot;
    out.push(candidate);
  }
  return out;
}
function letterDistractors(correct,used,n=6){
  const pool=HEB.filter(l=>l!==correct&&!used.includes(l));
  return shuffle(pool).slice(0,n);
}
function mathDistractors(ans,n=6){
  const out=[];let att=0;
  while(out.length<n&&att<100){att++;
    const v=Math.max(0,ans+Math.floor(Math.random()*17)-8);
    if(v!==ans&&!out.includes(v))out.push(v);
  }
  return out;
}
function genMathQ(level){
  const max=Math.min(10+level*8,100);
  const sub=level>=3&&Math.random()>.5;
  let a,b,ans;
  if(sub){a=Math.floor(Math.random()*max)+1;b=Math.floor(Math.random()*a);ans=a-b;}
  else{a=Math.floor(Math.random()*max);b=Math.floor(Math.random()*(max-a));ans=a+b;}
  return{display:`${a}${sub?'-':'+'}${b}=`,answer:ans};
}

/* ═══════════════════════════════════════
   FX
═══════════════════════════════════════ */
function sparkle(x,y,col='#FFD700'){
  const fx=document.getElementById('fx');
  for(let i=0;i<10;i++){
    const p=document.createElement('div');p.className='sparkle';
    const ang=(i/10)*Math.PI*2,d=40+Math.random()*40;
    p.style.cssText=`left:${x}px;top:${y}px;width:${6+Math.random()*7}px;height:${6+Math.random()*7}px;background:${col};--dx:${Math.cos(ang)*d}px;--dy:${Math.sin(ang)*d}px;animation-duration:${.4+Math.random()*.3}s`;
    fx.appendChild(p);setTimeout(()=>p.remove(),800);
  }
}
function dustFX(x,y){
  const fx=document.getElementById('fx');
  for(let i=0;i<8;i++){
    const p=document.createElement('div');p.className='dust';
    p.style.cssText=`left:${x}px;top:${y}px;--dx:${(Math.random()-.5)*80}px;--dy:${Math.random()*60+10}px`;
    fx.appendChild(p);setTimeout(()=>p.remove(),800);
  }
}

/* ═══════════════════════════════════════
   PUZZLE TROPHY BUILDER
═══════════════════════════════════════ */
// 7-piece trophy puzzle layout (positions as % of 110x130 container)
// Shape: handles + bowl + neck + base
const PIECE_LAYOUT_7=[
  {l:20,t:0,w:60,h:18},   // 1: top-crown
  {l:0, t:14,w:20,h:35},  // 2: left handle
  {l:80,t:14,w:20,h:35},  // 3: right handle
  {l:15,t:18,w:30,h:32},  // 4: left bowl
  {l:55,t:18,w:30,h:32},  // 5: right bowl
  {l:30,t:53,w:40,h:18},  // 6: neck
  {l:15,t:72,w:70,h:20},  // 7: base
];
const PIECE_LAYOUT_5=[
  {l:15,t:0,w:70,h:22},
  {l:5,t:18,w:90,h:35},
  {l:5,t:18,w:42,h:35},
  {l:53,t:18,w:42,h:35},
  {l:22,t:56,w:56,h:36},
];
function buildPuzzleHTML(gameType,earnedPieces){
  const col=TCOL[gameType];
  const maxP=gameType===GN?5:7;
  const layout=maxP===7?PIECE_LAYOUT_7:PIECE_LAYOUT_5;
  const countE=earnedPieces.filter(p=>p<=maxP).length;
  const complete=countE>=maxP;
  let h=`<div class="cup-puzzle">`;
  layout.forEach((_,i)=>{
    const pn=i+1;
    const e=earnedPieces.includes(pn);
    const pos=layout[i];
    h+=`<div class="cp ${e?'earned':'missing'}" style="left:${pos.l}%;top:${pos.t}%;width:${pos.w}%;height:${pos.h}%;background:${e?col:'#334'};border:2px solid ${e?'rgba(255,255,255,.4)':'rgba(100,120,160,.15)'};box-shadow:${e?`inset 0 1px 3px rgba(255,255,255,.35),0 0 8px ${col}55`:''};"></div>`;
  });
  if(complete)h+=`<div class="cp-complete-icon">🏆</div>`;
  h+='</div>';
  return h;
}
function getEarned(uid,g){
  const done=getCompletedLvs(uid,g);
  const max=g===GN?5:7;
  return done.filter(l=>l<=max);
}

/* ═══════════════════════════════════════
   SHARED MODALS
═══════════════════════════════════════ */
function showWordModal({word,points,onNext}){
  playSound('word-done');
  showModal(`
    <div class="m-title">✨ כל הכבוד! ✨</div>
    <div class="m-sub">המילה היא: <strong>${word}</strong></div>
    <div class="m-reward"><span class="m-pts">+${points} נק'</span></div>
    <div class="m-btns">
      <button class="btn btn-navy btn-lg" id="m-next">למילה הבאה ➜</button>
    </div>`);
  document.getElementById('m-next').onclick=()=>{closeModal();onNext();};
}
function showLevelModal({word,points,gameType,level,earnedPieces,onNext,onBack}){
  playSound('level-done');
  const maxP=gameType===GN?5:7;
  const isReward=level<=maxP;
  const puzzleHTML=isReward?buildPuzzleHTML(gameType,earnedPieces):'';
  const pieceLabel=isReward?`<div style="font-size:14px;color:rgba(10,30,100,.7);margin-top:4px;">חתיכת פאזל ${earnedPieces.length}/${maxP}</div>`:'';
  const lastLabel=gameType===GM?'התרגיל האחרון':'המילה האחרונה';
  const subHTML=gameType===GN?'':`<div class="m-sub">${lastLabel}: <strong>${word}</strong></div>`;
  showModal(`
    <div class="m-title">🌟 השלמת שלב ${level}! 🌟</div>
    ${subHTML}
    <div class="m-reward">
      ${puzzleHTML}
      <div>
        <span class="m-pts">+${points} נק'</span>
        ${pieceLabel}
      </div>
    </div>
    <div class="m-btns">
      <button class="btn btn-navy" id="m-back">חזרה</button>
      <button class="btn btn-navy btn-lg" id="m-next">לשלב הבא ➜</button>
    </div>`);
  document.getElementById('m-next').onclick=()=>{closeModal();onNext();};
  document.getElementById('m-back').onclick=()=>{closeModal();onBack();};
}

/* ═══════════════════════════════════════
   SHARED STAR SPAWNER (games 1-3)
═══════════════════════════════════════ */
function spawnGameStars(areaId, items, onClick, labelStyle){
  const area=document.getElementById(areaId);
  if(!area)return;
  area.innerHTML='';
  if(!items.length)return;
  const aW=area.offsetWidth||window.innerWidth-20;
  const aH=area.offsetHeight||200;
  const w=window.innerWidth;
  const starW=w<=480?82:(w<=768?90:100);
  const starH=starW;
  const margin=4;
  const bottomPad=w<=480?30:(w<=768?70:90);
  const animVars=['anim0','anim1','anim2','anim3'];
  // Decide whether to wrap to two rows: only when one row would overlap and there is vertical room
  const oneRowSpacing=items.length>1?(aW-2*margin-starW)/(items.length-1):aW;
  const usableY=Math.max(60,aH-bottomPad-10);
  const useTwoRows=oneRowSpacing<starW&&usableY>=starH*2+15;
  if(useTwoRows){
    const row0Count=Math.ceil(items.length/2);
    const row1Count=items.length-row0Count;
    const halfY=usableY/2;
    const r0Min=10,r0Range=Math.max(5,halfY-starH-r0Min-5);
    const r1Min=halfY+5,r1Range=Math.max(5,usableY-starH-r1Min);
    // Sub-band Y assignment per row so stars fill the row band evenly
    const r0YIdx=shuffle(Array.from({length:row0Count},(_,k)=>k));
    const r1YIdx=shuffle(Array.from({length:row1Count},(_,k)=>k));
    items.forEach((item,i)=>{
      const r=i<row0Count?0:1;
      const c=i<row0Count?i:i-row0Count;
      const cnt=r===0?row0Count:row1Count;
      const sp=cnt>1?(aW-2*margin-starW)/(cnt-1):0;
      const xJ=(Math.random()-0.5)*Math.min(10,sp*0.12);
      const left=Math.min(Math.max(margin,margin+c*sp+xJ),aW-starW-margin);
      const subIdx=r===0?r0YIdx[c]:r1YIdx[c];
      const subBandH=(r===0?r0Range:r1Range)/Math.max(1,cnt);
      const yBase=r===0?r0Min:r1Min;
      const top=yBase+subIdx*subBandH+Math.random()*subBandH*0.6;
      const star=document.createElement('div');
      star.className=`gstar ${animVars[i%4]}`;
      const delay=i*.08+Math.random()*.05;
      star.style.cssText=`left:${left}px;top:${top}px;animation-delay:${delay}s`;
      const hasFinal=/[ףךץן]/.test(item.label);
      star.innerHTML=`<div class="ss"></div><div class="sl${hasFinal?' sl-final':''}"${labelStyle?' style="'+labelStyle+'"':''}>${item.label}</div>`;
      setTimeout(()=>{if(star.isConnected&&!star.classList.contains('correct')&&!star.classList.contains('wrong'))star.classList.add('floating');},delay*1000+750);
      star.onclick=()=>onClick(star,item);
      area.appendChild(star);
    });
    return;
  }
  // Single-row scatter with sub-band Y so stars always fill the play-area top-to-bottom
  const usableW=Math.max(aW-starW,aW*0.7);
  const yMax=Math.max(60,aH-starH-bottomPad);
  const spacing=usableW/items.length;
  const xOffset=Math.round((aW-usableW)/2);
  const yIdx=shuffle(Array.from({length:items.length},(_,k)=>k));
  const yBandH=yMax/items.length;
  items.forEach((item,i)=>{
    const star=document.createElement('div');
    star.className=`gstar ${animVars[i%4]}`;
    const delay=i*.08+Math.random()*.05;
    const naturalLeft=xOffset+spacing*i+spacing*.08+Math.random()*8;
    const left=Math.min(naturalLeft,aW-starW-4);
    const top=10+yIdx[i]*yBandH+Math.random()*Math.min(yBandH*0.7,18);
    star.style.cssText=`left:${left}px;top:${top}px;animation-delay:${delay}s`;
    const hasFinal=/[ףךץן]/.test(item.label);
    star.innerHTML=`<div class="ss"></div><div class="sl${hasFinal?' sl-final':''}"${labelStyle?' style="'+labelStyle+'"':''}>${item.label}</div>`;
    setTimeout(()=>{if(star.isConnected&&!star.classList.contains('correct')&&!star.classList.contains('wrong'))star.classList.add('floating');},delay*1000+750);
    star.onclick=()=>onClick(star,item);
    area.appendChild(star);
  });
}
