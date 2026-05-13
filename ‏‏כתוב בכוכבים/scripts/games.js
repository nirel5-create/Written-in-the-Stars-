/* ═══════════════════════════════════════
   GAME 1: שמע וניקוד
═══════════════════════════════════════ */
reg('game1-inst',(el,d)=>{
  const lv=d.lv||S.level;
  const words=getWords(GH).filter(w=>w.lv===lv);
  // Read from persisted progress so a newly-added level never shows stale wIdx
  const _prog1=getProgress(S.user.id,GH);
  const resumeIdx=(_prog1.level===lv)?(_prog1.wIdx??0):0;
  S.wIdx=resumeIdx; // keep S in sync
  const firstW=words[resumeIdx]||words[0];
  const isResume=resumeIdx>0;
  el.innerHTML=`
    <div class="stitle"><span class="sico">✦</span>שמע וניקוד<span class="sico">✦</span></div>
    <div class="card inst-card">
      <h3>הוראות — שלב ${lv}</h3>
      <p>תשמע מילה.<br>בחר בכל פעם את האות עם הניקוד הנכון מהכוכבים.</p>
      <div style="display:flex;justify-content:center;margin-bottom:18px;">
        <button class="listen-btn" id="prev-listen">🔊 שמע את המילה הראשונה</button>
      </div>
      ${isResume?`
      <div class="resume-box">
        <div class="resume-info">🔖 עצרת במילה <strong>${resumeIdx+1}</strong> מתוך <strong>${words.length}</strong></div>
        <div class="resume-btns">
          <button class="btn btn-navy btn-lg" id="go-resume">▶ המשך מהמקום שעצרתי</button>
          <button class="btn btn-sm" style="background:rgba(10,30,80,.15);color:var(--navy);" id="go-fresh">↺ התחל מהתחלה</button>
        </div>
      </div>`:`
      <div style="display:flex;justify-content:center;">
        <button class="btn btn-navy btn-lg" id="go-play">🎮 התחל</button>
      </div>`}
    </div>
    ${mascotHTML('NanyExplains','bmr','big')}`;
  playSound('instructions');
  document.getElementById('prev-listen').onclick=()=>{if(firstW)speak(firstW.text)};
  if(isResume){
    document.getElementById('go-resume').onclick=()=>go('game1-play',{lv});
    document.getElementById('go-fresh').onclick=()=>{S.wIdx=0;saveProgress(S.user.id,GH,{level:lv,wIdx:0});go('game1-play',{lv});};
  } else {
    document.getElementById('go-play').onclick=()=>go('game1-play',{lv});
  }
  if(firstW)setTimeout(()=>speak(firstW.text),600);
});

