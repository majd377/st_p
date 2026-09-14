(function(){
  const OWNER_CHECK='ownerOnly/ping';
  function boot(){
    const gate=document.getElementById('admin-gate'),btn=document.getElementById('google-admin-btn'),msg=document.getElementById('admin-gate-msg');
    const provider=new firebase.auth.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
    window.adminSignOut=async()=>{try{await firebase.auth().signOut();location.reload();}catch(e){location.reload();}};
    async function writeDirectory(u){try{await firebase.database().ref('loginDirectory/'+u.uid).set({uid:u.uid,email:u.email||'',displayName:u.displayName||'',timestamp:firebase.database.ServerValue.TIMESTAMP});}catch(e){}}
    async function markFirstAllowed(u){try{const r=firebase.database().ref('accessLogs/'+u.uid),s=await r.once('value');if(!s.exists())await r.set({uid:u.uid,email:u.email||'',displayName:u.displayName||'',timestamp:firebase.database.ServerValue.TIMESTAMP,allowed:true});}catch(e){}}
    async function authorize(u){try{await firebase.database().ref('adminOnly/ping').once('value');window.IS_ADMIN=true;window.AUTH_USER=u;}catch(e){window.IS_ADMIN=false;window.AUTH_USER=u;}try{await firebase.database().ref(OWNER_CHECK).once('value');window.IS_OWNER=true;}catch(e){window.IS_OWNER=false;}return !!window.IS_ADMIN;}
    function renderAccessLogs(){
      const box=document.getElementById('access-logs-list'); if(!box || !window.IS_OWNER || !firebase.database) return;
      firebase.database().ref('accessLogs').once('value').then(s=>{const arr=[];s.forEach(c=>arr.push(c.val()||{}));arr.reverse();if(!arr.length){box.innerHTML='<div class="notice">لا توجد حسابات مسموح لها حتى الآن.</div>';return;}box.innerHTML=arr.map(x=>{const when=x.timestamp?new Date(x.timestamp).toLocaleString('ar-PS'):'';return '<div class="management-row account-row"><div><strong>'+String(x.displayName||'حساب Google')+'</strong><small>'+String(x.email||'')+'</small><small>'+when+'</small></div><span class="admin-badge">تم السماح</span></div>';}).join('');}).catch(()=>{box.innerHTML='<div class="notice">تعذر تحميل السجل.</div>';});
    }
    function renderAdmin(){if(!window.IS_ADMIN)return;document.body.classList.remove('view-mode');document.body.classList.add('edit-mode');document.body.classList.toggle('owner-mode',!!window.IS_OWNER);document.querySelectorAll('.owner-only-nav').forEach(el=>el.style.display=window.IS_OWNER?'flex':'none');if(gate)gate.remove();if(window.render)window.render();if(window.showSection)window.showSection('home');}
    window.renderAccessLogs=renderAccessLogs;
    window.adminSignIn=async()=>{btn.disabled=true;msg.textContent='جاري تسجيل الدخول والتحقق من الصلاحية...';try{const result=await firebase.auth().signInWithPopup(provider),u=result.user;await writeDirectory(u);const allowed=await authorize(u);if(!allowed){msg.textContent='عذراً، لن يتم تسجيل دخولك إلى لوحة الإدارة.';await firebase.auth().signOut();btn.disabled=false;return;}await markFirstAllowed(u);renderAdmin();}catch(e){msg.textContent=e&&e.code==='auth/unauthorized-domain'?'هذا النطاق غير مضاف في Authorized domains داخل Firebase.':'تعذر تسجيل الدخول. تأكد من تفعيل Google وإعداد Authorized domains في Firebase.';btn.disabled=false;}};
    firebase.auth().onAuthStateChanged(async u=>{if(!u)return;await writeDirectory(u);const allowed=await authorize(u);if(allowed){await markFirstAllowed(u);renderAdmin();}else{await firebase.auth().signOut();}});
  }
  window.addEventListener('load',boot);
})();