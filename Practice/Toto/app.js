/* ============================================
   1. DOM REFERENCES (cache karo, baar-baar query mat karo)
============================================ */
const form      = document.getElementById("todo-form");
const input     = document.getElementById("todo-input");
const list      = document.getElementById("todo-list");
const emptyState = document.getElementById("empty-state");
const countEl   = document.getElementById("count");
const filterBtns = document.querySelectorAll("[data-filter]");

/* ============================================
   2. STATE (single source of truth)
============================================ */
let todos = loadTodos();       // Array of { id, text, done }
let currentFilter = "all";     // "all" | "active" | "done"

/* ============================================
   3. STORAGE HELPERS (localStorage)
============================================ */
function loadTodos() {
  try {
    const raw = localStorage.getItem("todos");
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to load todos:", err);
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem("todos", JSON.stringify(todos));
  } catch (err) {
    console.error("Failed to save todos:", err);
  }
}

/* ============================================
   4. UTILS
============================================ */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getVisibleTodos() {
  // filter() — non-mutating
  if (currentFilter === "active") return todos.filter(t => !t.done);
  if (currentFilter === "done")   return todos.filter(t =>  t.done);
  return todos;
}

/* ============================================
   5. RENDER (state → DOM)
============================================ */
function render() {
  const visible = getVisibleTodos();

  // Clear list
  list.innerHTML = "";

  // Empty state
  emptyState.hidden = visible.length !== 0;

  // Build each item
  // DocumentFragment — ek hi reflow, performance
  const frag = document.createDocumentFragment();

  visible.forEach(todo => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.done ? " done" : "");
    li.dataset.id = todo.id; // data-id attribute

    // Text (click = toggle)
    const span = document.createElement("span");
    span.textContent = todo.text; // ⚠️ textContent — XSS safe
    span.dataset.action = "toggle";

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "✕";
    delBtn.className = "delete-btn";
    delBtn.dataset.action = "delete";

    li.append(span, delBtn);
    frag.appendChild(li);
  });

  list.appendChild(frag);

  // Count
  const remaining = todos.filter(t => !t.done).length;
  countEl.textContent = `${remaining} item${remaining !== 1 ? "s" : ""} left`;
}

/* ============================================
   6. ACTIONS (business logic)
============================================ */
function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return; // empty mat add karo

  todos.push({
    id: generateId(),
    text: trimmed,
    done: false
  });

  saveTodos();
  render();
}

function toggleTodo(id) {
  // Immutable update — reference badla, React ka pattern
  todos = todos.map(t =>
    t.id === id ? { ...t, done: !t.done } : t
  );
  saveTodos();
  render();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  render();
}

/* ============================================
   7. EVENT LISTENERS
============================================ */

// --- Form submit (add todo)
form.addEventListener("submit", (e) => {
  e.preventDefault(); // ⚠️ page reload rok
  addTodo(input.value);
  input.value = "";
  input.focus();
});

// --- Event Delegation on list (toggle + delete dono)
list.addEventListener("click", (e) => {
  const action = e.target.dataset.action;
  if (!action) return;

  // closest() — target ke parent chain me .todo-item dhoondo
  const li = e.target.closest(".todo-item");
  if (!li) return;

  const id = li.dataset.id;

  if (action === "toggle") toggleTodo(id);
  if (action === "delete") deleteTodo(id);
});

// --- Filter buttons (bhi delegation pattern)
document.querySelector(".filters").addEventListener("click", (e) => {
  const filter = e.target.dataset.filter;
  if (!filter) return;

  currentFilter = filter;

  // Active class update
  filterBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });

  render();
});

/* ============================================
   8. INITIAL RENDER
============================================ */
render();