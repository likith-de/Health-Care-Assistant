/* WebGL 3D particles background (port of the reactbits.dev Particles idea, no libraries) */
(function(){
const cv=document.getElementById('bg'),gl=cv.getContext('webgl',{alpha:true,premultipliedAlpha:false});
if(!gl)return;
const N=800,P=new Float32Array(N*3),R=new Float32Array(N*4),C=new Float32Array(N*3);
const pal=[[.24,.88,.77],[1,1,1],[.48,.65,1]];
for(let i=0;i<N;i++){let v=[0,0,0],l;do{v=v.map(()=>Math.random()*2-1);l=Math.hypot(...v)}while(l>1||l<.01);
const k=Math.cbrt(Math.random())/l;P.set(v.map(x=>x*k),i*3);R.set([Math.random(),Math.random(),Math.random(),Math.random()],i*4);C.set(pal[i%3],i*3)}
const vs=`attribute vec3 position;attribute vec4 random;attribute vec3 color;
uniform float uT,uRY,uRX,uSize;uniform vec2 uM;varying vec3 vC;varying float vA;
void main(){vec3 p=position*2.4;
p+=vec3(sin(uT*random.z+6.28*random.w),sin(uT*random.y+6.28*random.x),sin(uT*random.w+6.28*random.y))*(.1+random.x*.35);
float c=cos(uRY),s=sin(uRY);p.xz=vec2(p.x*c-p.z*s,p.x*s+p.z*c);
c=cos(uRX);s=sin(uRX);p.yz=vec2(p.y*c-p.z*s,p.y*s+p.z*c);
p.xy+=uM*.5;p.z+=4.6;
gl_Position=vec4(p.x*2.2/p.z,-p.y*2.2/p.z,0.,1.);
gl_PointSize=uSize*(.6+random.x*1.6)*(4.6/p.z);vC=color;vA=clamp(1.4-p.z*.18,.15,1.);}`;
const fs=`precision mediump float;varying vec3 vC;varying float vA;
void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vC,vA*(1.-smoothstep(.1,.5,d)));}`;
function sh(t,s){const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o}
const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
[['position',P,3],['random',R,4],['color',C,3]].forEach(([n,d,s])=>{const b=gl.createBuffer(),l=gl.getAttribLocation(pr,n);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,d,gl.STATIC_DRAW);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,s,gl.FLOAT,false,0,0)});
const U=n=>gl.getUniformLocation(pr,n);
gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
let dpr=1,mx=0,my=0,sx=0,sy=0;
function rs(){dpr=Math.min(devicePixelRatio||1,2);cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;gl.viewport(0,0,cv.width,cv.height)}
addEventListener('resize',rs);rs();
const mv=(x,y)=>{mx=x/innerWidth-.5;my=y/innerHeight-.5};
addEventListener('mousemove',e=>mv(e.clientX,e.clientY));
addEventListener('touchmove',e=>mv(e.touches[0].clientX,e.touches[0].clientY),{passive:true});
const still=matchMedia('(prefers-reduced-motion:reduce)').matches;
function fr(t){sx+=(mx-sx)*.05;sy+=(my-sy)*.05;gl.clear(gl.COLOR_BUFFER_BIT);
gl.uniform1f(U('uT'),still?0:t*.0006);gl.uniform1f(U('uRY'),(still?0:t*.00012)+sx*1.2);gl.uniform1f(U('uRX'),sy*.8);
gl.uniform1f(U('uSize'),5*dpr);gl.uniform2f(U('uM'),sx*.8,sy*.8);gl.drawArrays(gl.POINTS,0,N);requestAnimationFrame(fr)}
requestAnimationFrame(fr);
})();
