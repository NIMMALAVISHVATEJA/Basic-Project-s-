// Advanced To-Do script.js
const KEY = "todo.advanced.v1";

// UI
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const projectSelect = document.getElementById("project-select");
const dueInput = document.getElementById("due-input");
const prioritySelect = document.getElementById("priority-select");

const searchInput = document.getElementById("search");
const statusFilter = document.getElementById("status-filter");
const priorityFilter = document.getElementById("priority-filter");
const projectFilter = document.getElementById("project-filter");

const taskList = document.getElementById("task-list");
const clearCompletedBtn = document.getElementById("clear-completed");
const addProjectBtn = document.getElementById("add-project");
const projectsList = document.getElementById("projects-list");

const totalCount = document.getElementById("total-count");
const completedCount = document.getElementById("completed-count");
const pendingCount = document.getElementById("pending-count");
const overdueCount = document.getElementById("overdue-count");

const darkToggle = document.getElementById("dark-toggle");
const exportJsonBtn = document.getElementById("export-json");
const exportCsvBtn = document.getElementById("export-csv");
const importFile = document.getElementById("import-file");
const importBtn = document.getElementById("import-json");
const sortDateBtn = document.getElementById("sort-date");
const sortPriorityBtn = document.getElementById("sort-priority");

// state
let store = {
  tasks: [],
  projects: ["Inbox"]
};

// helpers
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const save = () => localStorage.setItem(KEY, JSON.stringify(store));
const load = () => {
  const raw = localStorage.getItem(KEY);
  if (raw) store = JSON.parse(raw);
};

load();
applyTheme();
renderProjectOptions();
renderProjectsList();
renderTasks();

// add project
addProjectBtn.addEventListener("click", ()=>{
  const name = prompt("Project name:");
  if (!name) return;
  if (!store.projects.includes(name)) store.projects.push(name);
  save(); renderProjectOptions(); renderProjectsList(); renderTasks();
});

// form add
taskForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  const text = taskInput.value.trim(); if (!text) return;
  const task = {
    id: uid(), text, project: projectSelect.value||"Inbox",
    priority: prioritySelect.value, dueDate: dueInput.value||null,
    completed: false, createdAt: new Date().toISOString()
  };
  store.tasks.unshift(task);
  save();
  taskForm.reset();
  renderTasks();
});

// filters
[searchInput, statusFilter, priorityFilter, projectFilter].forEach(el=>{
  el.addEventListener("input", renderTasks);
  el.addEventListener("change", renderTasks);
});

// clear completed
clearCompletedBtn.addEventListener("click", ()=>{
  if (!confirm("Clear completed tasks?")) return;
  store.tasks = store.tasks.filter(t => !t.completed);
  save(); renderTasks();
});

