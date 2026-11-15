/* eslint-disable */
// @ts-nocheck
// The MISVOR robot, ported from Gold_Robot_Mascot.html (latest design). The rig is kept as
// designed (same parts, same joints and joint names). Added: per-finger curl with a natural
// cascade, and a "Point" joint that extends the index finger and curls the others.
import * as THREE from "three";

export function createRobot() {
const T = THREE, rad = Math.PI / 180;
// materials and helpers
const M=(c,m,r,e,i)=>new T.MeshStandardMaterial({color:c,metalness:m,roughness:r,emissive:e||0,emissiveIntensity:i||1});
const G=new T.MeshPhysicalMaterial({color:0xc99a2c,metalness:.9,roughness:.28,clearcoat:.5,clearcoatRoughness:.2}),K=M(0x090a0f,.2,.5),B=new T.MeshBasicMaterial({color:0x1b55ff,toneMapped:false}),S=M(0x3a63e6,1,.2),E=M(0x1c2d63,.7,.3,0x2a55d0,.3);
const grp=(p,x=0,y=0,z=0)=>{const g=new T.Group();g.position.set(x,y,z);p.add(g);return g};
const add=(p,g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);p.add(o);return o};
const sph=r=>new T.SphereGeometry(r,32,20),cyl=(a,b,h)=>new T.CylinderGeometry(a,b,h,32),tor=(R,r)=>new T.TorusGeometry(R,r,12,48);
function rr(w,h,r){const s=new T.Shape(),x=-w/2,y=-h/2,P=Math.PI;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.absarc(x+w-r,y+r,r,-P/2,0);s.lineTo(x+w,y+h-r);s.absarc(x+w-r,y+h-r,r,0,P/2);s.lineTo(x+r,y+h);s.absarc(x+r,y+h-r,r,P/2,P);s.lineTo(x,y+r);s.absarc(x+r,y+r,r,P,P*1.5);return s}
class Lem extends T.Curve{constructor(a,k,z=0){super();this.a=a;this.k=k;this.z=z}getPoint(t,v=new T.Vector3()){const u=t*Math.PI*2,d=1+Math.sin(u)**2,x=this.a*Math.cos(u)/d;return v.set(x,this.k*this.a*Math.sin(u)*Math.cos(u)/d,-this.z*x*x)}}
const arc=(w,d,r)=>new T.TubeGeometry(new T.CatmullRomCurve3([-1,-.5,0,.5,1].map(i=>new T.Vector3(i*w,d*i*i,0))),24,r,8);
const J={},cur={},off={};
function jt(grp,key,label,min,max,def,set){J[key]={grp,label,min,max,def,set};cur[key]=def;off[key]=0}
const rot=(o,ax)=>v=>{o.rotation[ax]=v*rad};
const root=new T.Group();
// pelvis and torso
const WS=new T.MeshBasicMaterial({color:0xffffff});
const lat=p=>new T.LatheGeometry(new T.SplineCurve(p.map(([r,y])=>new T.Vector2(Math.max(.001,r),y))).getPoints(48),40);
function shoeGeo(){const g=new T.SphereGeometry(1,40,28),p=g.attributes.position;
 for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(y<0&&y>-.999){const t=-y,q=Math.pow(1-t*t*t*t,.25)/Math.sqrt(1-t*t);x*=q;z*=q}const f=(z+1)/2;
  x*=.78+.3*f;y=y>0?y*(1.15-.7*f):y*.55;if(z<0)z*=.9;p.setXYZ(i,x,y,z)}
 g.computeVertexNormals();return g}
