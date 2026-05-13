/* ═══════════════════════════════════════
   SCREEN: GAME SELECT
═══════════════════════════════════════ */
reg('gamesel',(el,d)=>{
  if(!S.user){go('login');return;}
  if(d.selGame)S.selGame=d.selGame;
  if(d.carIdx!==undefined)S.carIdx=d.carIdx;

  const glist=[{id:GH},{id:GI},{id:GM},{id:GN}];

  function renderCarousel(){
    const ci=S.carIdx;
    const isMobile=window.innerWidth<=480;
    const count=isMobile?glist.length:3;
    const vis=isMobile?glist:glist.slice(ci,ci+count);
    while(vis.length<count)vis.push(null);
    return vis.map(g=>g?`
      <div class="game-card${g.id===S.selGame?' sel':''}" data-gid="${g.id}" style="cursor:pointer;">
        <div class="gc-icon">${GICONS[g.id]}</div>
        <div class="gc-title">${GNAMES[g.id]}</div>
      </div>`:`<div class="game-card" style="opacity:0;pointer-events:none;"></div>`
    ).join('');
  }

  function renderStars(){
    const g=S.selGame;
    const lc=getLvCount(g);
    const prog=getProgress(S.user.id,g);
    const done=getCompletedLvs(S.user.id,g);
    // Current level = first undone level, capped to lc
    const curLv=Math.min(prog.level,lc);
    let h='';
    for(let i=1;i<=lc;i++){
      if((g===GH||g===GI)){
        const lvWords=getWords(g).filter(w=>w.lv===i);
        if(lvWords.length===0)break;
      }
      let cls='lock';
      if(done.includes(i))cls='done';
      else if(i===curLv)cls='cur';
      h+=`<div class="lv-star ${cls}" data-lv="${i}" title="שלב ${i}">
        <div class="ss"></div><span class="sn">${i}</span>
      </div>`;
    }
    return h||'<div style="color:rgba(255,255,255,.5);font-size:14px;padding:8px;">אין שלבים זמינים עדיין</div>';
  }

  el.innerHTML=`
    <div class="gsel-top">
      <div class="stitle"><span class="sico">✦</span>סוגי המשחקים<span class="sico">✦</span></div>
    </div>
    <div class="carousel-wrap">
      <button class="carr-arrow r" id="arr-r">&#8249;</button>
      <div class="carr-track" id="ctrack">${renderCarousel()}</div>
      <button class="carr-arrow l" id="arr-l">&#8250;</button>
    </div>
    <div class="stars-bar-wrap">
      <div class="stars-bar-label">לחץ על כוכב כחול להמשיך, או לחץ שוב על כרטיס המשחק</div>
      <div class="stars-bar" id="sbar">${renderStars()}</div>
    </div>
    <div class="gsel-btns">
      <button class="btn btn-navy btn-sm" id="btn-ach">🏆 הישגים</button>
      <button class="btn btn-sm" style="background:rgba(100,120,160,.3);color:#fff;" id="btn-out">יציאה</button>
    </div>`;

  function refresh(){
    document.getElementById('ctrack').innerHTML=renderCarousel();
    document.getElementById('sbar').innerHTML=renderStars();
    bindCards();bindStars();
    const cur=document.querySelector('.lv-star.cur');
    if(cur)cur.scrollIntoView({behavior:'smooth',inline:'center'});
  }
  function bindCards(){
    el.querySelectorAll('.game-card[data-gid]').forEach(c=>{
      c.onclick=()=>{
        const gid=parseInt(c.dataset.gid);
        if(gid===S.selGame){
          const prog=getProgress(S.user.id,gid);
          const resumeIdx=gid===GM?(prog.qIdx??0):(prog.wIdx??0);
          startGame(gid,prog.level,resumeIdx);
        } else {
          S.selGame=gid;refresh();
        }
      };
    });
  }
  function bindStars(){
    document.getElementById('sbar').querySelectorAll('.lv-star').forEach(star=>{
      star.onclick=()=>{
        const lv=parseInt(star.dataset.lv);
        const g=S.selGame;
        const prog=getProgress(S.user.id,g);
        const done=getCompletedLvs(S.user.id,g);
        const maxUnlocked=done.length>0?Math.max(...done)+1:1;
        const actualCurrent=Math.max(prog.level,maxUnlocked);
        if(done.includes(lv)){
          // Replay a completed level — don't touch progress
          S.game=g;S.level=lv;
          if(g===GM){S.qIdx=0;go('game3-inst',{lv});}
          else if(g===GN){go('game4-inst',{lv});}
          else{S.wIdx=0;go(g===GH?'game1-inst':'game2-inst',{lv});}
          return;
        }
        if(lv===actualCurrent){
          const resumeIdx=g===GM?(prog.qIdx??0):(prog.wIdx??0);
          startGame(g,lv,resumeIdx);return;
        }
        if(lv<actualCurrent){startGame(g,lv,0);return;}
        showToast('כדי להתקדם עליך לסיים את השלב הנוכחי! 🌟','warn');
      };
    });
  }
  document.getElementById('arr-r').onclick=()=>{if(S.carIdx>0){S.carIdx--;refresh();}};
  document.getElementById('arr-l').onclick=()=>{if(S.carIdx+3<glist.length){S.carIdx++;refresh();}};
  document.getElementById('btn-ach').onclick=()=>go('achievements');
  document.getElementById('btn-out').onclick=()=>{clearSession();go('login');};
  bindCards();bindStars();
  const cur=document.querySelector('.lv-star.cur');
  if(cur)setTimeout(()=>cur.scrollIntoView({behavior:'smooth',inline:'center'}),100);
});

function startGame(g,lv,resumeIdx){
  S.game=g;S.level=lv;
  if(g===GM){S.qIdx=resumeIdx||0;go('game3-inst',{lv});}
  else if(g===GN){go('game4-inst',{lv});}
  else{S.wIdx=resumeIdx||0;go(g===GH?'game1-inst':'game2-inst',{lv});}
}

