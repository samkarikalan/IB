const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const store={get(k,fallback=[]){try{return JSON.parse(localStorage.getItem(k))??fallback}catch{return fallback}},set(k,v){localStorage.setItem(k,JSON.stringify(v))}};
let setupStep=0;

function defaultSubjects(){
  return Array.from({length:6},(_,i)=>({name:'',level:i<3?'HL':'SL',target:6,current:''}));
}
function getProfile(){return store.get('ib_profile',null)}
function renderSubjectSetup(subjects=defaultSubjects()){
  $('#subjectSetup').innerHTML=subjects.map((s,i)=>`
    <div class="subject-row">
      <input id="subjName${i}" placeholder="Subject ${i+1}" value="${s.name||''}">
      <select id="subjLevel${i}"><option ${s.level==='HL'?'selected':''}>HL</option><option ${s.level==='SL'?'selected':''}>SL</option></select>
    </div>
    <div class="two" style="margin:-2px 0 10px">
      <input id="subjCurrent${i}" type="number" min="1" max="7" placeholder="Current grade" value="${s.current||''}">
      <input id="subjTarget${i}" type="number" min="1" max="7" placeholder="Target grade" value="${s.target||''}">
    </div>`).join('');
}
function showOnboarding(profile=null){
  $('#onboarding').classList.remove('hidden');
  const p=profile||{};
  $('#setupYear').value=p.year||'';
  $('#setupExamSession').value=p.examSession||'';
  $('#setupEE').value=p.ee||'';
  $('#setupTOK').value=p.tok||'';
  $('#setupCAS').value=p.cas||'';
  $('#setupSATEnabled').checked=!!p.sat?.enabled;
  $('#setupSATDate').value=p.sat?.date||'';
  $('#setupSATCurrent').value=p.sat?.current||'';
  $('#setupSATTarget').value=p.sat?.target||'';
  $('#setupSATMath').value=p.sat?.math||'';
  $('#setupSATRW').value=p.sat?.rw||'';
  renderSubjectSetup(p.subjects||defaultSubjects());
  toggleSATSetup();
  setupStep=0; renderSetupStep();
}
function editProfile(){showOnboarding(getProfile())}
function toggleSATSetup(){$('#satSetupFields').style.display=$('#setupSATEnabled').checked?'grid':'none'}
function renderSetupStep(){
  $$('.step').forEach((s,i)=>s.classList.toggle('active',i===setupStep));
  $$('.step-indicator span').forEach((s,i)=>s.classList.toggle('active',i<=setupStep));
  $('#prevStep').style.visibility=setupStep===0?'hidden':'visible';
  $('#nextStep').textContent=setupStep===3?'Finish setup':'Next';
}
function changeSetupStep(dir){
  if(dir>0 && setupStep===3){saveProfile();return}
  setupStep=Math.max(0,Math.min(3,setupStep+dir));renderSetupStep();
}
function saveProfile(){
  const subjects=Array.from({length:6},(_,i)=>({
    name:$('#subjName'+i).value.trim()||`Subject ${i+1}`,
    level:$('#subjLevel'+i).value,
    current:Number($('#subjCurrent'+i).value)||null,
    target:Number($('#subjTarget'+i).value)||null
  }));
  const profile={
    year:$('#setupYear').value||'DP',
    examSession:$('#setupExamSession').value.trim(),
    subjects,
    ee:$('#setupEE').value.trim(),
    tok:$('#setupTOK').value,
    cas:$('#setupCAS').value,
    sat:{
      enabled:$('#setupSATEnabled').checked,
      date:$('#setupSATDate').value,
      current:Number($('#setupSATCurrent').value)||null,
      target:Number($('#setupSATTarget').value)||null,
      math:Number($('#setupSATMath').value)||null,
      rw:Number($('#setupSATRW').value)||null
    }
  };
  store.set('ib_profile',profile);
  $('#onboarding').classList.add('hidden');
  renderAll();
}
function openPanel(id){
  $$('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  $$('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));
  window.scrollTo({top:0,behavior:'smooth'});
}
function showAcademicTab(id,btn){
  ['ib','exams','marks','sat'].forEach(x=>$('#academic-'+x).style.display=x===id?'block':'none');
  $$('.tabs button').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
}
function fmtDate(date){
  if(!date)return'No date';
  return new Date(date+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
}
function daysUntil(date){
  if(!date)return null;
  const d=new Date(date+'T12:00:00'), now=new Date(); now.setHours(12,0,0,0);
  return Math.ceil((d-now)/86400000);
}

function addTask(){
  const title=$('#taskTitle').value.trim(),date=$('#taskDate').value,type=$('#taskType').value;
  if(!title)return;
  const tasks=store.get('ib_tasks');tasks.push({id:Date.now(),title,date,type,done:false});store.set('ib_tasks',tasks);
  $('#taskTitle').value='';renderTasks();renderDashboard();
}
function toggleTask(id){
  const tasks=store.get('ib_tasks').map(t=>t.id===id?{...t,done:!t.done}:t);store.set('ib_tasks',tasks);renderTasks();renderDashboard();renderProgress();
}
function renderTasks(){
  const tasks=store.get('ib_tasks').sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
  $('#taskList').innerHTML=tasks.length?tasks.map(t=>`
    <div class="row"><div class="row-main"><strong style="${t.done?'text-decoration:line-through;opacity:.55':''}">${t.title}</strong><small>${t.type} • ${fmtDate(t.date)}</small></div>
    <button class="badge ${t.done?'good':''}" style="border:0" onclick="toggleTask(${t.id})">${t.done?'Done':'Mark done'}</button></div>`).join(''):'<div class="empty">No tasks yet.</div>';
}
function logStudy(){
  const subject=$('#studySubject').value,topic=$('#studyTopic').value.trim(),minutes=Number($('#studyMinutes').value||0);
  if(!topic||minutes<=0)return;
  const logs=store.get('ib_study');logs.unshift({id:Date.now(),subject,topic,minutes,date:new Date().toISOString()});store.set('ib_study',logs.slice(0,50));
  $('#studyTopic').value='';renderStudy();renderProgress();
}
function renderStudy(){
  const logs=store.get('ib_study');
  $('#studyList').innerHTML=logs.length?logs.map(x=>`<div class="row"><div class="row-main"><strong>${x.subject}</strong><small>${x.topic}</small></div><span class="badge good">${x.minutes} min</span></div>`).join(''):'<div class="empty">Your logged study sessions will appear here.</div>';
}
function addExam(){
  const name=$('#examName').value.trim(),date=$('#examDate').value;if(!name||!date)return;
  const exams=store.get('ib_exams');exams.push({id:Date.now(),name,date});store.set('ib_exams',exams);$('#examName').value='';$('#examDate').value='';renderExams();
}
function renderExams(){
  const exams=store.get('ib_exams').sort((a,b)=>a.date.localeCompare(b.date));
  $('#examList').innerHTML=exams.length?exams.map(e=>{const d=daysUntil(e.date),label=d<0?'Completed':d===0?'Today':`${d} days`;
    return `<div class="exam"><div class="date">${fmtDate(e.date)}</div><strong>${e.name}</strong><span class="badge ${d<=7&&d>=0?'warn':''}">${label}</span></div>`}).join(''):'<div class="empty">Add your exam dates to start a countdown.</div>';
}
function renderAcademics(){
  const p=getProfile(); if(!p)return;
  $('#ibSubjectList').innerHTML=p.subjects.map(s=>`<div class="subject"><span class="dot"></span><div><strong>${s.name} ${s.level}</strong><small>Target: ${s.target||'—'}</small></div><span class="mark">${s.current||'—'}</span></div>`).join('');
  $('#marksList').innerHTML=p.subjects.map(s=>`<div class="row"><div class="row-main"><strong>${s.name} ${s.level}</strong><small>Target grade ${s.target||'—'}</small></div><span class="badge">${s.current||'—'} / 7</span></div>`).join('');
  $('#ibCoreSummary').innerHTML=`
    <div class="row"><div class="row-main"><strong>Extended Essay</strong><small>${p.ee||'Not set'}</small></div><span class="badge">EE</span></div>
    <div class="row"><div class="row-main"><strong>TOK</strong><small>${p.tok||'Not set'}</small></div><span class="badge">${p.tok||'—'}</span></div>
    <div class="row"><div class="row-main"><strong>CAS</strong><small>${p.cas||'Not set'}</small></div><span class="badge good">${p.cas||'—'}</span></div>`;
  $('#eeLabel').textContent=p.ee||'Not set';
  $('#tokLabel').textContent=p.tok||'Not set';
  renderSAT();
}
function renderSAT(){
  const p=getProfile(), sat=p?.sat;
  $('#satTabButton').style.display=sat?.enabled?'inline-block':'none';
  $('#satProgressCard').style.display=sat?.enabled?'block':'none';
  if(!sat?.enabled){$('#satContent').innerHTML='';return}
  const d=daysUntil(sat.date);
  const countdown=sat.date?(d<0?'Completed':d===0?'Today':`${d} days`):'No date';
  const gap=(sat.target&&sat.current)?sat.target-sat.current:null;
  $('#satContent').innerHTML=`
    <div class="card">
      <h4>SAT overview</h4>
      <div class="mini-grid">
        <div class="metric"><strong>${sat.current||'—'}</strong><small>Current score</small></div>
        <div class="metric"><strong>${sat.target||'—'}</strong><small>Target score</small></div>
        <div class="metric"><strong>${sat.math||'—'}</strong><small>Math</small></div>
        <div class="metric"><strong>${sat.rw||'—'}</strong><small>Reading & Writing</small></div>
      </div>
    </div>
    <div class="card">
      <h4>Next SAT</h4>
      <div class="row"><div class="row-main"><strong>${fmtDate(sat.date)}</strong><small>${gap===null?'Set current and target scores':gap<=0?'Target reached':`${gap} points to target`}</small></div><span class="badge ${d!==null&&d<=30&&d>=0?'warn':''}">${countdown}</span></div>
    </div>
    <div class="card"><h4>SAT study areas</h4>
      <div class="row"><div class="row-main"><strong>Math</strong><small>Algebra, advanced math, data analysis, geometry</small></div><span class="badge">${sat.math||'—'}</span></div>
      <div class="row"><div class="row-main"><strong>Reading & Writing</strong><small>Information, expression, conventions, vocabulary</small></div><span class="badge">${sat.rw||'—'}</span></div>
    </div>`;
}
function renderDashboard(){
  const p=getProfile(); if(!p)return;
  $('#profileLine').textContent=`${p.year}${p.examSession?' • '+p.examSession:''}${p.sat?.enabled?' • IB + SAT':''}`;
  $('#heroTitle').textContent=`${p.year} dashboard`;
  const tasks=store.get('ib_tasks'), done=tasks.filter(t=>t.done).length, pct=tasks.length?Math.round(done/tasks.length*100):0;
  $('#heroScore').textContent=tasks.length?pct+'%':'—';
  $('#heroProgress').style.width=pct+'%';
  $('#heroFootRight').textContent=`${done} / ${tasks.length} completed`;
  const today=new Date().toISOString().slice(0,10);
  const upcoming=tasks.filter(t=>!t.done).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')).slice(0,3);
  $('#todayCard').innerHTML=upcoming.length?upcoming.map(t=>`<div class="row"><div class="row-main"><strong>${t.title}</strong><small>${t.type} • ${t.date===today?'Today':fmtDate(t.date)}</small></div><span class="badge ${t.date===today?'warn':''}">${t.type}</span></div>`).join(''):'<div class="empty">Add tasks to start your daily plan.</div>';
}
function renderStudySubjects(){
  const p=getProfile(); if(!p)return;
  const opts=p.subjects.map(s=>`<option>${s.name} ${s.level}</option>`).join('')+(p.sat?.enabled?'<option>SAT Math</option><option>SAT Reading & Writing</option>':'');
  $('#studySubject').innerHTML=opts;
}
function renderProgress(){
  const p=getProfile(); if(!p)return;
  const logs=store.get('ib_study');
  const weekAgo=Date.now()-7*86400000;
  const weekMins=logs.filter(x=>new Date(x.date).getTime()>=weekAgo).reduce((a,b)=>a+b.minutes,0);
  const tasks=store.get('ib_tasks'),done=tasks.filter(t=>t.done).length;
  $('#weeklyProgress').innerHTML=`
    <div class="row"><div class="row-main"><strong>Study time</strong><small>Last 7 days</small></div><span class="badge good">${Math.floor(weekMins/60)}h ${weekMins%60}m</span></div>
    <div class="row"><div class="row-main"><strong>Tasks completed</strong><small>All planned work</small></div><span class="badge">${done} / ${tasks.length}</span></div>`;
  $('#coreProgress').innerHTML=`
    <div class="row"><div class="row-main"><strong>CAS</strong><small>${p.cas||'Not set'}</small></div><span class="badge good">${p.cas||'—'}</span></div>
    <div class="row"><div class="row-main"><strong>Extended Essay</strong><small>${p.ee||'Not set'}</small></div><span class="badge">EE</span></div>
    <div class="row"><div class="row-main"><strong>TOK</strong><small>${p.tok||'Not set'}</small></div><span class="badge">${p.tok||'—'}</span></div>`;
  if(p.sat?.enabled){
    const gap=(p.sat.target&&p.sat.current)?p.sat.target-p.sat.current:null;
    $('#satProgress').innerHTML=`<div class="row"><div class="row-main"><strong>${p.sat.current||'—'} → ${p.sat.target||'—'}</strong><small>${gap===null?'Set scores to track progress':gap<=0?'Target reached':`${gap} points remaining`}</small></div><span class="badge">${p.sat.date?fmtDate(p.sat.date):'No date'}</span></div>`;
  }
}
function renderAll(){renderTasks();renderStudy();renderExams();renderAcademics();renderStudySubjects();renderDashboard();renderProgress()}

if(!getProfile()) showOnboarding();
else renderAll();
