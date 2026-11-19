const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {JSDOM}=require('jsdom');
function setup(url='http://localhost'){const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:'outside-only',url});const w=dom.window;w.structuredClone=structuredClone;w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.eval(fs.readFileSync('scoring.js','utf8'));w.eval(fs.readFileSync('app.js','utf8'));return w;}
test('guests must sign in before creating a grant',()=>{const w=setup();let opened=false;w.document.querySelector('#open-account').onclick=()=>opened=true;w.document.querySelector('.new').click();assert.equal(opened,true);assert.equal(w.document.querySelector('#form-dialog').open,false);w.close();});
test('switching accounts and signing out replaces previous records',()=>{const w=setup();const change=(user,grants)=>w.dispatchEvent(new w.CustomEvent('accountchange',{detail:{user,grants}}));const grant={id:'private-a',name:'Private grant A',funder:'Funder',amount:'50000',deadline:'2099-01-01',fit:'5',hours:'20',rate:'40',probability:'25',eligible:'yes',saved:false};change({uid:'a'},[grant]);assert.match(w.document.querySelector('#rows').textContent,/Private grant A/);change({uid:'b'},[]);assert.doesNotMatch(w.document.querySelector('#rows').textContent,/Private grant A/);assert.equal(w.document.querySelector('#nav-count').textContent,'0');change(null,[]);assert.equal(w.document.querySelector('#nav-count').textContent,'4');assert.doesNotMatch(w.document.querySelector('#rows').textContent,/Private grant A/);w.close();});
test('failed cloud save keeps the assessment form and input',async()=>{const w=setup();w.dispatchEvent(new w.CustomEvent('accountchange',{detail:{user:{uid:'a'},grants:[]}}));w.grantAccount={saveGrant:async()=>{throw Error('offline');}};let warning='';w.alert=t=>warning=t;w.document.querySelector('.new').click();const form=w.document.querySelector('#form');form.elements.name.value='Retain my work';form.elements.funder.value='Foundation';form.elements.amount.value='1000';form.elements.deadline.value='2099-01-01';await form.onsubmit({preventDefault(){},target:form});assert.equal(form.elements.name.value,'Retain my work');assert.equal(w.document.querySelector('#form-dialog').open,true);assert.match(warning,/could not be saved/);assert.equal(form.querySelector('.submit').disabled,false);assert.equal(w.document.querySelector('#nav-count').textContent,'0');w.close();});

test('overview and assessments have separate views and URLs',()=>{
 const w=setup(),d=w.document;
 assert.equal(w.location.hash,'#overview');
 assert.equal(d.querySelector('.hero').hidden,false);
 assert.equal(d.querySelector('.assessments').hidden,true);
 d.querySelector('#overview-assessments').click();
 assert.equal(w.location.hash,'#grant-assessments');
 assert.equal(d.querySelector('.hero').hidden,true);
 assert.equal(d.querySelector('.stats').hidden,false);
 assert.equal(d.querySelector('.assessments').hidden,false);
 assert.equal(d.querySelectorAll('#rows tr').length,4);
 assert.equal(d.querySelector('[data-page="Grant assessments"]').getAttribute('aria-current'),'page');
 d.querySelector('[data-page="Overview"]').click();
 assert.equal(d.querySelector('.assessments').hidden,true);
 assert.equal(d.querySelector('.stats').hidden,true);
 w.close();
});
test('direct assessment URLs and history navigation select the matching page',async()=>{
 const w=setup('http://localhost/#grant-assessments'),d=w.document;
 assert.equal(d.querySelector('#page-label').textContent,'Grant assessments');
 assert.equal(d.querySelector('.assessments').hidden,false);
 w.location.hash='#overview';
 await new Promise(resolve=>w.setTimeout(resolve,20));
 assert.equal(d.querySelector('.assessments').hidden,true);
 w.history.back();
 await new Promise(resolve=>w.setTimeout(resolve,30));
 assert.equal(w.location.hash,'#grant-assessments');
 assert.equal(d.querySelector('.assessments').hidden,false);
 w.close();
});
test('saved opportunities stay separate and filter account records',()=>{
 const w=setup('http://localhost/#saved-opportunities'),d=w.document;
 const grant={id:'one',name:'Saved grant',funder:'Foundation',amount:1000,deadline:'2099-01-01',fit:5,hours:1,rate:40,probability:50,eligible:'yes',saved:true};
 w.dispatchEvent(new w.CustomEvent('accountchange',{detail:{user:{uid:'a'},grants:[grant,{...grant,id:'two',name:'Unsaved grant',saved:false}]}}));
 assert.match(d.querySelector('#rows').textContent,/Saved grant/);
 assert.doesNotMatch(d.querySelector('#rows').textContent,/Unsaved grant/);
 assert.equal(d.querySelector('.hero').hidden,true);
 d.querySelector('[data-page="Grant assessments"]').click();
 assert.equal(d.querySelectorAll('#rows tr').length,2);
 w.close();
});

