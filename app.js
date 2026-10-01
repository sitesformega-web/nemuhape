'use strict';
const $ = s => document.querySelector(s);
const products = window.PRODUCTOS;
const config = window.CONFIG;
const money = n => '₲ ' + Math.round(n).toLocaleString('es-PY');
const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const findProduct = id => products.find(p => p.id === id);
const storageKey = 'nemuhape-demo-v1';
let state = {cart:{},favorites:[]};
try {
 const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
 if(saved && typeof saved==='object') {
  for(const [id,q] of Object.entries(saved.cart||{})) { const p=findProduct(id); if(p && Number.isInteger(q) && q>0 && q<=p.pack*999 && q%p.pack===0) state.cart[id]=q; }
  if(Array.isArray(saved.favorites)) state.favorites=[...new Set(saved.favorites.filter(id=>findProduct(id)))];
 }
} catch (_) {}
let category='Todos', favoritesOnly=false, term='', toastTimer;
function save(){ try{ localStorage.setItem(storageKey,JSON.stringify(state)); }catch(_){ } }
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2600);}
function openDialog(id){const d=document.getElementById(id);if(!d.open)d.showModal();}
function closeDialog(id){document.getElementById(id).close();}
function normalize(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function lines(){return Object.entries(state.cart).map(([id,qty])=>({product:findProduct(id),qty}));}
function total(){return lines().reduce((s,{product:p,qty})=>s+p.price*qty,0);}
function renderProducts(){
 let list=products.filter(p=>(category==='Todos'||p.category===category)&&(!favoritesOnly||state.favorites.includes(p.id))&&normalize(p.name+' '+p.category+' '+p.id).includes(normalize(term)));
 const sort=$('#sort').value;
 if(sort==='low')list.sort((a,b)=>a.price-b.price);else if(sort==='high')list.sort((a,b)=>b.price-a.price);else if(sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name,'es'));else list.sort((a,b)=>Number(b.featured)-Number(a.featured));
 $('#catalog-title').textContent=favoritesOnly?'Tus favoritos':'Nuestro catálogo';
 $('#result-count').textContent=`${list.length} producto${list.length===1?'':'s'}${term?' · Búsqueda: “'+term+'”':''}`;
 $('#clear-filters').hidden=category==='Todos'&&!term&&!favoritesOnly;
 $('[data-category="Todos"]').parentElement.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.category===category);b.setAttribute('aria-pressed',String(b.dataset.category===category));});
 $('#favorites-button').setAttribute('aria-pressed',String(favoritesOnly));
 $('#product-grid').innerHTML=list.length?list.map(p=>`<article class="product-card"><div class="product-image"><button class="image-button" data-detail="${p.id}" aria-label="Ver ${escapeHTML(p.name)}"><img src="${p.image}" alt="${escapeHTML(p.name)}" loading="lazy"></button>${p.featured?'<span class="product-badge">DESTACADO</span>':''}<button class="favorite ${state.favorites.includes(p.id)?'selected':''}" data-favorite="${p.id}" aria-label="${state.favorites.includes(p.id)?'Quitar de':'Agregar a'} favoritos: ${escapeHTML(p.name)}" aria-pressed="${state.favorites.includes(p.id)}">${state.favorites.includes(p.id)?'♥':'♡'}</button></div><div class="product-body"><p class="product-category">${escapeHTML(p.category)}</p><button class="product-name" data-detail="${p.id}">${escapeHTML(p.name)}</button><div class="price">${money(p.price)} <span class="unit">/ unidad</span></div><p class="pack-note">Pack de ${p.pack} unidades · ${money(p.price*p.pack)}</p><button class="add-button" data-add="${p.id}"><span aria-hidden="true">＋</span> Agregar 1 pack</button></div></article>`).join(''):'<div class="empty-state"><h3>No encontramos productos</h3><p>Probá otra búsqueda o cambiá la categoría.</p></div>';
}
function renderCount(){const count=lines().reduce((s,{product:p,qty})=>s+qty/p.pack,0);$('#cart-count').textContent=count;$('#cart-button').setAttribute('aria-label',`Abrir pedido: ${count} packs`);}
function add(id){const p=findProduct(id);if(!p)return;if((state.cart[id]||0)>=p.pack*999)return toast('Alcanzaste el máximo de packs para este artículo.');state.cart[id]=(state.cart[id]||0)+p.pack;save();renderCount();renderCart();toast(`Agregaste un pack de ${p.name.toLowerCase()}`);}
function toggleFavorite(id){if(!findProduct(id))return;state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];save();renderProducts();}
function detail(id){const p=findProduct(id);if(!p)return;$('#product-detail').innerHTML=`<div class="detail-layout"><img src="${p.image}" alt="${escapeHTML(p.name)}"><div><p class="product-category">${escapeHTML(p.category)}</p><h2>${escapeHTML(p.name)}</h2><p class="detail-id">Código: ${p.id}</p><p class="description">${escapeHTML(p.description)}</p><div class="price">${money(p.price)} <span class="unit">por unidad</span></div><p class="pack-note">Venta por pack de ${p.pack} unidades.<br>Total por pack: <strong>${money(p.price*p.pack)}</strong></p><button class="primary" data-add="${p.id}">Agregar 1 pack al pedido</button><p class="fine-print">Precio de ejemplo. Disponibilidad a confirmar con la tienda.</p></div></div>`;openDialog('product-dialog');}
function renderCart(){const list=lines();$('#cart-lines').textContent=`(${list.length})`;
 $('#cart-items').innerHTML=list.length?list.map(({product:p,qty})=>`<div class="cart-item"><img src="${p.image}" alt="${escapeHTML(p.name)}"><div><h3>${escapeHTML(p.name)}</h3><p>${money(p.price)} / unidad · Pack de ${p.pack}</p><div class="qty-control"><button data-qty="${p.id}" data-step="-1" ${qty===p.pack?'disabled':''} aria-label="Restar un pack de ${escapeHTML(p.name)}">−</button><span>${qty/p.pack} pack${qty/p.pack===1?'':'s'} · ${qty} un.</span><button data-qty="${p.id}" data-step="1" ${qty===p.pack*999?'disabled':''} aria-label="Sumar un pack de ${escapeHTML(p.name)}">+</button></div></div><div class="cart-item-total">${money(p.price*qty)}<button class="remove" data-remove="${p.id}">Eliminar</button></div></div>`).join(''):'<div class="cart-empty"><h3>Tu próximo surtido te espera</h3><p>Elegí productos y agregá packs para armar tu pedido.</p><button class="primary" id="back-catalog">Explorar catálogo</button></div>';
 const unitCount=list.reduce((s,x)=>s+x.qty,0), min=Number(config.pedidoMinimo)||0, meets=total()>=min;
 $('#cart-summary').innerHTML=list.length?`<div class="cart-summary"><div class="summary-row"><span>Total estimado<small>${unitCount} unidades · ${list.length} artículos</small></span><span>${money(total())}</span></div>${min?`<p class="pack-note">Pedido mínimo: ${money(min)}${!meets?' · Te faltan '+money(min-total()):''}</p>`:''}<p class="demo-note">${config.demo?'Demo: productos, precios y packs de ejemplo. ':''}Stock y costo de entrega a confirmar.</p><button class="primary" id="checkout-button" ${!meets?'disabled':''}>Revisar y preparar pedido</button></div>`:'';
}
function changeQuantity(id,step){const p=findProduct(id);if(!p||!state.cart[id])return;state.cart[id]=Math.min(p.pack*999,Math.max(p.pack,state.cart[id]+step*p.pack));save();renderCount();renderCart();}
function remove(id){delete state.cart[id];save();renderCount();renderCart();}
function orderText(){const name=$('#customer-name').value.trim(),notes=$('#customer-notes').value.trim();return `${config.demo?'[DEMO · SIN CONFIRMACIÓN DE COMPRA]\n\n':''}Hola, Ñemũhape. Quisiera consultar este pedido mayorista.${name?'\nNombre o negocio: '+name:''}\n\n`+lines().map(({product:p,qty})=>`• ${p.name} (${p.id})\n  ${qty/p.pack} pack(s) × ${p.pack} un. = ${qty} unidades\n  ${money(p.price)} por unidad · ${money(p.price*qty)}`).join('\n\n')+`\n\nTOTAL ESTIMADO: ${money(total())}${notes?'\n\nComentarios: '+notes:''}\n\n¿Podrían confirmar disponibilidad, condiciones de pago y entrega?`;}
function updatePreview(){$('#order-preview').value=orderText();}
function validWhatsapp(){return /^\d{8,15}$/.test(String(config.whatsapp));}
function checkout(){if(!lines().length)return;if(total()<(Number(config.pedidoMinimo)||0))return;closeDialog('cart-dialog');updatePreview();$('#send-order').disabled=!validWhatsapp();$('#checkout-note').textContent=!validWhatsapp()?'El WhatsApp de la tienda está pendiente de configurar. Para esta demo, podés copiar el pedido.':config.demo?'Demo: el mensaje incluye una aclaración de prueba.':'Revisá los datos antes de abrir WhatsApp.';openDialog('checkout-dialog');}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.close)return closeDialog(b.dataset.close);
 if(b.dataset.add)return add(b.dataset.add);
 if(b.dataset.detail)return detail(b.dataset.detail);
 if(b.dataset.favorite)return toggleFavorite(b.dataset.favorite);
 if(b.dataset.qty)return changeQuantity(b.dataset.qty,Number(b.dataset.step));
 if(b.dataset.remove)return remove(b.dataset.remove);
 if(b.dataset.category){category=b.dataset.category;favoritesOnly=false;renderProducts();return;}
 if(b.dataset.collection){category=b.dataset.collection;favoritesOnly=false;term='';$('#search').value='';renderProducts();$('#catalogo').scrollIntoView();return;}
 if(['cart-button','banner-cart','footer-cart'].includes(b.id)){renderCart();return openDialog('cart-dialog');}
 if(b.id==='favorites-button'){favoritesOnly=!favoritesOnly;category='Todos';term='';$('#search').value='';renderProducts();$('#catalogo').scrollIntoView();return;}
 if(b.id==='clear-filters'){category='Todos';term='';favoritesOnly=false;$('#search').value='';$('#sort').value='featured';renderProducts();return;}
 if(b.id==='back-catalog'){closeDialog('cart-dialog');$('#catalogo').scrollIntoView();return;}
 if(b.id==='checkout-button')return checkout();
 if(b.id==='contact-button'){if(validWhatsapp())window.open(`https://wa.me/${config.whatsapp}?text=${encodeURIComponent('Hola, Ñemũhape. Quisiera información sobre compras mayoristas.')}`,'_blank','noopener,noreferrer');else openDialog('notice-dialog');return;}
 if(b.id==='send-order'&&validWhatsapp()&&lines().length)window.open(`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(orderText())}`,'_blank','noopener,noreferrer');
 if(b.id==='copy-order')copyOrder();
});
async function copyOrder(){const text=orderText();try{await navigator.clipboard.writeText(text);toast('Pedido copiado.');}catch(_){const field=$('#order-preview');field.focus();field.select();try{if(document.execCommand('copy'))toast('Pedido copiado.');else toast('Seleccioná y copiá el mensaje del pedido.');}catch(_){toast('Seleccioná y copiá el mensaje del pedido.');}}}
$('#search-form').addEventListener('submit',e=>{e.preventDefault();term=$('#search').value.trim();favoritesOnly=false;renderProducts();$('#catalogo').scrollIntoView();});
$('#search').addEventListener('input',()=>{term=$('#search').value.trim();renderProducts();});
$('#sort').addEventListener('change',renderProducts);
$('#customer-name').addEventListener('input',updatePreview);$('#customer-notes').addEventListener('input',updatePreview);
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$('#year').textContent=new Date().getFullYear();$('#contact-text').textContent=config.contacto;
renderProducts();renderCount();renderCart();
