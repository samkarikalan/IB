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
function toggleHomeMenu(show){
  const menu=$('#homeMenu'); if(!menu)return;
  menu.classList.toggle('open',!!show);
  document.body.style.overflow=show?'hidden':'';
}
function closeHomeMenuFromBackdrop(event){if(event.target?.id==='homeMenu')toggleHomeMenu(false)}
function openHomeTool(id){toggleHomeMenu(false);openPanel(id)}
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
  $('#studyTopic').value='';renderStudy();renderProgress();renderCalendar();
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
  const tasks=store.get('ib_tasks'), done=tasks.filter(t=>t.done).length, pct=tasks.length?Math.round(done/tasks.length*100):0;
  const today=new Date().toISOString().slice(0,10);
  const upcoming=tasks.filter(t=>!t.done).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')).slice(0,3);
  $('#todayCard').innerHTML=upcoming.length?upcoming.map(t=>`<div class="row"><div class="row-main"><strong>${t.title}</strong><small>${t.type} • ${t.date===today?'Today':fmtDate(t.date)}</small></div><span class="badge ${t.date===today?'warn':''}">${t.type}</span></div>`).join(''):'<div class="empty">No upcoming items yet.</div>';
  const logs=store.get('ib_study'), weekAgo=Date.now()-7*86400000;
  const weekMins=logs.filter(x=>new Date(x.date).getTime()>=weekAgo).reduce((a,b)=>a+b.minutes,0);
  const progress=$('#homeProgressCard');
  if(progress)progress.innerHTML=`<div class="row"><div class="row-main"><strong>Weekly study</strong><small>Last 7 days</small></div><span class="badge good">${Math.floor(weekMins/60)}h ${weekMins%60}m</span></div><div class="row"><div class="row-main"><strong>Tasks completed</strong><small>Overall progress</small></div><span class="badge">${done} / ${tasks.length}</span></div>`;
}
function renderStudySubjects(){
  const p=getProfile(); if(!p)return;
  const opts=p.subjects.map(s=>`<option>${s.name} ${s.level}</option>`).join('')+(p.sat?.enabled?'<option>SAT Math</option><option>SAT Reading & Writing</option>':'');
  $('#studySubject').innerHTML=opts;
}
let progressMode='study', progressPeriod='week';
function setProgressMode(mode,btn){
  progressMode=mode;
  $$('.progress-mode-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.progressMode===mode));
  $('#progressPeriodTabs').style.display=mode==='study'?'grid':'none';
  renderProgress();
}
function setProgressPeriod(period,btn){
  progressPeriod=period;
  $$('.progress-period-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.period===period));
  renderProgress();
}
function progressRange(period){
  const now=new Date(), start=new Date(now), end=new Date(now);
  start.setHours(0,0,0,0); end.setHours(23,59,59,999);
  if(period==='yesterday'){start.setDate(start.getDate()-1);end.setDate(end.getDate()-1)}
  if(period==='week'){start.setDate(start.getDate()-6)}
  if(period==='month'){start.setDate(1)}
  return [start,end];
}
function formatStudyMinutes(m){return m>=60?`${Math.floor(m/60)}h ${m%60?m%60+'m':''}`.trim():`${m}m`}
function subjectStudyMinutes(subject,period){
  const [a,b]=progressRange(period);
  return store.get('ib_study').filter(x=>x.subject===subject&&new Date(x.date)>=a&&new Date(x.date)<=b).reduce((n,x)=>n+Number(x.minutes||0),0);
}
function renderProgress(){
  const p=getProfile(); if(!p)return;
  const box=$('#subjectProgressDashboard'); if(!box)return;
  if(progressMode==='study'){
    const rows=p.subjects.map(s=>({...s,minutes:subjectStudyMinutes(s.name,progressPeriod)})).sort((a,b)=>b.minutes-a.minutes);
    const total=rows.reduce((n,s)=>n+s.minutes,0), label={today:'today',yesterday:'yesterday',week:'last 7 days',month:'this month'}[progressPeriod];
    box.innerHTML=`<div class="progress-hero"><small>study time</small><strong>${formatStudyMinutes(total)}</strong><span>${label}</span></div><div class="subject-progress-list">${rows.map((s,i)=>`<div class="subject-progress-row"><div class="subject-rank">${i+1}</div><div class="subject-progress-main"><strong>${s.name} ${s.level}</strong><small>${total?Math.round(s.minutes/total*100):0}% of study time</small></div><div class="subject-progress-value">${formatStudyMinutes(s.minutes)}</div></div>`).join('')}</div>`;
    return;
  }
  if(progressMode==='marks'){
    const valid=p.subjects.filter(s=>s.current), total=valid.reduce((n,s)=>n+Number(s.current||0),0);
    box.innerHTML=`<div class="progress-hero"><small>current IB subject total</small><strong>${total} / 42</strong><span>${valid.length<6?'Add current grades in Student setup':'Across 6 subjects'}</span></div><div class="subject-progress-list">${p.subjects.map((s,i)=>{const gap=s.current&&s.target?s.target-s.current:null;return `<div class="subject-progress-row"><div class="subject-rank">${i+1}</div><div class="subject-progress-main"><strong>${s.name} ${s.level}</strong><small>Target ${s.target||'—'}${gap>0?` · ${gap} grade${gap>1?'s':''} to target`:gap===0?' · Target reached':''}</small></div><div class="subject-progress-value">${s.current||'—'}<small>/ 7</small></div></div>`}).join('')}</div>`;
    return;
  }
  const ranked=p.subjects.map(s=>{const gap=(s.target||0)-(s.current||0),mins=subjectStudyMinutes(s.name,'month');return {...s,gap,mins}}).sort((a,b)=>b.gap-a.gap||a.mins-b.mins);
  const needing=ranked.filter(s=>s.gap>0).length;
  box.innerHTML=`<div class="progress-hero"><small>subjects needing attention</small><strong>${needing}</strong><span>Based on current grade, target and study time</span></div><div class="subject-progress-list">${ranked.map((s,i)=>{const cls=s.gap>=2?'priority-high':s.gap===1?'priority-mid':'priority-good';let advice;if(!s.current||!s.target)advice='Set current and target grades first';else if(s.gap<=0)advice='On target · keep your study rhythm';else if(s.mins<60)advice='Priority: add focused study time this month';else advice=`${s.gap} grade${s.gap>1?'s':''} to target · review weakest topics and past-paper errors`;return `<div class="subject-progress-row"><div class="subject-rank">${i+1}</div><div class="subject-progress-main"><strong><i class="improve-priority ${cls}"></i>${s.name} ${s.level}</strong><small>${advice}</small></div><div class="subject-progress-value">${s.current||'—'} → ${s.target||'—'}<small>${formatStudyMinutes(s.mins)} month</small></div></div>`}).join('')}</div>`;
}

// Planner calendar: study time is grouped by day and subject.
let calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);
let selectedCalendarDate=null;
const initialTaskDate=$('#taskDate');
if(initialTaskDate&&!initialTaskDate.value)initialTaskDate.value=new Date().toISOString().slice(0,10);

function renderAll(){renderTasks();renderStudy();renderExams();renderAcademics();renderStudySubjects();renderDashboard();renderProgress();renderCalendar()}

if(!getProfile()) showOnboarding();
else renderAll();
const subjectPalette=['#4f8df7','#9b6df3','#20b875','#14a8b8','#f59e42','#e6b422','#ef6c8f','#64748b'];
function subjectColorMap(){
  const p=getProfile(); const map={};
  (p?.subjects||[]).forEach((s,i)=>{map[`${s.name} ${s.level}`]=subjectPalette[i%subjectPalette.length];map[s.name]=subjectPalette[i%subjectPalette.length]});
  if(p?.sat?.enabled){map['SAT Math']='#3b82f6';map['SAT Reading & Writing']='#f97316'}
  return map;
}
function studyDateKey(x){const d=new Date(x.date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function formatMinutes(m){m=Math.round(m||0);return m>=60?`${Math.floor(m/60)}h${m%60?` ${m%60}m`:''}`:`${m}m`}
function changeCalendarMonth(delta){calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+delta,1);selectedCalendarDate=null;renderCalendar()}
function selectCalendarDay(key){selectedCalendarDate=key;const taskDate=$('#taskDate');if(taskDate)taskDate.value=key;renderCalendar()}
function renderCalendar(){
  if(!$('#calendarGrid'))return;
  const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth();
  $('#calendarMonth').textContent=calendarCursor.toLocaleDateString(undefined,{month:'long',year:'numeric'});
  const logs=store.get('ib_study'), colors=subjectColorMap();
  const monthLogs=logs.filter(x=>{const d=new Date(x.date);return d.getFullYear()===y&&d.getMonth()===m});
  const byDay={}, bySubject={}; let total=0;
  monthLogs.forEach(x=>{const key=studyDateKey(x);(byDay[key]??=[]).push(x);bySubject[x.subject]=(bySubject[x.subject]||0)+x.minutes;total+=x.minutes});
  const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  const now=new Date(),today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  let html='';for(let i=0;i<first;i++)html+='<div class="calendar-day empty"></div>';
  for(let d=1;d<=days;d++){
    const key=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, dayLogs=byDay[key]||[], mins=dayLogs.reduce((a,b)=>a+b.minutes,0);
    const subjects=[...new Set(dayLogs.map(x=>x.subject))];
    html+=`<button class="calendar-day ${key===today?'today ':''}${key===selectedCalendarDate?'selected':''}" onclick="selectCalendarDay('${key}')"><span class="day-number">${d}</span>${mins?`<span class="day-hours">${formatMinutes(mins)}</span>`:''}<span class="calendar-dots">${subjects.slice(0,4).map(s=>`<i style="background:${colors[s]||'#64748b'}"></i>`).join('')}</span></button>`;
  }
  $('#calendarGrid').innerHTML=html;
  $('#calendarSummary').innerHTML=`<div><small>Study hours</small><strong>${formatMinutes(total)}</strong></div><div><small>Subjects studied</small><strong>${Object.keys(bySubject).length}</strong></div>`;
  $('#subjectLegend').innerHTML=Object.entries(bySubject).sort((a,b)=>b[1]-a[1]).map(([s,mins])=>`<span class="legend-item"><i style="background:${colors[s]||'#64748b'}"></i>${s.replace(/ (HL|SL)$/,'')} · ${formatMinutes(mins)}</span>`).join('');
  const detailKey=selectedCalendarDate||today, detailLogs=byDay[detailKey]||[];
  const detailSubjects={};detailLogs.forEach(x=>detailSubjects[x.subject]=(detailSubjects[x.subject]||0)+x.minutes);
  $('#calendarDayDetail').innerHTML=detailLogs.length?`<div class="day-detail-title">${fmtDate(detailKey)}</div>${Object.entries(detailSubjects).map(([s,mins])=>`<div class="day-study-row"><span><i style="background:${colors[s]||'#64748b'}"></i>${s.replace(/ (HL|SL)$/,'')}</span><strong>${formatMinutes(mins)}</strong></div>`).join('')}`:'';
}
