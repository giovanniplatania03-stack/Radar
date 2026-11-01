// @ts-nocheck
/**
 * Radar.tsx — "Come funziona la modalità B delle auto ibride (3D)"
 *
 * Componente React convertito dal file HTML originale.
 * Dipendenze:   npm i three@0.128.0
 * File dati:    ./priusModel.ts (modello 3D della Prius in base64)
 *
 * Uso:  import Radar from "./Radar";   ...   <Radar />
 */
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { PRIUS_B64 } from "./priusModel";

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=block");
.radar-root{display:flex;flex-direction:column;width:100%;height:100vh;height:100dvh;background:#000;color:#ddd;font:14px Inter,system-ui,sans-serif}
.radar-root #wrap{flex:1;min-height:0;display:flex;align-items:center;justify-content:center}
.radar-root #stage{position:relative;aspect-ratio:16/9;width:min(100vw,calc((100vh - 56px)*16/9))}
.radar-root #stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.radar-root #bar{display:flex;gap:12px;align-items:center;padding:8px 14px;background:#111;border-top:1px solid #2a2a36;flex-wrap:wrap}
.radar-root #bar button{background:#2a2a3c;color:#fff;border:0;border-radius:8px;padding:6px 14px;font:600 14px Inter,sans-serif;cursor:pointer}
.radar-root #bar input[type=range]{flex:1;min-width:160px;accent-color:#2f7bff}
.radar-root #tm{font-variant-numeric:tabular-nums;min-width:96px;text-align:right}
.radar-root label{display:flex;gap:6px;align-items:center;cursor:pointer}
`;

/** Avvia l'animazione dentro `root`. Restituisce la funzione di pulizia. */
function init(root: HTMLElement): () => void {

  /* ============ H: libreria di disegno ============ */
  const W=1280,HH=720,V='#2f7bff',O='#a9d0ff';
  const E=x=>1-Math.pow(1-x,3),cl=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),sg=(t,a,b)=>cl((t-a)/(b-a)),L=(a,b,x)=>a+(b-a)*x;
  const H={
   stage(c,light){const g=c.createRadialGradient(W/2,HH*.45,60,W/2,HH/2,W*.7);
    if(light){g.addColorStop(0,'#fff');g.addColorStop(1,'#e9e9f0')}else{g.addColorStop(0,'#0f1830');g.addColorStop(1,'#04050a')}
    c.fillStyle=g;c.fillRect(0,0,W,HH);
    const f=c.createLinearGradient(0,560,0,HH);f.addColorStop(0,'rgba(0,0,0,0)');f.addColorStop(1,light?'rgba(0,0,0,.08)':'rgba(47,123,255,.12)');c.fillStyle=f;c.fillRect(0,560,W,160)},
   vignette(c){const g=c.createRadialGradient(W/2,HH/2,HH*.45,W/2,HH/2,W*.72);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.5)');c.fillStyle=g;c.fillRect(0,0,W,HH)},
   grad(c,x0,x1){const g=c.createLinearGradient(x0,0,x1,0);g.addColorStop(0,V);g.addColorStop(1,O);return g},
   text(c,s,x,y,size,o={}){c.save();c.font=`${o.w||800} ${size}px Inter,sans-serif`;c.textAlign=o.al||'center';c.textBaseline='middle';
    const w=c.measureText(s).width,x0=o.al==='left'?x:o.al==='right'?x-w:x-w/2;
    if(o.g){c.shadowColor='rgba(80,150,255,.5)';c.shadowBlur=o.glow??30;c.fillStyle=H.grad(c,x0,x0+w)}else c.fillStyle=o.col||'#f2f2f8';
    c.globalAlpha*=o.a??1;c.fillText(s,x,y);c.restore()},
   ring(c,x,y,r,a,col=V,lw=3){if(a<=0||r<=0)return;c.save();c.strokeStyle=col;c.globalAlpha*=a;c.lineWidth=lw;c.shadowColor=col;c.shadowBlur=18;c.beginPath();c.arc(x,y,r,0,7);c.stroke();c.restore()},
   arc(c,x,y,r,a0,a1,a,col=V,lw=3,dash){if(a<=0||r<=0)return;c.save();c.strokeStyle=col;c.globalAlpha*=a;c.lineWidth=lw;c.shadowColor=col;c.shadowBlur=14;if(dash)c.setLineDash(dash);c.beginPath();c.arc(x,y,r,a0,a1);c.stroke();c.restore()},
   module(c,x,y,glow=1,sc=1){c.save();c.translate(x,y);c.scale(sc,sc);
    c.fillStyle='#0c0c12';c.beginPath();c.moveTo(-150,150);c.lineTo(150,150);c.lineTo(190,190);c.lineTo(-110,190);c.fill();
    let g=c.createLinearGradient(-150,-150,150,150);g.addColorStop(0,'#4a4a58');g.addColorStop(.35,'#1a1a24');g.addColorStop(.6,'#34343f');g.addColorStop(1,'#101017');
    c.fillStyle=g;c.beginPath();c.roundRect(-150,-150,300,300,28);c.fill();c.strokeStyle='rgba(255,255,255,.28)';c.lineWidth=2;c.stroke();
    g=c.createLinearGradient(-150,-150,60,60);g.addColorStop(0,'rgba(255,255,255,.35)');g.addColorStop(.25,'rgba(255,255,255,0)');c.fillStyle=g;c.beginPath();c.roundRect(-150,-150,300,300,28);c.fill();
    c.strokeStyle='rgba(139,92,246,.55)';c.lineWidth=3;
    [[-110,-110,-60],[110,-110,60],[-110,110,-60],[110,110,60]].forEach(([sx,sy,dx])=>{c.beginPath();c.moveTo(sx,sy);c.lineTo(sx+dx*.2,sy);c.lineTo(sx+dx*.8,sy>0?sy-60:sy+60);c.stroke()});
    c.fillStyle='#08080d';c.beginPath();c.arc(0,0,92,0,7);c.fill();c.strokeStyle='#555566';c.lineWidth=5;c.stroke();
    const e=c.createRadialGradient(0,0,4,0,0,70);e.addColorStop(0,`rgba(255,255,255,${cl(.95*glow)})`);e.addColorStop(.25,`rgba(251,146,60,${cl(.9*glow)})`);e.addColorStop(.7,`rgba(139,92,246,${cl(.7*glow)})`);e.addColorStop(1,'rgba(139,92,246,0)');
    c.fillStyle=e;c.shadowColor=O;c.shadowBlur=60*glow;c.beginPath();c.arc(0,0,70,0,7);c.fill();c.shadowBlur=0;
    c.strokeStyle=O;c.globalAlpha=cl(.4+.6*glow);c.lineWidth=6;c.shadowColor=O;c.shadowBlur=30*glow;c.beginPath();c.arc(0,0,58,0,7);c.stroke();c.restore()},
   jet(c,x,y,s=1,a=1){c.save();c.translate(x,y);c.scale(s,s);c.globalAlpha*=a;c.fillStyle='#cfcfe0';c.shadowColor=V;c.shadowBlur=24;
    c.beginPath();c.moveTo(-90,0);c.lineTo(-20,-10);c.lineTo(20,-70);c.lineTo(40,-70);c.lineTo(30,-10);c.lineTo(80,-6);c.lineTo(100,-28);c.lineTo(112,-28);c.lineTo(104,0);
    c.lineTo(112,28);c.lineTo(100,28);c.lineTo(80,6);c.lineTo(30,10);c.lineTo(40,70);c.lineTo(20,70);c.lineTo(-20,10);c.closePath();c.fill();
    c.shadowBlur=0;c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(-55,0,22,5,0,0,7);c.fill();c.restore()},
   callout(c,x0,y0,x1,y1,label,al='left'){c.save();c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=1.5;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.lineTo(x1+(al==='left'?60:-60),y1);c.stroke();
    c.fillStyle='#fff';c.beginPath();c.arc(x0,y0,5,0,7);c.fill();c.restore();
    H.text(c,label,x1+(al==='left'?72:-72),y1,30,{al,w:600,col:'#f2f2f8'})},
   wave(c,x0,x1,y,amp,wl,col,a=1,ph=0){c.save();c.strokeStyle=col;c.globalAlpha*=a;c.lineWidth=4;c.shadowColor=col;c.shadowBlur=14;c.beginPath();
    for(let x=x0;x<=x1;x+=3){const yy=y+Math.sin((x-x0)/wl*6.283+ph)*amp;x===x0?c.moveTo(x,yy):c.lineTo(x,yy)}c.stroke();c.restore()},
   sweep(c,x){c.save();c.translate(x,0);c.rotate(.18);const g=c.createLinearGradient(-260,0,260,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(-260,-200,520,1100);c.restore()}
  };
  /* ============ SOUND: kit WebAudio ============ */
  const SOUND={live(score,startT,opts={}){
   const AC=new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();
   const m=AC.createGain();m.gain.value=.85;const cp=AC.createDynamicsCompressor();m.connect(cp);cp.connect(AC.destination);
   const nodes=[],base=AC.currentTime+.06,when=t=>base+(t-startT);
   const nb=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate),d0=nb.getChannelData(0);for(let i=0;i<d0.length;i++)d0[i]=Math.random()*2-1;
   const env=(g,w,d,v)=>{g.gain.setValueAtTime(.0001,w);g.gain.exponentialRampToValueAtTime(v,w+Math.min(.02,d/3));g.gain.exponentialRampToValueAtTime(.0001,w+d)};
   const osc=(type,f0,f1,t,d,v)=>{if(t<startT)return;const o=AC.createOscillator(),g=AC.createGain(),w=when(t);o.type=type;o.frequency.setValueAtTime(f0,w);if(f1)o.frequency.exponentialRampToValueAtTime(f1,w+d);env(g,w,d,v);o.connect(g);g.connect(m);o.start(w);o.stop(w+d+.05);nodes.push(o)};
   const nz=(t,d,v,f0,f1,q=1,type='bandpass')=>{if(t<startT)return;const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain(),w=when(t);s.buffer=nb;s.loop=true;f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,w);if(f1!==f0)f.frequency.exponentialRampToValueAtTime(f1,w+d);env(g,w,d,v);s.connect(f);f.connect(g);g.connect(m);s.start(w);s.stop(w+d+.05);nodes.push(s)};
   const k={
    blip:(t,f=1400,v=.14)=>{osc('square',f,f*1.5,t,.09,v*.5);osc('sine',f*2,f*3,t,.07,v*.6)},
    click:t=>{nz(t,.03,.3,3500,3500,1,'highpass');osc('sine',1800,800,t,.04,.12)},
    tick:(t,f=2200)=>osc('triangle',f,f*.85,t,.035,.1),
    whoosh:(t,d=.6,v=.3,up=true)=>nz(t,d,v,up?250:4500,up?4500:250,1.3),
    boom:(t,v=.5)=>{osc('sine',130,30,t,.9,v);nz(t,.3,v*.45,500,50,1,'lowpass')},
    glide:(t,f0,f1,d,v=.08)=>{osc('sawtooth',f0,f1,t,d,v*.5);osc('sine',f0*2,f1*2,t,d,v)},
    riser:(t,d,v=.25)=>{nz(t,d,v,200,5000,1.5);osc('sawtooth',90,900,t,d,v*.3)},
    chord:(t,fs,d=1.6,v=.08)=>fs.forEach(f=>{osc('sine',f,0,t,d,v);osc('triangle',f*2,0,t,d,v*.3)}),
    shimmer:(t,d=1.2)=>{for(let i=0;i<6;i++)osc('sine',2000+i*650,0,t+i*.05,d,.03)},
    drone:(t,d,f,v=.1)=>osc('sine',f,f*1.4,t,d,v),kick:(t,v=.35)=>osc('sine',150,45,t,.18,v),hat:(t,v=.05)=>nz(t,.04,v,7000,7000,1,'highpass'),bass:(t,f,d=.22,v=.12)=>{osc('sawtooth',f,f,t,d,v*.6);osc('sine',f/2,f/2,t,d,v)}};
   score(k,opts);
   return()=>{nodes.forEach(o=>{try{o.stop()}catch(e){}});try{m.disconnect()}catch(e){}try{AC.close()}catch(e){}};
  }};
  /* ============ Progetto: modalità B ============ */
  const DURATION=91;
  const NARR=[
  [0.3,7.6,'Sei in discesa e la leva indica B. Ma sai cosa significa davvero?'],
  [8.3,12,'Un’auto ibrida combina un motore termico e uno elettrico.'],
  [12.1,17,'Una batteria alimenta il motore elettrico e la trasmissione porta la forza alle ruote.'],
  [17.1,20,'Le combinazioni cambiano da sistema a sistema.'],
  [20.3,23.5,'In modalità D, quando rilasci l’acceleratore,'],
  [23.6,27,'il motore elettrico diventa un generatore.'],
  [27.1,32,'Recupera parte dell’energia cinetica e la trasforma in energia elettrica,'],
  [32.1,35,'che torna alla batteria.'],
  [36.6,42,'Con la modalità B il rallentamento aumenta quando rilasci l’acceleratore.'],
  [42.1,52,'Il sistema usa di più il freno motore e, a seconda dell’auto, la frenata rigenerativa e altre strategie di gestione dell’energia.'],
  [52.1,55,'Il comportamento cambia da modello a modello.'],
  [55.3,58,'Facciamo un confronto in discesa.'],
  [58.1,63,'In D l’auto rallenta poco e devi usare spesso il freno.'],
  [63.1,67.5,'In B il rallentamento è maggiore, e premi meno il pedale del freno.'],
  [67.6,70,'Ideale nelle discese ripide.'],
  [70.3,74.5,'Attenzione a un mito: B non significa sempre più ricarica.'],
  [74.6,80.5,'Parte dell’energia può essere dissipata dal motore termico o da altri sistemi di rallentamento,'],
  [80.6,83,'e dipende dall’auto.'],
  [83.2,87,'D per la guida quotidiana, B per le discese ripide.'],
  [87.2,91,'Ora sai cosa succede quando inserisci la modalità B.']];
  const pop=(t,t0,d=.5)=>E(sg(t,t0,t0+d));
  function hl(c,parts,x,y,size,a=1){c.save();c.font=`800 ${size}px Inter,sans-serif`;const ws=parts.map(p=>c.measureText(p[0]).width),tot=ws.reduce((s,v)=>s+v,0);c.restore();let cx=x-tot/2;parts.forEach((p,i)=>{H.text(c,p[0],cx,y+(1-a)*30,size,{al:'left',g:p[1],a,col:'#fff'});cx+=ws[i]})}
  const note=(c,a)=>H.text(c,'VARIA SECONDO COSTRUTTORE E MODELLO',1240,36,24,{al:'right',w:600,col:'#9aa4b8',a});
  function badge(c,x,y,ch,a=1){c.save();c.globalAlpha=a;c.strokeStyle='#4f8cff';c.lineWidth=4;c.shadowColor='#2f7bff';c.shadowBlur=20;c.beginPath();c.roundRect(x-40,y-40,80,80,16);c.stroke();c.restore();H.text(c,ch,x,y,60,{g:1,a})}
  function lab(c,txt,p,dx,dy,a,size=34){c.save();c.globalAlpha=a;c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=2;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(p[0]+dx,p[1]+dy);c.stroke();c.fillStyle='#fff';c.beginPath();c.arc(p[0],p[1],5,0,7);c.fill();H.text(c,txt,p[0]+dx,p[1]+dy+(dy<0?-30:30),size,{w:600,col:'#fff'});c.restore()}
  function flow(c,pts,t,col,rev=0,sp=.6,n=6,w=3){let tot=0;const ls=[];for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);ls.push(l);tot+=l}
   c.save();c.strokeStyle=col;c.globalAlpha*=.3;c.lineWidth=w;c.shadowColor=col;c.shadowBlur=10;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();c.restore();
   for(let k=0;k<n;k++){let u=(t*sp+k/n)%1;if(rev)u=1-u;let d=u*tot,i=0;while(i<ls.length-1&&d>ls[i]){d-=ls[i];i++}const f=d/ls[i];
    c.save();c.fillStyle='#fff';c.shadowColor=col;c.shadowBlur=16;c.beginPath();c.arc(L(pts[i][0],pts[i+1][0],f),L(pts[i][1],pts[i+1][1],f),w*.6+1.5,0,7);c.fill();c.restore()}}
  function sub(c,t){if(t>87.2)return;const n=NARR.find(n=>t>=n[0]&&t<n[1]+.4);if(!n)return;const s=n[2];let ls=[s];if(s.length>58){const m=s.lastIndexOf(' ',Math.floor(s.length/2)+8);ls=[s.slice(0,m),s.slice(m+1)]}
   c.save();c.font='600 28px Inter,sans-serif';const w=Math.max(...ls.map(l=>c.measureText(l).width))+40,h=ls.length*38+14;c.fillStyle='rgba(0,0,0,.82)';c.beginPath();c.roundRect(640-w/2,690-h,w,h,14);c.fill();c.restore();ls.forEach((l,i)=>H.text(c,l,640,690-h+27+i*38,28,{w:600}))}
  /* ============ Spartito audio ============ */
  function scoreSound(k){
   const drop=t=>t>=70&&t<74.5;
   for(let i=0;i<182;i++){const t=i*.5;
    if(t>=8&&t<83&&!drop(t)){k.kick(t,t>=35&&t<55?.4:.3);k.bass(t,[55,55,65.4,49,55,73.4,65.4,49][i%8],.4,.1)}
    if(t>=20&&t<83){k.hat(t+.25,.04);if(t>=35&&!drop(t))k.hat(t,.03)}
    if((t>=35&&t<55)||(t>=74.5&&t<83))k.blip(t+.25,[880,1040,1320,1040][i%4],.035)}
   for(let t=0;t<83;t+=4)k.chord(t,[110,138.6,164.8],4.2,.022);k.drone(0,8,50,.12);
   k.riser(.3,1.5,.2);k.glide(1.8,200,1500,1.8,.06);k.whoosh(3.2,.6,.3);k.boom(3.7,.5);k.click(5.2);k.boom(5.7,.5);k.shimmer(5.8);k.click(5.9);k.click(6.3);
   [8,20,55,83].forEach(b=>{k.whoosh(b-.2,.6,.35);k.boom(b,.4)});
   [9.2,11,13,15,17].forEach(b=>{k.blip(b,1300);k.click(b+.05)});k.glide(13,300,1500,1,.05);k.click(8.2);k.click(17.1);
   k.click(20.2);k.click(24);k.tick(24,3000);k.glide(24.4,1500,300,1.2,.05);k.click(24.5);k.click(26);k.click(27.2);k.click(29);
   k.riser(34,1,.3);k.whoosh(34.6,.5,.4);k.boom(35,.8);k.shimmer(35.4);k.click(36.8);
   [39,43,47].forEach(b=>{k.blip(b,1100);k.click(b+.05)});k.click(37);k.click(52.2);
   k.click(55.8);[59,64,69].forEach(b=>k.blip(b,420,.12));k.click(67.7);
   k.boom(70,.7);for(let i=0;i<12;i++)k.tick(70.05+i*.05,1200+(i*379)%1800);k.click(70.1);k.whoosh(74.4,.6,.4);k.click(74.8);k.blip(76.5,900);k.blip(78,700);k.click(76);k.click(80.5);
   k.click(84);k.click(85.6);k.click(87.4);k.boom(87.4,.55);k.chord(87.4,[261.6,329.6,392,523.3],3.5,.09);k.shimmer(87.6,1.5)}
  /* ============ 3D (three.js r128) ============ */
  const gl=root.querySelector('#gl'),ovc=root.querySelector('#ov'),oc=ovc.getContext('2d');
  const R_=new THREE.WebGLRenderer({canvas:gl,antialias:true,preserveDrawingBuffer:true});
  R_.setPixelRatio(1);R_.setSize(1920,1080,false);R_.toneMapping=THREE.ACESFilmicToneMapping;R_.outputEncoding=THREE.sRGBEncoding;R_.autoClear=false;R_.setClearColor(0x04050a,1);
  const scn=new THREE.Scene();scn.background=new THREE.Color(0x04050a);scn.fog=new THREE.FogExp2(0x04050a,.014);
  const cam3=new THREE.PerspectiveCamera(36,16/9,.1,600);
  scn.add(new THREE.AmbientLight(0x3a4c80,.9));
  const key=new THREE.DirectionalLight(0xffffff,1.7);key.position.set(5,8,6);scn.add(key);
  const rim1=new THREE.PointLight(0x2f7bff,3.5,40);rim1.position.set(-5,3,-5);scn.add(rim1);
  const rim2=new THREE.PointLight(0x9cc4ff,2,40);rim2.position.set(5,2,5);scn.add(rim2);
  const M=(c,e=0,ei=0,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,emissive:e,emissiveIntensity:ei,metalness:.6,roughness:.4},o));
  const hh=i=>{const s=Math.sin(i*127.1)*43758.5;return s-Math.floor(s)};
  function mkFlow(parent,pts,n){const V=pts.map(p=>new THREE.Vector3(p[0],p[1],p[2])),ls=[];let tot=0;V.forEach((v,i)=>{if(i){const l=v.distanceTo(V[i-1]);ls.push(l);tot+=l}});
   const lm=new THREE.LineBasicMaterial({color:0x5b9bff,transparent:true,opacity:0}),line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(V),lm);
   const pa=new Float32Array(n*3),pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pa,3));
   const pm=new THREE.PointsMaterial({color:0xffffff,size:.2,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}),pt=new THREE.Points(pg,pm);pt.frustumCulled=false;parent.add(line,pt);
   return{upd(t,on,rev,col,sp){lm.opacity=on?.55:0;pm.opacity=on?1:0;lm.color.setHex(col);pm.color.setHex(col===0xffffff?0xffffff:0xcfe4ff);if(!on)return;
    for(let k=0;k<n;k++){let u=(t*sp+k/n)%1;if(rev)u=1-u;let d=u*tot,i=0;while(i<ls.length-1&&d>ls[i]){d-=ls[i];i++}const f=d/ls[i],a=V[i],b=V[i+1];pa[k*3]=a.x+(b.x-a.x)*f;pa[k*3+1]=a.y+(b.y-a.y)*f;pa[k*3+2]=a.z+(b.z-a.z)*f}pg.attributes.position.needsUpdate=true}}}
  function makeRig(){const R={flows:{},wheels:[],dash:[],posts:[],mt:[],cmats:[],imats:[],cedges:[]};
   R.world=new THREE.Group();R.car=new THREE.Group();R.world.add(R.car);scn.add(R.world);R.modelGroup=new THREE.Group();R.modelGroup.rotation.y=Math.PI;/* FIX: inverte la direzione di marcia della Prius (il modello GLB ha il davanti verso -x) */R.car.add(R.modelGroup);R.modelMats=[];R.priusReady=false;
   const sh=new THREE.Shape(),P=(x,y)=>[x*.0157,(20-y)*.0157+.3];sh.moveTo(...P(-140,20));
   [['l',-138,-4],['q',-132,-14,-100,-18],['l',-62,-46],['q',-50,-52,-30,-52],['l',40,-52],['q',62,-52,76,-30],['l',90,-16],['q',132,-12,138,4],['l',140,20]].forEach(s=>{if(s[0]==='l')sh.lineTo(...P(s[1],s[2]));else{const a=P(s[1],s[2]),b=P(s[3],s[4]);sh.quadraticCurveTo(a[0],a[1],b[0],b[1])}});
   const g=new THREE.ExtrudeGeometry(sh,{depth:1.6,bevelEnabled:true,bevelSize:.07,bevelThickness:.07,bevelSegments:3,curveSegments:10});g.translate(0,0,-.8);
   R.solid=new THREE.Mesh(g,new THREE.MeshPhysicalMaterial({color:0x1b1e29,metalness:.85,roughness:.3,clearcoat:1,clearcoatRoughness:.15,transparent:true}));
   R.ghost=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x2f7bff,transparent:true,opacity:0,depthWrite:false}));
   R.edge=new THREE.LineSegments(new THREE.EdgesGeometry(g,25),new THREE.LineBasicMaterial({color:0x7fb4ff,transparent:true,opacity:0}));R.car.add(R.solid,R.ghost,R.edge);
   const ws=new THREE.Shape();[[-58,-18],[-40,-44],[36,-44],[56,-18]].forEach((p,i)=>{const q=P(p[0],p[1]);i?ws.lineTo(q[0],q[1]):ws.moveTo(q[0],q[1])});
   R.glass=[.89,-.89].map(z=>{const m=new THREE.Mesh(new THREE.ShapeGeometry(ws),new THREE.MeshBasicMaterial({color:0x3f74e0,transparent:true,opacity:.55,side:THREE.DoubleSide}));m.position.z=z;R.car.add(m);return m});
   R.tail=[];[.5,-.5].forEach(z=>{const h=new THREE.Mesh(new THREE.BoxGeometry(.06,.1,.35),new THREE.MeshBasicMaterial({color:0xffffff}));h.position.set(2.25,.75,z);const t=new THREE.Mesh(new THREE.BoxGeometry(.06,.1,.35),M(0x223355,0x7fb4ff,1));t.position.set(-2.25,.8,z);R.car.add(h,t);R.tail.push(t)});
   [[1.35,.95],[1.35,-.95],[-1.35,.95],[-1.35,-.95]].forEach(([x,z])=>{const w=new THREE.Group();w.position.set(x,.42,z);
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.3,32),M(0x0a0b10,0,0,{roughness:.8}));tire.rotation.x=Math.PI/2;
    const rim=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.32,5),M(0xaab6cc,0x2f7bff,.25,{metalness:1,roughness:.3}));rim.rotation.x=Math.PI/2;w.add(tire,rim);R.car.add(w);R.wheels.push(w)});
   const G=R.compG=new THREE.Group();R.car.add(G);
   const cm=()=>{const m=M(0x2f7bff,0x1d56d6,.5,{transparent:true,opacity:0,metalness:.3});R.cmats.push(m);return m};
   const ce=(geo,par)=>{const l=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0xcfe1ff,transparent:true,opacity:0}));R.cedges.push(l.material);par.add(l)};
   const im=()=>{const m=M(0xdfe9ff,0x6fa8ff,.9,{transparent:true,opacity:0});R.imats.push(m);return m};
   // Motore termico più leggibile: basamento, testata, quattro cilindri,
   // coperchio valvole, collettori e albero motore. Tutti i pezzi seguono
   // la stessa dissolvenza del sistema ibrido.
   const engine=new THREE.Group();engine.position.set(1.25,.95,0);G.add(engine);
   const addEnginePart=(geo,mat,pos,rot=null)=>{
     const mesh=new THREE.Mesh(geo,mat);mesh.position.set(...pos);
     if(rot)mesh.rotation.set(...rot);engine.add(mesh);ce(geo,mesh);return mesh;
   };
   addEnginePart(new THREE.BoxGeometry(.92,.24,.78),cm(),[0,-.22,0]);
   addEnginePart(new THREE.BoxGeometry(.88,.17,.72),cm(),[0,.02,0]);
   addEnginePart(new THREE.BoxGeometry(.78,.11,.62),im(),[0,.17,0]);
   // Quattro cilindri e relative sedi, visibili dall'alto nel modello esploso.
   for(let i=0;i<4;i++){
     const x=-.31+i*.205;
     addEnginePart(new THREE.CylinderGeometry(.085,.085,.22,20),cm(),[x,.29,0]);
     addEnginePart(new THREE.CylinderGeometry(.052,.052,.035,20),im(),[x,.415,0]);
     addEnginePart(new THREE.CylinderGeometry(.022,.022,.10,12),im(),[x,.49,0]);
   }
   // Coperchio valvole e dettagli laterali.
   addEnginePart(new THREE.BoxGeometry(.72,.09,.42),cm(),[0,.43,0]);
   addEnginePart(new THREE.BoxGeometry(.24,.12,.18),im(),[-.29,.52,0]);
   addEnginePart(new THREE.BoxGeometry(.18,.12,.18),im(),[.29,.52,0]);
   // Collettore di scarico con quattro rami curvi che confluiscono.
   const pipeMat=im();
   for(let i=0;i<4;i++){
     const x=-.30+i*.20;
     const curve=new THREE.CatmullRomCurve3([
       new THREE.Vector3(x,.10,.39),
       new THREE.Vector3(x+.02,-.02,.48),
       new THREE.Vector3(x+.08,-.12,.48),
       new THREE.Vector3(.38,-.16,.48)
     ]);
     const pipe=new THREE.Mesh(new THREE.TubeGeometry(curve,12,.025,8,false),pipeMat);
     engine.add(pipe);
   }
   addEnginePart(new THREE.BoxGeometry(.16,.13,.20),cm(),[.40,-.12,.48]);
   // Albero motore e puleggia.
   R.crank=new THREE.Group();R.crank.position.set(1.25,.72,0);
   const cr=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.72,20),im());
   cr.rotation.x=Math.PI/2;R.crank.add(cr);
   for(let i=0;i<4;i++){
     const web=new THREE.Mesh(new THREE.BoxGeometry(.10,.20,.07),im());
     web.position.set(-.28+i*.185,0,(i%2?-.13:.13));R.crank.add(web);
   }
   G.add(R.crank);
   const mg=new THREE.CylinderGeometry(.3,.3,.55,24),mot=new THREE.Mesh(mg,cm());mot.rotation.z=Math.PI/2;mot.position.set(.55,.85,0);ce(mg,mot);G.add(mot);
   R.rotor=new THREE.Group();R.rotor.position.set(.55,.85,0);const ro=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.6,6),im());ro.rotation.z=Math.PI/2;R.rotor.add(ro);G.add(R.rotor);
   const tg=new THREE.BoxGeometry(.55,.5,.6),tr=new THREE.Mesh(tg,cm());tr.position.set(-.05,.8,0);ce(tg,tr);G.add(tr);
   R.gear=new THREE.Group();R.gear.position.set(-.05,.8,0);const ge=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.14,8),im());ge.rotation.x=Math.PI/2;R.gear.add(ge);G.add(R.gear);
   const bgm=new THREE.BoxGeometry(1.7,.28,1.15),bt=new THREE.Mesh(bgm,cm());bt.position.set(-1.15,.4,0);ce(bgm,bt);G.add(bt);
   R.fill=new THREE.Mesh(new THREE.BoxGeometry(1.6,.2,1.05),im());R.fill.position.set(-1.15,.4,0);G.add(R.fill);
   R.flows.bm=mkFlow(R.car,[[-1,.56,.5],[.55,.56,.5],[.55,.8,.3]],12);R.flows.tw=mkFlow(R.car,[[0,.6,.3],[0,.42,.3],[1.35,.42,.3],[1.35,.42,.95]],12);R.flows.eb=mkFlow(R.car,[[1.35,.42,-.95],[1.35,.42,-.3],[1.25,.6,-.3],[1.25,.75,0]],10);
   R.env=new THREE.Group();R.world.add(R.env);
   const gr=new THREE.Mesh(new THREE.PlaneGeometry(600,300),M(0x05060b,0,0,{roughness:1,metalness:0}));gr.rotation.x=-Math.PI/2;gr.position.y=-.05;R.env.add(gr);
   const rd=new THREE.Mesh(new THREE.PlaneGeometry(500,8),M(0x090b12,0,0,{roughness:.5,metalness:.4}));rd.rotation.x=-Math.PI/2;R.env.add(rd);
   [3.9,-3.9].forEach(z=>{const e=new THREE.Mesh(new THREE.BoxGeometry(500,.04,.1),new THREE.MeshBasicMaterial({color:0x4f8cff}));e.position.set(0,.02,z);R.env.add(e)});
   for(let i=0;i<70;i++){const d=new THREE.Mesh(new THREE.BoxGeometry(1.8,.02,.14),new THREE.MeshBasicMaterial({color:0xffffff}));d.position.y=.015;R.env.add(d);R.dash.push(d)}
   for(let i=0;i<25;i++){const p=new THREE.Group(),a=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,3.4),M(0x222a3d)),b=new THREE.Mesh(new THREE.BoxGeometry(.9,.08,.12),new THREE.MeshBasicMaterial({color:0x9cc4ff}));a.position.y=1.7;b.position.set(-.4,3.4,0);p.add(a,b);p.position.z=i%2?-5:5;R.env.add(p);R.posts.push(p)}
   for(let i=0;i<44;i++){const hg=4+hh(i+3)*11,r=3+hh(i+9)*5,cg=new THREE.ConeGeometry(r,hg,5),m=new THREE.Mesh(cg,M(0x0b1226,0x0a1d4a,.5,{flatShading:true,roughness:.9,metalness:.1}));
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(cg),new THREE.LineBasicMaterial({color:0x2f7bff,transparent:true,opacity:.35})));
    m.position.set(0,hg/2-1,(i%2?1:-1)*(14+hh(i)*35));m.userData.x0=i*7.3;R.env.add(m);R.mt.push(m)}
   return R}
  const Rm=makeRig(),RD=makeRig(),RB=makeRig();
  // Toyota Prius GLB embedded in this HTML so it does not need a separate upload.
  function installPrius(gltf){
    [Rm,RD,RB].forEach(R=>{
      const model=gltf.scene.clone(true);
      model.traverse(child=>{
        if(child.isMesh){
          child.material=Array.isArray(child.material)?child.material.map(m=>m.clone()):child.material.clone();
          const mats=Array.isArray(child.material)?child.material:[child.material];
          mats.forEach(m=>{m.transparent=true;m.depthWrite=true;R.modelMats.push(m);});
          child.castShadow=true;child.receiveShadow=true;child.frustumCulled=false;
        }
      });
      const box=new THREE.Box3().setFromObject(model);
      const size=box.getSize(new THREE.Vector3());
      // Match the previous car's ~4.35-unit length while preserving proportions.
      model.scale.setScalar(4.35/size.x);
      const fitted=new THREE.Box3().setFromObject(model);
      const center=fitted.getCenter(new THREE.Vector3());
      model.position.set(-center.x,-fitted.min.y,-center.z);
      R.modelGroup.add(model);
      R.priusReady=true;
      // Hide the procedural exterior; retain the existing hybrid components and labels.
      R.solid.visible=false;R.ghost.visible=false;R.edge.visible=false;
      R.glass.forEach(x=>x.visible=false);R.tail.forEach(x=>x.visible=false);R.wheels.forEach(x=>x.visible=false);
    });
    draw();
  }
  try{
    const bytes=Uint8Array.from(atob(PRIUS_B64),c=>c.charCodeAt(0));
    new GLTFLoader().parse(bytes.buffer,'',installPrius,e=>console.error('Errore caricamento Prius GLB:',e));
  }catch(e){console.error('Errore inizializzazione modello Prius:',e);}
  const grid=new THREE.GridHelper(60,60,0x2f7bff,0x14284d);grid.material.transparent=true;grid.material.opacity=.45;scn.add(grid);
  function setRig(R,o){const T=o.t,s=o.sec||0,d=o.dist||0,lv=o.lv??.6;R.world.rotation.z=-(o.slope||0);R.env.visible=!!o.env;R.wheels.forEach(w=>w.rotation.z=-d/.42);
   if(o.env){R.dash.forEach((m,i)=>m.position.x=((i*4-d)%280+280)%280-140);R.posts.forEach((m,i)=>m.position.x=((i*22-d)%550+550)%550-275);R.mt.forEach(m=>m.position.x=((m.userData.x0-d*.35)%320+320)%320-160)}
   R.solid.material.opacity=1-s;R.solid.visible=!R.priusReady&&s<.98;R.glass.forEach(g=>{{g.material.opacity=.55*(1-s);g.visible=!R.priusReady;}});R.ghost.material.opacity=.1*s;R.edge.material.opacity=.75*s;
   if(R.priusReady){{R.modelGroup.visible=true;R.modelMats.forEach(m=>{{m.opacity=1-s;m.transparent=true;m.depthWrite=s<.02;}});R.tail.forEach(x=>x.visible=false);R.wheels.forEach(x=>x.visible=false);}}
   R.compG.visible=s>.01;R.cmats.forEach(m=>m.opacity=.3*s);R.imats.forEach(m=>m.opacity=s);R.cedges.forEach(m=>m.opacity=.9*s);
   [0,1,3,2].forEach((ci,i)=>{R.cmats[ci].emissiveIntensity=.4+((o.hl===i||o.hlAll)?1.6:0)});
   R.crank.rotation.z=T*(o.eng||0)*6;R.rotor.rotation.x=T*(o.mot||4);R.gear.rotation.z=-T*3;R.fill.scale.x=Math.max(.01,lv);R.fill.position.x=-1.95+.8*lv;
   R.flows.bm.upd(T,!!o.f,o.f<0,o.f<0?0xbfe4ff:0x5b9bff,.5);R.flows.tw.upd(T,!!o.f,o.f<0,o.f<0?0xbfe4ff:0x5b9bff,.5);R.flows.eb.upd(T,!!o.fe,0,0xffffff,.7);
   R.tail.forEach(m=>m.material.emissiveIntensity=o.brake?4:1)}
  /* console con leva */
  const LV=new THREE.Group();LV.position.set(0,0,300);scn.add(LV);LV.tex=[];
  const base=new THREE.Mesh(new THREE.BoxGeometry(4.2,.5,1.8),new THREE.MeshPhysicalMaterial({color:0x14161d,metalness:.8,roughness:.3,clearcoat:1}));LV.add(base);
  const plate=new THREE.Mesh(new THREE.BoxGeometry(3.5,.06,.9),M(0x05060a));plate.position.y=.28;LV.add(plate);
  function paintLetter(cv,ch,on){const x=cv.getContext('2d');x.clearRect(0,0,128,128);x.font='800 100px Inter,sans-serif';x.textAlign='center';x.textBaseline='middle';if(on){x.shadowColor='#2f7bff';x.shadowBlur=30}x.fillStyle=on?'#ffffff':'#8b93a8';x.fillText(ch,64,70)}
  const letters=[];'PRNDB'.split('').forEach((ch,i)=>{const cv=document.createElement('canvas');cv.width=cv.height=128;const tx=new THREE.CanvasTexture(cv),m=new THREE.Mesh(new THREE.PlaneGeometry(.5,.5),new THREE.MeshBasicMaterial({map:tx,transparent:true}));m.rotation.x=-Math.PI/2;m.position.set(-1.2+i*.6,.32,.05);LV.add(m);letters.push({cv,tx,ch,m})});
  const bOn=document.createElement('canvas');bOn.width=bOn.height=128;LV.tOn=new THREE.CanvasTexture(bOn);LV.tOff=letters[4].tx;LV.bMat=letters[4].m.material;
  function paintAll(){letters.forEach(l=>{paintLetter(l.cv,l.ch,false);l.tx.needsUpdate=true});paintLetter(bOn,'B',true);LV.tOn.needsUpdate=true}paintAll();
  const gc=document.createElement('canvas');gc.width=gc.height=128;{const x=gc.getContext('2d'),g=x.createRadialGradient(64,64,4,64,64,64);g.addColorStop(0,'rgba(120,180,255,1)');g.addColorStop(1,'rgba(47,123,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128)}
  LV.glow=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.6),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(gc),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));LV.glow.rotation.x=-Math.PI/2;LV.glow.position.set(1.2,.34,.05);LV.add(LV.glow);
  LV.knob=new THREE.Group();{const st=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.6),M(0x333844,0,0,{metalness:1,roughness:.3})),bl=new THREE.Mesh(new THREE.SphereGeometry(.26,32,24),new THREE.MeshStandardMaterial({color:0xdfe6f5,metalness:1,roughness:.12}));st.position.y=.3;bl.position.y=.7;LV.knob.add(st,bl);LV.knob.position.z=-.62;LV.add(LV.knob)}
  LV.light=new THREE.PointLight(0x2f7bff,0,8);LV.light.position.set(1.2,1.2,.6);LV.add(LV.light);
  /* batteria grande */
  const BT=new THREE.Group();scn.add(BT);{const bg_=new THREE.BoxGeometry(3,1.4,1.6);BT.add(new THREE.Mesh(bg_,new THREE.MeshBasicMaterial({color:0x2f7bff,transparent:true,opacity:.1,depthWrite:false})),new THREE.LineSegments(new THREE.EdgesGeometry(bg_),new THREE.LineBasicMaterial({color:0xcfe1ff})));
   BT.fill=new THREE.Mesh(new THREE.BoxGeometry(2.8,1.2,1.4),M(0x2f7bff,0x2f7bff,1.2));BT.add(BT.fill);const tm_=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.3,16),M(0xcfe1ff,0x8fc0ff,.6));tm_.rotation.z=Math.PI/2;tm_.position.x=1.65;BT.add(tm_)}
  /* velocità e distanza */
  const spd=t=>t<8?22:t<20?3:t<24?26:t<35?L(26,20,sg(t,24,35)):t<55?L(24,10,sg(t,36,55)):t<70?0:t<83?0:18;
  const DT=[0];for(let i=1;i<=1830;i++)DT.push(DT[i-1]+spd(i*.05)*.05);
  const distAt=t=>{const f=Math.min(1828,Math.max(0,t/.05)),i=Math.floor(f);return L(DT[i],DT[i+1],f-i)};
  function vS(s,t){const k=t-55;if(s)return[55+4*Math.sin(k*1.3),0];const ph=(k%5)/5;return[ph<.8?45+40*(ph/.8):85-35*sg(ph,.8,1),ph>.8?1:0]}
  function distS(s,t){let d=0;for(let u=55;u<t;u+=.1)d+=vS(s,u)[0]*.05;return d}
  /* camera */
  function setCam(p,l,fov=36,asp=16/9){cam3.position.set(p[0],p[1],p[2]);cam3.lookAt(l[0],l[1],l[2]);cam3.fov=fov;cam3.aspect=asp;cam3.updateProjectionMatrix();cam3.updateMatrixWorld()}
  function camK(t,K,pz){let i=0;while(i<K.length-2&&t>=K[i+1][0])i++;const a=K[i],b=K[i+1],u=sg(t,a[0],b[0]),s=u*u*(3-2*u),v=a.slice(1).map((x,j)=>L(x,b[j+1],s));setCam([v[0],v[1],v[2]],[v[3],v[4],v[5]],v[6]/pz)}
  const FP=[[1.25,.95,0],[.55,.85,0],[-1.15,.4,0],[-.05,.8,0],[1.35,.42,.95]],FO=[[2.6,1,3],[2.4,.8,3.2],[-2.4,1.2,3.2],[-.4,1.4,3.6],[2.2,.5,3.4]],SW2=[9.2,11,13,15,17];
  const K1a=[[0,7,1.6,6.5,0,.7,0,38],[1.8,4.5,1.2,4.2,0,.9,0,36],[3.6,1,1.15,2.6,-.1,1,.3,34]],K1b=[[3.7,0,2.2,303.4,0,.1,300,34],[8,.5,1.5,302.4,0,.15,300,30]];
  const K2=[[8,7,2.6,7,0,.8,0,36]];FP.forEach((f,i)=>{const o=FO[i],a=SW2[i]-.1,b=SW2[i]+(i<4?1.5:2.4);K2.push([a,f[0]+o[0],f[1]+o[1],f[2]+o[2],f[0],f[1],f[2],28],[b,f[0]+o[0]*.85,f[1]+o[1]*1.1,f[2]+o[2]*.9,f[0],f[1],f[2],30])});K2.push([20,6,2.4,6.5,0,.8,0,36]);
  const K3=[[20,-4.5,1.6,5.5,.3,.7,0,34],[24,-2.5,1.4,6,.5,.7,0,32],[27,3,1.4,5,.55,.85,0,30],[30,2.2,1.2,3.4,.55,.85,0,28],[35,4.8,1.8,5.5,0,.7,0,34]];
  const K4=[[36.6,6,1.6,5.5,.2,.7,0,34],[38.9,4,2,4.2,1.2,.9,0,30],[42.8,3.4,1.8,4.4,1.2,.9,0,30],[43.1,3,1.5,4.4,.55,.85,0,30],[46.8,2.6,1.6,4.4,.55,.85,0,30],[47.1,-3.4,1.6,4.2,-1.1,.4,0,30],[50.8,-2.6,1.8,4.4,-1.1,.4,0,30],[51.5,-1.5,2.6,7,0,.5,0,36],[55,4,2,7,0,.5,0,38]];
  const K7=[[83,7,1.6,6,0,.7,0,34],[91,3.5,1.2,5.5,0,.7,0,40]];
  const hlIdx=(t,sw)=>{let c=-1;sw.forEach((v,i)=>{if(t>=v)c=i});return c};
  function frame(t){
   const B=[0,8,20,35,55,70,83];let b0=0;B.forEach(v=>{if(t>=v)b0=v});const pz=1+.08*Math.max(0,1-(t-b0)/.5);
   [Rm,RD,RB].forEach(r=>r.world.visible=false);LV.visible=false;BT.visible=false;grid.visible=false;
   R_.setScissorTest(false);R_.setViewport(0,0,1920,1080);R_.clear();const full=()=>R_.render(scn,cam3);
   if(t<3.7){Rm.world.visible=true;setRig(Rm,{t,env:1,slope:.06,dist:distAt(t)});camK(t,K1a,pz);full()}
   else if(t<8){LV.visible=true;const pos=t<5.2?3:L(3,4,E(sg(t,5.2,5.7))),g=sg(t,5.6,6)*(.8+.2*Math.sin(t*10));LV.knob.position.x=-1.2+pos*.6;LV.glow.material.opacity=g;LV.light.intensity=g*5;LV.bMat.map=g>0?LV.tOn:LV.tOff;camK(t,K1b,pz);full()}
   else if(t<20){grid.visible=true;Rm.world.visible=true;setRig(Rm,{t,env:0,sec:sg(t,8,9.2),dist:distAt(t),f:t>13?1:0,lv:.7,hl:hlIdx(t,SW2),eng:1});camK(t,K2,pz);full()}
   else if(t<35){Rm.world.visible=true;setRig(Rm,{t,env:1,sec:1,dist:distAt(t),f:t<24?1:-1,lv:.35+.25*E(sg(t,24.6,34)),hl:t>24.5?1:-1,mot:t<24?4:-4});camK(t,K3,pz);full()}
   else if(t<55){if(t>=36.6){Rm.world.visible=true;setRig(Rm,{t,env:1,sec:1,slope:.2*E(sg(t,36.6,38)),dist:distAt(t),f:-1,fe:1,lv:.5+.08*E(sg(t,37,52)),hl:hlIdx(t,[39,43,47]),eng:3,mot:6});camK(t,K4,pz);full()}}
   else if(t<70){const p=E(sg(t,55,55.8));R_.setScissorTest(true);
    const side=(R,s,x,w,sw)=>{R.world.visible=true;setRig(R,{t,env:1,slope:.18,dist:distS(s,t),brake:vS(s,t)[1]});setCam([-5,1.6,5.5],[.3,.6,0],50,960/1080);R_.setViewport(x,0,960,1080);R_.setScissor(x,0,sw,1080);R_.clear();R_.render(scn,cam3);R.world.visible=false};
    side(RD,0,0,960,960);if(p>.02)side(RB,1,1920-960*p,960,960*p)}
   else if(t<83){BT.visible=true;const p=E(sg(t,74.2,75)),lv=.4+.25*Math.sin(t*2);BT.rotation.y=t*.7;BT.rotation.x=.3;BT.fill.scale.x=lv;BT.fill.position.x=-1.4+1.4*lv;BT.position.set(L(0,4.13,p),L(-.6,1.05,p),0);BT.scale.setScalar(L(1,.45,p));setCam([0,0,8],[0,0,0],40);full()}
   else{Rm.world.visible=true;setRig(Rm,{t,env:1,slope:.06,dist:distAt(t)});camK(t,K7,pz);full()}}
  /* ============ Overlay 2D ============ */
  const NAMES=['MOTORE TERMICO','MOTORE ELETTRICO','BATTERIA','TRASMISSIONE','RUOTE'];
  function proj(R,i){const f=FP[i],v=new THREE.Vector3(f[0],f[1],f[2]);R.world.updateMatrixWorld(true);R.car.localToWorld(v);v.project(cam3);return[(v.x*.5+.5)*1280,(-v.y*.5+.5)*720]}
  const lab3=(c,txt,p,a,size=34)=>{
   const slots={
    'MOTORE TERMICO':[205,205,'left'],
    'MOTORE ELETTRICO':[205,285,'left'],
    'BATTERIA':[1075,205,'right'],
    'TRASMISSIONE':[1075,285,'right'],
    'RUOTE':[640,465,'center'],
    'ENERGIA CINETICA':[1075,390,'right'],
    'ENERGIA ELETTRICA':[1075,475,'right'],
    'FRENO MOTORE':[205,245,'left'],
    'FRENATA RIGENERATIVA':[205,330,'left'],
    'GESTIONE DELL’ENERGIA':[205,415,'left']
   };
   const s=slots[txt]||[640,470,'center'];if(a<=.02)return;
   c.save();c.globalAlpha=a;
   c.font=`600 ${Math.min(size,29)}px Inter,sans-serif`;
   const w=c.measureText(txt).width+34,h=48;
   const x=s[2]==='left'?s[0]:s[2]==='right'?s[0]-w:s[0]-w/2;
   c.fillStyle='rgba(5,10,22,.82)';c.strokeStyle='rgba(127,180,255,.8)';c.lineWidth=2;
   c.beginPath();c.roundRect(x,s[1]-h/2,w,h,12);c.fill();c.stroke();
   c.fillStyle='#fff';c.textAlign='left';c.textBaseline='middle';c.fillText(txt,x+17,s[1]);
   c.restore();
  };
  function ov(t){const c=oc;c.save();c.scale(1.5,1.5);c.clearRect(0,0,1280,720);
   if(t<8){if(t<3.7){c.save();c.strokeStyle='rgba(180,210,255,.35)';c.lineWidth=2;for(let i=0;i<12;i++){const x=((i*331-t*900)%1500+1500)%1500-110,y=(i*61)%720;c.beginPath();c.moveTo(x,y);c.lineTo(x+140,y);c.stroke()}c.restore()}
    else{hl(c,[['SAI COSA SIGNIFICA DAVVERO',0]],640,120,56,pop(t,5.9));hl(c,[['LA MODALITÀ ',0],['B',1],['?',0]],640,200,70,pop(t,6.3))}
    c.fillStyle=`rgba(255,255,255,${Math.max(0,1-Math.abs(t-3.7)*4)})`;c.fillRect(0,0,1280,720)}
   else if(t<20){SW2.forEach((s,i)=>{if(t>=s)lab3(c,NAMES[i],proj(Rm,i),pop(t,s))});hl(c,[['IL SISTEMA ',0],['IBRIDO',1]],640,70,60,pop(t,8.2));hl(c,[['TERMICO + ELETTRICO: ',0],['COMBINAZIONI DIVERSE',1]],640,610,40,pop(t,17.1))}
   else if(t<35){const k=t-20;if(t>=26)lab3(c,'ENERGIA CINETICA',proj(Rm,4),pop(t,26));if(t>=29)lab3(c,'ENERGIA ELETTRICA',proj(Rm,2),pop(t,29));
    badge(c,90,100,'D',pop(t,20.2));H.text(c,'MODALITÀ D',150,100,56,{al:'left',g:1,a:pop(t,20.2)});hl(c,[['FRENATA ',0],['RIGENERATIVA',1]],640,190,60,pop(t,24.5));hl(c,[['IL MOTORE ELETTRICO ',0],['FA DA GENERATORE',1]],640,600,40,pop(t,27.2));
    const pd=k<4?.9:L(.9,0,sg(t,24,24.4));H.text(c,'ACCELERATORE',40,530,28,{al:'left',w:600});c.strokeStyle='#5b9bff';c.lineWidth=3;c.strokeRect(40,550,220,22);c.fillStyle='#4f8cff';c.fillRect(40,550,220*pd,22)}
   else if(t<55){const k=t-35;
    if(k<1.6){c.fillStyle='#000';c.fillRect(0,0,1280,720);const q=E(sg(k,0,.45));c.save();c.translate(640+Math.sin(k*80)*8*(1-sg(k,0,.8)),360);for(let i=0;i<3;i++)H.ring(c,0,0,q*600*(1+i*.4)-i*60,(1-q)*.9+.1,'#4f8cff',6);c.restore();H.text(c,'B',640,360,L(1100,380,q),{g:1,glow:80});hl(c,[['MODALITÀ ',0],['B',1]],640,620,64,pop(k,.8))}
    else{[['FRENO MOTORE',0,39],['FRENATA RIGENERATIVA',1,43],['GESTIONE DELL’ENERGIA',2,47]].forEach(m=>{if(t>=m[2])lab3(c,m[0],proj(Rm,m[1]),pop(t,m[2]),32)});
     c.save();c.globalAlpha=pop(t,37);H.text(c,'RALLENTAMENTO',1130,150,28,{w:600});c.strokeStyle='#5b9bff';c.lineWidth=3;c.strokeRect(1100,180,60,320);const lv=.85*E(sg(t,37.5,39));c.fillStyle='#4f8cff';c.fillRect(1100,500-320*lv,60,320*lv);c.fillStyle='#fff';c.fillRect(1090,388,80,3);H.text(c,'D',1065,388,32,{w:600});H.text(c,'B',1195,500-320*lv,32,{g:1});c.restore();
     badge(c,90,100,'B',pop(t,36.8));H.text(c,'MODALITÀ B',150,100,56,{al:'left',g:1,a:pop(t,36.8)});note(c,pop(t,37));hl(c,[['VARIA SECONDO ',0],['COSTRUTTORE E MODELLO',1]],640,560,40,pop(t,52.2))}}
   else if(t<70){const p=E(sg(t,55,55.8));
    [0,1].forEach(s=>{c.save();c.translate(s?1280-640*p:0,0);c.beginPath();c.rect(0,0,640,720);c.clip();const[v,br]=vS(s,t);
     H.text(c,s?'B':'D',90,90,130,{g:1});H.text(c,Math.round(v)+' km/h',320,470,56,{g:1});c.fillStyle=br?'#fff':'rgba(255,255,255,.08)';c.beginPath();c.roundRect(240,505,160,44,10);c.fill();H.text(c,'FRENO',320,528,30,{w:600,col:br?'#000':'#7d8497'});
     H.text(c,s?'RALLENTA DI PIÙ · FRENO POCO':'RALLENTA POCO · FRENO SPESSO',320,590,26,{w:600});
      // Freccia animata: il muso dell'auto procede verso destra.
      const ax=250+((t*95)%125);
      c.strokeStyle='#9cc4ff';c.fillStyle='#9cc4ff';c.lineWidth=5;
      c.beginPath();c.moveTo(ax-34,220);c.lineTo(ax+28,220);c.lineTo(ax+12,207);c.moveTo(ax+28,220);c.lineTo(ax+12,233);c.stroke();
      H.text(c,'AVANTI',320,255,24,{w:800,col:'#9cc4ff'});
      c.restore()});
    c.save();c.globalAlpha=p;c.fillStyle='#fff';c.shadowColor='#4f8cff';c.shadowBlur=20;c.fillRect(638,0,4,720);c.restore();
    const a=pop(t,67.7);c.save();c.globalAlpha=a*.6;c.fillStyle='#000';c.beginPath();c.roundRect(150,285,980,90,20);c.fill();c.restore();hl(c,[['IDEALE NELLE ',0],['DISCESE RIPIDE',1]],640,330,56,a)}
   else if(t<83){const k=t-70,pm=E(sg(t,74.2,75)),ty=L(250,90,pm),ts=L(100,64,pm),g=k<1.2?Math.sin(t*90)*7*(1-k/1.2):0;
    if(k<1.2){c.save();c.globalAlpha=.4;c.translate(-g*1.5,3);hl(c,[['B = PIÙ RICARICA?',1]],640,ty,ts,1);c.restore()}
    c.save();c.translate(g,0);hl(c,[['B = ',1],['PIÙ RICARICA',0],['?',1]],640,ty,ts,pop(t,70.1,.3));c.restore();
    if(t<75){c.save();c.globalAlpha=1-pm;H.text(c,'?',330,430,150,{g:1,a:.5+.5*Math.sin(t*3)});H.text(c,'?',950,320,110,{g:1,a:.5+.5*Math.sin(t*3+2)});c.restore()}
    if(t>=74.8){c.save();c.globalAlpha=pop(t,74.8,.6);c.strokeStyle='#cfe1ff';c.lineWidth=4;c.beginPath();c.arc(230,350,80,0,7);c.stroke();H.ring(c,230,350,100+10*Math.sin(t*4),.5);H.text(c,'ENERGIA DEL',230,470,28,{w:600});H.text(c,'RALLENTAMENTO',230,502,28,{w:600});
     [[230,'BATTERIA','RECUPERATA',4,'#7fb4ff'],[350,'MOTORE TERMICO','DISPERSA',12,'#8a93a6'],[470,'ALTRI SISTEMI','DISPERSA',9,'#8a93a6']].forEach(([y,n,tag,w,col])=>{flow(c,[[310,350],[560,y],[900,y]],t,col,0,.5,6,w);H.text(c,n,920,y,32,{al:'left',col:'#fff'});H.text(c,tag,730,y-34,28,{w:600,col})});c.restore()}
    note(c,pop(t,76));hl(c,[['NON SEMPRE ',1],['PIÙ RECUPERO CHE IN D',0]],640,570,44,pop(t,80.5))}
   else{const p1=pop(t,84,.6),p2=pop(t,85.6,.6);c.save();c.translate((1-p1)*-900,0);hl(c,[['D',1],[' – GUIDA QUOTIDIANA',0]],640,120,64);c.restore();c.save();c.translate((1-p2)*900,0);hl(c,[['B',1],[' – DISCESE RIPIDE',0]],640,205,64);c.restore();
    hl(c,[['ORA SAI COSA SUCCEDE',0]],640,545,54,pop(t,87.4,.7));hl(c,[['QUANDO INSERISCI LA MODALITÀ ',0],['B',1],['.',0]],640,610,54,pop(t,87.9,.7));note(c,pop(t,84,.5))}
   if((t<3.7)||(t>=20&&t<55)||(t>=83)){
     c.save();c.globalAlpha=.78;
     c.fillStyle='rgba(4,10,22,.62)';c.beginPath();c.roundRect(1010,78,220,58,14);c.fill();
     H.text(c,'DIREZIONE  →',1120,107,25,{w:800,col:'#9cc4ff'});
     c.restore();
   }
   for(const b of [8,20,35,55,70,83]){const a=1-Math.abs(t-b)*5;if(a>0){c.fillStyle=`rgba(120,170,255,${a*.45})`;c.fillRect(0,0,1280,720)}}
   sub(c,t);c.restore()}

  /* ============ Player ============ */
  const sl=root.querySelector('#sl'),tm=root.querySelector('#tm'),pp=root.querySelector('#pp'),snd=root.querySelector('#snd'),vo=root.querySelector('#vo'),lp=root.querySelector('#lp');
  sl.max=DURATION;let t=0,playing=false,last=0,stopSound=null,ni=0;
  const draw=()=>{frame(t);ov(t);sl.value=t;tm.textContent=t.toFixed(2)+' / '+DURATION.toFixed(2)};
  const killSound=()=>{if(stopSound){stopSound();stopSound=null}};
  const startSound=()=>{killSound();if(snd.checked&&playing)stopSound=SOUND.live(scoreSound,t,{voiceover:false})};
  function speak(txt){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.lang='it-IT';const v=speechSynthesis.getVoices().find(v=>/^it/i.test(v.lang));if(v)u.voice=v;u.rate=1.08;speechSynthesis.speak(u)}catch(e){}}
  function resetNarr(){try{speechSynthesis.cancel()}catch(e){}ni=NARR.findIndex(n=>t<n[1]);if(ni<0)ni=NARR.length}
  function narr(){if(!vo.checked)return;while(ni<NARR.length&&t>=NARR[ni][0]){if(t<NARR[ni][1])speak(NARR[ni][2]);ni++}}
  function play(){if(t>=DURATION-.01)t=0;playing=true;pp.textContent='❚❚ Pausa';startSound();resetNarr();last=performance.now();requestAnimationFrame(loop)}
  function pause(){playing=false;pp.textContent='▶ Play';killSound();try{speechSynthesis.cancel()}catch(e){}}
  function loop(now){if(!playing)return;t+=(now-last)/1000;last=now;
   if(t>=DURATION){if(lp.checked){t=0;startSound();resetNarr()}else{t=DURATION;draw();pause();return}}
   narr();draw();requestAnimationFrame(loop)}
  pp.onclick=()=>playing?pause():play();
  sl.oninput=()=>{t=+sl.value;draw();if(playing){startSound();resetNarr()}else killSound()};
  snd.onchange=()=>{if(snd.checked)startSound();else killSound()};
  vo.onchange=()=>{if(vo.checked)resetNarr();else{try{speechSynthesis.cancel()}catch(e){}}};
  (async()=>{try{await Promise.all(['300','400','600','800'].map(w=>document.fonts.load(w+' 40px Inter')))}catch(e){}paintAll();t=6.3;draw();t=0})();

  return () => {
    playing = false;
    killSound();
    try { speechSynthesis.cancel(); } catch (e) {}
    R_.dispose();
  };
}

export default function Radar() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    return init(rootRef.current);
  }, []);

  return (
    <div className="radar-root" ref={rootRef}>
      <style>{CSS}</style>
      <div id="wrap">
        <div id="stage">
          <canvas id="gl" width={1920} height={1080} />
          <canvas id="ov" width={1920} height={1080} />
        </div>
      </div>
      <div id="bar">
        <button id="pp">▶ Play</button>
        <input id="sl" type="range" min={0} max={91} step={0.01} defaultValue={0} />
        <span id="tm">0.00 / 91.00</span>
        <label><input id="snd" type="checkbox" defaultChecked />Musica e effetti</label>
        <label><input id="vo" type="checkbox" defaultChecked />Voce narrante</label>
        <label><input id="lp" type="checkbox" />Loop</label>
      </div>
    </div>
  );
}
