const MEMORY_KEY='john_memory';
function getMemory(){return JSON.parse(localStorage.getItem(MEMORY_KEY)||'[]');}
function saveMemory(item){
 const m=getMemory(); m.push({time:new Date().toISOString(),text:item});
 localStorage.setItem(MEMORY_KEY,JSON.stringify(m));
}
