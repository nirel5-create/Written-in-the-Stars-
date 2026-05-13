/* ═══════════════════════════════════════
   ACHIEVEMENTS
═══════════════════════════════════════ */
reg('achievements',el=>{
  if(!S.user){go('login');return;}
  playSound('achievements',0.7);
  const uid=S.user.id;
  const allGames=[GH,GI,GM,GN];

  let html=`
    <div class="ach-wrap" style="direction:rtl;text-align:center;width:100%;max-width:700px;">
      <div class="ach-title">🏆 הישגים</div>
      <div class="cups-row">`;

  allGames.forEach(g=>{
    const earned=getEarned(uid,g);
    html+=`<div class="cup-wrap">
      <div class="cup-title">${TNAMES[g]}</div>
      ${buildPuzzleHTML(g,earned)}
      <div style="font-size:13px;color:rgba(255,255,255,.6);margin-top:6px;">${earned.length}/${g===GN?5:7} חתיכות</div>
    </div>`;
  });

  html+=`</div><div class="words-done"><h4>המילים שלי:</h4><div>`;
  allGames.forEach(g=>{
    const words=getDoneWords(uid,g);
    if(words.length){
      html+=`<div style="margin-bottom:8px;"><span style="font-size:13px;color:rgba(10,30,100,.5);">${GNAMES[g]}:</span><br>`;
      words.forEach(w=>{html+=`<span class="wchip">${w}</span>`;});
      html+=`</div>`;
    }
  });
  html+=`</div></div>
  <div style="margin-top:16px;">
    <button class="btn btn-navy" id="back-ach">◄ חזרה</button>
  </div></div>
  ${mascotHTML('NanyProudOfYou','br','big')}`;

  el.innerHTML=html;
  document.getElementById('back-ach').onclick=()=>go('gamesel');
});