reg('game1-play',(el,d)=>{
  const lv=d.lv||S.level;
  const uid=S.user.id;
  const words=getWords(GH).filter(w=>w.lv===lv);
  if(!words.length){go('gamesel');return;}

  let wIdx=S.wIdx;
  if(wIdx>=words.length)wIdx=0;
  let cw,syls,sylIdx;
  let busy=false;

  el.innerHTML=`
    <div class="play-inner" id="pi">
      <div class="play-hdr">
        <div class="play-title">✦ כתוב בכוכבים</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="word-ctr" id="wctr">מילה ${wIdx+1}/${words.length}</span>
          <button class="listen-mini" id="listen-btn">🔊</button>
        </div>
      </div>
      <div class="play-area" id="play-area"></div>
      <div class="ans-wrap"><div class="ans-bar" id="ans-bar"></div></div>
    </div>
    <div class="lv-badge"><div class="lv-badge-wrap"><div class="ss"></div><span class="bn">${lv}</span></div></div>
    <button class="back-btn" id="bbtn">◄ חזרה</button>`;

  document.getElementById('bbtn').onclick=()=>{saveProgress(uid,GH,{level:lv,wIdx:S.wIdx??0});go('gamesel',{selGame:GH});};
  document.getElementById('listen-btn').onclick=()=>{if(cw)speak(cw.text)};

  function loadWord(idx){
    wIdx=idx;cw=words[wIdx];
    syls=splitNikud(cw.text);sylIdx=0;busy=false;
    S.wIdx=wIdx;
    // Only save if we are NOT replaying a completed level (don't overwrite higher progress)
    const _ep1=getProgress(uid,GH);if(_ep1.level<=lv)saveProgress(uid,GH,{level:lv,wIdx});
    const wc=document.getElementById('wctr');if(wc)wc.textContent=`מילה ${wIdx+1}/${words.length}`;
    document.getElementById('ans-bar').innerHTML='';
    speak(cw.text);
    spawnStars();
  }

  function spawnStars(){
    if(sylIdx>=syls.length)return;
    const correct=syls[sylIdx];
    const all=shuffle([...new Set([correct,...nikudDistractors(correct,6)])]);
    spawnGameStars('play-area',all.map(s=>({label:s,val:s})),(star,item)=>{
      if(busy)return;star.style.pointerEvents='none';
      const r=star.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      if(item.val===correct){
        busy=true;playSound('correct');sparkle(cx,cy,'#FFD700');star.classList.remove('floating');star.classList.add('correct');
        setTimeout(()=>{addSlot(item.val);sylIdx++;if(sylIdx>=syls.length)onWordDone();else{busy=false;spawnStars();}},500);
      }else{playSound('wrong');dustFX(cx,cy);star.classList.remove('floating');star.classList.add('wrong');setTimeout(()=>star.remove(),700);}
    });
  }

  function addSlot(syl){
    const bar=document.getElementById('ans-bar');
    const slot=document.createElement('div');slot.className='aslot';
    slot.innerHTML=`<div class="ss"></div><div class="sl">${syl}</div>`;
    bar.appendChild(slot); // RTL container: first appended = rightmost
  }

  function onWordDone(){
    markWordDone(uid,GH,cw.text);
    addScore(uid,GH,PTS_WORD);
    const nextIdx=wIdx+1;
    const isLvEnd=nextIdx>=words.length;
    if(isLvEnd){
      markLvDone(uid,GH,lv);
      addScore(uid,GH,PTS_LEVEL);
      // Save progress to next level NOW so back button doesn't reset
      const nl=lv+1;
      if(nl<=getLvCount(GH)){S.wIdx=0;S.level=nl;saveProgress(uid,GH,{level:nl,wIdx:0});}
      else{S.wIdx=0;} // last level: reset so re-entry never shows stale resume
      const earned=getEarned(uid,GH);
      showLevelModal({
        word:cw.text,points:PTS_WORD+PTS_LEVEL,gameType:GH,level:lv,earnedPieces:earned,
        onNext:()=>{
          if(nl<=getLvCount(GH)){go('game1-inst',{lv:nl});} else go('gamesel',{selGame:GH});
        },
        onBack:()=>go('gamesel',{selGame:GH})
      });
    } else {
      showWordModal({word:cw.text,points:PTS_WORD,
        onNext:()=>loadWord(nextIdx)});
    }
  }

  loadWord(wIdx);
});

