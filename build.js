const fs=require('node:fs');
const files=['index.html','style.css','app.js','account.js','scoring.js'];
if(fs.existsSync('firebase-config.json')){
 const config=JSON.parse(fs.readFileSync('firebase-config.json','utf8'));
 for(const key of ['apiKey','authDomain','projectId','appId'])if(!config[key]||config[key].includes('YOUR_'))throw Error('Missing Firebase configuration: '+key);
 if(config.projectId!=='grant-df598')throw Error('Expected Firebase project grant-df598');
 files.push('firebase-config.json');
}else console.log('Using Firebase Hosting reserved configuration endpoint. A registered Firebase web app is required.');
fs.mkdirSync('public',{recursive:true});
if(!files.includes('firebase-config.json'))fs.rmSync('public/firebase-config.json',{force:true});
for(const file of files)fs.copyFileSync(file,'public/'+file);
console.log('Firebase Hosting files prepared in public/.');
