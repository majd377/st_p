(function(){
  function boot(){
    const gate=document.getElementById('admin-gate');
    const btn=document.getElementById('google-admin-btn');
    const msg=document.getElementById('admin-gate-msg');
    const provider=new firebase.auth.GoogleAuthProvider();
    window.adminSignOut=async function(){try{await firebase.auth().signOut();location.reload();}catch(e){location.reload();}};
    function renderLogs(){
      const box=document.getElementById('access-logs-list');
      if(!box || !window.IS_ADMIN) return;
      firebase.database().ref('accessLogs').limitToLast(100).on('value',function(snap){
        const arr=[]; snap.forEach(function(c){arr.push(c.val()||{});}); arr.reverse();
        if(!arr.length){box.innerHTML='<div class="notice" style="padding:12px">لا توجد محاولات مسجلة بعد.</div>';return;}
        box.innerHTML=arr.map(function(x){
          const name=String(x.displayName||'حساب بدون اسم');
          const email=String(x.email||'');
          const when=x.timestamp?new Date(x.timestamp).toLocaleString('ar-PS'):'';
          const state=x.allowed?'تم السماح':'تم الرفض';
          return '<div class="data-card" style="box-shadow:none;margin-bottom:9px"><strong>'+name+'</strong><div style="color:var(--text-light);font-size:.9rem;margin-top:3px">'+email+'</div><div style="color:var(--text-light);font-size:.82rem;margin-top:3px">'+when+' — '+state+'</div></div>';
        }).join('');
      });
    }
    window.adminSignIn=async function(){
      btn.disabled=true; msg.textContent='جاري التحقق...';
      try{
        const result=await firebase.auth().signInWithPopup(provider);
        const u=result.user;
        let allowed=false;
        try{ await firebase.database().ref('adminOnly/ping').once('value'); allowed=true; }catch(e){ allowed=false; }
        try{await firebase.database().ref('accessLogs').push({email:u.email||'',displayName:u.displayName||'',timestamp:firebase.database.ServerValue.TIMESTAMP,allowed:allowed});}catch(e){}
        if(!allowed){msg.textContent='هذا الحساب غير مخوّل للوصول إلى لوحة الإدارة.';await firebase.auth().signOut();btn.disabled=false;return;}
        window.AUTH_USER=u;window.IS_ADMIN=true;document.body.classList.remove('view-mode');document.body.classList.add('edit-mode');gate.remove();if(window.render)window.render();if(window.showSection)window.showSection('home');renderLogs();
      }catch(e){msg.textContent='تعذر تسجيل الدخول. حاول مرة أخرى.';btn.disabled=false;}
    };
    firebase.auth().onAuthStateChanged(function(u){
      if(!u)return;
      firebase.database().ref('adminOnly/ping').once('value').then(function(){window.AUTH_USER=u;window.IS_ADMIN=true;document.body.classList.remove('view-mode');document.body.classList.add('edit-mode');if(gate)gate.remove();if(window.render)window.render();renderLogs();}).catch(function(){});
    });
  }
  window.addEventListener('load',boot);
})();
