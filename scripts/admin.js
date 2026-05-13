/* ═══════════════════════════════════════
   WIKTIONARY LOOKUP
═══════════════════════════════════════ */
async function checkWiktionary(word){
  const plain=stripNikud(word);
  try{
    const r=await fetch(`https://he.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(plain)}&format=json&origin=*`);
    const d=await r.json();
    return!d.query.pages['-1'];
  }catch{return true;}// אם ה-API לא זמין, לא חוסמים
}
async function checkWiktionaryBatch(words){
  const plains=[...new Set(words.map(w=>stripNikud(w)))];
  const titles=plains.map(encodeURIComponent).join('|');
  try{
    const r=await fetch(`https://he.wiktionary.org/w/api.php?action=query&titles=${titles}&format=json&origin=*`);
    const d=await r.json();
    const missing=new Set();
    Object.values(d.query.pages).forEach(p=>{if(p.missing!==undefined)missing.add(p.title);});
    return words.filter(w=>missing.has(stripNikud(w)));
  }catch{return[];}
}

/* ═══════════════════════════════════════
   ADMIN HOME
═══════════════════════════════════════ */
reg('admin',el=>{
  if(!S.user){go('login');return;}
  el.innerHTML=`
    <div class="card admin-card">
      <h2>👑 המשחקים שלנו</h2>
      <div class="amenu">
        <button class="amenu-btn" id="a-words1">📝 הוסף מילים — שמע וניקוד</button>
        <button class="amenu-btn" id="a-words2">🖼️ הוסף מילים — תמונה וזיהוי</button>
        <button class="amenu-btn" id="a-math">⚡ הגדר שאלות חשבון</button>
        <button class="amenu-btn" id="a-lvs">⭐ נהל שלבים</button>
        <button class="amenu-btn" id="a-students">👥 מעקב אחר תלמידים</button>
        <button class="amenu-btn" style="background:#2D1B6B;" id="a-logout">יציאה</button>
      </div>
    </div>`;

  document.getElementById('a-words1').onclick=()=>go('admin-words',{g:GH});
  document.getElementById('a-words2').onclick=()=>go('admin-words',{g:GI});
  document.getElementById('a-math').onclick=()=>go('admin-math');
  document.getElementById('a-lvs').onclick=()=>go('admin-levels');
  document.getElementById('a-students').onclick=()=>go('admin-students');
  document.getElementById('a-logout').onclick=()=>{clearSession();go('login');};
});

