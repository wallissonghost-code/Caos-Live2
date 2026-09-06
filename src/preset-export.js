(()=>{'use strict';
const PREFIX='daniel.live.plus.v2';
const LEGACY_RULES_KEY=`${PREFIX}.rules`;
const RULE_PROFILES_KEY=`${PREFIX}.rulesByGame`;
const ACTIVE_GAME_KEY=`${PREFIX}.activeGameId`;
const button=()=>document.getElementById('exportGamePreset');
const notice=(text,tone='neutral')=>{const el=document.getElementById('connectorNotice');if(!el)return;el.dataset.tone=tone;el.innerHTML=`<span class="noticeDot"></span><span>${text}</span>`};
const safeName=value=>String(value||'jogo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase()||'jogo';
const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const readJSON=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key));return value??fallback}catch{return fallback}};
const cleanRules=value=>(Array.isArray(value)?value:[]).filter(rule=>rule&&!rule.__profileMarker);
function resolveRules(manifest){
  const gameId=String(manifest?.gameId||'').trim();
  const activeId=String(readJSON(ACTIVE_GAME_KEY,'')||'').trim();
  const profiles=readJSON(RULE_PROFILES_KEY,{});
  if(profiles&&typeof profiles==='object'&&!Array.isArray(profiles)){
    const direct=cleanRules(profiles[gameId]);if(direct.length)return{rules:direct,profileId:gameId,source:'manifest'};
    const active=cleanRules(profiles[activeId]);if(active.length)return{rules:active,profileId:activeId,source:'active'};
    const wantedName=norm(manifest?.name||manifest?.gameName||'');
    if(wantedName){for(const [id,list] of Object.entries(profiles)){const rules=cleanRules(list);if(rules.some(r=>norm(r.gameName)===wantedName))return{rules,profileId:id,source:'name'}}}
    const nonEmpty=Object.entries(profiles).map(([id,list])=>[id,cleanRules(list)]).filter(([,rules])=>rules.length);
    if(nonEmpty.length===1)return{rules:nonEmpty[0][1],profileId:nonEmpty[0][0],source:'single-profile'};
  }
  const legacy=cleanRules(readJSON(LEGACY_RULES_KEY,[]));
  const matched=legacy.filter(rule=>String(rule?.gameId||'')===gameId||String(rule?.gameId||'')===activeId);
  return{rules:matched.length?matched:legacy,profileId:gameId||activeId,source:matched.length?'legacy-match':'legacy'};
}
async function deliverPreset(preset,rules){
  const filename=`${safeName(preset.game.name)}.preset.json`;
  const json=JSON.stringify(preset,null,2);
  const file=new File([json],filename,{type:'application/json'});
  if(navigator.canShare?.({files:[file]})&&navigator.share){
    try{await navigator.share({files:[file],title:`Preset ${preset.game.name}`});return 'share'}catch(error){if(error?.name!=='AbortError')console.warn('[preset-export] share failed',error);if(error?.name==='AbortError')return 'cancel'}
  }
  const blob=new Blob([json],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);return 'download';
}
async function exportPreset(){
  const b=button();if(b.disabled)return;
  const manifest=window.LivePlusMatch?.getManifest?.();
  if(!manifest?.gameId){notice('Conecte um jogo antes de salvar o preset.','error');return}
  const resolved=resolveRules(manifest),rules=resolved.rules;
  if(!rules.length){notice(`Nenhuma regra encontrada para ${manifest.name||manifest.gameName||'este jogo'}. Abra Gatilhos e salve uma regra primeiro.`,'error');return}
  const preset={format:'liveplus-game-preset',version:1,game:{id:String(manifest.gameId),name:String(manifest.name||manifest.gameName||'Jogo'),version:String(manifest.version||''),icon:String(manifest.icon||'')},exportedAt:new Date().toISOString(),rules:rules.map(({id,__profileMarker,...rule})=>({...rule,gameId:String(manifest.gameId),gameName:String(rule.gameName||manifest.name||manifest.gameName||'Jogo')}))};
  if(b){b.disabled=true;b.textContent='GERANDO…'}
  try{
    const mode=await deliverPreset(preset,rules);
    if(mode==='cancel'){notice('Exportação cancelada.');return}
    notice(`Preset de ${preset.game.name} pronto com ${rules.length} regra${rules.length===1?'':'s'}.`,'ok');
    if(b)b.textContent='PRESET SALVO ✓';
  }catch(error){console.error('[preset-export]',error);notice(`Erro ao exportar preset: ${error?.message||error}`,'error')}
  finally{setTimeout(()=>{if(b){b.disabled=false;b.textContent='SALVAR PRESET'}},1600)}
}
function bind(){const b=button();if(!b||b.dataset.presetExportBound==='1')return;b.dataset.presetExportBound='1';b.addEventListener('click',exportPreset)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
window.LivePlusPresetExport={exportPreset,resolveRules};
})();