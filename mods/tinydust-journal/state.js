export const EMPTY = () => ({version:1, notes:"", tasks:[], now:null});

// Reject corrupt storage rather than silently replacing someone's journal.
export function decode(raw) {
  if (raw == null) return EMPTY();
  const data = JSON.parse(raw);
  if (!data || data.version !== 1 || typeof data.notes !== "string" || !Array.isArray(data.tasks)
      || !(data.now === null || typeof data.now === "string")) throw new Error("Invalid journal format");
  const ids = new Set();
  for (const task of data.tasks) {
    if (!task || typeof task.id !== "string" || ids.has(task.id) || typeof task.text !== "string" || typeof task.done !== "boolean")
      throw new Error("Invalid task data");
    ids.add(task.id);
  }
  if (data.now && !data.tasks.some(task => task.id === data.now && !task.done)) data.now = null;
  return data;
}

export function addTask(data, text, id) {
  const value = text.trim();
  if (!value) throw new Error("Write one small next step first.");
  if (value.length > 240) throw new Error("Keep this step under 240 characters.");
  if (data.tasks.length >= 500) throw new Error("This journal has reached its 500-task limit.");
  if (data.tasks.some(task => task.id === id)) throw new Error("Task ID collision. Try again.");
  return {...data, tasks:[...data.tasks,{id,text:value,done:false}]};
}

export function toggleTask(data, id) {
  const target = data.tasks.find(task => task.id === id);
  if (!target) return data;
  return {...data, now:data.now === id ? null : data.now,
    tasks:data.tasks.map(task => task.id === id ? {...task,done:!task.done} : task)};
}

export function selectNow(data, id) {
  return {...data, now:data.tasks.some(task => task.id === id && !task.done) ? id : null};
}