/* ═══════════════════════════════════════
   GAME 2: תמונה וזיהוי
═══════════════════════════════════════ */
reg('game2-inst',(el,d)=>{
  const lv=d.lv||S.level;
  const words=getWords(GI).filter(w=>w.lv===lv);
  // Always read from persisted progress, not S.wIdx (which can be stale)
  const _prog2=getProgress(S.user.id,GI);
  const resumeIdx=(_prog2.level===lv)?(_prog2.wIdx??0):0;
  S.wIdx=resumeIdx; // sync S
  const isResume=resumeIdx>0;
  el.innerHTML=`
    <div class="stitle"><span class="sico">✦</span>תמונה וזיהוי<span class="sico">✦</span></div>
    <div class="card inst-card">
      <h3>הוראות — שלב ${lv}</h3>
      <p>תראה תמונה.<br>בחר את האותיות הנכונות מהכוכבים כדי לבנות את המילה.</p>
      ${isResume?`
      <div class="resume-box">
        <div class="resume-info">🔖 עצרת במילה <strong>${resumeIdx+1}</strong> מתוך <strong>${words.length}</strong></div>
        <div class="resume-btns">
          <button class="btn btn-navy btn-lg" id="go-resume">▶ המשך מהמקום שעצרתי</button>
          <button class="btn btn-sm" style="background:rgba(10,30,80,.15);color:var(--navy);" id="go-fresh">↺ התחל מהתחלה</button>
        </div>
      </div>`:`
      <div style="display:flex;justify-content:center;margin-top:10px;">
        <button class="btn btn-navy btn-lg" id="go-play">🎮 התחל</button>
      </div>`}
    </div>
    ${mascotHTML('NanyExplains','bmr','big')}`;
  playSound('instructions');
  if(isResume){
    document.getElementById('go-resume').onclick=()=>go('game2-play',{lv});
    document.getElementById('go-fresh').onclick=()=>{S.wIdx=0;saveProgress(S.user.id,GI,{level:lv,wIdx:0});go('game2-play',{lv});};
  } else {
    document.getElementById('go-play').onclick=()=>go('game2-play',{lv});
  }
});

reg('game2-play',(el,d)=>{
  const lv=d.lv||S.level;
  const uid=S.user.id;
  const words=getWords(GI).filter(w=>w.lv===lv);
  if(!words.length){go('gamesel');return;}
  let wIdx=S.wIdx;if(wIdx>=words.length)wIdx=0;
  let cw,letters,letIdx;let busy=false;

  el.innerHTML=`
    <div class="play-inner">
      <div class="play-hdr">
        <div class="play-title">✦ כתוב בכוכבים</div>
        <span class="word-ctr" id="wctr">מילה ${wIdx+1}/${words.length}</span>
      </div>
      <div style="display:flex;justify-content:center;flex-shrink:0;padding:2px 0 4px;">
        <div class="img-box" id="imgbox"></div>
      </div>
      <div class="play-area" id="play-area"></div>
      <div class="ans-wrap"><div class="ans-bar" id="ans-bar"></div></div>
    </div>
    <div class="lv-badge"><div class="lv-badge-wrap"><div class="ss"></div><span class="bn">${lv}</span></div></div>
    <button class="back-btn" id="bbtn">◄ חזרה</button>`;

  document.getElementById('bbtn').onclick=()=>{saveProgress(uid,GI,{level:lv,wIdx:S.wIdx??0});go('gamesel',{selGame:GI});};

  function loadWord(idx){
    wIdx=idx;cw=words[wIdx];
    letters=splitPlain(cw.plain);letIdx=0;busy=false;
    S.wIdx=wIdx;
    const _ep2=getProgress(uid,GI);if(_ep2.level<=lv)saveProgress(uid,GI,{level:lv,wIdx});
    const wc=document.getElementById('wctr');if(wc)wc.textContent=`מילה ${wIdx+1}/${words.length}`;
    const ib=document.getElementById('imgbox');
    if(cw.img&&cw.img.length<=4){ib.textContent=cw.img;ib.style.fontSize='72px';}
    else if(cw.img&&(cw.img.startsWith('data:')||/\.(png|jpe?g|gif|webp|svg)$/i.test(cw.img))){ib.innerHTML=`<img src="${cw.img}" alt="${cw.plain}"/>`;}
    else{ib.textContent='🖼️';}
    document.getElementById('ans-bar').innerHTML='';
    spawnStars();
  }

  function spawnStars(){
    if(letIdx>=letters.length)return;
    const correct=letters[letIdx];
    const all=shuffle([correct,...letterDistractors(correct,letters,6)]);
    spawnGameStars('play-area',all.map(l=>({label:l,val:l})),(star,item)=>{
      if(busy)return;star.style.pointerEvents='none';
      const r=star.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      if(item.val===correct){
        busy=true;playSound('correct');sparkle(cx,cy,'#FFD700');star.classList.remove('floating');star.classList.add('correct');
        setTimeout(()=>{addSlot(item.val);letIdx++;if(letIdx>=letters.length)onWordDone();else{busy=false;spawnStars();}},500);
      }else{playSound('wrong');dustFX(cx,cy);star.classList.remove('floating');star.classList.add('wrong');setTimeout(()=>star.remove(),700);}
    });
  }

  function addSlot(lt){
    const bar=document.getElementById('ans-bar');
    const slot=document.createElement('div');slot.className='aslot';
    slot.innerHTML=`<div class="ss"></div><div class="sl">${lt}</div>`;
    bar.appendChild(slot); // RTL container: first appended = rightmost
  }

  function onWordDone(){
    markWordDone(uid,GI,cw.plain);addScore(uid,GI,PTS_WORD);
    const ni=wIdx+1;const lvEnd=ni>=words.length;
    if(lvEnd){
      markLvDone(uid,GI,lv);addScore(uid,GI,PTS_LEVEL);
      const nlGI=lv+1;
      if(nlGI<=getLvCount(GI)){S.wIdx=0;S.level=nlGI;saveProgress(uid,GI,{level:nlGI,wIdx:0});}
      else{S.wIdx=0;} // last level: reset so re-entry never shows stale resume
      const earned=getEarned(uid,GI);
      showLevelModal({word:cw.plain,points:PTS_WORD+PTS_LEVEL,gameType:GI,level:lv,earnedPieces:earned,
        onNext:()=>{if(nlGI<=getLvCount(GI)){go('game2-inst',{lv:nlGI});}else go('gamesel',{selGame:GI});},
        onBack:()=>go('gamesel',{selGame:GI})});
    } else {
      showWordModal({word:cw.plain,points:PTS_WORD,onNext:()=>loadWord(ni)});
    }
  }
  loadWord(wIdx);
});

