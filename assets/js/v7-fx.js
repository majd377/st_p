/* V7 — حلقة ثلاثية الأبعاد، بطاقات مائلة، غبار ذهبي، شريط تقدّم. لا مكتبات خارجية. */
(function(){
  'use strict';
  var RM=function(){return document.body.classList.contains('reduced-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches};
  var ITEMS=[['📝','الواجبات','assignments'],['🎥','التسجيلات','recordings'],['📋','الاختبارات','exams'],['📊','التقدم بالمنهج','progress'],['🌟','الكتب والرزم','books-packages'],['📚','التلخيصات','summaries']];

  function hero(){
    var home=document.getElementById('home'); if(!home||document.getElementById('v7-hero')) return;
    var h=document.createElement('div'); h.className='v7-hero'; h.id='v7-hero';
    h.innerHTML='<h2>المنارة الطلابية</h2><p>اسحب الحلقة ودوّرها، واضغط على أي بطاقة للدخول</p><div class="v7-stage"><div class="v7-ring"></div><div class="v7-floor"></div></div>';
    home.insertBefore(h,home.firstChild);
    var stage=h.querySelector('.v7-stage'), ring=h.querySelector('.v7-ring'), n=ITEMS.length, step=360/n, faces=[];
    ITEMS.forEach(function(it,i){
      var f=document.createElement('div'); f.className='v7-face'; f.innerHTML='<i>'+it[0]+'</i><span>'+it[1]+'</span>'; f.dataset.go=it[2]; ring.appendChild(f); faces.push(f);
    });
    var rot=0,vel=.22,drag=false,moved=0,lastX=0,R=150,auto=!RM();
    function size(){var w=stage.clientWidth; var fw=w<420?96:112; R=Math.max(110,Math.round((fw/2)/Math.tan(Math.PI/n)*1.18));}
    size(); addEventListener('resize',size);
    function paint(){
      ring.style.transform='translateY(-50%) rotateX(-8deg) rotateY('+rot+'deg)';
      for(var i=0;i<n;i++){
        var a=((i*step+rot)%360+360)%360, c=Math.cos(a*Math.PI/180), k=(c+1)/2;
        faces[i].style.transform='rotateY('+(i*step)+'deg) translateZ('+R+'px)';
        faces[i].style.opacity=(.35+.65*k).toFixed(2); faces[i].style.setProperty('--g',(k>.92?(k-.92)*9:0).toFixed(2));
        faces[i].style.filter=k<.5?'saturate(.7)':'none';
      }
    }
    stage.addEventListener('pointerdown',function(e){drag=true;moved=0;lastX=e.clientX;stage.classList.add('drag');stage.setPointerCapture&&stage.setPointerCapture(e.pointerId)});
    stage.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-lastX;lastX=e.clientX;moved+=Math.abs(dx);rot+=dx*.45;vel=dx*.45});
    function up(e){if(!drag)return;drag=false;stage.classList.remove('drag');
      if(moved<6){var t=document.elementFromPoint(e.clientX,e.clientY);var f=t&&t.closest&&t.closest('.v7-face');if(f&&window.showSection)showSection(f.dataset.go)}}
    stage.addEventListener('pointerup',up); stage.addEventListener('pointercancel',function(){drag=false;stage.classList.remove('drag')});
    var last=performance.now();
    (function loop(t){
      requestAnimationFrame(loop);
      if(document.hidden||!home.classList.contains('active')) {last=t;return}
      var dt=Math.min(40,t-last)/16.7; last=t;
      if(!drag){ if(Math.abs(vel)>.25){rot+=vel*dt;vel*=.95} else if(auto&&!RM()){rot+=.22*dt} }
      paint();
    })(last);
  }

  function tilt(){
    if(!matchMedia('(hover:hover)').matches) return;
    document.addEventListener('pointermove',function(e){
      var c=e.target.closest&&e.target.closest('.feature-card'); if(!c||RM()) return;
      var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
      c.classList.add('tilt'); c.style.setProperty('--ry',((x-.5)*-14).toFixed(1)+'deg'); c.style.setProperty('--rx',((y-.5)*12).toFixed(1)+'deg');
      c.style.setProperty('--mx',(x*100)+'%'); c.style.setProperty('--my',(y*100)+'%');
    },{passive:true});
    document.addEventListener('pointerout',function(e){var c=e.target.closest&&e.target.closest('.feature-card'); if(c&&!c.contains(e.relatedTarget)){c.style.removeProperty('--rx');c.style.removeProperty('--ry')}});
  }

  function reveal(){
    document.querySelectorAll('#home .feature-card').forEach(function(c,i){c.style.setProperty('--i',i);c.classList.add('v7-in')});
  }

  function dust(){
    var cv=document.createElement('canvas'); cv.id='v7-dust'; document.body.insertBefore(cv,document.body.firstChild);
    var x=cv.getContext('2d'),W,H,P=[],dpr=Math.min(2,devicePixelRatio||1),mx=0,my=0;
    function rs(){W=cv.width=innerWidth*dpr;H=cv.height=innerHeight*dpr}
    rs(); addEventListener('resize',rs);
    var N=innerWidth<640?22:42; for(var i=0;i<N;i++)P.push({x:Math.random(),y:Math.random(),z:Math.random()*.9+.1,s:Math.random()*.0004+.00008,p:Math.random()*6});
    addEventListener('pointermove',function(e){mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5},{passive:true});
    function col(){return getComputedStyle(document.documentElement).getPropertyValue('--v-gold').trim()||'#b97f1d'}
    var c=col(); setInterval(function(){c=col()},4000);
    (function f(){
      requestAnimationFrame(f); if(document.hidden||RM())return;
      x.clearRect(0,0,W,H); x.fillStyle=c;
      for(var i=0;i<P.length;i++){var p=P[i]; p.y-=p.s*p.z*16; p.p+=.01; if(p.y<-.02){p.y=1.02;p.x=Math.random()}
        var px=(p.x+Math.sin(p.p)*.01-mx*.03*p.z)*W, py=(p.y-my*.03*p.z)*H;
        x.globalAlpha=.18+.4*p.z; x.beginPath(); x.arc(px,py,(1+p.z*2.2)*dpr,0,6.283); x.fill();}
    })();
  }

  function progress(){
    var b=document.createElement('div'); b.id='v7-progress'; document.body.appendChild(b);
    function u(){var h=document.documentElement,m=h.scrollHeight-h.clientHeight;b.style.transform='scaleX('+(m>0?Math.min(1,h.scrollTop/m):0)+')'}
    addEventListener('scroll',u,{passive:true}); u();
  }

  function init(){hero();tilt();reveal();dust();progress()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
