<script>
  (function(){
    const wrap = document.getElementById('steps-flow');
    if(!wrap) return;

    wrap.addEventListener('click', (e)=>{
      const card = e.target.closest('.step-card');
      if(!card || !wrap.contains(card)) return;

      wrap.querySelectorAll('.step-card.active').forEach(el=>{
        el.classList.remove('active');
        el.setAttribute('aria-expanded','false');
      });

      card.classList.add('active');
      card.setAttribute('aria-expanded','true');
    });
  })();
</script>
