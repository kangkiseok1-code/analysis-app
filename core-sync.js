/* core-sync.js — 공용 출생정보(core_profiles)와 이 앱 프로필을 자동으로 맞춘다. 동의한 사람만(공용 정보가 있을 때만 호출).
 * index.html의 전역(sb, me, profile, coreRow, hasBirth, coreAsProfile, coreToast)을 그대로 쓴다. */
async function coreQuietSync(){
  const a=coreAsProfile(coreRow);
  const f={ calendar:a.calendar, leap:a.leap, birth_y:a.birth_y, birth_mo:a.birth_mo, birth_d:a.birth_d, birth_h:a.birth_h, birth_min:a.birth_min, time_unknown:a.time_unknown };
  if(a.birth_city) f.birth_city=a.birth_city;
  if(a.gender) f.gender=a.gender;
  try{ const { error }=await sb.from('profiles').update(f).eq('id', me.id); if(!error){ Object.assign(profile,f); coreToast('자림에 저장된 정보로 맞췄어요'); } }catch(e){}
}
// 이 앱에서 고친 값을 공용 정보에도 바로 반영(동의한 사람만, 조용히)
async function corePush(f){
  if(!sb||!me||!coreRow||!hasBirth(f)) return;
  const unk=!!f.time_unknown||f.birth_h==null;
  const row={ user_id:me.id, gender:f.gender==='male'||f.gender==='female'?f.gender:coreRow.gender, calendar:f.calendar==='lunar'?'lunar':'solar', leap:f.calendar==='lunar'&&!!f.leap,
    birth_y:f.birth_y, birth_mo:f.birth_mo, birth_d:f.birth_d, birth_h:unk?null:f.birth_h, birth_min:unk?null:(f.birth_min||0), time_unknown:unk, birth_city:f.birth_city||null };
  try{ const r=await sb.from('core_profiles').upsert(row,{onConflict:'user_id'}).select().maybeSingle(); if(!r.error) coreRow=r.data||Object.assign({},coreRow,row); }catch(e){}
}