// export json
exportJsonBtn.addEventListener("click", ()=>{
  const data = JSON.stringify(store,null,2);
  const blob = new Blob([data], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `todo-${new Date().toISOString().slice(0,10)}.json`; a.click();
  URL.revokeObjectURL(url);
});

// export csv
exportCsvBtn.addEventListener("click", ()=>{
  if (!store.tasks.length) return alert("No tasks");
  const rows = [["id","text","project","priority","dueDate","completed","createdAt"]];
  store.tasks.forEach(t => rows.push([t.id,t.text,t.project,t.priority,t.dueDate||"",t.completed,t.createdAt]));
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `todo-${new Date().toISOString().slice(0,10)}.csv`; a.click();
});

// import
importBtn.addEventListener("click", ()=> importFile.click());
importFile.addEventListener("change", (e)=>{
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = evt=>{
    try {
      const data = JSON.parse(evt.target.result);
      if (Array.isArray(data.tasks)) {
        // merge simple: append imported tasks at top
        store.tasks = [...data.tasks, ...store.tasks];
        store.projects = Array.from(new Set([...(data.projects||[]), ...store.projects]));
        save(); renderProjectOptions(); renderProjectsList(); renderTasks();
        alert("Imported");
      } else alert("Invalid file");
    } catch (err) {
      alert("Error parsing file: " + err.message);
    }
  };
  r.readAsText(f);
  importFile.value = "";
});

// sorting
sortDateBtn.addEventListener("click", ()=>{
  store.tasks.sort((a,b)=>{
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
  save(); renderTasks();
});
sortPriorityBtn.addEventListener("click", ()=>{
  const rank = {high:0, medium:1, low:2};
  store.tasks.sort((a,b)=> rank[a.priority]-rank[b.priority]);
  save(); renderTasks();
});

// theme
darkToggle.addEventListener("change", ()=>{
  document.body.classList.toggle("dark", darkToggle.checked);
  localStorage.setItem("todo.theme.dark", darkToggle.checked? "1":"0");
});
function applyTheme(){
  const saved = localStorage.getItem("todo.theme.dark");
  const isDark = saved === "1";
  darkToggle.checked = isDark;
  document.body.classList.toggle("dark", isDark);
}

// drag & drop simple re-order
let dragId = null;
taskList.addEventListener("dragstart", (e)=>{
  const li = e.target.closest("li.task-item"); if (!li) return;
  dragId = li.dataset.id;
  e.dataTransfer.effectAllowed = "move";
  li.style.opacity = ".5";
});
taskList.addEventListener("dragend", (e)=>{
  const li = e.target.closest("li.task-item"); if (li) li.style.opacity = "";
});
taskList.addEventListener("dragover", e=> e.preventDefault());
taskList.addEventListener("drop", (e)=>{
  e.preventDefault();
  const li = e.target.closest("li.task-item"); if (!li || !dragId) return;
  const id = li.dataset.id;
  if (id === dragId) return;
  const src = store.tasks.findIndex(t=>t.id===dragId);
  const dst = store.tasks.findIndex(t=>t.id===id);
  if (src<0||dst<0) return;
  const [moved] = store.tasks.splice(src,1);
  store.tasks.splice(dst,0,moved);
  save(); renderTasks();
  dragId = null;
});

// render helpers
function renderProjectOptions(){
  projectSelect.innerHTML = store.projects.map(p=>`<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
  projectFilter.innerHTML = `<option value="all">All projects</option>` + store.projects.map(p=>`<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
}
function renderProjectsList(){
  projectsList.innerHTML = store.projects.map(p=>{
    const c = store.tasks.filter(t=>t.project===p).length;
    return `<li>${escapeHtml(p)} (${c}) <button data-project="${escapeHtml(p)}" class="open-project">Open</button></li>`;
  }).join("");
  projectsList.querySelectorAll(".open-project").forEach(b=>{
    b.addEventListener("click", ()=>{ projectFilter.value = b.dataset.project; renderTasks(); });
  });
}
function renderTasks(){
  const q = (searchInput.value||"").trim().toLowerCase();
  const status = statusFilter.value;
  const pfilter = priorityFilter.value;
  const proj = projectFilter.value;
  const nowDate = new Date(new Date().toDateString());

  const list = store.tasks.filter(t=>{
    if (proj !== "all" && t.project !== proj) return false;
    if (pfilter !== "all" && t.priority !== pfilter) return false;
    if (q && !t.text.toLowerCase().includes(q)) return false;
    const overdue = t.dueDate && !t.completed && new Date(t.dueDate) < nowDate;
    if (status === "completed" && !t.completed) return false;
    if (status === "pending" && t.completed) return false;
    if (status === "overdue" && !overdue) return false;
    return true;
  });

  // render
  taskList.innerHTML = list.map(t => renderTaskLi(t)).join("");
  // attach events
  document.querySelectorAll(".task-item").forEach(li=>{
    const id = li.dataset.id;
    li.querySelector(".toggle-complete").addEventListener("click", ()=> toggleComplete(id));
    li.querySelector(".edit-btn").addEventListener("click", ()=> editTask(id));
    li.querySelector(".delete-btn").addEventListener("click", ()=> {
      if (!confirm("Delete task?")) return;
      store.tasks = store.tasks.filter(x=>x.id!==id); save(); renderTasks();
    });
  });
  updateStats();
}
function renderTaskLi(t){
  const overdue = t.dueDate && !t.completed && (new Date(t.dueDate) < new Date(new Date().toDateString()));
  const due = t.dueDate ? ` • due ${t.dueDate}` : "";
  return `<li class="task-item ${t.completed ? "completed" : ""} ${overdue? "overdue":""}" draggable="true" data-id="${t.id}">
    <div class="task-left">
      <span class="priority-dot priority-${t.priority}"></span>
      <div>
        <div class="title">${escapeHtml(t.text)}</div>
        <div class="task-meta">${escapeHtml(t.project)}${due}</div>
      </div>
    </div>
    <div class="task-actions">
      <button class="small toggle-complete">${t.completed ? "↺" : "✔"}</button>
      <button class="small edit-btn">✏</button>
      <button class="small del delete-btn">🗑</button>
    </div>
  </li>`;
}
function toggleComplete(id){
  const t = store.tasks.find(x=>x.id===id); if (!t) return;
  t.completed = !t.completed; save(); renderTasks();
}
function editTask(id){
  const t = store.tasks.find(x=>x.id===id); if (!t) return;
  const newText = prompt("Edit text:", t.text);
  if (newText!==null && newText.trim()!=="") t.text = newText.trim();
  const newDue = prompt("Due date (YYYY-MM-DD) or blank:", t.dueDate||"");
  if (newDue!==null) t.dueDate = newDue.trim()||null;
  const newPriority = prompt("Priority (low/medium/high):", t.priority) || t.priority;
  if (["low","medium","high"].includes(newPriority)) t.priority = newPriority;
  save(); renderTasks();
}
function updateStats(){
  const total = store.tasks.length;
  const comp = store.tasks.filter(t=>t.completed).length;
  const pending = total - comp;
  const overdue = store.tasks.filter(t=>t.dueDate && !t.completed && new Date(t.dueDate) < new Date(new Date().toDateString())).length;
  totalCount.textContent = total; completedCount.textContent = comp; pendingCount.textContent = pending; overdueCount.textContent = overdue;
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
