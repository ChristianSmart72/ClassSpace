import { FastifyInstance } from 'fastify';

export function resetPageRoute(app: FastifyInstance) {
  app.get('/reset', async (_request, reply) => {
    reply.type('text/html');
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reset Database — ClassSpace</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f0f11;color:#e8e8ed;display:flex;align-items:center;justify-content:center;min-height:100dvh;padding:20px}
.card{background:#1c1c1f;border:1px solid #2c2c30;border-radius:16px;padding:32px;max-width:400px;width:100%}
h1{font-size:20px;font-weight:700;margin-bottom:4px}
p{color:#8e8e93;font-size:14px;margin-bottom:20px;line-height:1.5}
input{width:100%;background:#0f0f11;border:1px solid #2c2c30;border-radius:10px;padding:12px 16px;color:#e8e8ed;font-size:14px;margin-bottom:12px;outline:none;transition:border-color .2s}
input:focus{border-color:#7b61ff}
button{width:100%;background:#7b61ff;color:#fff;border:none;border-radius:10px;padding:12px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .2s}
button:hover{opacity:.9}
button:disabled{opacity:.5;cursor:not-allowed}
#msg{margin-top:12px;font-size:13px;line-height:1.5;padding:8px 12px;border-radius:8px;display:none}
#msg.error{display:block;background:#3a1a1a;color:#ff6b6b;border:1px solid #5a2020}
#msg.success{display:block;background:#1a3a1a;color:#6bff6b;border:1px solid #205a20}
</style>
</head>
<body>
<div class="card">
<h1>Reset Database</h1>
<p>This will drop all tables and re-seed the default PRE220 space. This cannot be undone.</p>
<input type="password" id="token" placeholder="Enter reset token" autocomplete="off">
<button id="btn" onclick="reset()">Reset Database</button>
<div id="msg"></div>
</div>
<script>
async function reset(){
  const t=document.getElementById('token');
  const b=document.getElementById('btn');
  const m=document.getElementById('msg');
  const token=t.value.trim();
  if(!token){show('Enter the reset token','error');return}
  b.disabled=true;b.textContent='Resetting...';m.style.display='none';
  try{
    const r=await fetch('/api/db/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});
    const d=await r.json();
    if(r.ok)show(d.message||'Done','success')
    else show(d.error||'Reset failed','error')
  }catch(e){show('Network error','error')}
  finally{b.disabled=false;b.textContent='Reset Database'}
}
function show(msg,type){const m=document.getElementById('msg');m.textContent=msg;m.className=type;m.style.display='block'}
</script>
</body>
</html>`;
  });
}
