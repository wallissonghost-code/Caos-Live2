(()=>{'use strict';
const PREFIX='daniel.live.plus.v2',GAME_ID='frutas';
const RULES_KEY=`${PREFIX}.rulesByGame`,META_KEY=`${PREFIX}.ruleProfileMeta`,MIGRATION_KEY=`${PREFIX}.migrations.frutas-central-preset-v1`;
try{
  if(localStorage.getItem(MIGRATION_KEY)==='1')return;
  const profiles=JSON.parse(localStorage.getItem(RULES_KEY)||'{}');
  const rules=Array.isArray(profiles?.[GAME_ID])?profiles[GAME_ID]:[];
  if(rules.length===0){
    const meta=JSON.parse(localStorage.getItem(META_KEY)||'{}');
    if(meta&&typeof meta==='object'&&meta[GAME_ID]){delete meta[GAME_ID];localStorage.setItem(META_KEY,JSON.stringify(meta));}
  }
  localStorage.setItem(MIGRATION_KEY,'1');
}catch(error){console.warn('Frutas preset profile repair skipped',error);}
})();
