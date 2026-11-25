'use strict';

const paths = {
  book:'M12 5c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v14',
  mute:'M11 4 6 8H3v8h3l5 4V4Zm5 5 5 6m0-6-5 6',
  sound:'M11 4 6 8H3v8h3l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  settings:'M3 7h5m4 0h9M3 17h10m4 0h4M8 4h4v6H8zM13 14h4v6h-4z',
  arrow:'M4 12h15m-6-6 6 6-6 6', back:'M20 12H5m6-6-6 6 6 6', close:'m6 6 12 12M18 6 6 18',
  flag:'M5 21V4m0 0c4-4 8 3 14-1v10c-6 4-10-3-14 1',
  compass:'m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2L12 2Z',
  pin:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 1 1 6 0Z',
  castle:'M3 20V9h3V4l2 2 2-2v5h4V4l2 2 2-2v5h3v11H3Zm7 0v-4a2 2 0 0 1 4 0v4',
  mountain:'m2 20 8-15 4 7 2-4 6 12H2Zm5-10 3 2 2-2',
  building:'m2 9 10-6 10 6H2Zm3 2v7m5-7v7m4-7v7m5-7v7M2 21h20',
  lock:'M6 10h12v11H6zM8 10V7a4 4 0 1 1 8 0v3', check:'m4 12 5 5L20 6',
  file:'M5 3h10l4 4v14H5V3Zm9 0v5h5M8 12h8m-8 4h6', tag:'m3 4 7-1 11 11-8 8L2 11l1-7Zm3 3h.01',
  pencil:'m4 16 12-12 4 4L8 20l-6 2 2-6Zm10-10 4 4', sun:'M12 3v2m0 14v2M3 12h2m14 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M16 12a4 4 0 1 1-8 0 4 4 0 1 1 8 0Z',
  mail:'M2 5h20v14H2zM2 6l10 8L22 6', seal:'M18 9a6 6 0 1 1-12 0 6 6 0 0 1 12 0ZM8 14l-2 7 5-3 2 3 3-7',
  box:'m3 7 9-4 9 4-9 4-9-4Zm0 0v11l9 4 9-4V7m-9 4v11', tree:'m12 2 6 7h-3l5 6h-6v5h-4v-5H4l5-6H6l6-7Z',
  diamond:'m12 3 8 9-8 9-8-9 8-9Z', search:'M16 10a6 6 0 1 1-12 0 6 6 0 1 1 12 0Zm-1 5 6 6',
  frame:'M3 9V3h6m6 0h6v6m0 6v6h-6m-6 0H3v-6', info:'M22 12a10 10 0 1 1-20 0 10 10 0 1 1 20 0ZM12 11v6m0-10v.1',
  hint:'M8 15a6 6 0 1 1 8 0l-1 2H9l-1-2Zm2 5h4', image:'M3 4h18v16H3zM3 18l6-7 4 4 3-3 5 6',
  plane:'m3 12 7-2 8-7 2 1-4 8 5 4-1 2-7-2-4 5-2-1 1-6-5-1Z'
};
function icon(name) {
  return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="'+paths[name]+'"/></svg>';
}
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const screen=document.querySelector('#screen'), sheet=document.querySelector('#sheet'), sheetBody=document.querySelector('#sheet-body');
const saveKey='monuments-men-field-v1';
const fresh=()=>({started:false,progress:0,clues:[[],[],[]],pieces:[...initialPieces],route:null,proofs:[],city:null,sound:false});
let game=fresh(), memoryOnly=false;
try {
  const data=JSON.parse(localStorage.getItem(saveKey)||'null');
  if(data && Number.isInteger(data.progress) && data.progress>=0 && data.progress<=3){
    game.started=Boolean(data.started||data.progress);
    game.progress=data.progress;
    game.sound=data.sound===true;
    game.resume=data.resume==='puzzle'?'puzzle':'field';
    game.clues=game.clues.map((_,i)=>[...new Set((Array.isArray(data.clues?.[i])?data.clues[i]:[]).filter(n=>[0,1,2].includes(n)))]);
    if(Array.isArray(data.pieces) && [...data.pieces].sort().join()==='0,1,2,3,4,5') game.pieces=data.pieces;
    if(routes.some(r=>r.id===data.route)) game.route=data.route;
    if(Array.isArray(data.proofs)) game.proofs=[...new Set(data.proofs.filter(n=>[0,1,2,3].includes(n)))].slice(0,2);
    if(['헨트','브뤼셀','뮌헨'].includes(data.city))game.city=data.city;
  }
}catch{ /* An unavailable or obsolete save can be started again. */ }
let view='home', chapter=0, chosenTile=null, feedback='', hintLevel=0, dialogType='', audioCtx=null, ambientTimer=0;
const chapterNo=i=>String(i+1).padStart(2,'0');
const has=(c,n)=>game.clues[c].includes(n);
const ready=c=>has(c,0)&&has(c,1);
const memoryCount=()=>game.clues.filter(a=>a.includes(2)).length;
const action=(key,label,kind='secondary',pic='',data='')=>'<button class="'+kind+'" data-act="'+key+'" '+data+'>'+ (pic?icon(pic):'') +'<span>'+label+'</span></button>';
const btnData=(key,value)=>'data-'+key+'="'+value+'"';
function save(){try{localStorage.setItem(saveKey,JSON.stringify(game));}catch{memoryOnly=true;}}
function announce(s){document.querySelector('#announce').textContent=s;}
function tone(f=330,d=.13,delay=0,volume=.045){
  if(!game.sound||!audioCtx||document.hidden)return;
  const at=audioCtx.currentTime+delay, osc=audioCtx.createOscillator(),gain=audioCtx.createGain();
  osc.type='sine';osc.frequency.value=f;gain.gain.setValueAtTime(.0001,at);
  gain.gain.exponentialRampToValueAtTime(volume,at+.025);gain.gain.exponentialRampToValueAtTime(.0001,at+d);
  osc.connect(gain).connect(audioCtx.destination);osc.start(at);osc.stop(at+d+.03);
}
function enableAudio(){
  const Ctx=window.AudioContext||window.webkitAudioContext;
  if(!Ctx)return;
  if(!audioCtx)audioCtx=new Ctx();
  if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
  if(!ambientTimer)ambientTimer=setInterval(()=>{if(game.sound&&!document.hidden){tone(146.83,3,0,.024);tone(220,2.7,.6,.018);tone(261.63,2,1.5,.012);}},11000);
}
function updateSound(){
  const el=document.querySelector('[data-act="sound"]'),label=game.sound?'소리 끄기':'소리 켜기';
  el.innerHTML=icon(game.sound?'sound':'mute');el.title=label;el.setAttribute('aria-label',label);el.setAttribute('aria-pressed',String(game.sound));
}
function modal(type,kicker,title,body,wide=false){
  dialogType=type;sheet.className=wide?'wide':'';
  sheetBody.innerHTML='<button autofocus class="dialog-close" data-act="close" aria-label="닫기">'+icon('close')+'</button><div class="sheet-kicker">'+kicker+'</div><h2 id="dialog-title">'+title+'</h2>'+body;
  if(!sheet.open)sheet.showModal();
  sheet.scrollTop=0;
}
function closeSheet(){if(sheet.open)sheet.close();}
sheet.addEventListener('close',()=>{dialogType='';if(!document.activeElement||document.activeElement===document.body)screen.focus({preventScroll:true});});
sheet.addEventListener('click',e=>{if(e.target===sheet){const r=sheet.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeSheet();}});
function move(v,c=chapter){
  closeSheet();view=v;chapter=c;chosenTile=null;feedback='';hintLevel=0;
  render();window.scrollTo(0,0);screen.focus({preventScroll:true});
}
function render(){
  document.body.dataset.view=view;
  screen.innerHTML=({home:homeScreen,field:fieldScreen,puzzle:puzzleScreen,ending:endingScreen}[view])();
}
function homeScreen(){
  const primary=game.progress===3?'귀환 기록 보기':game.started?'조사 이어하기':'작전 시작';
  const cards=chapters.map((c,i)=>{
    const status=game.progress>i?'조사 완료':game.progress===i?'현재 현장':'미개방 현장';
    return '<button class="route-card '+(game.progress===i?'current':'')+'" data-act="chapter" data-i="'+i+'" aria-label="'+c.place+', '+status+'"><img src="./assets/'+c.file+'.webp" alt=""><span class="route-name"><small>CH. '+chapterNo(i)+'</small><b>'+c.place.replace(' 중앙 미술품 집결소',' 집결소')+'</b></span><i>'+icon(game.progress>i?'check':game.progress===i?'compass':'lock')+'</i></button>';
  }).join('');
  return '<div class="cover"><div class="cover-art"></div><div class="cover-shade"></div><section class="hero"><div class="hero-inner"><div class="genre"><i></i> 역사 미스터리 어드벤처</div><p class="hero-english">THE MONUMENTS MEN</p><h1>모뉴먼츠 맨</h1><div class="subtitle"><span></span>사라진 제단화<span></span></div><p class="premise">1945년, 나치가 약탈한 헨트 제단화가 사라졌다.<br>세 개의 현장에 남은 흔적을 따라 그림을 되찾으세요.</p><div class="hero-actions">'+action('start',primary,'primary','flag')+action('guide','플레이 방법','cover-link','book')+'</div></div><div class="plate-caption">'+icon('pin')+'<span><small>BAVARIA, GERMANY</small>노이슈반슈타인 성</span></div></section></div><section class="route-section"><div class="route-heading"><h2>'+icon('compass')+'작전 경로</h2><span>현장 '+game.progress+' / 3 완료</span></div><div class="route-grid">'+cards+'</div></section>';
}
function showIntro(){
  modal('letter','프롤로그　/　벨기에 헨트에서 온 편지','분수는 아직 거기 있나요?','<div class="letter-meta"><span>받는 이　문화재 전담반</span>'+icon('mail')+'</div><div class="letter-writing"><p>조사관님께,</p><p>아버지와 저는 일요일마다 성당 그림 속 분수를 그렸어요. 저는 물이 나오는 곳을 항상 하나씩 빼먹었고요.</p><p>그림이 돌아오면 둘이서 다시 세어 보기로 했어요. 혹시 찾으시면 분수가 아직 거기 있는지 알려 주세요.</p><p class="signature">헨트에서, 리네</p></div><div class="narrative">1945년 5월. 나는 연합군 문화재 전담반에 배치됐다. 첫 근무지로 가는 기차 안에서 이 편지를 두 번 읽었다.</div><div class="sheet-actions">'+action('begin','편지를 챙겨 성으로','primary','flag')+'</div>');
}
function showChapter(i){
  const c=chapters[i], locked=i>game.progress;
  modal('chapter','작전 경로　/　CH. '+chapterNo(i),c.title,'<img class="preview-img" src="./assets/'+c.file+'.webp" alt="'+c.place+' 현장 삽화"><p class="scene-meta">'+c.date+' · '+c.place+'</p><p>'+c.brief+'</p><div class="sheet-actions">'+(locked?'<p class="quiet">'+icon('lock')+'앞 현장을 마치면 열립니다.</p>':action('enter',i<game.progress?'현장 다시 조사':'현장으로','primary','compass',btnData('i',i)))+'</div>');
}
function fieldScreen(){
  const c=chapters[chapter], solved=game.progress>chapter;
  const markers=c.clues.map((cl,i)=>'<button class="marker '+(has(chapter,i)?'found':'')+'" style="--x:'+cl.x+'%;--y:'+cl.y+'%" data-act="clue" data-i="'+i+'" aria-label="'+cl.title+' 조사"><span>'+icon(has(chapter,i)?'check':i===2?'pencil':'search')+'</span></button>').join('');
  const items=c.clues.map((cl,i)=>'<button class="clue-row" data-act="clue" data-i="'+i+'"><i>'+icon(cl.mark)+'</i><span><small>'+cl.tag+(i===2?' · 선택':'')+'</small><b>'+cl.title+'</b></span><em>'+icon(has(chapter,i)?'check':'search')+'</em></button>').join('');
  return '<section class="field page"><div class="location-bar">'+action('home','작전 경로','text-btn','back')+'<span>CHAPTER '+chapterNo(chapter)+' / 03</span></div><div class="field-title"><div class="eyebrow">'+c.date+'　·　'+c.short+'</div><h1>'+c.title+'</h1></div><div class="field-grid"><div><div class="scene"><img src="./assets/'+c.file+'.webp" alt="'+c.place+'의 조사 현장">'+markers+'<div class="scene-label">'+icon('pin')+c.place+'</div></div><p class="scene-story">'+c.brief+'</p></div><aside class="field-aside"><div class="small-title">'+icon('flag')+'현재 임무</div><h2>'+c.objective+'</h2><div class="list-heading"><b>현장 단서</b><span>'+game.clues[chapter].length+' / 3</span></div><div class="clue-list">'+items+'</div><div class="field-action">'+(solved?action(chapter<2?'next':'ending',chapter<2?'다음 현장으로':'귀환 기록 보기','primary',chapter<2?'compass':'mail'):ready(chapter)?action('puzzle',c.task,'primary','file'):'<p>'+icon('search')+'현장의 필수 단서 두 개를 조사하세요.</p>')+'</div></aside></div></section>';
}
function showClue(i){
  const c=chapters[chapter],cl=c.clues[i],isNew=!has(chapter,i);
  if(isNew){game.clues[chapter].push(i);save();tone(i===2?523:392,.4);}
  render();
  modal('clue',c.place+'　/　'+cl.tag,cl.title,'<div class="evidence-slip"><div class="slip-head">'+icon(cl.mark)+'<span>'+cl.code+'</span></div><h3>'+cl.head+'</h3><p>'+cl.text+'</p></div><div class="recorded">'+icon('check')+(i===2?'답장에 담을 기억을 기록했습니다.':'현장 수첩에 단서를 기록했습니다.')+'</div><div class="sheet-actions">'+action('close','현장으로','secondary','back')+(ready(chapter)&&game.progress===chapter?action('puzzle',c.task,'primary','file'):'')+'</div>');
}
function showGuide(){
  modal('guide','조사관 안내','플레이 방법','<ol class="guide-list"><li><b>현장을 살펴보세요.</b><p>그림 위 돋보기나 단서 목록을 누르세요. 연필 표식에는 답장에 담을 기억이 있습니다.</p></li><li><b>두 단서를 대조하세요.</b><p>필수 단서를 모으면 각 장의 퍼즐이 열립니다. 현장 수첩이나 힌트는 언제든 읽을 수 있습니다.</p></li><li><b>그림을 집으로 돌려보내세요.</b><p>세 현장을 마치면 리네에게 편지를 보냅니다. 완료한 현장도 다시 방문할 수 있습니다.</p></li></ol><p class="fine">터치 또는 마우스 · 키보드는 Tab으로 이동, Enter로 선택, Esc로 창 닫기</p><div class="sheet-actions">'+action('close','확인','primary','check')+'</div>');
}
function showSettings(){
  const full=Boolean(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen);
  modal('settings','문화재 전담반','게임 설정','<div class="menu-stack">'+action('sound-setting',game.sound?'소리 끄기':'소리 켜기','menu-btn',game.sound?'sound':'mute')+(full?action('fullscreen',(document.fullscreenElement||document.webkitFullscreenElement)?'전체 화면 해제':'전체 화면으로 보기','menu-btn','frame'):'')+action('guide','플레이 방법','menu-btn','book')+action('history','역사와 제작 기록','menu-btn','info')+(game.started?action('reset-confirm','처음부터 다시 시작','menu-btn','back'):'')+'</div><p class="fine">'+(memoryOnly?'이 브라우저에서 저장이 차단되어 현재 탭에서만 이어집니다.':'이 브라우저에 조사 진행 상황을 자동으로 저장합니다.')+'</p>');
}
function showHistory(){
  modal('history','작전 기록　/　사료','제단화가 실제로 거친 길','<p>헨트 성 바보 대성당의 제단화는 전쟁 중 나치에 의해 노이슈반슈타인 성을 거쳐 알타우스제 소금광산으로 옮겨졌습니다. 연합군 문화재 전담반은 현지인들과 함께 작품을 회수했습니다.</p><p>1945년 8월 21일, 패널 17점을 담은 상자 10개가 뮌헨을 떠나 브뤼셀에 도착했습니다. 다음 날 벨기에 측이 인계증에 서명했습니다.</p><p>리네와 가족, 조사관의 대화, 표식과 서류는 창작입니다. 세 현장 삽화는 당시를 상상해 재구성했습니다. 사진 퍼즐과 엔딩에는 반 에이크 형제의 실제 제단화 중앙 하단 패널을 사용했습니다.</p><div class="sources"><a href="'+historyUrl+'" target="_blank" rel="noopener">미국 국립문서기록관리청 · 반환 기록 ↗</a><a href="'+paintingUrl+'" target="_blank" rel="noopener">중앙 패널 사진 · Wikimedia Commons ↗</a></div>');
}
function showJournal(){
  const sections=chapters.map((c,i)=>{
    const entries=c.clues.map((cl,n)=>has(i,n)?'<li><b>'+cl.title+'</b><p>'+cl.note+'</p></li>':'').join('');
    return '<section class="journal-section"><h3><small>'+chapterNo(i)+'</small>'+c.place+'</h3>'+(entries?'<ul>'+entries+'</ul>':'<p class="fine">아직 기록한 단서가 없습니다.</p>')+'</section>';
  }).join('');
  modal('journal','조사관의 기록　/　FIELD NOTES','현장 수첩','<p class="journal-meta">완료한 현장 '+game.progress+' / 3　 ·　 개인 기록 '+memoryCount()+' / 3</p>'+sections+'<div class="sheet-actions">'+action('history','역사와 제작 기록','secondary','info')+action('close','수첩 덮기','primary','book')+'</div>');
}