test('award probability page appears beneath overview and has its own route',()=>{
 const w=setup('http://localhost/#award-probability'),d=w.document;
 const links=[...d.querySelectorAll('nav [data-page]')].map(b=>b.dataset.page);
 assert.deepEqual(links.slice(0,3),['Overview','Award probability','Grant assessments']);
 assert.equal(d.querySelector('#probability-page').hidden,false);
 assert.equal(d.querySelector('.assessments').hidden,true);
 assert.equal(d.querySelector('.hero').hidden,true);
 assert.match(d.querySelector('#award-estimate').textContent,/10%/);
 assert.equal(d.querySelector('.title-row').hidden,true);
 assert.equal(d.querySelector('#sync-status').hidden,true);
 d.querySelector('[data-page="Overview"]').click();
 assert.equal(d.querySelector('#probability-page').hidden,true);
 assert.equal(d.querySelector('.title-row').hidden,false);
 assert.equal(d.querySelector('#sync-status').hidden,false);
 w.close();
});
test('probability page keeps the formula and four selectable variables',()=>{
 const w=setup('http://localhost/#award-probability'),d=w.document;
 assert.equal(d.querySelector('.probability-formula').textContent,'Probability Estimator');
 assert.equal(d.querySelectorAll('#probability-page select').length,4);
 for(const [name,value] of [['awards','20'],['applicants','100'],['fit','1.5'],['relationship','1.25']]){
  const select=d.querySelector('#probability-'+name);select.value=value;
  select.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(select.value,value);
 }
 assert.equal(d.querySelector('#probability-result'),null);
 w.close();
});

test('award probability stays accessible with existing account assessments and after sign-out',()=>{
 const w=setup(),d=w.document;
 const grant={id:'existing',name:'Existing assessment',funder:'Foundation',amount:1000,deadline:'2099-01-01',fit:5,hours:1,rate:40,probability:50,eligible:'yes',saved:true};
 const change=(user,grants)=>w.dispatchEvent(new w.CustomEvent('accountchange',{detail:{user,grants}}));
 change({uid:'returning'},[grant]);
 d.querySelector('[data-page="Grant assessments"]').click();
 d.querySelector('[data-id="existing"]').click();
 assert.equal(d.querySelector('#detail-dialog').open,true);
 d.querySelector('[data-open-probability]').click();
 assert.equal(d.querySelector('#detail-dialog').open,false);
 assert.equal(w.location.hash,'#award-probability');
 assert.equal(d.querySelector('#probability-page').hidden,false);
 change({uid:'returning'},[grant]);
 assert.equal(d.querySelector('#probability-page').hidden,false);
 change(null,[]);
 assert.equal(d.querySelector('#probability-page').hidden,false);
 assert.equal(d.querySelector('[data-page="Award probability"]').getAttribute('href'),'#award-probability');
 w.close();
});
test('successful assessment results provide a working route to award probability',async()=>{
 const w=setup(),d=w.document;
 w.dispatchEvent(new w.CustomEvent('accountchange',{detail:{user:{uid:'account'},grants:[]}}));
 w.grantAccount={saveGrant:async()=>{}};
 d.querySelector('.new').click();
 const form=d.querySelector('#form');
 form.elements.name.value='New assessment';form.elements.funder.value='Foundation';form.elements.amount.value='1000';form.elements.deadline.value='2099-01-01';
 await form.onsubmit({preventDefault(){},target:form});
 assert.equal(d.querySelector('#detail-dialog').open,true);
 d.querySelector('[data-open-probability]').click();
 assert.equal(d.querySelector('#detail-dialog').open,false);
 assert.equal(d.querySelector('#probability-page').hidden,false);
 assert.equal(w.location.hash,'#award-probability');
 w.close();
});