/* ═══════════════════════════════════════
   GAME 3: חשבון במהירות האור
═══════════════════════════════════════ */
reg('game3-inst',(el,d)=>{
  const lv=d.lv||S.level;
  // Read from persisted progress so newly-added levels don't show stale qIdx
  const _prog3=getProgress(S.user.id,GM);
  const resumeQ=(_prog3.level===lv)?(_prog3.qIdx??0):0;
  S.qIdx=resumeQ; // keep S in sync
  const isResume=resumeQ>0;
  el.innerHTML=`
    <div class="stitle" style="font-size:clamp(18px,3.5vw,36px);"><span class="sico">✦</span>חשבון במהירות האור<span class="sico">✦</span></div>
    <div class="card inst-card">
      <h3>הוראות — שלב ${lv}</h3>
      <p>יופיע תרגיל חשבון.<br>בחר את התוצאה הנכונה מהכוכבים הנופלים.<br><strong>30 שניות</strong> לכל תרגיל!</p>
      ${isResume?`
      <div class="resume-box">
        <div class="resume-info">🔖 עצרת בתרגיל <strong>${resumeQ+1}</strong> מתוך <strong>${MATH_PER_LEVEL}</strong></div>
        <div class="resume-btns">
          <button class="btn btn-navy btn-lg" id="go-resume">▶ המשך מהמקום שעצרתי</button>
          <button class="btn btn-sm" style="background:rgba(10,30,80,.15);color:var(--navy);" id="go-fresh">↺ התחל מהתחלה</button>
        </div>
      </div>`:`
      <div style="display:flex;justify-content:center;margin-top:14px;">
        <button class="btn btn-navy btn-lg" id="go-play">🎮 התחל</button>
      </div>`}
    </div>
    ${mascotHTML('NanyExplains','bmr','big')}`;
  playSound('instructions');
  if(isResume){
    document.getElementById('go-resume').onclick=()=>go('game3-play',{lv});
    document.getElementById('go-fresh').onclick=()=>{S.qIdx=0;saveProgress(S.user.id,GM,{level:lv,qIdx:0});go('game3-play',{lv});};
  } else {
    document.getElementById('go-play').onclick=()=>go('game3-play',{lv});
  }
});

