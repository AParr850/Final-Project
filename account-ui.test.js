const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {JSDOM}=require('jsdom');
function setup(url='http://localhost'){const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:'outside-only',url});const w=dom.window;w.structuredClone=structuredClone;w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.eval(fs.readFileSync('scoring.js','utf8'));w.eval(fs.readFileSync('app.js','utf8'));return w;}
test('guests must sign in before creating a grant',()=>{const w=setup();let opened=false;w.document.querySelector('#open-account').onclick=()=>opened=true;w.document.querySelector('.new').click();assert.equal(opened,true);assert.equal(w.document.querySelector('#form-dialog').open,false);w.close();});
test('switching accounts and signing out replaces previous records',()=>{const w=setup();const change=(user,grants)=>w.dispatchEvent(new w.CustomEvent('accountchange',{detail:{user,grants}}));const grant={id:'private-a',name:'Private grant A',funder:'Funder',amount:'50000',deadline:'2099-01-01',fit:'5',hours:'20',rate:'40',probability:'25',eligible:'yes',saved:false};change({uid:'a'},[grant]);assert.match(w.document.querySelector('#rows').textContent,/Private grant A/);change({uid:'b'},[]);assert.doesNotMatch(w.document.querySelector('#rows').textContent,/Private grant A/);assert.equal(w.document.querySelector('#total').textContent,'0');change(null,[]);assert.equal(w.document.querySelector('#total').textContent,'4');assert.doesNotMatch(w.document.querySelector('#rows').textContent,/Private grant A/);w.close();});
test('failed cloud save keeps the assessment form and input',async()=>{const w=setup();w.dispatchEvent(new w.CustomEvent('accountchange',{detail:{user:{uid:'a'},grants:[]}}));w.grantAccount={saveGrant:async()=>{throw Error('offline');}};let warning='';w.alert=t=>warning=t;w.document.querySelector('.new').click();const form=w.document.querySelector('#form');form.elements.name.value='Retain my work';form.elements.funder.value='Foundation';form.elements.amount.value='1000';form.elements.deadline.value='2099-01-01';await form.onsubmit({preventDefault(){},target:form});assert.equal(form.elements.name.value,'Retain my work');assert.equal(w.document.querySelector('#form-dialog').open,true);assert.match(warning,/could not be saved/);assert.equal(form.querySelector('.submit').disabled,false);assert.equal(w.document.querySelector('#total').textContent,'0');w.close();});

test('overview and assessments have separate views and URLs',()=>{
 const w=setup(),d=w.document;
 assert.equal(w.location.hash,'#overview');
 assert.equal(d.querySelector('.hero').hidden,false);
 assert.equal(d.querySelector('.assessments').hidden,true);
 d.querySelector('#overview-assessments').click();
 assert.equal(w.location.hash,'#grant-assessments');
 assert.equal(d.querySelector('.hero').hidden,true);
 assert.equal(d.querySelector('.stats').hidden,true);
 assert.equal(d.querySelector('.assessments').hidden,false);
 assert.equal(d.querySelectorAll('#rows tr').length,4);
 assert.equal(d.querySelector('[data-page="Grant assessments"]').getAttribute('aria-current'),'page');
 d.querySelector('[data-page="Overview"]').click();
 assert.equal(d.querySelector('.assessments').hidden,true);
 assert.equal(d.querySelector('.stats').hidden,false);
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
