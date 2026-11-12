// Zero-dependency static server: run with `node server.js`, open http://localhost:3000
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'public'),port=process.env.PORT||3000;
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
http.createServer((q,r)=>{
  const u=decodeURIComponent(q.url.split('?')[0]);
  const f=path.join(root,path.normalize(u==='/'?'/index.html':u));
  if(!f.startsWith(root)){r.writeHead(403);return r.end('Forbidden')}
  fs.readFile(f,(e,d)=>{
    if(e){r.writeHead(404);return r.end('Not found')}
    r.writeHead(200,{'Content-Type':(types[path.extname(f)]||'application/octet-stream')+'; charset=utf-8'});r.end(d);
  });
}).listen(port,()=>console.log('Health Care Assistant running at http://localhost:'+port));