const pelvis=grp(root,0,3.15,0);
add(pelvis,lat([[0,-.38],[.28,-.36],[.46,-.22],[.52,-.02],[.48,.16],[.36,.24],[0,.26]]),G,0,0,.02,1,1,.62);add(pelvis,cyl(.42,.46,.3),K,0,.15,0,1,1,.75);[-1,1].forEach(q=>add(pelvis,new T.BoxGeometry(.03,.3,.03),K,q*.12,-.12,.3).rotation.z=-q*.45);add(pelvis,sph(1),K,0,-.36,0,.3,.12,.25);
[-1,1].forEach(s=>add(pelvis,sph(.3),K,s*.46,-.12,0));
const torso=grp(pelvis,0,.2,0);
for(let i=0;i<5;i++)add(torso,cyl(.4+(i%2)*.04,.4+(i%2)*.04,.075),K,0,.01+i*.075,0,1,1,.8);
add(torso,cyl(.98,.6,1.2),K,0,.82,0,1,1,.6);
add(torso,lat([[0,.1],[.4,.12],[.52,.3],[.7,.7],[.8,1.05],[.78,1.25],[.55,1.38],[0,1.43]]),G,0,0,0,1.08,1.06,.88);const chSp=new T.SplineCurve([[0,.1],[.4,.12],[.52,.3],[.7,.7],[.8,1.05],[.78,1.25],[.55,1.38],[0,1.43]].map(([r,y])=>new T.Vector2(Math.max(.001,r),y))).getPoints(240);
const chR=y=>{y/=1.06;for(let i=1;i<chSp.length;i++)if(chSp[i].y>=y&&chSp[i-1].y<=y){const u=(y-chSp[i-1].y)/((chSp[i].y-chSp[i-1].y)||1);return chSp[i-1].x+(chSp[i].x-chSp[i-1].x)*u}return .3};
const onChest=(x,y,o=.012)=>new T.Vector3(x,y,.88*Math.sqrt(Math.max(0,chR(y)**2-(x/1.08)**2))+o);
class Surf extends T.Curve{constructor(f){super();this.f=f}getPoint(t,v=new T.Vector3()){const[x,y]=this.f(t);return v.copy(onChest(x,y))}}
const decal=(f,seg,r,m,closed)=>add(torso,new T.TubeGeometry(new Surf(f),seg,r,8,closed),m);const bd=add(torso,tor(.63,.045),K,0,.58,0);bd.rotation.x=Math.PI/2;bd.scale.set(1.08,.88,1);const bd2=add(torso,tor(.72,.03),K,0,.83,0);bd2.rotation.x=Math.PI/2;bd2.scale.set(1.08,.88,1);
const cr=add(torso,tor(.55,.03),B,0,1.47,0);cr.rotation.x=Math.PI/2;cr.scale.set(1.08,.88,1);
[-1,1].forEach(s=>decal(t=>[s*(.76-.16*t),1.3-.78*t],40,.02,B,false));
const EY=.98;
decal(t=>{const u=t*Math.PI*2,d=1+Math.sin(u)**2;return[.34*Math.cos(u)/d,EY+.442*Math.sin(u)*Math.cos(u)/d]},140,.016,E,true);
decal(t=>[0,EY-.38+t*.76],20,.016,E,false);
[[0,EY+.46,0],[0,EY-.46,Math.PI],[.42,EY,-Math.PI/2],[-.42,EY,Math.PI/2]].forEach(([x,y,rz])=>{const c=add(torso,new T.ConeGeometry(.045,.16,10),E,...onChest(x,y,0).toArray());c.rotation.z=rz});

// neck and head
const nk=grp(torso,0,1.54,0);add(nk,cyl(.22,.26,.35),K,0,.1,0);add(nk,tor(.23,.03),K,0,0,0).rotation.x=Math.PI/2;add(nk,tor(.22,.03),K,0,.2,0).rotation.x=Math.PI/2;
const hp=grp(nk,0,.25,0);hp.rotation.order='YXZ';const head=grp(hp,0,.8,.25);
const fr=rr(2.2,1.7,.45);fr.holes.push(rr(1.82,1.3,.3));
add(head,new T.ExtrudeGeometry(fr,{depth:.3,bevelEnabled:true,bevelThickness:.1,bevelSize:.07,bevelSegments:8,curveSegments:16}),G,0,0,-.15);
add(head,new T.ExtrudeGeometry(rr(1.84,1.32,.3),{depth:.05,bevelEnabled:false,curveSegments:16}),WS,0,0,-.12);
const gl=rr(1.78,1.26,.28);gl.holes.push(rr(1.7,1.18,.25));
add(head,new T.ExtrudeGeometry(gl,{depth:.01,bevelEnabled:false,curveSegments:16}),B,0,0,-.065);
add(head,new T.ExtrudeGeometry(rr(2.1,1.6,.4),{depth:.5,bevelEnabled:false,curveSegments:16}),G,0,0,-.7);
add(head,new T.TubeGeometry(new Lem(1.0,.85),160,.085,12,true),G,0,0,.05);
[-1,1].forEach(s=>add(head,cyl(.06,.06,.5),G,s*1.15,0,.05).rotation.z=Math.PI/2);
const eyes=[-1,1].map(s=>{const e=grp(head,s*.5,0,-.02);add(e,arc(.2,.12,.04),B);return e});
const mouth=grp(head,0,-.43,-.02);add(mouth,arc(.26,.12,.04),B);
// spear antenna and halo

