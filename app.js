const chat=document.getElementById('chat');
function add(role,msg){
 chat.innerHTML += `<p><b>${role}:</b> ${msg}</p>`;
 chat.scrollTop=chat.scrollHeight;
}
function speak(text){
 const u=new SpeechSynthesisUtterance(text);
 speechSynthesis.speak(u);
}
async function handleMessage(msg){
 add('You',msg);
 saveMemory(msg); // automatic memory
 const memories=getMemory().slice(-20).map(x=>x.text).join('\n');
 const reply='John v1 demo. I remembered your recent messages. Total memories: '+getMemory().length+'. Connect a free AI API here later.';
 add('John',reply);
 speak(reply);
}
document.getElementById('send').onclick=()=>{
 const t=document.getElementById('text');
 if(t.value.trim()) handleMessage(t.value.trim());
 t.value='';
};
document.getElementById('mic').onclick=()=>{
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){alert('Speech recognition not supported');return;}
 const r=new SR();
 r.onresult=e=>handleMessage(e.results[0][0].transcript);
 r.start();
};