function puzzleScreen(){
  const c=chapters[chapter];
  const title=['사라진 화물의 운송표','흩어진 대조 사진','마지막 인계증'][chapter];
  const desc=['장부와 표찰에 모두 맞는 운송표를 골라 행선지를 확인하세요.','사진 두 조각을 차례로 누르면 자리가 바뀝니다. 풍경이 이어지도록 여섯 조각을 맞추세요.','원래 소장처와 현재 인수 권한을 증명하는 서류 두 장을 고르고, 비행기가 갈 도시를 지정하세요.'][chapter];
  const content=[routePuzzle,photoPuzzle,handoverPuzzle][chapter]();
  const evidence=c.clues.slice(0,2).map(cl=>'<article class="puzzle-note"><small>'+icon(cl.mark)+cl.title+'</small><p>'+cl.note+'</p></article>').join('');
  return '<section class="puzzle page"><div class="location-bar">'+action('field','현장으로','text-btn','back')+'<span>CHAPTER '+chapterNo(chapter)+' / 03</span></div><div class="field-title"><div class="eyebrow">'+c.place+'　·　'+c.task+'</div><h1>'+title+'</h1></div><div class="puzzle-grid"><div class="puzzle-table"><p class="puzzle-desc">'+desc+'</p>'+content+'<div class="puzzle-footer"><div class="feedback" role="status">'+feedback+'</div><div class="puzzle-controls">'+action('hint','힌트','secondary','hint')+action('submit',['운송표 확인','사진 대조','인계증 서명'][chapter],'primary','check')+'</div></div></div><aside class="notes"><h2>'+icon('book')+'조사 메모</h2>'+evidence+'</aside></div></section>';
}
function routePuzzle(){
  return '<div class="waybills">'+routes.map(r=>'<button class="waybill '+(game.route===r.id?'selected':'')+'" data-act="route" data-id="'+r.id+'" aria-pressed="'+(game.route===r.id)+'"><span class="waybill-top"><small>화물 운송표</small><b>'+r.id+'</b></span><span class="stamp-mark">'+icon(r.tree?'tree':'diamond')+'</span><strong>'+r.to+'</strong><span class="ribbon">'+(r.tree?'전나무':'마름모')+' · 파란 띠 '+r.stripes+'줄</span></button>').join('')+'</div>';
}
function photoPuzzle(){
  const tiles=game.pieces.map((n,i)=>'<button class="photo-tile '+(chosenTile===i?'selected':'')+'" style="--px:'+(n%3*50)+'%;--py:'+Math.floor(n/3)*100+'%" aria-label="'+(i+1)+'번 칸, '+pieceNames[n]+'" aria-pressed="'+(chosenTile===i)+'" data-act="tile" data-i="'+i+'"><span>'+(i+1)+'</span></button>').join('');
  return '<div class="photo-board" role="group" aria-label="두 칸을 선택해 사진 조각 바꾸기">'+tiles+'</div><p class="photo-caption">'+icon('image')+'헨트 제단화 · 중앙 하단 패널 대조용 사진</p>';
}
function handoverPuzzle(){
  const docs=proofCards.map((p,i)=>'<button class="proof '+(game.proofs.includes(i)?'selected':'')+'" data-act="proof" data-i="'+i+'" aria-pressed="'+game.proofs.includes(i)+'">'+icon(p.icon)+'<span><b>'+p.title+'</b><small>'+p.desc+'</small></span></button>').join('');
  const cities=['헨트','브뤼셀','뮌헨'].map(city=>'<button class="city '+(game.city===city?'selected':'')+'" data-act="city" data-id="'+city+'" aria-pressed="'+(game.city===city)+'">'+city+'</button>').join('');
  return '<div class="list-heading"><b>첨부 서류</b><span>'+game.proofs.length+' / 2</span></div><div class="proof-grid">'+docs+'</div><div class="list-heading"><b>인계 도시</b></div><div class="cities">'+cities+'</div>';
}
function puzzleUpdate(message='',focusSelector=''){
  feedback=message;render();
  if(focusSelector)screen.querySelector(focusSelector)?.focus({preventScroll:true});
  if(message)announce(message);
}
function showHint(){
  const hints=[
    ['단서를 하나씩 적용해 보세요. 우선 전나무 인장이 찍힌 표만 남겨 보세요.','전나무가 찍힌 두 장 가운데 띠가 두 줄인 운송표를 찾으세요.'],
    ['윗줄의 하늘을 먼저 이어 보세요. 둥근 빛줄기가 윗줄 한가운데입니다.','아랫줄은 왼쪽의 푸른 옷, 가운데 분수, 오른쪽의 붉은 옷 순서입니다.'],
    ['그림을 잠시 맡았던 사람의 서류와 전쟁 전부터 갖고 있던 사람의 서류를 구분하세요.','성당 소장 대장과 정부 위임장을 첨부하세요. 위임장에 인수 도시가 적혀 있습니다.']
  ];
  const level=Math.min(hintLevel,1);
  modal('hint','조사 지원　/　'+(level+1)+'단계','조사관의 힌트','<p>'+hints[chapter][level]+'</p><div class="sheet-actions">'+(level===0?action('hint','다음 힌트','secondary','hint'):chapter===1?action('assist','한 칸 맞추기','secondary','image'):'')+action('close','조사 계속','primary','back')+'</div>');
  hintLevel=Math.min(1,hintLevel+1);
}
function swapTiles(a,b){
  [game.pieces[a],game.pieces[b]]=[game.pieces[b],game.pieces[a]];chosenTile=null;save();tone(440,.18);
}
function submitPuzzle(){
  if(!ready(chapter)||chapter!==game.progress)return;
  let error='';
  if(chapter===0){
    const r=routes.find(x=>x.id===game.route);
    if(!r)error='먼저 운송표 한 장을 선택하세요.';
    else if(!r.tree)error='상자 표찰에는 전나무가 찍혀 있습니다. 작업장 인장을 다시 보세요.';
    else if(r.stripes!==2)error='인장은 맞습니다. 포장공이 기록한 띠의 수를 다시 확인하세요.';
  }else if(chapter===1){
    const correct=game.pieces.filter((n,i)=>n===i).length;
    if(correct!==6)error='여섯 칸 중 '+correct+'칸이 맞습니다. 서로 이어지는 하늘과 옷자락을 찾아보세요.';
  }else if(game.proofs.length!==2)error='인계증에 첨부할 서류 두 장을 선택하세요.';
  else if(!game.proofs.includes(1))error='운송·보관 기록만으로는 원래 소장처를 알 수 없습니다. 전쟁 전 대장을 확인하세요.';
  else if(!game.proofs.includes(3))error='원래 소장처는 확인했습니다. 누가 인수할 권한이 있는지도 증명하세요.';
  else if(game.city!=='브뤼셀')error='위임장에 적힌 벨기에 대표단의 인수 도시를 확인하세요.';
  if(error){tone(174,.2);puzzleUpdate(error,'[data-act="submit"]');return;}
  game.progress=chapter+1;game.resume='field';save();
  tone(349,.55);tone(440,.55,.12);tone(523,.7,.27);
  const c=chapters[chapter];move('field');
  modal('solved','현장 '+chapterNo(chapter)+'　/　조사 완료',c.done,(chapter===1?'<img class="preview-img original" src="./assets/ghent.jpg" alt="복원한 대조 사진. 중앙 아래에 분수가 보인다.">':'<div class="completion-mark">'+icon(chapter===0?'compass':'seal')+'</div>')+'<p>'+c.conclusion+'</p><div class="sheet-actions">'+action(chapter===2?'ending':'next',c.lead,'primary',chapter===2?'mail':'compass')+'</div>');
}
function endingScreen(){
  const extras=memories.filter((_,i)=>has(i,2));
  return '<section class="ending page"><div class="location-bar">'+action('home','작전 경로','text-btn','back')+'<span>EPILOGUE</span></div><div class="field-title"><div class="eyebrow">1945년 8월　·　벨기에로 보낸 편지</div><h1>분수는 그대로야</h1></div><div class="ending-grid"><figure><img src="./assets/ghent.jpg" alt="헨트 제단화의 중앙 하단 패널. 푸른 들판 앞에 분수가 솟아 있다."><figcaption>반 에이크 형제, 《신비한 어린양에 대한 경배》 중앙 하단 패널 · 1432</figcaption></figure><div class="ending-letter"><small>브뤼셀에서 헨트로</small><p>리네에게,</p><p>분수는 그대로야. 광산에서 덮개를 걷었을 때, 네가 그려 보낸 돌받침을 제일 먼저 알아봤어. 오늘 그림이 벨기에 사람들의 손에 돌아갔단다.</p>'+extras.map(t=>'<p>'+t+'</p>').join('')+'<p>다음 일요일엔 네가 센 물줄기가 몇 개인지 내게도 알려 주겠니?</p><p class="signature">너의 조사관이</p></div></div><div class="ending-foot"><span>'+icon('mail')+'개인 기록 '+extras.length+' / 3'+(extras.length<3?' · 지나간 현장에서 더 찾을 수 있어요.':' · 세 현장의 기억을 모두 담았습니다.')+'</span><div>'+action('history','실제 반환 기록','secondary','book')+action('home','작전 경로로','primary','compass')+'</div></div></section>';
}
function start(){
  if(game.progress===3){move('ending',2);return;}
  if(!game.started){showIntro();return;}
  move(game.resume==='puzzle'&&ready(game.progress)?'puzzle':'field',game.progress);
}
let immersiveTried=false;
function mobileLandscape(){
  if(immersiveTried||!matchMedia('(orientation: landscape) and (pointer: coarse) and (max-height: 540px)').matches)return;
  immersiveTried=true;
  if(document.fullscreenEnabled&&!document.fullscreenElement)document.documentElement.requestFullscreen().catch(()=>{});
}
async function fullscreen(){
  closeSheet();
  try {
    if(document.fullscreenElement)await document.exitFullscreen();
    else if(document.webkitFullscreenElement)document.webkitExitFullscreen();
    else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
    else document.documentElement.webkitRequestFullscreen();
  }catch{modal('fullscreen','화면 설정','전체 화면 전환','<p>이 브라우저에서는 현재 전체 화면 전환을 사용할 수 없습니다. 기기를 돌려 가로 또는 세로로 플레이할 수 있습니다.</p>');}
}
document.addEventListener('click',e=>{
  const button=e.target.closest('button[data-act]');if(!button)return;
  const a=button.dataset.act, i=Number(button.dataset.i), id=button.dataset.id;
  if(game.sound)enableAudio();
  if(['start','begin','enter','puzzle','clue','tile'].includes(a))mobileLandscape();
  switch(a){
    case 'start':start();break;
    case 'begin':game.started=true;game.resume='field';save();move('field',0);break;
    case 'home':move('home');break;
    case 'guide':showGuide();break;
    case 'chapter':showChapter(i);break;
    case 'enter':if(i<=game.progress){if(!game.started)showIntro();else move('field',i);}break;
    case 'field':game.resume='field';save();move('field');break;
    case 'clue':if(view==='field')showClue(i);break;
    case 'puzzle':if(ready(chapter)&&chapter===game.progress){game.resume='puzzle';save();move('puzzle');}break;
    case 'next':if(chapter<2&&game.progress>chapter)move('field',chapter+1);break;
    case 'ending':if(game.progress===3)move('ending',2);break;
    case 'journal':showJournal();break;
    case 'settings':showSettings();break;
    case 'close':closeSheet();break;
    case 'history':showHistory();break;
    case 'hint':showHint();break;
    case 'assist':{
      const dest=game.pieces.findIndex((n,k)=>n!==k);
      if(dest>=0)swapTiles(dest,game.pieces.indexOf(dest));
      closeSheet();puzzleUpdate(dest>=0?(dest+1)+'번 칸에 맞는 사진을 놓았습니다.':'사진이 완성됐습니다. 사진 대조를 눌러 보세요.','[data-act="submit"]');break;
    }
    case 'route':game.route=id;save();puzzleUpdate('','[data-id="'+id+'"]');tone(330);break;
    case 'tile':{
      if(chosenTile===i)chosenTile=null;
      else if(chosenTile===null)chosenTile=i;
      else swapTiles(chosenTile,i);
      puzzleUpdate(chosenTile===null?'':(i+1)+'번 칸 선택. 바꿀 칸을 누르세요.','[data-act="tile"][data-i="'+i+'"]');break;
    }
    case 'proof':{
      let msg='';
      if(game.proofs.includes(i))game.proofs=game.proofs.filter(n=>n!==i);
      else if(game.proofs.length<2)game.proofs.push(i);
      else msg='이미 두 장을 골랐습니다. 바꿀 서류를 눌러 선택을 해제하세요.';
      save();puzzleUpdate(msg,'[data-act="proof"][data-i="'+i+'"]');break;
    }
    case 'city':game.city=id;save();puzzleUpdate('','[data-id="'+id+'"]');break;
    case 'submit':submitPuzzle();break;
    case 'sound':case 'sound-setting':
      game.sound=!game.sound;save();updateSound();
      if(game.sound){enableAudio();tone(349,.55);tone(523,.7,.16);}
      if(a==='sound-setting')showSettings();break;
    case 'fullscreen':fullscreen();break;
    case 'reset-confirm':
      modal('reset','진행 기록','처음부터 다시 시작할까요?','<p>이 브라우저에 저장한 단서와 편지가 지워집니다.</p><div class="sheet-actions">'+action('settings','기록 유지','secondary','back')+action('reset','새 작전 시작','primary','flag')+'</div>');break;
    case 'reset':{const sound=game.sound;game=fresh();game.sound=sound;save();move('home',0);showIntro();break;}
  }
});
updateSound();render();
