/* Original, resolution-independent Canvas 2D artwork. No raster media or network. */
(() => {
  const palette = {ink:'#34352f',cream:'#f7f3e9',skin:'#d9b292',sage:'#a6b5a0',oat:'#ddd1b9',coral:'#ed9b85',line:'#aaa697'};
  const ease = n => { n=Math.max(0,Math.min(1,n));return n*n*(3-2*n); };
  const mix = (a,b,n)=>a+(b-a)*n;
  class Art {
    constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.state={scene:0,time:0,freedom:0};this.width=0;this.height=0;}
    resize(w,h){this.width=w;this.height=h;const d=Math.min(devicePixelRatio||1,2);this.canvas.width=w*d;this.canvas.height=h*d;this.ctx?.setTransform(d,0,0,d,0,0);this.draw();}
    shape(points,fill,stroke=null){const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1.3;c.stroke();}}
    line(points,color=palette.ink,width=3){const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
    ellipse(x,y,rx,ry,color){const c=this.ctx;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}
    chair(x,y){const c=this.ctx;c.save();c.translate(x,y);this.shape([[-42,-85],[39,-90],[39,-10],[-41,-6]],'#d4a97a');this.line([[-34,-76],[-34,-18]],'#bb8f66',2);this.line([[31,-78],[31,-19]],'#bb8f66',2);this.shape([[-49,-6],[49,-6],[58,9],[-46,13]],'#c2966a');this.line([[-38,11],[-45,92]],'#ab835f',7);this.line([[40,9],[50,90]],'#ab835f',7);c.restore();}
    person(x,y,{facing=1,shirt=palette.oat,seated=0,bow=0,arm=0,palm=0,hair='long',opacity=1}={}){
      const c=this.ctx;c.save();c.globalAlpha=opacity;c.translate(x,y);c.scale(facing,1);
      // Cut-paper limbs retain slight asymmetry; the head tilts toward the other person.
      const torsoY=seated*40;
      c.save();c.translate(0,torsoY);c.rotate(bow*.17);
      this.shape([[-34,-107],[29,-109],[43,9],[-41,16]],shirt,palette.line);
      const leg=(standing,sitting,color)=>this.shape(standing.map((point,i)=>point.map((value,j)=>mix(value,sitting[i][j],seated))),color);
      leg([[-33,8],[-3,12],[-9,119],[-35,121]],[[-33,8],[-3,12],[44,29],[20,44]],palette.ink);
      leg([[-3,12],[36,8],[30,120],[5,121]],[[-3,12],[36,8],[64,28],[36,47]],'#52534a');
      this.line([[mix(-21,33,seated),mix(27,35,seated)],[mix(-22,32,seated),125-torsoY]],palette.ink,23);
      this.line([[mix(17,54,seated),mix(27,35,seated)],[mix(19,55,seated),125-torsoY]],'#52534a',23);
      this.ellipse(mix(-20,34,seated),125-torsoY,25,8,palette.ink);this.ellipse(mix(21,57,seated),125-torsoY,25,8,palette.ink);
      // Quietly visible paper seams.
      this.line([[-9,-102],[-3,-21]],'#f7f3e977',1.5);
      this.shape([[-11,-140],[13,-140],[15,-105],[-10,-105]],palette.skin);
      c.save();c.translate(0,-159);c.rotate(bow*.26);
      this.ellipse(-3,0,29,37,palette.skin);
      this.shape([[20,-8],[32,-1],[22,6]],palette.skin);
      if(hair==='long'){
        this.shape([[-32,-22],[-17,-39],[8,-40],[25,-29],[22,-9],[10,-20],[-11,-16],[-17,30],[-29,47],[-43,36]],palette.ink);
      }else{
        this.shape([[-31,-13],[-28,-33],[-8,-41],[17,-36],[26,-22],[23,-13],[9,-18],[-9,-21],[-23,-4]],palette.ink);
      }
      this.ellipse(16,-6,1.6,1.7,palette.ink);this.line([[17,12],[24,10]],'#986b55',1.2);
      c.restore();
      // Forearm moves as one small human gesture, never a large looping wave.
      this.line([[-27,-91],[-39,-32],[-31,16]],shirt,22);
      const elbow=[mix(35,62,arm),mix(-48,-70,arm)];
      const hand=[mix(31,112,arm),mix(10,-70-palm*32,arm)];
      this.line([[28,-88],elbow,hand],shirt,23);
      this.ellipse(hand[0]+7,hand[1]-2,13,7,palette.skin);
      if(palm>.2)this.line([[hand[0]+9,hand[1]-4],[hand[0]+20,hand[1]-12]],palette.skin,5);
      c.restore();c.restore();
    }
    bag(x,y){const c=this.ctx;c.save();c.translate(x,y);this.shape([[-27,-25],[25,-25],[30,34],[-33,34]],'#6c756d');this.line([[-19,-26],[-16,-49],[15,-50],[21,-25]],'#6c756d',8);this.line([[-25,0],[27,0]],'#f7f3e955',1);c.restore();}
    phone(x,y,glow=0){const c=this.ctx;c.save();c.translate(x,y);this.shape([[-21,-37],[21,-37],[22,37],[-22,37]],palette.ink);this.shape([[-17,-31],[17,-31],[17,29],[-17,29]],'#d7e4df');c.globalAlpha=.35+glow*.65;this.ellipse(0,-2,8,8,palette.coral);c.globalAlpha=1;this.line([[-8,19],[8,19]],'#83958d',2);c.restore();}
    papers(x,y,n=4){const c=this.ctx;c.save();c.translate(x,y);for(let i=0;i<n;i++)this.shape([[-31+i*3,-18-i*4],[31+i*3,-18-i*4],[31+i*3,13-i*4],[-31+i*3,13-i*4]],'#ede4d4','#b8aa91');c.restore();}
    room(){const c=this.ctx;
      // The door, clock and one movable chair stay in the same place throughout the evening.
      this.line([[-337,-262],[-337,146]],'#b8aa95',4);this.line([[-337,-262],[-184,-262],[-184,146]],'#c5b7a1',4);
      this.shape([[-331,-252],[-204,-252],[-204,130],[-331,130]],'#ede2cd');
      this.line([[-204,-251],[-204,129]],'#b8aa95',3);this.ellipse(-222,-11,4,4,'#a38b72');
      c.globalAlpha=.52;this.line([[288,-252],[288,110]],'#b8aa95',3);this.line([[210,-252],[367,-252],[367,110]],'#b8aa95',3);c.globalAlpha=1;
      this.ellipse(254,-210,25,25,'#fffaf0');c.beginPath();c.arc(254,-210,25,0,Math.PI*2);c.strokeStyle='#c7b69e';c.lineWidth=2;c.stroke();
      this.line([[254,-210],[254,-227]],'#776c5d',2);this.line([[254,-210],[267,-207]],'#776c5d',2);
      this.line([[-370,146],[379,146]],'#c9bea9',2);
    }
    draw(){const c=this.ctx;if(!c)return;const {scene,time,freedom}=this.state,w=this.width,h=this.height;const mobile=w<h;
      c.clearRect(0,0,w,h);
      c.fillStyle=palette.cream;c.fillRect(0,0,w,h);
      const light=c.createLinearGradient(0,0,w,h);light.addColorStop(0,'#f4ead444');light.addColorStop(.6,'#fffdf400');light.addColorStop(1,'#ead8ba77');c.fillStyle=light;c.fillRect(0,0,w,h);
      c.fillStyle='#e4d9c244';c.beginPath();c.moveTo(w*.66,0);c.lineTo(w*.89,0);c.lineTo(w*.56,h*.73);c.lineTo(w*.25,h*.73);c.fill();
      c.fillStyle='#655f4a0b';for(let i=0;i<420;i++)c.fillRect((i*137.13)%w,(i*83.7)%h,1,1);
      const scale=Math.min(w/(mobile?650:1080),h/780);
      c.save();c.translate(w/2,h*.34);c.scale(scale,scale);
      const enter=ease(time/4), shift=ease((time-3)/5);
      c.globalAlpha=.45;this.ellipse(0,146,350,18,'#d4ccb9');c.globalAlpha=1;this.room();
      if(scene===-2){
        this.chair(75,51);this.chair(-88,51);
        this.person(105,0,{seated:1,arm:0});
        this.person(-280+enter*49,0,{shirt:palette.sage,hair:'short',bow:.24});
        this.bag(-244+enter*49,92);
        c.globalAlpha=.48;this.person(278,0,{shirt:'#b6a792',hair:'short',seated:1});c.globalAlpha=1;
      }else if(scene===-1){
        c.fillStyle='#d4d9d277';c.fillRect(-380,-260,758,405);
        this.chair(72,51);this.chair(218,51);
        this.person(-245+enter*25,0,{bow:.26+shift*.2});this.bag(-235+enter*25,94);
        c.globalAlpha=.34;this.person(237,0,{shirt:'#b6a792',hair:'short',seated:1});c.globalAlpha=1;
      }else if(scene===0){
        this.chair(-78+enter*28,50);this.chair(102,50);
        this.person(113,0,{seated:1,arm:enter*.83,palm:.4});
        this.person(-262+shift*182,0,{facing:-1,shirt:palette.sage,hair:'short',seated:shift});
        this.bag(-240+shift*135,95);
        c.globalAlpha=.45;this.line([[-40,-24],[21,-47],[72,-42]],palette.coral,2);c.globalAlpha=1;
      }else if(scene===1){
        this.chair(-122,49);this.chair(142,49);
        this.shape([[-177,-2],[188,-2],[195,12],[-185,12]],'#c9ad8b');
        this.line([[-168,12],[-168,142]],'#ac8c6d',7);this.line([[178,12],[178,142]],'#ac8c6d',7);
        this.person(-131,0,{arm:enter*.9,palm:.6});
        this.person(146,0,{facing:-1,shirt:palette.sage,hair:'short',seated:1});
        c.globalAlpha=.68;this.person(272,0,{facing:-1,shirt:'#b6a792',hair:'short',arm:.4});c.globalAlpha=1;
        this.papers(1,-3,5);this.papers(70,-3,3);
        this.phone(-225,94,shift);
        if(shift>.1){c.globalAlpha=shift*.7;this.bag(-202,101);c.globalAlpha=1;}
      }else if(scene===2){
        this.chair(-52,51);this.chair(146,51);
        this.person(-185-enter*22,0,{bow:.08,arm:.1});this.bag(-202-enter*22,86);
        this.person(104,0,{facing:-1,shirt:'#b6a792',hair:'short',arm:enter*.55,palm:.4});
        this.person(247,0,{facing:-1,shirt:palette.sage,hair:'short',bow:.1});
        this.phone(-281,96,shift);
        if(shift>.1){c.globalAlpha=shift*.38;this.line([[-309,27],[-279,27]],palette.coral,2);c.globalAlpha=1;}
      }else{
        this.chair(-35,51);this.chair(166+enter*16,51);
        this.person(-278-enter*12,0,{arm:.12});this.bag(-292-enter*12,84);
        this.person(-26,0,{facing:-1,shirt:palette.sage,hair:'short',arm:enter*.7,palm:.4});
        this.person(164,0,{facing:-1,shirt:'#b6a792',hair:'short',arm:.35+enter*.5,palm:.2});
        c.globalAlpha=.5*shift;this.line([[-216,34],[-192,34]],palette.coral,2);c.globalAlpha=1;
      }
      if(scene>=0&&freedom>.02){c.globalAlpha=.25*freedom;this.line([[-98,-189],[0,-199],[99,-187]],palette.coral,2);c.globalAlpha=1;}
      c.restore();
    }
  }
  window.MZArt=Art;
})();