reg('game3-play',(el,d)=>{
  const lv=d.lv||S.level;const uid=S.user.id;
  let qIdx=S.qIdx||0;let timer=null;let _toTimer=null;let timeLeft=TIMER_SEC;let cq=null;let busy=false;let attempts=0;

  el.innerHTML=`
    <div class="play-inner">
      <div class="play-hdr">
        <div class="play-title">✦ חשבון במהירות האור</div>
        <div style="font-size:15px;color:rgba(255,255,255,.65);">תרגיל <span id="qc">${qIdx+1}</span>/${MATH_PER_LEVEL}</div>
      </div>
      <div style="margin-top:12px;"><div class="timer-wrap"><div class="timer-bar" id="tbar" style="width:100%"></div></div>
      <p class="timer-txt" id="ttxt">${TIMER_SEC} שניות</p></div>
      <div style="text-align:center;margin-top:6px;">
        <span style="font-size:13px;color:rgba(255,255,255,.65);font-weight:700;">נסיונות שגויים: <span id="attempts-count" style="color:#FF6D00;font-weight:800;">0</span></span>
      </div>
      <div class="play-area" id="play-area"></div>
      <div class="ans-wrap" style="justify-content:center;margin-top:10px;">
        <div class="math-box" id="mbox"></div>
      </div>
    </div>
    <div class="lv-badge"><div class="lv-badge-wrap"><div class="ss"></div><span class="bn">${lv}</span></div></div>
    <button class="back-btn" id="bbtn">◄ חזרה</button>`;

  document.getElementById('bbtn').onclick=()=>{clearInterval(timer);clearTimeout(_toTimer);go('gamesel',{selGame:GM});};

  function loadQ(){
    clearInterval(timer);timeLeft=TIMER_SEC;busy=false;attempts=0;
    const cfg=getCustomMath(lv);
    if(cfg.type==='manual'&&cfg.questions&&cfg.questions.length>0){
      // Use manual question if available for this index, else auto-generate
      cq=cfg.questions[qIdx]||genMathQ(lv);
    } else {cq=genMathQ(lv);}
    document.getElementById('qc').textContent=qIdx+1;
    document.getElementById('mbox').textContent=cq.display;
    const ac=document.getElementById('attempts-count');if(ac)ac.textContent='0';
    const tb=document.getElementById('tbar');if(tb){tb.style.width='100%';tb.className='timer-bar';}
    const tt=document.getElementById('ttxt');if(tt)tt.textContent=`${TIMER_SEC} שניות`;
    spawnStars();
    timer=setInterval(()=>{
      timeLeft--;
      const pct=(timeLeft/TIMER_SEC)*100;
      const tb=document.getElementById('tbar');
      if(tb){tb.style.width=pct+'%';if(timeLeft<=10)tb.className='timer-bar danger';else if(timeLeft<=20)tb.className='timer-bar warn';}
      const tt=document.getElementById('ttxt');if(tt)tt.textContent=`${timeLeft} שניות`;
      if(timeLeft<=0){clearInterval(timer);onTimeout();}
    },1000);
  }

  function onTimeout(){
    busy=true;
    const area=document.getElementById('play-area');
    if(area)area.innerHTML=`<div style="width:100%;display:flex;align-items:center;justify-content:center;font-size:20px;color:#FF6D00;font-weight:800;padding:20px;">⏰ הזמן נגמר! התשובה: ${cq.answer}</div>`;
    // Stay on same question index — generate a NEW question, no score
    _toTimer=setTimeout(()=>{
      // Don't increment qIdx — just reload with a fresh auto-generated question
      const cfg=getCustomMath(lv);
      cq=genMathQ(lv); // always fresh auto question on timeout
      attempts=0; // Reset attempts for new question
      const mb=document.getElementById('mbox');if(mb)mb.textContent=cq.display;
      const ac=document.getElementById('attempts-count');if(ac)ac.textContent='0';
      busy=false;
      clearInterval(timer);timeLeft=TIMER_SEC;
      const tb=document.getElementById('tbar');if(tb){tb.style.width='100%';tb.className='timer-bar';}
      const tt=document.getElementById('ttxt');if(tt)tt.textContent=`${TIMER_SEC} שניות`;
      spawnStars();
      timer=setInterval(()=>{
        timeLeft--;
        const pct=(timeLeft/TIMER_SEC)*100;
        const tb=document.getElementById('tbar');
        if(tb){tb.style.width=pct+'%';if(timeLeft<=10)tb.className='timer-bar danger';else if(timeLeft<=20)tb.className='timer-bar warn';}
        const tt=document.getElementById('ttxt');if(tt)tt.textContent=`${timeLeft} שניות`;
        if(timeLeft<=0){clearInterval(timer);onTimeout();}
      },1000);
    },2200);
  }

  function spawnStars(){
    const clean=n=>Number.isInteger(n)?n:parseFloat(n.toFixed(2));
    const all=shuffle([clean(cq.answer),...mathDistractors(cq.answer,6).map(clean)]);
    cq.answer=clean(cq.answer);
    spawnGameStars('play-area',all.map(n=>({label:n,val:n})),(_star,_item)=>{
        if(busy)return;_star.style.pointerEvents='none';
        const r=_star.getBoundingClientRect();
        if(_item.val===cq.answer){
          clearInterval(timer);busy=true;playSound('correct');
          sparkle(r.left+r.width/2,r.top+r.height/2,'#FFD700');
          _star.classList.remove('floating');_star.classList.add('correct');
          setTimeout(()=>{
            const mb=document.getElementById('mbox');
            if(mb){const as=document.createElement('div');as.className='math-ans-star';
              as.innerHTML=`<div class="ss"></div><span>${cq.answer}</span>`;mb.appendChild(as);}
            addScore(uid,GM,PTS_WORD);
            setTimeout(()=>nextQ(),1100);
          },300);
        } else {
          attempts++;playSound('wrong');
          const ac=document.getElementById('attempts-count');if(ac)ac.textContent=attempts;
          dustFX(r.left+r.width/2,r.top+r.height/2);_star.classList.remove('floating');_star.classList.add('wrong');setTimeout(()=>_star.remove(),700);
        }
    });
  }

  function nextQ(){
    qIdx++;S.qIdx=qIdx;saveProgress(uid,GM,{level:lv,qIdx});
    if(qIdx>=MATH_PER_LEVEL){
      markLvDone(uid,GM,lv);addScore(uid,GM,PTS_LEVEL);
      const nlGM=lv+1;
      if(nlGM<=getLvCount(GM)){S.qIdx=0;S.level=nlGM;saveProgress(uid,GM,{level:nlGM,qIdx:0});}
      else{S.qIdx=0;} // last level: reset so re-entry never shows stale resume
      const earned=getEarned(uid,GM);
      showLevelModal({word:`${cq.display}${cq.answer}`,points:PTS_LEVEL,gameType:GM,level:lv,earnedPieces:earned,
        onNext:()=>{if(nlGM<=getLvCount(GM)){go('game3-inst',{lv:nlGM});}else go('gamesel',{selGame:GM});},
        onBack:()=>go('gamesel',{selGame:GM})});
    } else loadQ();
  }
  loadQ();
});

