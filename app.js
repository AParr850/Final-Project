function recommendationIcon(result){
 const icons={
  Pass:{label:'Seed — Pass',paths:'<path d="M18 5C10 3 4 9 6 16c7 3 14-3 12-11Z"/><path d="m9 14 6-6"/>'},
  Consider:{label:'Seedling — Consider',paths:'<path d="M12 21V11M6 21h12"/><path d="M12 14C5 14 3 10 3 6c6 0 9 3 9 8ZM12 10c0-5 3-7 9-7 0 5-3 8-9 8"/>'},
  Pursue:{label:'Budding flower — Pursue',paths:'<path d="M12 21V11M12 17c-4 0-6-2-6-5 4 0 6 2 6 5ZM12 19c4 0 6-2 6-5-4 0-6 2-6 5Z"/><path d="M12 11C7 11 6 7 7 4l3 2 2-4 2 4 3-2c1 3 0 7-5 7Z"/>'}
 };
 const icon=icons[result]||icons.Consider;
 return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${icon.label}">${icon.paths}</svg>`;
}
function grantWebsiteLink(value){
 if(typeof value!=='string'||!value.trim())return '';
 try{const url=new URL(value.trim());if(!['https:','http:'].includes(url.protocol))return '';return `<a class="grant-website" href="${escape(url.href)}" target="_blank" rel="noopener noreferrer">Visit grant website ↗</a>`;}catch{return '';}
}
const seeds=[{id:'1',name:'Community Impact Fund',funder:'The Oakwood Foundation',amount:75000,deadline:'2027-02-15',fit:5,hours:35,rate:40,probability:30,eligible:'yes',saved:false},{id:'2',name:'Youth Futures Initiative',funder:'Bright Horizons Trust',amount:50000,deadline:'2027-03-01',fit:5,hours:30,rate:40,probability:30,eligible:'yes',saved:false},{id:'3',name:'Neighborhood Growth Grant',funder:'Civic Together Foundation',amount:25000,deadline:'2027-03-20',fit:3,hours:40,rate:40,probability:20,eligible:'yes',saved:false},{id:'4',name:'Arts & Culture Catalyst',funder:'The Westbridge Fund',amount:40000,deadline:'2027-04-10',fit:1,hours:60,rate:40,probability:15,eligible:'yes',saved:false}];let grants=structuredClone(seeds),currentUser=null,editingGrant=null;window.addEventListener('accountchange',event=>{if(currentUser?.uid!==event.detail.user?.uid){editingGrant=null;$('#form-dialog').close();$('#form').reset();}currentUser=event.detail.user;grants=currentUser?event.detail.grants:structuredClone(seeds);render();});let page='Overview';const $=s=>document.querySelector(s),money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));async function persist(g){await window.grantAccount.saveGrant(g);}function render(){$('#guest-assessment-note').hidden=!!currentUser;const pursued=grants.filter(g=>assess(g).result==='Pursue');$('#total').textContent=grants.length;$('#nav-count').textContent=grants.length;$('#pursue').innerHTML=pursued.length+' <small>strong fits</small>';$('#funding').textContent=money(pursued.reduce((sum,g)=>sum+Number(g.amount),0));const shown=page==='Saved opportunities'?grants.filter(g=>g.saved):grants;$('#rows').innerHTML=shown.length?shown.map(g=>{const a=assess(g);return `<tr><td><span class="grant-icon">${recommendationIcon(a.result)}</span><div><strong>${escape(g.name)}</strong><small>${escape(g.funder)}</small></div></td><td>${money(g.amount)}</td><td>${new Date(g.deadline+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td><td><span class="fit">${g.fit==5?'Strong':g.fit==3?'Moderate':'Low'}</span></td><td><span class="badge ${a.result.toLowerCase()}">${a.result==='Pursue'?'↗ ':a.result==='Consider'?'◷ ':'− '}${a.result}</span>${grantWebsiteLink(g.website)}</td><td><div class="grant-actions"><button class="row-button" data-id="${escape(g.id)}" aria-label="View ${escape(g.name)}">↗</button>${currentUser?`<button type="button" data-edit="${escape(g.id)}" aria-label="Edit ${escape(g.name)}">Edit</button><button type="button" class="delete-grant" data-delete="${escape(g.id)}" aria-label="Delete ${escape(g.name)}">Delete</button>`:''}</div></td></tr>`;}).join(''):`<tr><td colspan="6" class="empty">${page==='Saved opportunities'?'No saved opportunities yet. Open an assessment and save it here.':'No assessments yet. Assess a grant to get started.'}</td></tr>`;document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>detail(grants.find(g=>g.id===b.dataset.id)));document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editGrant(b.dataset.edit));document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteGrant(b.dataset.delete,b));}const pageRoutes={'Overview':'#overview','Award probability':'#award-probability','Grant assessments':'#grant-assessments','Saved opportunities':'#saved-opportunities'};
function navigate(next){
 if(!pageRoutes[next])next='Overview';
 page=next;
 if(next==='Award probability')document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
 if(location.hash!==pageRoutes[next])location.hash=pageRoutes[next];
 const overview=next==='Overview',probability=next==='Award probability';
 $('#page-label').textContent=next;
 $('#page-title').innerHTML=overview?'Plant wisely.<br>Grow boldly.':escape(next);
 $('#section-title').textContent=next;
 $('.title-row p').textContent=probability?'Explore how award rates, mission fit, and funder relationships affect your estimate.':overview?'Spend less time chasing grants. More time changing lives.':next==='Grant assessments'?'Review your grant assessments and decide what to pursue.':'Keep track of the opportunities you want to revisit.';
 for(const selector of ['.hero','.insight','#overview-assessments','#assessment-guide'])$(selector).hidden=!overview;
 $('.assessments').hidden=overview||probability;
 $('.stats').hidden=overview||probability;
 $('#probability-page').hidden=!probability;
 for(const selector of ['.content>.eyebrow','.title-row','#sync-status','footer'])$(selector).hidden=probability;
 $('.title-row .new').hidden=probability;
 $('#view-all').hidden=true;
 document.querySelectorAll('[data-page]').forEach(b=>{const active=b.dataset.page===next;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 render();
}
function routeFromHash(){navigate(Object.keys(pageRoutes).find(name=>pageRoutes[name]===location.hash)||'Overview');}
window.addEventListener('hashchange',routeFromHash);
function detail(g){const a=assess(g);$('#detail').innerHTML=`<div class="eyebrow">YOUR GRANT ASSESSMENT</div><h2>${escape(g.name)}</h2><p>${escape(g.funder)}</p><span class="badge ${a.result.toLowerCase()}">${a.result}</span><p>${a.reason}</p>${grantWebsiteLink(g.website)}<ul><li>Potential funding: <strong>${money(g.amount)}</strong></li><li>Estimated application cost: <strong>${money(a.cost)}</strong> (${g.hours} hours)</li>${a.expected===null?`<li>Award probability: <strong>Unknown</strong></li><li>Probability-weighted funding: <strong>Not available</strong></li><li>Break-even award chance: <strong>${a.breakEven.toFixed(2)}%</strong> to cover application effort only</li>`:`<li>Probability-weighted funding: <strong>${money(a.expected)}</strong></li><li>Expected funding less application cost: <strong>${money(a.expected-a.cost)}</strong></li>`}</ul><p>This estimate excludes program delivery costs, restrictions, reporting, and matching requirements. Confirm these with the funder before committing.</p><p><a class="probability-shortcut" href="#award-probability" data-open-probability>Explore award probability ↗</a></p><button class="save" id="save-grant">${g.saved?'✓ Saved · remove from saved':'＋ Save opportunity'}</button><p>Next step: ${a.result==='Pursue'?'Review allowable costs and reporting requirements, then assign an application owner.':a.result==='Consider'?'Contact the funder and confirm fit, eligibility, and your team’s capacity.':'Focus on better-aligned opportunities or revisit if the requirements change.'}</p>`;$('#save-grant').onclick=async()=>{if(!currentUser){$('#detail-dialog').close();$('#open-account').click();return;}const button=$('#save-grant');button.disabled=true;try{const updated={...g,saved:!g.saved};await persist(updated);g.saved=updated.saved;button.textContent=g.saved?'✓ Saved · remove from saved':'＋ Save opportunity';}catch{alert('Could not save this opportunity. Check your connection and try again.');}finally{button.disabled=false;}};$('#detail-dialog').showModal();}document.querySelectorAll('.new').forEach(b=>b.onclick=()=>{if(!currentUser){$('#open-account').click();return;}editingGrant=null;$('#form').reset();$('#form-dialog h2').textContent='Let us help you decide where to plant your efforts';$('#form .submit').textContent='Get my recommendation ↗';$('#form-dialog').showModal();});$('.close').onclick=()=>$('#form-dialog').close();$('#back').onclick=()=>$('#detail-dialog').close();document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>navigate(b.dataset.page));$('#view-all').onclick=()=>navigate('Grant assessments');$('#overview-assessments').onclick=()=>navigate('Grant assessments');$('#form').onsubmit=async e=>{e.preventDefault();if(!currentUser)return;const owner=currentUser.uid;const g={...(editingGrant||{}),...Object.fromEntries(new FormData(e.target))};g.id=editingGrant?.id||crypto.randomUUID();g.createdAt=editingGrant?.createdAt??Date.now();g.saved=editingGrant?.saved??false;const button=e.target.querySelector('.submit');button.disabled=true;try{await persist(g);if(currentUser?.uid!==owner)return;const index=grants.findIndex(item=>item.id===g.id);if(index<0)grants.unshift(g);else grants[index]=g;render();editingGrant=null;$('#form-dialog').close();e.target.reset();detail(g);}catch{alert('Your assessment could not be saved. Your form is still here; check your connection and try again.');}finally{button.disabled=false;}};document.querySelectorAll('.guide').forEach(b=>b.onclick=()=>{$('#detail').innerHTML='<div class="eyebrow">THE DECISION GUIDE</div><h2>Put your mission first.</h2><p>A great grant helps you do more of the work that matters.</p><ul><li><strong>Check eligibility.</strong> Confirm your location, legal status, program, and funding needs qualify.</li><li><strong>Protect your focus.</strong> Prioritize work that directly serves your mission.</li><li><strong>Count the full cost.</strong> Include application time, matching funds, delivery, and reporting.</li><li><strong>Be realistic about odds.</strong> Use funder award rates when available. An estimate is not a guarantee.</li><li><strong>Check your capacity.</strong> Agree who will apply and who will deliver before committing.</li></ul><p>The dashboard starts with four illustrative opportunities. Replace them with your own assessments; funding totals are potential awards, not guaranteed income.</p>';$('#detail-dialog').showModal();});routeFromHash();

$('#probability-form').addEventListener('submit',event=>{event.preventDefault();showAwardEstimate();const result=$('.probability-estimate');result.hidden=false;result.focus({preventScroll:true});result.scrollIntoView({behavior:'smooth',block:'nearest'});});

document.addEventListener('click',event=>{if(event.target.closest('[data-open-probability]')){event.preventDefault();navigate('Award probability');}});

function awardEstimate(){
 const awards=Number($('#probability-awards').value),applicants=Number($('#probability-applicants').value);
 if(applicants<=0||awards>applicants)return null;
 return Math.min(100,awards/applicants*Number($('#probability-fit').value)*Number($('#probability-relationship').value)*100);
}
function showAwardEstimate(){
 const estimate=awardEstimate();
 $('#award-estimate').textContent=estimate===null?'Awards cannot exceed applicants. Check counts from the same funding round.':`Estimated award chance: ${Number(estimate.toFixed(2))}% (planning estimate)`;
 $('#use-award-estimate').disabled=estimate===null;
 const awards=Number($('#probability-awards').value),applicants=Number($('#probability-applicants').value),fit=Number($('#probability-fit').value),relationship=Number($('#probability-relationship').value);
 const raw=awards/applicants*fit*relationship*100;
 $('#award-calculation').textContent=estimate===null?'':`(${awards} ÷ ${applicants}) × ${fit} × ${relationship} × 100 = ${Number(raw.toFixed(2))}%`+(raw>100?' · displayed estimate capped at 100%':'');
}
$('#probability-form').addEventListener('change',showAwardEstimate);
$('#use-award-estimate').onclick=()=>{
 const estimate=awardEstimate();if(estimate===null)return;
 if(!currentUser){$('#open-account').click();return;}
 if(!editingGrant){$('#form-dialog h2').textContent='Let us help you decide where to plant your efforts';$('#form .submit').textContent='Get my recommendation ↗';}
 $('#form').elements.probability.value=Number(estimate.toFixed(2));
 $('#form-dialog').showModal();
};
showAwardEstimate();

function renderAccountOverview(){
 const profile=$('#profile-form').elements;
 for(const key of ['name','organization','mission','website'])$('#overview-'+key).textContent=profile.namedItem(key).value||'Not provided';
 $('#overview-email').textContent=currentUser?.email||'Not provided';
 $('#overview-grant-count').textContent=grants.length;
 $('#overview-saved-count').textContent=grants.filter(g=>g.saved).length;
}
$('#open-account-overview').onclick=()=>{
 if(!currentUser){$('#open-account').click();return;}
 renderAccountOverview();$('#account-overview-dialog').showModal();
};
$('#close-account-overview').onclick=()=>$('#account-overview-dialog').close();
$('#overview-edit-profile').onclick=()=>{
 $('#account-overview-dialog').close();if(currentUser)$('#edit-profile').click();
};
window.addEventListener('accountchange',()=>{
 $('#account-overview-dialog').close();
 document.querySelectorAll('.account-overview-details dd').forEach(el=>el.textContent='');
});
window.addEventListener('profilechange',()=>{if(currentUser&&$('#account-overview-dialog').open)renderAccountOverview();});

function editGrant(id){
 if(!currentUser)return;
 const grant=grants.find(item=>item.id===id);if(!grant)return;
 editingGrant={...grant};const form=$('#form');form.reset();
 for(const [name,value]of Object.entries(grant)){const field=form.elements.namedItem(name);if(field)field.value=value??'';}
 $('#form-dialog h2').textContent='Edit grant assessment';
 $('#form .submit').textContent='Save changes';
 $('#form-dialog').showModal();
}
async function deleteGrant(id,button){
 if(!currentUser)return;
 const grant=grants.find(item=>item.id===id);if(!grant)return;
 if(!confirm(`Delete "${grant.name}"? This removes the assessment from Grant assessments and Saved opportunities and cannot be undone.`))return;
 const owner=currentUser.uid;button.disabled=true;
 try{
  await window.grantAccount.deleteGrant(id);
  if(currentUser?.uid!==owner)return;
  grants=grants.filter(item=>item.id!==id);render();
 }catch{if(currentUser?.uid===owner)alert('Could not delete this assessment. Your grant is still here; check your connection and try again.');}
 finally{button.disabled=false;}
}
