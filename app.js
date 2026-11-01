const DAY_NAMES=["یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه","شنبه"];
const FA_DIGITS="۰۱۲۳۴۵۶۷۸۹";
const fa=n=>String(n).replace(/\d/g,d=>FA_DIGITS[d]);
let data, selectedDay="sat", timerInterval=null, remaining=0, deferredInstall=null;
const $=s=>document.querySelector(s);
const doneKey=()=>`mbpm-done-${new Date().toISOString().slice(0,10)}`;
const completed=()=>JSON.parse(localStorage.getItem(doneKey())||"[]");
function todayId(){const d=new Date().getDay();return ({6:"sat",0:"sun",1:"mon",2:"tue",3:"wed",4:"thu"})[d]||"rest";}
function renderToday(){
 const id=todayId(), w=data.workouts.find(x=>x.id===id);
 $("#todayLabel").textContent=new Intl.DateTimeFormat("fa-IR",{weekday:"long",day:"numeric",month:"long"}).format(new Date());
 if(!w){$("#todayCard").innerHTML="<div><h3>امروز روز استراحت است 🌙</h3><p>ریکاوری، خواب و تغذیه بخشی از برنامه‌اند.</p></div>";return;}
 $("#todayCard").innerHTML=`<div><span class="eyebrow">${w.day} · TODAY'S PLAN</span><h3>${w.title}</h3><p>${w.focus}</p><div class="today-meta"><span class="tag">${fa(w.sessions.length)} حرکت</span><span class="tag">تمرین خانگی</span></div></div><a class="primary-btn" href="#weekly" onclick="selectDay('${id}')">مشاهده برنامه ←</a>`;
}
function selectDay(id){
 selectedDay=id;
 document.querySelectorAll(".day-tab").forEach(b=>b.classList.toggle("active",b.dataset.id===id));
 const w=data.workouts.find(x=>x.id===id);
 $("#workoutPanel").innerHTML=`<h3>${w.day} | ${w.title}</h3><p>${w.focus}</p><div class="exercise-list">${w.sessions.map((e,i)=>rowHTML(e,i,id)).join("")}</div>`;
}
function rowHTML(e,i,id){
 const ex=data.exercises.find(x=>x.name===e[0]);const isDone=completed().includes(`${id}-${i}`);
 return `<div class="exercise-row"><div><span class="exercise-name">${fa(i+1)}. ${e[0]}</span><span class="exercise-sub">${e[2]}</span></div><span class="prescription">${e[1]}</span><div class="row-actions"><button class="detail-btn" onclick="showExercise('${encodeURIComponent(e[0])}')">آموزش</button><button class="done-btn ${isDone?'done':''}" onclick="toggleDone('${id}-${i}',this)">${isDone?'✓ انجام شد':'انجام شد'}</button></div></div>`;
}
function renderTabs(){
 $("#dayTabs").innerHTML=data.workouts.map(w=>`<button class="day-tab" data-id="${w.id}" onclick="selectDay('${w.id}')">${w.day}</button>`).join("")+`<button class="day-tab" onclick="showRest()">جمعه</button>`;
 selectDay(todayId()==="rest"?"sat":todayId());
}
function showRest(){selectedDay="rest";document.querySelectorAll(".day-tab").forEach(b=>b.classList.remove("active"));$("#workoutPanel").innerHTML="<h3>جمعه | استراحت</h3><p>استراحت فعال، خواب کافی و تغذیه مناسب. تمرین سنگین جبرانی انجام نده.</p>";}
function showExercise(encoded){
 const name=decodeURIComponent(encoded), ex=data.exercises.find(x=>x.name===name);if(!ex)return;
 $("#dialogContent").innerHTML=`<div class="dialog-content"><img class="dialog-art" src="${ex.image}" alt="طرح آموزشی شماتیک ${ex.name}"><span class="eyebrow">${ex.group}</span><h2>${ex.name}</h2><p>${ex.description}</p><p><b>نسخه برنامه:</b> ${ex.prescription}</p><p class="muted">تصویر این نسخه شماتیک و آموزشی است؛ برای یادگیری دقیق فرم، توضیحات را بخوان و ابتدا بدون وزنه تمرین کن.</p></div>`;
 $("#exerciseDialog").showModal();
}
function toggleDone(key,btn){let arr=completed();arr=arr.includes(key)?arr.filter(x=>x!==key):[...arr,key];localStorage.setItem(doneKey(),JSON.stringify(arr));btn.classList.toggle("done");btn.textContent=arr.includes(key)?"✓ انجام شد":"انجام شد";updateProgress();}
function updateProgress(){const count=completed().length;$("#completedCount").textContent=fa(count);const total=data.workouts.find(w=>w.id===todayId())?.sessions.length||0;$("#progressBar").style.width=(total?Math.min(100,count/total*100):0)+"%";}
function renderLibrary(){
 const q=$("#searchInput").value.trim().toLowerCase(),g=$("#groupFilter").value;
 const list=data.exercises.filter(x=>(g==="all"||x.group===g)&&x.name.toLowerCase().includes(q));
 $("#exerciseLibrary").innerHTML=list.map(x=>`<article class="exercise-card" onclick="showExercise('${encodeURIComponent(x.name)}')"><img loading="lazy" src="${x.image}" alt="طرح شماتیک ${x.name}"><b>${x.name}</b><small>${x.group} · مشاهده آموزش</small></article>`).join("")||"<p>حرکتی پیدا نشد.</p>";
}
function startTimer(seconds){clearInterval(timerInterval);remaining=seconds;paintTimer();timerInterval=setInterval(()=>{remaining--;paintTimer();if(remaining<=0){clearInterval(timerInterval);timerInterval=null;$("#timerValue").textContent="تمام شد!";}},1000);}
function paintTimer(){const m=Math.floor(remaining/60),s=remaining%60;$("#timerValue").textContent=fa(String(m).padStart(2,"0")+":"+String(s).padStart(2,"0"));}
async function init(){
 const res=await fetch("workouts.json");data=await res.json();renderToday();renderTabs();renderLibrary();updateProgress();
 $("#searchInput").addEventListener("input",renderLibrary);$("#groupFilter").addEventListener("change",renderLibrary);
 $("#closeDialog").onclick=()=>$("#exerciseDialog").close();
 $("#resetProgress").onclick=()=>{if(confirm("ثبت‌های امروز پاک شوند؟")){localStorage.removeItem(doneKey());selectDay(selectedDay);updateProgress();}};
 document.querySelectorAll("[data-seconds]").forEach(b=>b.onclick=()=>startTimer(+b.dataset.seconds));
 $("#stopTimer").onclick=()=>{clearInterval(timerInterval);timerInterval=null;remaining=0;paintTimer();};
}
window.selectDay=selectDay;window.showExercise=showExercise;window.toggleDone=toggleDone;window.showRest=showRest;
init();
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("#installBtn").hidden=false;});
$("#installBtn").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();deferredInstall=null;$("#installBtn").hidden=true;});
if("serviceWorker" in navigator && location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
