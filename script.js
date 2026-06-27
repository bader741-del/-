/* ====== منصة يوم الانضمام ====== */
const STORAGE_KEY = "joiningDayRecords";
const HOSPITALS = ["مستشفى الطب النفسي","مستشفى الولادة والأطفال","مستشفى المدينة العام"];

let records = [];
let pendingDeleteId = null;

/* ---- تخزين ---- */
function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){ try{ records = JSON.parse(raw); }catch{ records = []; } }
  if(!raw){ records = seedData(); save(); }
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }

/* ---- بيانات تجريبية ---- */
function seedData(){
  const today = new Date().toISOString().slice(0,10);
  return [
    {id:id(),hospital:HOSPITALS[0],name:"أحمد العتيبي",empId:"10245",department:"التمريض",jobTitle:"ممرض أول",date:today,status:"حاضر",time:"08:05",notes:""},
    {id:id(),hospital:HOSPITALS[0],name:"نورة القحطاني",empId:"10246",department:"المختبر",jobTitle:"فني مختبر",date:today,status:"غائب",time:"",notes:"إجازة مرضية"},
    {id:id(),hospital:HOSPITALS[1],name:"سارة الزهراني",empId:"20311",department:"الأطفال",jobTitle:"طبيبة مقيمة",date:today,status:"حاضر",time:"07:50",notes:""},
    {id:id(),hospital:HOSPITALS[1],name:"خالد الشهري",empId:"20312",department:"الولادة",jobTitle:"أخصائي",date:today,status:"انسحاب",time:"",notes:"اعتذر عن الالتحاق"},
    {id:id(),hospital:HOSPITALS[2],name:"منى الغامدي",empId:"30501",department:"الطوارئ",jobTitle:"ممرضة",date:today,status:"حاضر",time:"08:15",notes:""},
    {id:id(),hospital:HOSPITALS[2],name:"فهد المطيري",empId:"30502",department:"الأشعة",jobTitle:"فني أشعة",date:today,status:"حاضر",time:"08:00",notes:""},
    {id:id(),hospital:HOSPITALS[2],name:"ريم الدوسري",empId:"30503",department:"الصيدلية",jobTitle:"صيدلانية",date:today,status:"غائب",time:"",notes:""}
  ];
}
function id(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

/* ---- تبويبات ---- */
document.querySelectorAll(".tab-btn").forEach(b=>{
  b.addEventListener("click",()=>{
    document.querySelectorAll(".tab-btn").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    document.getElementById(b.dataset.tab).classList.add("active");
    if(b.dataset.tab==="manage") renderAll();
  });
});

/* ---- نموذج التسجيل ---- */
const form = document.getElementById("registerForm");
document.getElementById("date").value = new Date().toISOString().slice(0,10);

form.addEventListener("submit",e=>{
  e.preventDefault();
  const rec = {
    id: document.getElementById("recordId").value || id(),
    hospital: val("hospital"),
    name: val("name").trim(),
    empId: val("empId").trim(),
    department: val("department").trim(),
    jobTitle: val("jobTitle").trim(),
    date: val("date"),
    status: val("status"),
    time: val("time"),
    notes: val("notes").trim()
  };
  const editing = document.getElementById("recordId").value;
  if(editing){
    const i = records.findIndex(r=>r.id===editing);
    if(i>-1) records[i]=rec;
    toast("تم تحديث السجل بنجاح","success");
  }else{
    records.push(rec);
    toast("تم حفظ التسجيل بنجاح","success");
  }
  save();
  resetForm();
  renderAll();
});

document.getElementById("cancelEditBtn").addEventListener("click",resetForm);

function resetForm(){
  form.reset();
  document.getElementById("recordId").value="";
  document.getElementById("date").value=new Date().toISOString().slice(0,10);
  document.getElementById("submitBtn").textContent="حفظ التسجيل";
}
function val(idn){ return document.getElementById(idn).value; }

/* ---- تعديل ---- */
function editRecord(rid){
  const r = records.find(x=>x.id===rid);
  if(!r) return;
  document.getElementById("recordId").value=r.id;
  setVal("hospital",r.hospital);setVal("name",r.name);setVal("empId",r.empId);
  setVal("department",r.department);setVal("jobTitle",r.jobTitle);setVal("date",r.date);
  setVal("status",r.status);setVal("time",r.time);setVal("notes",r.notes);
  document.getElementById("submitBtn").textContent="تحديث السجل";
  document.querySelector('.tab-btn[data-tab="register"]').click();
  window.scrollTo({top:0,behavior:"smooth"});
}
function setVal(idn,v){ document.getElementById(idn).value=v||""; }

/* ---- حذف ---- */
function askDelete(rid){
  pendingDeleteId=rid;
  document.getElementById("confirmModal").hidden=false;
}
document.getElementById("cancelDeleteBtn").addEventListener("click",()=>{
  document.getElementById("confirmModal").hidden=true;pendingDeleteId=null;
});
document.getElementById("confirmDeleteBtn").addEventListener("click",()=>{
  records=records.filter(r=>r.id!==pendingDeleteId);
  save();
  document.getElementById("confirmModal").hidden=true;
  pendingDeleteId=null;
  renderAll();
  toast("تم حذف السجل","success");
});

/* ---- فلترة ---- */
["searchInput","filterHospital","filterStatus","filterDate"].forEach(idn=>{
  document.getElementById(idn).addEventListener("input",renderTable);
});
document.getElementById("clearFiltersBtn").addEventListener("click",()=>{
  document.getElementById("searchInput").value="";
  document.getElementById("filterHospital").value="";
  document.getElementById("filterStatus").value="";
  document.getElementById("filterDate").value="";
  renderTable();
});

function getFiltered(){
  const q=document.getElementById("searchInput").value.trim().toLowerCase();
  const h=document.getElementById("filterHospital").value;
  const s=document.getElementById("filterStatus").value;
  const d=document.getElementById("filterDate").value;
  return records.filter(r=>{
    if(h && r.hospital!==h) return false;
    if(s && r.status!==s) return false;
    if(d && r.date!==d) return false;
    if(q && !(r.name.toLowerCase().includes(q)||r.empId.toLowerCase().includes(q))) return false;
    return true;
  });
}

/* ---- عرض الجدول ---- */
function renderTable(){
  const data=getFiltered();
  const body=document.getElementById("tableBody");
  const empty=document.getElementById("emptyMsg");
  body.innerHTML="";
  if(data.length===0){ empty.hidden=false; return; }
  empty.hidden=true;
  data.forEach(r=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${esc(r.hospital)}</td>
      <td>${esc(r.name)}</td>
      <td>${esc(r.empId)}</td>
      <td>${esc(r.department)||"-"}</td>
      <td>${esc(r.jobTitle)||"-"}</td>
      <td>${esc(r.date)}</td>
      <td>${statusBadge(r.status)}</td>
      <td>${esc(r.time)||"-"}</td>
      <td>${esc(r.notes)||"-"}</td>
      <td><div class="row-actions">
        <button class="btn btn-sm btn-primary" onclick="editRecord('${r.id}')">تعديل</button>
        <button class="btn btn-sm btn-danger" onclick="askDelete('${r.id}')">حذف</button>
      </div></td>`;
    body.appendChild(tr);
  });
}
function statusBadge(s){
  const m={"حاضر":"present","غائب":"absent","انسحاب":"withdraw"};
  return `<span class="badge ${m[s]||""}">${s}</span>`;
}
function esc(t){ return (t??"").toString().replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

/* ---- إحصائيات ---- */
function stats(list){
  const total=list.length;
  const present=list.filter(r=>r.status==="حاضر").length;
  const absent=list.filter(r=>r.status==="غائب").length;
  const withdraw=list.filter(r=>r.status==="انسحاب").length;
  const pct=n=>total?((n/total)*100).toFixed(1):"0.0";
  return {total,present,absent,withdraw,pPresent:pct(present),pAbsent:pct(absent),pWithdraw:pct(withdraw)};
}

/* ---- KPI ---- */
function renderKPI(){
  const s=stats(records);
  const grid=document.getElementById("kpiGrid");
  const cards=[
    {l:"إجمالي المسجلين",v:s.total,sub:"",c:"k-blue"},
    {l:"الحاضرون",v:s.present,sub:`نسبة الحضور ${s.pPresent}%`,c:"k-green"},
    {l:"الغياب",v:s.absent,sub:`نسبة الغياب ${s.pAbsent}%`,c:"k-red"},
    {l:"المنسحبون",v:s.withdraw,sub:`نسبة الانسحاب ${s.pWithdraw}%`,c:"k-amber"}
  ];
  grid.innerHTML=cards.map(c=>`
    <div class="kpi ${c.c}">
      <div class="k-label">${c.l}</div>
      <div class="k-value">${c.v}</div>
      <div class="k-sub">${c.sub||"&nbsp;"}</div>
    </div>`).join("");
}

/* ---- مقارنة المستشفيات ---- */
function renderCompare(){
  const wrap=document.getElementById("hospitalCompare");
  wrap.innerHTML=HOSPITALS.map(h=>{
    const s=stats(records.filter(r=>r.hospital===h));
    return `<div class="hc-card">
      <h4>${h}</h4>
      <div class="hc-row"><span>الإجمالي</span><span>${s.total}</span></div>
      <div class="hc-row"><span><i class="dot present"></i>حاضر</span><span>${s.present} (${s.pPresent}%)</span></div>
      <div class="hc-row"><span><i class="dot absent"></i>غائب</span><span>${s.absent} (${s.pAbsent}%)</span></div>
      <div class="hc-row"><span><i class="dot withdraw"></i>انسحاب</span><span>${s.withdraw} (${s.pWithdraw}%)</span></div>
      <div class="bar"><i style="width:${s.pPresent}%"></i></div>
      <div class="hc-row" style="margin-top:4px"><span>نسبة الحضور</span><span>${s.pPresent}%</span></div>
    </div>`;
  }).join("");
}

function renderAll(){ renderKPI(); renderCompare(); renderTable(); }

/* ---- تصدير Excel ---- */
function buildSheet(list,sheetTitle){
  const header=["المستشفى","الاسم","الرقم الوظيفي","القسم","المسمى الوظيفي","التاريخ","الحالة","وقت الحضور","الملاحظات"];
  const rows=list.map(r=>[r.hospital,r.name,r.empId,r.department,r.jobTitle,r.date,r.status,r.time,r.notes]);
  const s=stats(list);
  const summary=[
    ["ملخص المؤشرات (KPI)"],
    ["إجمالي المسجلين",s.total],
    ["الحاضرون",s.present,`${s.pPresent}%`],
    ["الغياب",s.absent,`${s.pAbsent}%`],
    ["المنسحبون",s.withdraw,`${s.pWithdraw}%`],
    [""]
  ];
  // مؤشرات لكل مستشفى
  const perHospital=[["مؤشرات حسب المستشفى"],["المستشفى","الإجمالي","حاضر","غائب","انسحاب","نسبة الحضور"]];
  HOSPITALS.forEach(h=>{
    const hs=stats(list.filter(r=>r.hospital===h));
    perHospital.push([h,hs.total,hs.present,hs.absent,hs.withdraw,`${hs.pPresent}%`]);
  });
  perHospital.push([""]);

  const aoa=[...summary,...perHospital,header,...rows];
  const ws=XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"]=[{wch:24},{wch:18},{wch:14},{wch:16},{wch:18},{wch:12},{wch:10},{wch:12},{wch:24}];
  return ws;
}
function exportRows(list,fileName){
  if(list.length===0){ toast("لا توجد بيانات للتصدير","error"); return; }
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,buildSheet(list,"البيانات"),"يوم الانضمام");
  XLSX.writeFile(wb,fileName);
  toast("تم تصدير الملف بنجاح","success");
}
document.getElementById("exportAllBtn").addEventListener("click",()=>{
  exportRows(records,"يوم_الانضمام_الكل.xlsx");
});
document.getElementById("exportHospitalBtn").addEventListener("click",()=>{
  const h=document.getElementById("filterHospital").value;
  if(!h){ toast("اختر مستشفى من الفلتر أولًا","error"); return; }
  exportRows(records.filter(r=>r.hospital===h),`يوم_الانضمام_${h}.xlsx`);
});
document.getElementById("exportDateBtn").addEventListener("click",()=>{
  const d=document.getElementById("filterDate").value;
  if(!d){ toast("اختر تاريخًا من الفلتر أولًا","error"); return; }
  exportRows(records.filter(r=>r.date===d),`يوم_الانضمام_${d}.xlsx`);
});

/* ---- توست ---- */
let toastTimer=null;
function toast(msg,type){
  const t=document.getElementById("toast");
  t.textContent=msg;t.className="toast "+(type||"");t.hidden=false;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.hidden=true,2600);
}

/* ---- بدء ---- */
load();
renderAll();
