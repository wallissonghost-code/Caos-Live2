(()=>{'use strict';
const PREFIX='daniel.live.plus.v2';
const LEGACY_RULES_KEY=`${PREFIX}.rules`;
const RULE_PROFILES_KEY=`${PREFIX}.rulesByGame`;
const button=()=>document.getElementById('exportGamePreset');
const notice=(text)=>{const el=document.getElementById('connectorNotice');if(!el)return;el.dataset.tone='neutral';el.innerHTML=`<span class="noticeDot"></span><span>${text}</span>`};
const safeName=value=>String(value||'jogo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase()||'jogo';
const readJSON=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key));return value??fallback}catch{return fallback}};
function readRulesForGame(gameId){
  const id=String(gameId||'').trim();if(!id)return[];
  const profiles=readJSON(RULE_PROFILES_KEY,{});
  if(profiles&&typeof profiles==='object'&&!Array.isArray(profiles)&&Array.isArray(profiles[id]))return profiles[id].filter(rule=>rule&&!rule.__profileMarker);
  const legacy=readJSON(LEGACY_RULES_KEY,[]);
  return Array.isArray(legacy)?legacy.filter(rule=>String(rule?.gameId||'')===id&&!rule?.__profileMarker):[];
}
function exportPreset(){
  const manifest=window.LivePlusMatch?.getManifest?.();
  if(!manifest?.gameId){notice('Conecte um jogo antes de salvar o preset.');return}
  const rules=readRulesForGame(manifest.gameId);
  if(!rules.length){notice(`Nenhuma regra configurada para ${manifest.name||manifest.gameName||'este jogo'}.`);return}
  const preset={
    format:'liveplus-game-preset',
    version:1,
    game:{id:String(manifest.gameId),name:String(manifest.name||manifest.gameName||'Jogo'),version:String(manifest.version||''),icon:String(manifest.icon||'')},
    exportedAt:new Date().toISOString(),
    rules:rules.map(({id,...rule})=>({...rule}))
  };
  const blob=new Blob([JSON.stringify(preset,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`${safeName(preset.game.name)}.preset.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  const b=button();if(b){const original=b.textContent;b.textContent='PRESET SALVO ✓';setTimeout(()=>{b.textContent=original},1600)}
  notice(`Preset de ${preset.game.name} exportado com ${rules.length} regra${rules.length===1?'':'s'}.`);
}
function bind(){const b=button();if(!b||b.dataset.presetExportBound==='1')return;b.dataset.presetExportBound='1';b.addEventListener('click',exportPreset)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();