/* ═══════════════════════════════════════
   ADMIN: WORDS MANAGEMENT
═══════════════════════════════════════ */
reg('admin-words',(el,d)=>{
  const g=d.g||GH;
  let lvFilter=1;

  function renderWords(){
    const words=getWords(g).filter(w=>w.lv===lvFilter);
    if(!words.length)return'<div style="color:rgba(10,30,100,.4);font-size:14px;padding:10px;">אין מילים לשלב זה</div>';
    return words.map(w=>{
      let imgDisplay='';
      if(w.img){
        if(w.img.startsWith('data:')){
          const name=w.imgName||'תמונה';
          imgDisplay=`<span style="display:inline-flex;align-items:center;gap:6px;vertical-align:middle;">
            <img src="${w.img}" style="width:36px;height:36px;border-radius:8px;object-fit:cover;border:1.5px solid rgba(79,195,247,.4);" alt="${name}"/>
            <span style="font-size:12px;color:rgba(10,30,100,.5);">${name}</span>
          </span>`;
        } else {
          imgDisplay=`<span style="font-size:20px;">${w.img}</span>`;
        }
      }
      return`
      <div class="wi">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="wt">${w.text}</span><span class="wp">(${w.plain})</span>
          ${imgDisplay}
        </div>
        <button class="del-btn" data-id="${w.id}">✕</button>
      </div>`;
    }).join('');
  }

  function renderLvTabs(){
    const lc=getLvCount(g);
    const words=getWords(g);
    let h='';for(let i=1;i<=lc;i++){
      const empty=words.filter(w=>w.lv===i).length===0;
      h+=`<button class="tab${i===lvFilter?' active':''}${empty?' tab-empty':''}" data-lv="${i}">שלב ${i}${empty?' ⚠':''}</button>`;
    }
    return h;
  }
  function renderEmptyWarning(){
    const lc=getLvCount(g);const words=getWords(g);
    const empty=[];for(let i=1;i<=lc;i++){if(words.filter(w=>w.lv===i).length===0)empty.push(i);}
    if(!empty.length)return'';
    const last=Math.max(...empty);
    const blocked=[];for(let i=last+1;i<=lc;i++){if(words.filter(w=>w.lv===i).length>0)blocked.push(i);}
    if(!blocked.length)return'';
    return`<div style="background:rgba(255,150,0,.12);border:1px solid rgba(255,150,0,.3);border-radius:10px;padding:8px 12px;margin-bottom:10px;font-size:13px;color:#7a4a00;">
      ⚠️ שלבים: ${empty.join(', ')} ריקים — השחקן לא יוכל להגיע לשלב ${blocked[0]}${blocked.length>1?' ואילך':''} עד שיתווסף להם תוכן
    </div>`;
  }

  let _uploadedImg=null;
  function render(){
    el.innerHTML=`
      <div class="card mgmt-card">
        <h2>${g===GH?'📝 שמע וניקוד':'🖼️ תמונה וזיהוי'} — ניהול מילים</h2>
        ${renderEmptyWarning()}
        <div class="game-tabs" id="lv-tabs">${renderLvTabs()}</div>
        <div style="font-size:13px;color:rgba(10,30,100,.55);margin-bottom:6px;">📋  בשלב ${lvFilter}: ${getWords(g).filter(w=>w.lv===lvFilter).length} מילים </div>
        <div class="add-row">
          <input class="word-inp" id="new-word" placeholder="${g===GH?'מילה עם ניקוד...':'מילה...'}"/>
          ${g===GI?'<input class="word-inp" style="max-width:60px;font-size:24px;" id="new-img" placeholder="🖼"/>':''}
          ${g===GH?'<button class="btn btn-sm" style="background:rgba(10,30,80,.12);color:var(--navy);padding:6px 10px;" id="hear-btn">🔊</button>':''}
          <button class="btn btn-navy btn-sm" id="add-btn">הוסף</button>
        </div>
        ${g===GI?`<div class="img-upload" id="img-upload">📁 העלה תמונה (לחץ כאן)<input type="file" id="img-file" accept="image/*" style="display:none"/></div>`:''}
        <div class="word-list" id="word-list">${renderWords()}</div>
        ${g===GH?`<div class="bulk-area">
          <h4 style="font-size:15px;color:var(--navy);margin-bottom:6px;">הוספה מרובה:</h4>
          <p style="font-size:13px;color:rgba(10,30,100,.55);margin-bottom:4px;">💡 יש לוודא שהמילים מנוקדות כראוי — הניקוד ישמש ללימוד התלמידים</p>

          <p style="font-size:12px;color:rgba(10,30,100,.4);margin-bottom:8px;">המילים שכבר קיימות במשחק לא יתווספו</p>
          <div style="font-size:12px;color:rgba(10,30,100,.45);background:rgba(10,30,80,.05);padding:6px 10px;border-radius:8px;margin-bottom:8px;direction:rtl;">דוגמה: <span style="font-weight:700;">הוֹרִים יְלָדִים תִּינוֹק סַבָּא</span></div>
          <textarea class="bulk-ta" id="bulk-ta" placeholder="הכניסי מילים מנוקדות מופרדות ברווח או בשורה חדשה"></textarea>
          <button class="btn btn-navy btn-sm" id="bulk-btn">עבד ושמור הכל</button>
        </div>`:'<div style="padding:8px 0;font-size:13px;color:rgba(10,30,100,.5);">⚠️ למשחק התמונות — ניתן להוסיף מילה אחת בכל פעם (כל מילה מקושרת לתמונה נפרדת)</div>'}
        <div style="margin-top:14px;display:flex;gap:10px;">
          <button class="btn btn-navy btn-sm" id="back-btn">◄ חזרה</button>
        </div>
      </div>`;

    document.getElementById('back-btn').onclick=()=>go('admin');

    document.getElementById('lv-tabs').querySelectorAll('.tab').forEach(t=>{
      t.onclick=()=>{lvFilter=parseInt(t.dataset.lv);render();};
    });

    document.getElementById('add-btn').onclick=async()=>{
      const txt=document.getElementById('new-word').value.trim().replace(/^[^א-ת\u05B0-\u05C7]+|[^א-ת\u05B0-\u05C7'׳״]+$/g,'');
      if(!txt)return;
      if(g===GI){
        const emojiVal=document.getElementById('new-img')?.value.trim()||null;
        const img=_uploadedImg||emojiVal;
        if(!img){showToast('יש להזין אימוג׳י או להעלות תמונה','warn');return;}
        const words=getWords(g);
        if(words.some(w=>w.plain===txt)){showToast('המילה כבר קיימת במאגר','warn');return;}
        words.push({id:'w'+Date.now(),g,lv:lvFilter,text:txt,plain:txt,img});
        saveWords(g,words);document.getElementById('new-word').value='';_uploadedImg=null;render();
        return;
      }
      if(!/[\u05B0-\u05C7]/.test(txt)){showToast('יש להזין מילה מנוקדת','warn');return;}
      const words=getWords(g);
      const plain=stripNikud(txt);
      if(words.some(w=>w.plain===plain)){showToast('המילה כבר קיימת במאגר','warn');return;}
      function doAdd(){words.push({id:'w'+Date.now(),g,lv:lvFilter,text:txt,plain,img:null});saveWords(g,words);document.getElementById('new-word').value='';render();}
      const found=await checkWiktionary(txt);
      if(!found){
        showModal(`<div style="text-align:center;padding:12px;">
          <p style="margin-bottom:14px;">המילה <strong>"${plain}"</strong> לא נמצאה בוויקימילון.<br>להוסיף בכל זאת?</p>
          <div style="display:flex;gap:10px;justify-content:center;">
            <button class="btn btn-navy btn-sm" id="md-yes">כן, הוסיפי</button>
            <button class="btn btn-sm" style="background:rgba(10,30,80,.15);color:var(--navy);" id="md-no">ביטול</button>
          </div></div>`);
        document.getElementById('md-yes').onclick=()=>{doAdd();closeModal();};
        document.getElementById('md-no').onclick=()=>closeModal();
        return;
      }
      doAdd();
    };
    if(g===GH){
      const hearBtn=document.getElementById('hear-btn');
      if(hearBtn)hearBtn.onclick=()=>{const t=document.getElementById('new-word').value.trim();if(t)speak(t);};
    }

      /* ============================================
      * נושא חדש שנלמד באופן עצמאי (NEW TOPIC)
      * ============================================
      * FileReader API - File API
      * מקור למידה: MDN Web Docs + W3Schools
      *
      * בעיה שנפתרה:
      * ללא FileReader,
      *  המנהל היה צריך להעלות תמונה ללא אפשרות לראות תצוגה מקדימה.
      *  רק אחרי שמירה והכנסה למשחק היה יכול לגלות אם בחר את התמונה הנכונה.
      *
      * הפתרון:
      * FileReader קורא את הקובץ ומציג תצוגה מקדימה מיידית,
      * מאפשר למנהל לאמת את התמונה לפני השמירה וחוסך זמן וטעויות.
      *
      * מיקום בקוד: admin.js
      * ============================================ */
    if(g===GI){
      const uploadEl=document.getElementById('img-upload');
      uploadEl.onclick=()=>document.getElementById('img-file').click();
      function onFileChange(e){
        const f=e.target.files[0];if(!f)return;
        const reader=new FileReader();
        reader.onload=ev=>{
          _uploadedImg=ev.target.result;
          uploadEl.textContent='';
          uploadEl.appendChild(document.createTextNode('✅ תמונה נבחרה: '+f.name+' '));
          const inp=document.createElement('input');inp.type='file';inp.id='img-file';inp.accept='image/*';inp.style.display='none';
          uploadEl.appendChild(inp);
          inp.onchange=onFileChange;
        };
        reader.readAsDataURL(f);
      }
      document.getElementById('img-file').onchange=onFileChange;
    }

    document.getElementById('word-list').querySelectorAll('.del-btn').forEach(btn=>{
      btn.onclick=()=>{
        const words=getWords(g).filter(w=>w.id!==btn.dataset.id);
        saveWords(g,words);render();
      };
    });

    if(g===GH){
      const bulkBtn=document.getElementById('bulk-btn');
      if(bulkBtn)bulkBtn.onclick=async()=>{
        const txt=document.getElementById('bulk-ta').value;
        if(!txt.trim())return;
        const words=getWords(g);
        const existing=new Set(words.map(w=>w.plain));
        const newWords=txt.split(/[\s,،;:\n]+/).map(w=>w.replace(/^[^א-ת\u05B0-\u05C7]+|[^א-ת\u05B0-\u05C7'׳״]+$/g,'')).filter(w=>/[\u05D0-\u05EA]/.test(w));
        const withNikud=newWords.filter(w=>/[\u05B0-\u05C7]/.test(w));
        const withoutNikud=newWords.filter(w=>!/[\u05B0-\u05C7]/.test(w));
        let unique=[...new Set(withNikud)].filter(w=>!existing.has(stripNikud(w)));
        const MAX_BULK=25;
        let trimmed=false;
        if(unique.length>MAX_BULK){unique=unique.slice(0,MAX_BULK);trimmed=true;}
        if(!unique.length){
          document.getElementById('bulk-ta').value=withoutNikud.join(' ');
          let msg=withoutNikud.length>0?`${withoutNikud.length} מילים ללא ניקוד — לא נוספו`:'כל המילים כבר קיימות במאגר';
          showToast(msg,'warn');return;
        }
        function addList(list){list.forEach(w=>{words.push({id:'w'+Date.now()+Math.random(),g,lv:lvFilter,text:w,plain:stripNikud(w),img:null});});saveWords(g,words);}
        const notFound=await checkWiktionaryBatch(unique);
        const found=unique.filter(w=>!notFound.includes(w));
        if(notFound.length>0){
          if(found.length>0)addList(found);
          const leftover=[...withoutNikud,...notFound];
          document.getElementById('bulk-ta').value=leftover.join(' ');
          showModal(`<div style="text-align:center;padding:12px;">
            ${found.length>0?`<p>נוספו <strong>${found.length}</strong> מילים.</p>`:''}
            <p style="margin:10px 0;"><strong>${notFound.length}</strong> מילים לא נמצאו בוויקימילון:<br><span style="color:var(--navy);font-weight:700;">${notFound.map(stripNikud).join(', ')}</span></p>
            ${withoutNikud.length>0?`<p style="font-size:13px;color:rgba(10,30,80,.5);">${withoutNikud.length} מילים ללא ניקוד — לא נוספו</p>`:''}
            ${trimmed?`<p style="font-size:13px;color:#E65100;">ניתן להכניס עד ${MAX_BULK} מילים בכל פעם</p>`:''}
            <div style="display:flex;gap:10px;justify-content:center;margin-top:14px;">
              <button class="btn btn-navy btn-sm" id="md-yes">הוסיפי גם אותן</button>
              <button class="btn btn-sm" style="background:rgba(10,30,80,.15);color:var(--navy);" id="md-no">דלגי עליהן</button>
            </div></div>`);
          document.getElementById('md-yes').onclick=()=>{addList(notFound);document.getElementById('bulk-ta').value=withoutNikud.join(' ');closeModal();render();};
          document.getElementById('md-no').onclick=()=>{closeModal();render();};
        } else {
          addList(found);
          document.getElementById('bulk-ta').value=withoutNikud.join(' ');
          let msg=`נוספו ${found.length} מילים חדשות`;
          if(withoutNikud.length>0)msg+=`, ${withoutNikud.length} מילים ללא ניקוד — לא נוספו`;
          if(trimmed)msg+=` (ניתן להכניס עד ${MAX_BULK} מילים בכל פעם)`;
          showToast(msg,'ok');render();
        }
      };
    }
  }
  render();
});

/* ═══════════════════════════════════════
   ADMIN: MATH MANAGEMENT
═══════════════════════════════════════ */
reg('admin-math',el=>{
  let lvSel=1;
  function render(){
    const cfg=getCustomMath(lvSel);
    const lc=getLvCount(GM);
    let tabs='';for(let i=1;i<=lc;i++)tabs+=`<button class="tab${i===lvSel?' active':''}" data-lv="${i}">שלב ${i}</button>`;
    el.innerHTML=`
      <div class="card mgmt-card">
        <h2>⚡ ניהול שאלות חשבון</h2>
        <div class="game-tabs" id="lv-tabs">${tabs}</div>
        <div class="math-opts">
          <button class="mopt${cfg.type!=='manual'?' active':''}" id="opt-auto">⚡ יצירה אוטומטית</button>
          <button class="mopt${cfg.type==='manual'?' active':''}" id="opt-manual">✏️ שאלות ידניות</button>
        </div>
        <div id="manual-area" style="${cfg.type!=='manual'?'display:none':''}">
          <div class="add-row">
            <input class="word-inp" id="qinp" placeholder="הכנס תרגיל, למשל: 5+3" style="direction:ltr;text-align:left;"/>
            <button class="btn btn-navy btn-sm" id="qadd">הוסף</button>
          </div>
          <div class="word-list" id="qlist">
            ${(cfg.questions||[]).map((q,i)=>`<div class="wi"><span class="wt" style="direction:ltr;">${q.display} <strong>${q.answer}</strong></span><button class="del-btn" data-qi="${i}">✕</button></div>`).join('')}
          </div>
        </div>
        <div style="margin-top:14px;display:flex;gap:10px;">
          <button class="btn btn-navy btn-sm" id="back-btn">◄ חזרה</button>
        </div>
      </div>`;

    document.getElementById('back-btn').onclick=()=>go('admin');
    document.getElementById('lv-tabs').querySelectorAll('.tab').forEach(t=>{
      t.onclick=()=>{lvSel=parseInt(t.dataset.lv);render();};
    });
    document.getElementById('opt-auto').onclick=()=>{
      const cfg=getCustomMath(lvSel);cfg.type='auto';saveCustomMath(lvSel,cfg);render();
    };
    document.getElementById('opt-manual').onclick=()=>{
      const cfg=getCustomMath(lvSel);cfg.type='manual';saveCustomMath(lvSel,cfg);render();
    };
    document.getElementById('qadd').onclick=()=>{
      const raw=document.getElementById('qinp').value.trim();
      if(!raw)return;
      // Parse expression: support +, -, *, /
      const m=raw.match(/^(\d+)\s*([+\-*\/])\s*(\d+)/);
      if(!m){showToast('פורמט לא תקין — דוגמה: 5+3','warn');return;}
      const a=parseInt(m[1]),op=m[2],b=parseInt(m[3]);
      if(op==='/'&&b===0){showToast('אי אפשר לחלק ב-0','warn');return;}
      let ans;
      if(op==='+')ans=a+b;else if(op==='-')ans=a-b;else if(op==='*')ans=a*b;else ans=parseFloat((a/b).toFixed(2));
      const cfg=getCustomMath(lvSel);
      if(!cfg.questions)cfg.questions=[];
      cfg.questions.push({display:`${a}${op}${b}=`,answer:ans});
      saveCustomMath(lvSel,cfg);render();
    };
    document.querySelectorAll('.del-btn[data-qi]').forEach(btn=>{
      btn.onclick=()=>{
        const cfg=getCustomMath(lvSel);
        cfg.questions.splice(parseInt(btn.dataset.qi),1);
        saveCustomMath(lvSel,cfg);render();
      };
    });
  }
  render();
});

/* ═══════════════════════════════════════
   ADMIN: LEVELS MANAGEMENT
═══════════════════════════════════════ */
reg('admin-levels',el=>{
  function render(){
    const allG=[GH,GI,GM,GN];
    let rows=allG.map(g=>{
      if(g===GN)return`
      <div class="wi" style="opacity:.7;">
        <div style="flex:1;">
          <span class="wt" style="font-size:16px;">${GICONS[g]} ${GNAMES[g]}</span>
          <span style="font-size:13px;color:rgba(10,30,100,.5);margin-right:8px;">🚧 כבר עובדים על משחקים נוספים עבורכם/ן</span>
        </div>
      </div>`;
      return`
      <div class="wi" id="lv-row-${g}">
        <div style="flex:1;">
          <span class="wt" style="font-size:16px;">${GICONS[g]} ${GNAMES[g]}</span>
          <span class="wp" id="lc-${g}">— <span id="lc-num-${g}">${getLvCount(g)}</span> שלבים</span>
        </div>
        <button class="btn btn-navy btn-sm" data-g="${g}" data-act="add">+ שלב</button>
        <button class="del-btn" data-g="${g}" data-act="rem">−</button>
      </div>`;
    }).join('');
    let warnings='';
    [GH,GI].forEach(g=>{
      const lc=getLvCount(g);
      const words=getWords(g);
      const empty=[];
      for(let i=1;i<=lc;i++){if(words.filter(w=>w.lv===i).length===0)empty.push(i);}
      if(empty.length>0){
        const last=Math.max(...empty);
        const blocked=[];for(let i=last+1;i<=lc;i++){if(words.filter(w=>w.lv===i).length>0)blocked.push(i);}
        if(blocked.length>0){
          warnings+=`<div style="background:rgba(255,150,0,.12);border:1px solid rgba(255,150,0,.3);border-radius:10px;padding:10px 14px;margin-bottom:8px;font-size:13px;color:#7a4a00;">
            ⚠️ <strong>${GNAMES[g]}</strong>: שלבים ${empty.join(', ')} ריקים — השחקן לא יוכל להגיע לשלב ${blocked[0]}${blocked.length>1?' ואילך':''} עד שיתווסף להם תוכן
          </div>`;
        }
      }
    });
    el.innerHTML=`
      <div class="card mgmt-card">
        <h2>⭐ ניהול שלבים</h2>
        ${warnings}
        <div style="display:flex;flex-direction:column;gap:8px;">${rows}</div>
        <div style="margin-top:16px;"><button class="btn btn-navy btn-sm" id="back-btn">◄ חזרה</button></div>
      </div>`;
    document.getElementById('back-btn').onclick=()=>go('admin');
    el.querySelectorAll('[data-act]').forEach(btn=>{
      btn.onclick=()=>{
        const g=parseInt(btn.dataset.g);const act=btn.dataset.act;
        let lc=getLvCount(g);
        const row=document.getElementById(`lv-row-${g}`);
        const numEl=document.getElementById(`lc-num-${g}`);
        if(act==='add'){
          if(g===GN&&lc>=NIKUD_TABLES.length){showToast('לוח צירופים מכיל '+NIKUD_TABLES.length+' שלבים בלבד','warn');return;}
          lc++;setLvCount(g,lc);
          if(numEl)numEl.textContent=lc;
          if(row){row.classList.remove('flash-blue','flash-red');void row.offsetWidth;row.classList.add('flash-blue');}
        } else if(act==='rem'&&lc>DEFAULT_LV[g]){
          lc--;setLvCount(g,lc);
          if(numEl)numEl.textContent=lc;
          if(row){row.classList.remove('flash-blue','flash-red');void row.offsetWidth;row.classList.add('flash-red');}
        } else if(act==='rem'){
          showToast('לא ניתן להסיר שלבים ברירת מחדל','warn');
        }
      };
    });
  }
  render();
});

/* ═══════════════════════════════════════
   ADMIN: STUDENTS
═══════════════════════════════════════ */
reg('admin-students',el=>{
  el.style.padding='0';
  const users=getUsers().filter(u=>u.role==='player');
  const sorted=[...users].sort((a,b)=>(b.score||0)-(a.score||0));

  let html=`
    <div class="students-wrap" style="direction:rtl;">
      <div class="stgrid-area">
        <div class="stgrid-title">👥 תלמידים</div>
        <div class="stgrid">`;

  users.forEach(u=>{
    html+=`<div class="stcard" data-uid="${u.id}">
      <div class="st-av">${u.avatar||'🌟'}</div>
      <div class="st-name">${u.name}</div>
      <div class="st-score">ניקוד: ${u.score||0}</div>
    </div>`;
  });

  html+=`</div></div>
    <div class="lb-panel">
      <h3>🏆 לוח מובילים</h3>`;

  sorted.forEach((u,i)=>{
    const medals=['🥇','🥈','🥉'];
    html+=`<div class="lb-item">
      <span class="lb-rk">${medals[i]||i+1}</span>
      <span class="lb-nm">${u.name}</span>
      <span class="lb-sc">${u.score||0}</span>
    </div>`;
  });
  html+=`</div></div>`;

  el.innerHTML=html;

  el.querySelectorAll('.stcard').forEach(card=>{
    card.onclick=()=>{
      const u=users.find(x=>x.id===card.dataset.uid);
      if(!u)return;
      const allG=[GH,GI,GM,GN];
      const bestG=allG.reduce((best,g)=>getGameScore(u.id,g)>getGameScore(u.id,best)?g:best,GH);
      const totalWords=[GH,GI].reduce((sum,g)=>sum+getDoneWords(u.id,g).length,0);
      const joinDate=u.createdAt?new Date(u.createdAt).toLocaleDateString('he-IL'):'—';

      const gameRows=allG.map(g=>{
        const prog=getProgress(u.id,g);
        const done=getCompletedLvs(u.id,g);
        const total=getLvCount(g);
        const pct=Math.round((done.length/total)*100);
        const gScore=getGameScore(u.id,g);
        return`<div class="st-game-row">
          <span class="st-game-ico">${GICONS[g]}</span>
          <span class="st-game-nm">${GNAMES[g]}</span>
          <div class="st-game-prog">
            <div class="st-pbar-wrap"><div class="st-pbar" style="width:${pct}%"></div></div>
            <span class="st-pval">${done.length}/${total} שלבים | ${gScore} נק'</span>
          </div>
        </div>`;
      }).join('');

      showModal(`
        <div class="st-modal">
          <div class="st-modal-header">
            <div class="st-modal-av">${u.avatar||'🌟'}</div>
            <div class="st-modal-info">
              <h2>${u.name}</h2>
              <div class="st-since">הצטרף: ${joinDate}</div>
              <div style="margin-top:6px;display:flex;align-items:center;gap:6px;">
                <span style="font-size:11px;color:rgba(255,255,255,.5);">סיסמה:</span>
                <span style="font-size:13px;font-weight:700;color:rgba(255,255,255,.85);background:rgba(255,255,255,.1);padding:2px 8px;border-radius:8px;letter-spacing:1px;">${u.password}</span>
              </div>
            </div>
          </div>
          <div class="st-stats-row">
            <div class="st-stat">
              <div class="sval">${u.score||0}</div>
              <div class="slbl">ניקוד כולל</div>
            </div>
            <div class="st-stat">
              <div class="sval">${totalWords}</div>
              <div class="slbl">מילים שהושלמו</div>
            </div>
            <div class="st-stat">
              <div class="sval" style="font-size:13px;line-height:1.3;">${GICONS[bestG]} ${GNAMES[bestG]}</div>
              <div class="slbl">משחק חזק</div>
            </div>
          </div>
          <div class="st-games">${gameRows}</div>
          <div class="m-btns">
            <button class="btn btn-navy" id="m-close">סגור</button>
          </div>
        </div>`);
      document.getElementById('m-close').onclick=closeModal;
    };
  });

  // Back button
  const bb=document.createElement('button');
  bb.className='back-btn';bb.textContent='◄ חזרה';
  bb.onclick=()=>go('admin');
  el.appendChild(bb);
});

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
/* init is in each HTML page */