test('unknown probability saves without inventing expected funding',async()=>{
 const w=setup(),d=w.document;
 w.dispatchEvent(new w.CustomEvent('accountchange',{detail:{user:{uid:'a'},grants:[]}}));
 let saved;w.grantAccount={saveGrant:async g=>{saved=g;}};
 d.querySelector('.new').click();const f=d.querySelector('#form');
 f.elements.name.value='Unknown odds';f.elements.funder.value='Foundation';f.elements.amount.value='50000';f.elements.deadline.value='2099-01-01';
 assert.equal(f.elements.probability.required,false);
 assert.equal(f.elements.probability.value,'');
 assert.equal(f.checkValidity(),true);
 await f.onsubmit({preventDefault(){},target:f});
 assert.equal(saved.probability,'');
 assert.match(d.querySelector('#detail').textContent,/Unknown/);
 assert.match(d.querySelector('#detail').textContent,/Not available/);
 assert.match(d.querySelector('#detail').textContent,/Break-even award chance/);
 w.close();
});
test('probability estimate updates and can populate an assessment',()=>{
 const w=setup('http://localhost/#award-probability'),d=w.document;
 w.dispatchEvent(new w.CustomEvent('accountchange',{detail:{user:{uid:'a'},grants:[]}}));
 d.querySelector('#probability-fit').value='1.5';
 d.querySelector('#probability-form').dispatchEvent(new w.Event('change'));
 assert.match(d.querySelector('#award-estimate').textContent,/15%/);
 d.querySelector('#use-award-estimate').click();
 assert.equal(d.querySelector('#form-dialog').open,true);
 assert.equal(d.querySelector('#form').elements.probability.value,'15');
 d.querySelector('#probability-awards').value='200';
 d.querySelector('#probability-form').dispatchEvent(new w.Event('change'));
 assert.equal(d.querySelector('#use-award-estimate').disabled,true);
 w.close();
});

test('calculate button shows the formula using selected values and a percentage',()=>{
 const w=setup('http://localhost/#award-probability'),d=w.document;
 for(const [name,value] of [['awards','20'],['applicants','100'],['fit','1.5'],['relationship','1.25']])d.querySelector('#probability-'+name).value=value;
 d.querySelector('#probability-form button[type="submit"]').click();
 assert.match(d.querySelector('#award-estimate').textContent,/37.5%/);
 assert.equal(d.querySelector('#award-calculation').textContent,'(20 ÷ 100) × 1.5 × 1.25 × 100 = 37.5%');
 assert.equal(d.activeElement,d.querySelector('.probability-estimate'));
 w.close();
});

test('summary cards are omitted only from overview and the standalone probability tool',()=>{
 const w=setup(),d=w.document;
 assert.equal(d.querySelector('.stats').hidden,true);
 for(const page of ['Grant assessments','Saved opportunities']){
  d.querySelector(`[data-page="${page}"]`).click();
  assert.equal(d.querySelector('.stats').hidden,false);
  assert.equal(d.querySelector('#total').textContent,'4');
 }
 d.querySelector('[data-page="Award probability"]').click();
 assert.equal(d.querySelector('.stats').hidden,true);
 assert.equal(d.querySelector('#probability-page').hidden,false);
 d.querySelector('[data-page="Overview"]').click();
 assert.equal(d.querySelector('.stats').hidden,true);
 w.close();
});

test('assessment explanation appears only on overview without changing other page sections',()=>{
 const w=setup(),d=w.document;
 assert.equal(d.querySelector('#assessment-guide').hidden,false);
 assert.match(d.querySelector('#assessment-guide').textContent,/How grant assessment works/);
 assert.equal(d.querySelector('.stats').hidden,true);
 assert.equal(d.querySelector('.assessments').hidden,true);
 for(const name of ['Grant assessments','Saved opportunities','Award probability']){
  d.querySelector(`[data-page="${name}"]`).click();
  assert.equal(d.querySelector('#assessment-guide').hidden,true);
  assert.equal(d.querySelector('.stats').hidden,name==='Award probability');
  assert.equal(d.querySelector('.assessments').hidden,name==='Award probability');
  assert.equal(d.querySelector('#probability-page').hidden,name!=='Award probability');
 }
 d.querySelector('[data-page="Overview"]').click();
 assert.equal(d.querySelector('#assessment-guide').hidden,false);
 w.close();
});

