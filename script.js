// میٹھا خزانہ — M Ijaz · GHS 124/NB
(function(){
  "use strict";

  const FAV_KEY = "meethaKhazana_favs_v1";
  const grid = document.getElementById("grid");
  const chipsEl = document.getElementById("chips");
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearch");
  const resultMeta = document.getElementById("resultMeta");
  const emptyState = document.getElementById("emptyState");
  const overlay = document.getElementById("detailOverlay");
  const bottomNav = document.getElementById("bottomNav");
  const toastEl = document.getElementById("toast");

  let favs = new Set();
  try{ favs = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]")); }catch(e){ favs = new Set(); }

  let activeCategory = "سب";
  let activeView = "all"; // all | fav
  let searchTerm = "";

  const categories = ["سب", ...Array.from(new Set(RECIPES.map(r=>r.category)))];

  function saveFavs(){
    localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(favs)));
  }

  function toast(msg){
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(()=>{ toastEl.hidden = true; }, 1800);
  }

  function renderChips(){
    chipsEl.innerHTML = "";
    categories.forEach(cat=>{
      const b = document.createElement("button");
      b.className = "chip" + (cat===activeCategory ? " active" : "");
      b.textContent = cat;
      b.addEventListener("click", ()=>{
        activeCategory = cat;
        renderChips();
        renderGrid();
      });
      chipsEl.appendChild(b);
    });
  }

  function matchesSearch(r, term){
    if(!term) return true;
    const t = term.trim();
    if(!t) return true;
    if(r.name.includes(t)) return true;
    if(String(r.id).includes(t)) return true;
    return r.ingredients.some(i => i.includes(t));
  }

  function getFiltered(){
    let list = RECIPES;
    if(activeView === "fav"){
      list = list.filter(r => favs.has(r.id));
    }
    if(activeCategory !== "سب"){
      list = list.filter(r => r.category === activeCategory);
    }
    if(searchTerm){
      list = list.filter(r => matchesSearch(r, searchTerm));
    }
    return list;
  }

  function cardHTML(r){
    const isFav = favs.has(r.id);
    return `
      <div class="card" data-id="${r.id}" tabindex="0" role="button" aria-label="${r.name}">
        <div class="card-top">
          <button class="card-fav ${isFav?'active':''}" data-fav="${r.id}" aria-label="پسندیدہ میں شامل کریں">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 21s-6.7-4.35-9.3-8.1C1 10.2 1.6 6.9 4.4 5.3c2.3-1.3 4.9-.6 6.3 1.4l1.3 1.8 1.3-1.8c1.4-2 4-2.7 6.3-1.4 2.8 1.6 3.4 4.9 1.7 7.6C18.7 16.65 12 21 12 21z"/></svg>
          </button>
          <span class="card-num">#${r.id}</span>
          <div class="mini-balls"><span class="mball m1"></span><span class="mball m2"></span><span class="mball m3"></span></div>
        </div>
        <div class="card-body">
          <div class="card-name">${r.name}</div>
          <div class="card-cat">${r.category}</div>
        </div>
      </div>
    `;
  }

  function renderGrid(){
    const list = getFiltered();
    grid.innerHTML = list.map(cardHTML).join("");
    emptyState.hidden = list.length !== 0;
    grid.hidden = list.length === 0;

    let metaLabel;
    if(activeView === "fav"){
      metaLabel = `پسندیدہ مٹھائیاں — ${list.length}`;
    } else {
      metaLabel = `${list.length} مٹھائیاں ${activeCategory !== "سب" ? "· " + activeCategory : ""}`;
    }
    resultMeta.textContent = metaLabel;

    grid.querySelectorAll(".card").forEach(card=>{
      card.addEventListener("click", (e)=>{
        if(e.target.closest("[data-fav]")) return;
        openDetail(Number(card.dataset.id));
      });
      card.addEventListener("keydown",(e)=>{
        if(e.key === "Enter") openDetail(Number(card.dataset.id));
      });
    });
    grid.querySelectorAll("[data-fav]").forEach(btn=>{
      btn.addEventListener("click",(e)=>{
        e.stopPropagation();
        toggleFav(Number(btn.dataset.fav));
      });
    });
  }

  function toggleFav(id){
    if(favs.has(id)){
      favs.delete(id);
      toast("پسندیدہ سے ہٹا دیا گیا");
    } else {
      favs.add(id);
      toast("پسندیدہ میں شامل کر دیا گیا ❤️");
    }
    saveFavs();
    renderGrid();
    if(!overlay.hidden){
      updateDetailFavIcon(currentDetailId);
    }
  }

  // ===== Detail view =====
  let currentDetailId = null;
  const detailNum = document.getElementById("detailNum");
  const detailName = document.getElementById("detailName");
  const detailCat = document.getElementById("detailCat");
  const detailIngredients = document.getElementById("detailIngredients");
  const detailSteps = document.getElementById("detailSteps");
  const detailFavIcon = document.getElementById("detailFavIcon");

  function updateDetailFavIcon(id){
    const active = favs.has(id);
    document.getElementById("detailFavBtn").classList.toggle("active-fav", active);
    detailFavIcon.parentElement.style.color = active ? "#F0B94C" : "#FBF3E7";
  }

  function openDetail(id){
    const r = RECIPES.find(x=>x.id===id);
    if(!r) return;
    currentDetailId = id;
    detailNum.textContent = "مٹھائی نمبر " + r.id;
    detailName.textContent = r.name;
    detailCat.textContent = r.category;

    detailIngredients.innerHTML = r.ingredients.map(ing=>{
      const idx = ing.indexOf(":");
      if(idx === -1){
        return `<li><span class="ing-name">${ing}</span></li>`;
      }
      const name = ing.slice(0, idx).trim();
      const amt = ing.slice(idx+1).trim();
      return `<li><span class="ing-name">${name}</span><span class="ing-amt">${amt}</span></li>`;
    }).join("");

    detailSteps.innerHTML = r.steps.map(s=>`<li>${s}</li>`).join("");

    updateDetailFavIcon(id);
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    overlay.querySelector(".detail-sheet").scrollTop = 0;
    history.pushState({detail:id}, "", "#recipe-" + id);
  }

  function closeDetail(){
    overlay.hidden = true;
    document.body.style.overflow = "";
    if(location.hash.startsWith("#recipe-")){
      history.back();
    }
  }

  document.getElementById("backBtn").addEventListener("click", closeDetail);
  overlay.addEventListener("click", (e)=>{
    if(e.target === overlay) closeDetail();
  });
  document.getElementById("detailFavBtn").addEventListener("click", ()=>{
    if(currentDetailId!=null) toggleFav(currentDetailId);
  });
  window.addEventListener("popstate", ()=>{
    if(!overlay.hidden) { overlay.hidden = true; document.body.style.overflow=""; }
  });

  // ===== Search =====
  let searchDebounce;
  searchInput.addEventListener("input", ()=>{
    clearSearchBtn.hidden = searchInput.value.length === 0;
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(()=>{
      searchTerm = searchInput.value;
      renderGrid();
    }, 120);
  });
  clearSearchBtn.addEventListener("click", ()=>{
    searchInput.value = "";
    searchTerm = "";
    clearSearchBtn.hidden = true;
    renderGrid();
    searchInput.focus();
  });

  // ===== Bottom nav =====
  bottomNav.querySelectorAll(".nav-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const v = btn.dataset.view;
      if(v === "install"){
        triggerInstall();
        return;
      }
      if(v === "random"){
        const pick = RECIPES[Math.floor(Math.random()*RECIPES.length)];
        openDetail(pick.id);
        return;
      }
      activeView = v;
      bottomNav.querySelectorAll(".nav-btn").forEach(b=>{
        if(b.dataset.view !== "install") b.classList.remove("active");
      });
      btn.classList.add("active");
      renderGrid();
    });
  });

  // ===== Menu button (scroll to top / categories) =====
  document.getElementById("menuBtn").addEventListener("click", ()=>{
    window.scrollTo({top:0, behavior:"smooth"});
    searchInput.focus();
  });
  document.getElementById("favBtn").addEventListener("click", ()=>{
    activeView = "fav";
    bottomNav.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    bottomNav.querySelector('[data-view="fav"]').classList.add("active");
    renderGrid();
    window.scrollTo({top:0, behavior:"smooth"});
  });

  // ===== Install prompt =====
  let deferredPrompt = null;
  const installNav = document.getElementById("installNav");
  window.addEventListener("beforeinstallprompt", (e)=>{
    e.preventDefault();
    deferredPrompt = e;
    installNav.hidden = false;
  });
  function triggerInstall(){
    if(!deferredPrompt){
      toast("ایپ پہلے سے انسٹال ہے یا سپورٹڈ نہیں");
      return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(()=>{
      deferredPrompt = null;
      installNav.hidden = true;
    });
  }
  window.addEventListener("appinstalled", ()=>{
    installNav.hidden = true;
    toast("ایپ کامیابی سے انسٹال ہو گئی 🎉");
  });

  // ===== Deep link on load =====
  function handleInitialHash(){
    const m = location.hash.match(/^#recipe-(\d+)$/);
    if(m){
      const id = Number(m[1]);
      if(RECIPES.some(r=>r.id===id)) openDetail(id);
    }
  }

  // ===== Init =====
  renderChips();
  renderGrid();
  handleInitialHash();

  // ===== Service worker =====
  if("serviceWorker" in navigator){
    window.addEventListener("load", ()=>{
      navigator.serviceWorker.register("sw.js").catch(()=>{});
    });
  }
})();