add(head,tor(.95,.045),G,0,1.12,-.22).rotation.x=Math.PI/2;const haloB=add(head,tor(.85,.024),B,0,1.12,-.22);haloB.rotation.x=Math.PI/2;
// ears and spikes
[-1,1].forEach(s=>{
 add(head,cyl(.42,.42,.26),G,s*1.27,0,0).rotation.z=Math.PI/2;
 add(head,cyl(.3,.3,.28),K,s*1.27,0,0).rotation.z=Math.PI/2;
 add(head,tor(.33,.035),B,s*1.41,0,0).rotation.y=Math.PI/2;
 add(head,cyl(.13,.17,.2),K,s*1.5,0,0).rotation.z=Math.PI/2;
 add(head,new T.ConeGeometry(.13,.42,24),S,s*1.81,0,0).rotation.z=-s*Math.PI/2;
});
jt('Head and torso','torso','Torso twist',-40,40,0,rot(torso,'y'));jt('Head and torso','tx','Torso bend',-35,35,0,rot(torso,'x'));jt('Head and torso','tz','Torso lean',-25,25,0,rot(torso,'z'));jt('Head and torso','mo','Mouth open',0,100,0,v=>{mouth.userData.o=v});
jt('Head and torso','hy','Head turn',-70,70,0,v=>hp.rotation.y=v*rad);
jt('Head and torso','hx','Head nod',-35,35,0,v=>hp.rotation.x=v*rad);
jt('Head and torso','hz','Head tilt',-30,30,0,v=>hp.rotation.z=v*rad);
// hand
const WH=new T.MeshBasicMaterial({color:0xc4deff,toneMapped:false});
function hand(p,s){
 const h=grp(p,0,-.22,0);h.scale.setScalar(1.4);
 add(h,sph(1),G,0,-.18,0,.25,.23,.125);
 add(h,tor(.095,.024),B,0,-.18,.125);add(h,new T.CircleGeometry(.066,24),WH,0,-.18,.128);
 const fs=[];
 [[-.15,.17,.15],[-.05,.2,.17],[.05,.19,.16],[.145,.15,.13]].forEach(([x,a,b],i)=>{
  const f=grp(h,x,-.31,0);f.rotation.z=(i-1.5)*.1;
  add(f,cyl(.047,.047,.07),K,0,-.03,0);add(f,cyl(.05,.045,a),G,0,-.07-a/2,0);
  const f2=grp(f,0,-.07-a,0);add(f2,cyl(.046,.046,.07),K,0,-.02,0);
  add(f2,cyl(.045,.04,b),G,0,-.055-b/2,0);add(f2,sph(.04),G,0,-.055-b,0);fs.push([f,f2]);
 });
 const t=grp(h,s*.22,-.24,.03);t.rotation.z=s*.95;add(t,sph(.055),K);add(t,cyl(.052,.046,.15),G,0,-.085,0);
 const t2=grp(t,0,-.16,0);add(t2,cyl(.044,.044,.06),K,0,-.01,0);add(t2,cyl(.046,.04,.12),G,0,-.105,0);add(t2,sph(.04),G,0,-.165,0);fs.push([t,t2]);
 const idx=s<0?0:3,st={c:25,p:0,apply(){fs.forEach(([a,b],i)=>{const th=i===4,casc=th?1:[.75,1,1.15,1.3][s<0?i:3-i];let c=st.c*casc;const tg=th?75:(i===idx?0:100);c=c+(tg-c)*st.p;a.rotation.x=-c*rad*.6;b.rotation.x=-c*rad*.9})}};st.apply();return st;
}
// arms: s=-1 is the robot's right (viewer's left)
function arm(s){
 const n=s<0?'R':'L',g=s<0?'Right arm':'Left arm',sh=grp(torso,s*1.12,1.22,0);sh.rotation.order='ZXY';
 add(sh,sph(.3),K);const pd=grp(torso,s*1.12,1.22,0);
const tl=grp(pd,s*.08,.02,0);tl.rotation.z=-s*.12;
add(tl,lat([[0,-.04],[.4,-.04],[.5,.08],[.48,.28],[.34,.46],[0,.52]]),G,0,0,0,1.05,1,1.15);
const rg=add(tl,new T.TorusGeometry(.5,.03,10,40,Math.PI*1.1),B,0,.08,0);rg.rotation.set(Math.PI/2,0,-.05*Math.PI);rg.scale.set(1.05,1.15,1);
add(pd,sph(.3),G,s*.14,.16,.26,.95,.55,.6);add(pd,sph(.035),K,s*.3,.38,.12);
for(let i=0;i<4;i++)add(sh,cyl(.3+(i%2)*.012,.3+(i%2)*.012,.07),K,0,-.06-i*.08,0);
 add(sh,tor(.285,.04),K,0,-.62,0).rotation.x=Math.PI/2;
 add(sh,lat([[0,-.82],[.17,-.8],[.24,-.7],[.28,-.45],[.3,-.2],[.27,-.02],[0,0]]),G);
 const el=grp(sh,0,-.85,0);add(el,sph(.27),K);add(el,tor(.2,.025),B,s*.23,0,0).rotation.y=Math.PI/2;
 add(el,lat([[0,-.95],[.17,-.93],[.21,-.85],[.27,-.6],[.34,-.3],[.33,-.1],[.26,0],[0,.02]]),G);add(el,new T.BoxGeometry(.05,.42,.04),B,0,-.45,.31);
 const wr=grp(el,0,-.9,0);wr.rotation.order='ZXY';add(wr,sph(.19),K);add(wr,cyl(.23,.2,.22),K,0,-.1,0);
 const curl=hand(wr,s);
 jt(g,'sz'+n,'Raise sideways',-175,175,s*42,v=>{sh.rotation.z=v*rad;pd.rotation.z=v*rad*.35});
 jt(g,'sx'+n,'Swing forward/back',-90,90,-8,rot(sh,'x'));jt(g,'sy'+n,'Arm twist',-90,90,0,rot(sh,'y'));
 jt(g,'el'+n,'Elbow bend',-150,0,-4,rot(el,'z'));
 jt(g,'wr'+n,'Wrist tilt',-60,60,s*8,rot(wr,'z'));jt(g,'wx'+n,'Wrist bend',-60,60,0,rot(wr,'x'));jt(g,'wy'+n,'Wrist twist',-90,90,0,rot(wr,'y'));
 jt(g,'fi'+n,'Fingers curl',0,100,25,v=>{curl.c=v;curl.apply()});jt(g,'pn'+n,'Point with index finger',0,100,0,v=>{curl.p=v;curl.apply()});
}
function surfOf(pts,sx,sz,oz){const sp=new T.SplineCurve(pts.map(([r,y])=>new T.Vector2(Math.max(.001,r),y))).getPoints(240);
 const r=y=>{for(let i=1;i<sp.length;i++){const a=sp[i-1],b=sp[i];if((a.y-y)*(b.y-y)<=0){const u=(y-a.y)/((b.y-a.y)||1);return a.x+(b.x-a.x)*u}}return .3};
 return{front:(x,y,o=.012)=>new T.Vector3(x,y,oz+sz*Math.sqrt(Math.max(0,r(y)**2-(x/sx)**2))+o),
  side:(q,z,y,o=.012)=>new T.Vector3(q*(sx*Math.sqrt(Math.max(0,r(y)**2-((z-oz)/sz)**2))+o),y,z)}}
