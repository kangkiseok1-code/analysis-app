/* checkin-cards.js — 분석 '사주' 칸 맨 끝의 두 카드
 *  1) 달력과 내 하루는 얼마나 맞았을까요: 운세 체크인 달력에서 남긴 내 점수를 그날 발복점수 구간별로 평균 낸다
 *  2) 상담사와 이야기해 보세요: 심화상담 신청으로 이어지는 지름길
 * analysis-app/index.html 의 전역(me, sb, esc, HUB)을 쓴다. 읽기만 하고 아무것도 바꾸지 않는다. */
const CK_LOTTO='https://kangkiseok1-code.github.io/lotto-app/';
const CK_COUNSEL='https://kangkiseok1-code.github.io/counsel-tool/';
const CK_GOAL=20;            // 이만큼 쌓이면 "더 믿을 만해요"
const CK_BANDS=[['높은 날 8~10',8,10],['보통 4~7',4,7],['낮은 날 1~3',1,3]];

function ckSlotHtml(){ return '<div id="ck-slot">'+SKEL+'</div>'; }

/* rows: [{score, luck}] → 구간별 {label, n, avg}. 순수 계산이라 따로 시험할 수 있다 */
function ckBands(rows){
  return CK_BANDS.map(([label,lo,hi])=>{
    const xs=rows.filter(r=>r.luck>=lo&&r.luck<=hi).map(r=>r.score);
    return {label,n:xs.length,avg:xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null};
  });
}
function ckVerdict(b){
  const hi=b[0], lo=b[2];
  if(hi.n<3||lo.n<3) return '아직 기록이 적어서 말하기 일러요. 높은 날과 낮은 날 모두 3일 이상 쌓이면 비교해 드려요.';
  const d=hi.avg-lo.avg;
  if(d>=0.5) return '발복점수가 높다던 날 내 점수도 더 높았어요. 기록이 더 쌓이면 정확해져요.';
  if(d<=-0.5) return '달력과 반대로 느낀 날이 많았어요. 달력은 참고용이고, 내 하루가 먼저예요.';
  return '높은 날과 낮은 날의 차이가 크지 않았어요. 기록이 더 쌓이면 달라질 수 있어요.';
}
function ckCompareHtml(all,rows){
  const total=all.length, n=rows.length;
  if(!total) return `<div class="card"><h2><span class="seal">◆</span> 달력과 내 하루</h2>
    <p class="sub">운세 체크인 달력에 오늘 하루를 점수로 남기면, 달력의 발복점수와 내 하루가 얼마나 맞았는지 여기서 비교해 드려요.</p>
    <div style="text-align:center;margin-top:10px"><a class="btn ghost" href="${CK_LOTTO}" style="text-decoration:none;display:inline-block">달력에 기록하러 가기</a></div></div>`;
  const b=ckBands(rows);
  const bars=b.map(x=>`<div class="bar"><div class="name" style="width:96px">${x.label}</div><div class="track"><div class="fill" style="width:${x.avg==null?0:Math.round(x.avg*10)}%"></div></div><div class="val" style="width:64px">${x.avg==null?'기록 없음':x.avg.toFixed(1)}</div></div>`).join('');
  const pct=Math.min(100,Math.round(n/CK_GOAL*100));
  return `<div class="card"><h2><span class="seal">◆</span> 달력과 내 하루는 얼마나 맞았을까요</h2>
    <p class="sub" style="margin:-2px 0 8px">내 기록 ${total}일 · 비교에 쓴 날 ${n}일 (발복점수가 함께 남은 날)</p>
    <div class="prof-sub">발복점수 구간별 내 점수 평균</div>${bars}
    <p class="sub" style="margin-top:8px">${esc(ckVerdict(b))}</p>
    <div class="prof-sub" style="margin-top:12px">기록이 쌓이는 중</div>
    <div class="track" style="height:9px"><div class="fill" style="width:${pct}%"></div></div>
    <p class="sub fine" style="font-size:.8rem;margin-top:4px">${n} / ${CK_GOAL}일 · ${CK_GOAL}일이 되면 비교가 더 믿을 만해져요. 이 비교는 참고용이에요.</p></div>`;
}
function ckCounselHtml(counts,state){
  const mine=counts.walk?`지금 저장된 걷기 기록 ${counts.walk}곳과 성향·대인 결과를 `:'걷기 기록과 성향·대인 결과를 ';
  const approved=state==='approved', pending=state==='pending';
  const cta=approved?`<a class="btn" href="${CK_COUNSEL}" style="text-decoration:none;display:block;text-align:center">심화상담 열기</a>`
    :pending?`<a class="btn" href="${HUB}?apply=counsel" style="text-decoration:none;display:block;text-align:center">신청 상태 보기</a>`
    :`<a class="btn" href="${HUB}?apply=counsel" style="text-decoration:none;display:block;text-align:center">심화상담 신청하기</a>`;
  return `<div class="card" style="border-color:var(--gold)"><h2><span class="seal">◆</span> 이 흐름을 상담사와 이야기해 보세요</h2>
    <p class="sub" style="margin:0 0 10px">${mine}상담을 보낼 때 항목마다 직접 골라 함께 보낼 수 있어요. 고르지 않은 것은 전달되지 않아요.${approved?'':' 심화상담은 상담사가 승인한 회원만 이용할 수 있어요.'}</p>${cta}</div>`;
}
async function loadCkCards(){
  const slot=document.getElementById('ck-slot'); if(!slot||!sb||!me) return;
  const uid=me.id; let all=[], rows=[], walk=0, state=null;
  try{
    const c=await sb.from('daily_checkins').select('day,score,luck').eq('user_id',uid);
    if(c.error){ const c2=await sb.from('daily_checkins').select('day,score').eq('user_id',uid); all=(c2.data||[]).filter(r=>r.score); }   // luck 칸이 아직 없으면 비교는 못 하고 일수만
    else{ all=(c.data||[]).filter(r=>r.score); rows=all.filter(r=>r.luck); }
    const w=await sb.from('journey_answers').select('year',{count:'exact',head:true}).eq('user_id',uid); walk=w.count||0;
    const q=await sb.from('app_access').select('status').eq('app','counsel').eq('user_id',uid).maybeSingle(); state=q.data?q.data.status:null;
    const a=await sb.rpc('is_jalim_admin'); if(a.data===true) state='approved';
  }catch(e){}
  if(!me||me.id!==uid||!document.getElementById('ck-slot')) return;
  slot.outerHTML=ckCompareHtml(all,rows)+ckCounselHtml({walk,checkin:all.length},state);
}