test('guest assessment message follows sign-in status on assessments and saved opportunities',()=>{
 const w=setup(),d=w.document;
 const change=user=>w.dispatchEvent(new w.CustomEvent('accountchange',{detail:{user,grants:[]}}));
 for(const name of ['Grant assessments','Saved opportunities']){
  d.querySelector(`[data-page="${name}"]`).click();
  change(null);
  assert.equal(d.querySelector('#guest-assessment-note').hidden,false);
  change({uid:'member'});
  assert.equal(d.querySelector('#guest-assessment-note').hidden,true);
  change(null);
  assert.equal(d.querySelector('#guest-assessment-note').hidden,false);
 }
 w.close();
});

test('organization box prompts guests to sign in and opens a private account overview for members',()=>{
 const w=setup(),d=w.document;let login=false;
 d.querySelector('#open-account').onclick=()=>login=true;
 d.querySelector('#open-account-overview').click();assert.equal(login,true);
 assert.equal(d.querySelector('#account-overview-dialog').open,false);
 const grant={id:'one',name:'Grant',funder:'Foundation',amount:1000,deadline:'2099-01-01',fit:5,hours:1,rate:40,probability:50,eligible:'yes',saved:true};
 w.dispatchEvent(new w.CustomEvent('accountchange',{detail:{user:{uid:'a',email:'member@example.org'},grants:[grant]}}));
 d.querySelector('#profile-form').elements.organization.value='Garden nonprofit';
 d.querySelector('#open-account-overview').click();
 assert.equal(d.querySelector('#account-overview-dialog').open,true);
 assert.equal(d.querySelector('#overview-email').textContent,'member@example.org');
 assert.equal(d.querySelector('#overview-organization').textContent,'Garden nonprofit');
 assert.equal(d.querySelector('#overview-grant-count').textContent,'1');
 assert.equal(d.querySelector('#overview-saved-count').textContent,'1');
 d.querySelector('#profile-form').elements.organization.value='Updated nonprofit';
 w.dispatchEvent(new w.Event('profilechange'));
 assert.equal(d.querySelector('#overview-organization').textContent,'Updated nonprofit');
 let edit=false;d.querySelector('#edit-profile').onclick=()=>edit=true;
 d.querySelector('#overview-edit-profile').click();assert.equal(edit,true);
 assert.equal(d.querySelector('#account-overview-dialog').open,false);
 d.querySelector('#open-account-overview').click();
 w.dispatchEvent(new w.CustomEvent('accountchange',{detail:{user:null,grants:[]}}));
 assert.equal(d.querySelector('#account-overview-dialog').open,false);
 assert.equal(d.querySelector('#overview-email').textContent,'');
 w.close();
});

test('grant website is saved and linked after the recommendation in both assessment views',async()=>{
 const w=setup(),d=w.document;let saved;
 w.dispatchEvent(new w.CustomEvent('accountchange',{detail:{user:{uid:'a'},grants:[]}}));
 w.grantAccount={saveGrant:async g=>{saved=g;}};
 d.querySelector('.new').click();const f=d.querySelector('#form');
 Object.assign(f.elements.name,{value:'Linked grant'});f.elements.funder.value='Foundation';f.elements.amount.value='1000';f.elements.deadline.value='2099-01-01';f.elements.website.value='https://example.org/grant?a=1&b=2';
 await f.onsubmit({preventDefault(){},target:f});
 assert.equal(saved.website,'https://example.org/grant?a=1&b=2');
 const detailLink=d.querySelector('#detail .grant-website');
 assert.equal(detailLink.href,saved.website);assert.equal(detailLink.target,'_blank');
 assert.equal(detailLink.rel,'noopener noreferrer');
 w.dispatchEvent(new w.CustomEvent('accountchange',{detail:{user:{uid:'a'},grants:[{...saved,saved:true}]}}));
 for(const page of ['Grant assessments','Saved opportunities']){
  d.querySelector(`[data-page="${page}"]`).click();
  const cell=d.querySelector('#rows tr').children[4];
  assert.equal(cell.querySelector('.grant-website').href,saved.website);
  assert.equal(cell.firstElementChild.classList.contains('badge'),true);
 }
 w.close();
});
test('old assessments without links and unsafe website values do not render website links',()=>{
 const w=setup(),d=w.document;
 for(const website of [undefined,'','javascript:alert(1)','data:text/html,unsafe','not a URL']){
  const grant={id:'one',name:'Grant',funder:'Foundation',amount:1000,deadline:'2099-01-01',fit:5,hours:1,rate:40,probability:50,eligible:'yes',saved:false,website};
  w.dispatchEvent(new w.CustomEvent('accountchange',{detail:{user:{uid:'a'},grants:[grant]}}));
  assert.equal(d.querySelector('#rows .grant-website'),null);
 }
 w.close();
});