const thP=[[0,-1.07],[.24,-1.05],[.3,-.9],[.38,-.5],[.43,-.2],[.4,-.02],[0,0]],shP=[[0,-1.42],[.3,-1.4],[.38,-1.3],[.48,-.9],[.55,-.5],[.5,-.2],[.36,-.05],[0,0]];
const thS=surfOf(thP,1,.95,0),shS=surfOf(shP,1,1.05,.04);
class Fn extends T.Curve{constructor(f){super();this.f=f}getPoint(t,v=new T.Vector3()){return v.copy(this.f(t))}}
const fnc=(f,seg,r,closed)=>new T.TubeGeometry(new Fn(f),seg,r,8,closed);
const shoeDef=(x,y,z)=>{if(y<0&&y>-.999){const t=-y,q=Math.pow(1-t*t*t*t,.25)/Math.sqrt(1-t*t);x*=q;z*=q}const f=(z+1)/2;x*=.78+.3*f;y=y>0?y*(1.15-.7*f):y*.55;if(z<0)z*=.9;return new T.Vector3(x*.62,-.27+y*.34,.45+z)};
const shoePt=(y0,phi,k)=>{const r=Math.sqrt(1-y0*y0);return shoeDef(r*Math.cos(phi)*k,y0,r*Math.sin(phi)*k)};
const shoeSeam=(zc,a,k)=>{const r=Math.sqrt(1-zc*zc);return shoeDef(r*Math.cos(a)*k,r*Math.sin(a)*k,zc)};
function leg(s){
 const n=s<0?'R':'L',g=s<0?'Right leg':'Left leg',h=grp(pelvis,s*.5,-.2,0);h.rotation.order='ZXY';let rl=0;
 add(h,sph(.36),K);add(h,lat(thP),G,0,0,0,1,1,.95);
 add(h,fnc(t=>thS.front(s*.27,-.2-.65*t),30,.02,false),B);
 add(h,tor(.2,.02),B,s*.3,0,0).rotation.y=Math.PI/2;add(h,cyl(.29,.285,.1),K,0,-.97,0,1,1,.95);
 const kn=grp(h,0,-1.1,0);add(kn,sph(.36),K);add(kn,new T.TorusGeometry(.27,.035,10,32,Math.PI),B,0,0,.25);add(kn,cyl(.15,.15,.08),K,s*.32,0,0).rotation.z=Math.PI/2;add(kn,tor(.15,.02),B,s*.33,0,0).rotation.y=Math.PI/2;
 add(kn,lat(shP),G,0,0,.04,1,1,1.05);add(kn,cyl(.52,.5,.1),K,0,-.2,.04,1,1,1.05);add(kn,cyl(.33,.35,.14),K,0,-1.4,.04,1,1,1.05);
 add(kn,fnc(t=>shS.front(0,-.4-.75*t),30,.02,false),B);
 [-1,1].forEach(q=>add(kn,fnc(t=>{const u=t*Math.PI*2;return shS.side(q,.04+.27*Math.cos(u),-.8+.42*Math.sin(u))},60,.022,true),B));
 const an=grp(kn,0,-1.4,0);add(an,sph(.28),K);
 const ft=grp(an,0,.2,0);ft.rotation.y=s*.5;
 add(ft,shoeGeo(),G,0,-.27,.45,.62,.34,1.0);add(ft,fnc(t=>shoeSeam(.4,-.2*Math.PI+t*1.4*Math.PI,1.01),50,.012,false),K);add(ft,shoeGeo(),B,0,-.4,.45,.675,.07,1.05);add(ft,shoeGeo(),K,0,-.5,.45,.65,.19,1.03);add(ft,sph(1),K,0,-.56,-.15,.48,.13,.36);
 jt(g,'hs'+n,'Hip swing',-80,80,0,rot(h,'x'));
 jt(g,'hz'+n,'Hip spread',-60,60,s*10,v=>{h.rotation.z=v*rad;an.rotation.z=-v*rad+rl});jt(g,'hy'+n,'Hip twist',-60,60,0,rot(h,'y'));
 jt(g,'kn'+n,'Knee bend',0,120,0,rot(kn,'x'));
 jt(g,'an'+n,'Ankle',-40,40,0,rot(an,'x'));jt(g,'ar'+n,'Ankle roll',-30,30,0,v=>{rl=v*rad;an.rotation.z=-h.rotation.z+rl});
}
arm(-1);arm(1);leg(-1);leg(1);
// comic-style black outline
const OL=new T.MeshBasicMaterial({color:0x050505,side:T.BackSide});
OL.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','vec3 transformed=position+normal*0.012;')};
const ms=[];root.traverse(o=>{if(o.isMesh&&[G,K,S].includes(o.material))ms.push(o)});
ms.forEach(o=>o.add(new T.Mesh(o.geometry,OL)));
// glow, shadows and floor
const GL=new T.MeshBasicMaterial({color:0x2b6bff,transparent:true,opacity:.22,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false});
GL.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','vec3 transformed=position+normal*0.025;')};
const bs=[];root.traverse(o=>{if(o.isMesh&&o.material===B)bs.push(o)});bs.forEach(o=>o.add(new T.Mesh(o.geometry,GL)));
ms.forEach(o=>o.castShadow=true);

const DEF = Object.fromEntries(Object.keys(J).map((k) => [k, J[k].def]));
return { root, J, DEF, eyes, mouth, haloB, GL, pelvis, torso, head, hp };
}

// Studio environment for the metal reflections (from the mascot file).
export function robotEnvironment(renderer) {
const T = THREE;
// studio environment for metal reflections
const es=new T.Scene();
es.add(new T.Mesh(new T.BoxGeometry(24,24,24),new T.MeshBasicMaterial({color:0x3a3226,side:T.BackSide})));
[[0,9,4,8,.4,8,0xffffff,5],[-9,3,3,.4,7,7,0xffe9c0,4],[9,3,2,.4,7,7,0xcfe0ff,4],[0,-10,0,12,.4,12,0x2a3146,1],[0,2,10,6,5,.4,0xffffff,2]].forEach(([x,y,z,w,h,d,c,k])=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshBasicMaterial({color:new T.Color(c).multiplyScalar(k*.5)}));m.position.set(x,y,z);es.add(m)});
const envTex=new T.PMREMGenerator(renderer).fromScene(es,.03).texture;

return envTex;
}