/* ═══════════════════════════════════════
   GAME 4: לוח צירופים
═══════════════════════════════════════ */
reg('game4-inst',(el,d)=>{
  const lv=d.lv||S.level;
  el.innerHTML=`
    <div class="stitle"><span class="sico">✦</span>לוח צירופים<span class="sico">✦</span></div>
    <div class="card inst-card">
      <h3>הוראות — שלב ${lv}</h3>
      <p>בצד תראה כרטיסים עם צירופים של אות+ניקוד.<br>
         לחץ על כרטיס ואז על התא המתאים בטבלה.<br>
         מלא את כל התאים הריקים בצורה נכונה!</p>
      <div style="display:flex;justify-content:center;margin-top:14px;">
        <button class="btn btn-navy btn-lg" id="go-play">🎮 למשחק</button>
      </div>
    </div>
    ${mascotHTML('NanyExplains','bmr','big')}`;
  playSound('instructions');
  document.getElementById('go-play').onclick=()=>go('game4-play',{lv});
});

reg('game4-play',(el,d)=>{
  const lv=d.lv||S.level;
  const uid=S.user.id;
  const cfg=NIKUD_TABLES.find(t=>t.lv===lv)||NIKUD_TABLES[0];
  const rows=cfg.consonants.length;
  const cols=cfg.nikud.length;

  // Determine which cells need cards (value is in cfg.cards)
  // and which are pre-filled (value not in cfg.cards)
  const cardCells={};   // k -> correct answer
  const preFilled={};   // k -> pre-shown value

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const k=`${r}-${c}`;
      const correctVal=cfg.grid[r][c];
      if(cfg.cards.includes(correctVal)){
        cardCells[k]=correctVal;
      } else {
        preFilled[k]=correctVal;
      }
    }
  }

  // Load previously saved placement (if player pressed back mid-game)
  const _g4key=`kbk_g4_${uid}_${lv}`;
  let placed=ls.g(_g4key)||{};
  let selCard=null;

  el.innerHTML=`
    <div style="width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;">
      <div class="play-hdr">
        <div class="play-title">✦ לוח צירופים — שלב ${lv}</div>
        <span class="word-ctr" id="prog-ctr">${Object.keys(placed).length}/${Object.keys(cardCells).length} הונחו</span>
      </div>
      <div class="nikud-layout" id="nlayout" style="flex:1;min-height:0;">
        <div class="nikud-panel" id="npanel"></div>
        <div class="nikud-main" style="overflow:auto;">
          <div class="nikud-tbl"><table id="ntable"></table></div>
          <div id="action-area" style="margin-top:14px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;"></div>
        </div>
      </div>
    </div>
    <button class="back-btn" id="bbtn">◄ חזרה</button>`;

  document.getElementById('bbtn').onclick=()=>{ls.s(_g4key,placed);go('gamesel',{selGame:GN});};

  function buildTable(mode){
    const tbl=document.getElementById('ntable');
    let h=`<tr><th></th>${cfg.nikud.map(n=>`<th>${n.s}<br><small style="font-size:14px;opacity:.7">${n.n}</small></th>`).join('')}</tr>`;
    for(let r=0;r<rows;r++){
      h+=`<tr>`;
      h+=`<td style="background:rgba(10,30,80,.7);color:#fff;font-weight:800;font-size:20px;">${cfg.consonants[r]}</td>`;
      for(let c=0;c<cols;c++){
        const k=`${r}-${c}`;
        if(preFilled[k]!==undefined){
          h+=`<td class="filled" data-k="${k}" data-pre="1" style="background:rgba(79,195,247,.15);color:var(--navy);">${preFilled[k]}</td>`;
        } else {
          const val=placed[k];
          if(mode==='result'){
            const isOk=val===cardCells[k];
            const cls=val?(isOk?'filled real':'filled fake'):'empty';
            const icon=val?(isOk?' ✓':` ✗`):'';
            const hint=(!isOk&&val)?`<div style="font-size:10px;color:#888;">(${cardCells[k]})</div>`:'';
            h+=`<td class="${cls}" data-k="${k}" style="font-size:18px;">${val||'—'}${icon}${hint}</td>`;
          } else {
            const hi=(selCard&&!val)?'hi':'';
            h+=`<td class="${val?'filled':'empty'} ${hi}" data-k="${k}" data-r="${r}" data-c="${c}">${val||''}</td>`;
          }
        }
      }
      h+=`</tr>`;
    }
    tbl.innerHTML=h;

    if(mode!=='result'){
      tbl.querySelectorAll('td[data-k]:not([data-pre])').forEach(td=>{
        td.onclick=()=>{
          const k=td.dataset.k;
          if(placed[k]&&!selCard){
            delete placed[k];selCard=null;
            updateCounter();buildCards();buildTable('place');
            return;
          }
          if(selCard){
            placed[k]=selCard;selCard=null;
            updateCounter();buildCards();buildTable('place');
            checkAllPlaced();
          }
        };
      });
    }
  }

  // Shuffle card order ONCE at init — never re-shuffle on click
  const cardOrder=shuffle([...new Set(cfg.cards)]);

  function buildCards(){
    const panel=document.getElementById('npanel');
    panel.innerHTML='';
    const placedCounts={};
    Object.values(placed).forEach(v=>{placedCounts[v]=(placedCounts[v]||0)+1;});
    const totalCounts={};
    cfg.cards.forEach(v=>{totalCounts[v]=(totalCounts[v]||0)+1;});
    // Use fixed card order — never shuffle again after init
    cardOrder.forEach(card=>{
      const available=(placedCounts[card]||0)<totalCounts[card];
      const div=document.createElement('div');
      div.className=`ncard${!available?' placed':''}${selCard===card?' sel':''}`;
      div.textContent=card;
      if(available){
        div.onclick=()=>{
          selCard=(selCard===card)?null:card;
          buildCards();buildTable('place');
        };
      }
      panel.appendChild(div);
    });
  }

  function updateCounter(){
    const c=document.getElementById('prog-ctr');
    if(c)c.textContent=`${Object.keys(placed).length}/${Object.keys(cardCells).length} הונחו`;
  }

  function checkAllPlaced(){
    const needed=Object.keys(cardCells).length;
    if(Object.keys(placed).length>=needed){
      const area=document.getElementById('action-area');
      area.innerHTML=`
        <button class="nikud-phase-btn" id="check-btn"
          style="background:linear-gradient(135deg,#1B5E20,#388E3C);color:#fff;font-size:17px;padding:13px 28px;border-radius:14px;">
          ✓ בדוק את הטבלה
        </button>`;
      document.getElementById('check-btn').onclick=checkAnswers;
    }
  }

  function checkAnswers(){
    const area=document.getElementById('action-area');
    let wrong=0;
    Object.entries(cardCells).forEach(([k,correctVal])=>{
      if(placed[k]!==correctVal)wrong++;
    });

    buildTable('result');

    if(wrong===0){
      playSound('correct');
      area.innerHTML=`<div style="font-size:18px;font-weight:800;color:#1B5E20;padding:8px 0;">🌟 מצוין! הכל נכון!</div>`;
      setTimeout(()=>{
        markLvDone(uid,GN,lv);
        addScore(uid,GN,PTS_WORD+PTS_LEVEL);
        ls.s(_g4key,{}); // clear saved placement
        const nlGN=lv+1;
        if(nlGN<=getLvCount(GN)){saveProgress(uid,GN,{level:nlGN});}
        const earned=getEarned(uid,GN);
        showLevelModal({
          word:'השלמת את הטבלה ⭐',
          points:PTS_WORD+PTS_LEVEL,
          gameType:GN,level:lv,earnedPieces:earned,
          onNext:()=>{
            if(nlGN<=getLvCount(GN)){go('game4-inst',{lv:nlGN});}
            else go('gamesel',{selGame:GN});
          },
          onBack:()=>go('gamesel',{selGame:GN})
        });
      },900);
    } else {
      playSound('wrong');
      area.innerHTML=`
        <div style="text-align:center;margin-bottom:8px;">
          <span style="font-size:15px;font-weight:700;color:#B71C1C;">✗ ${wrong} תאים שגויים — מסומנים באדום</span>
        </div>
        <button class="nikud-phase-btn" id="retry-btn" style="background:var(--navy);color:#fff;border-radius:12px;padding:10px 22px;">↺ נסה שוב</button>`;
      document.getElementById('retry-btn').onclick=()=>{
        // Remove only wrong placements
        Object.entries(cardCells).forEach(([k,correctVal])=>{
          if(placed[k]&&placed[k]!==correctVal)delete placed[k];
        });
        selCard=null;
        updateCounter();buildCards();buildTable('place');
        area.innerHTML='';
      };
    }
  }

  buildCards();
  buildTable('place');
});