const editableGrant={id:'editable',name:'Original grant',funder:'Foundation',amount:'50000',deadline:'2099-01-01',fit:'5',hours:'25',rate:'40',probability:'25',eligible:'yes',saved:true,createdAt:123,website:'https://example.org/grant'};
function memberGrant(w){w.dispatchEvent(new w.CustomEvent('accountchange',{detail:{user:{uid:'member'},grants:[{...editableGrant}]}}));}
test('edit on either grant page preserves identity and saved status and updates recommendation',async()=>{
 for(const page of ['Grant assessments','Saved opportunities']){
  const w=setup(),d=w.document;memberGrant(w);let saved;
  w.grantAccount={saveGrant:async g=>{saved=g;}};
  d.querySelector(`[data-page="${page}"]`).click();d.querySelector('[data-edit]').click();
  const f=d.querySelector('#form');assert.equal(f.elements.name.value,'Original grant');assert.equal(f.elements.website.value,editableGrant.website);
  f.elements.name.value='Edited grant';f.elements.fit.value='1';
  await f.onsubmit({preventDefault(){},target:f});
  assert.equal(saved.id,'editable');assert.equal(saved.createdAt,123);assert.equal(saved.saved,true);
  assert.equal(d.querySelectorAll('#rows tr').length,1);assert.match(d.querySelector('#rows').textContent,/Edited grant/);assert.match(d.querySelector('#rows .badge').textContent,/Pass/);
  w.close();
 }
});
test('failed edit retains input and original record',async()=>{
 const w=setup(),d=w.document;memberGrant(w);w.alert=()=>{};w.grantAccount={saveGrant:async()=>{throw Error('offline');}};
 d.querySelector('[data-edit]').click();const f=d.querySelector('#form');f.elements.name.value='Unsaved edit';
 await f.onsubmit({preventDefault(){},target:f});assert.equal(d.querySelector('#form-dialog').open,true);assert.equal(f.elements.name.value,'Unsaved edit');assert.match(d.querySelector('#rows').textContent,/Original grant/);w.close();
});
test('delete requires confirmation and removes the grant from both pages only after success',async()=>{
 const w=setup(),d=w.document;memberGrant(w);let deleted=null;w.grantAccount={deleteGrant:async id=>{deleted=id;}};
 w.confirm=()=>false;await d.querySelector('[data-delete]').onclick();assert.equal(deleted,null);assert.match(d.querySelector('#rows').textContent,/Original grant/);
 w.confirm=()=>true;await d.querySelector('[data-delete]').onclick();assert.equal(deleted,'editable');
 for(const page of ['Grant assessments','Saved opportunities']){d.querySelector(`[data-page="${page}"]`).click();assert.doesNotMatch(d.querySelector('#rows').textContent,/Original grant/);}
 w.close();
});
test('failed delete retains grant and guest accounts have no mutation controls',async()=>{
 const w=setup(),d=w.document;assert.equal(d.querySelector('[data-edit]'),null);assert.equal(d.querySelector('[data-delete]'),null);
 memberGrant(w);w.confirm=()=>true;let warning='';w.alert=m=>warning=m;w.grantAccount={deleteGrant:async()=>{throw Error('offline');}};
 await d.querySelector('[data-delete]').onclick();assert.match(warning,/Could not delete/);assert.match(d.querySelector('#rows').textContent,/Original grant/);assert.equal(d.querySelector('[data-delete]').disabled,false);w.close();
});
