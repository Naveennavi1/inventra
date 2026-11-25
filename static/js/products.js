let productsCache=[], categoriesCache=[], suppliersCache=[], currentFilter="all", productModal;
document.addEventListener("DOMContentLoaded", async () => {
  productModal = new bootstrap.Modal(document.getElementById("productModal"));
  document.getElementById("addProductBtn").addEventListener("click", openCreateModal);
  document.getElementById("productForm").addEventListener("submit", saveProduct);
  document.getElementById("productSearch").addEventListener("input", renderProducts);
  document.getElementById("refreshProducts").addEventListener("click", loadProducts);
  document.getElementById("productsRefreshBottom").addEventListener("click", loadProducts);
  document.querySelectorAll("#productFilters button").forEach(btn => btn.addEventListener("click",()=>{
    document.querySelectorAll("#productFilters button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active"); currentFilter=btn.dataset.filter; renderProducts();
  }));
  await Promise.all([loadLookups(),loadProducts()]);
});
async function loadLookups(){
  try {
    [categoriesCache,suppliersCache]=await Promise.all([API.get("/categories/"),API.get("/suppliers/")]);
    document.getElementById("productCategory").innerHTML='<option value="">Select category</option>'+categoriesCache.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("");
    document.getElementById("productSupplier").innerHTML='<option value="">Select supplier</option>'+suppliersCache.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("");
  } catch(e){showToast("Could not load categories or suppliers: "+e.message,"error");}
}
async function loadProducts(){
  const body=document.getElementById("productsTable"); body.innerHTML='<tr><td colspan="7" class="text-center py-5 muted">Loading products...</td></tr>';
  try { productsCache=await API.get("/products/"); renderProducts(); }
  catch(e){body.innerHTML=`<tr><td colspan="7" class="text-center py-5 text-danger">${esc(e.message)}</td></tr>`;}
}
function renderProducts(){
  const query=document.getElementById("productSearch").value.toLowerCase().trim();
  const filtered=productsCache.filter(p=>{
    const name=(p.name||"").toLowerCase(), barcode=(p.barcode||"").toLowerCase();
    if(query && !name.includes(query) && !barcode.includes(query)) return false;
    const qty=p.inventory?.quantity ?? p.quantity ?? null, level=p.inventory?.reorder_level ?? p.reorder_level ?? null;
    if(currentFilter==="out") return qty===0;
    if(currentFilter==="low") return qty!==null && level!==null && qty>0 && qty<=level;
    if(currentFilter==="instock") return qty!==null && (level===null || qty>level);
    return true;
  });
  const body=document.getElementById("productsTable");
  if(!filtered.length){body.innerHTML='<tr><td colspan="7" class="text-center py-5 muted">No products match your search.</td></tr>';}
  else body.innerHTML=filtered.map(p=>{
    const qty=p.inventory?.quantity ?? p.quantity ?? null, level=p.inventory?.reorder_level ?? p.reorder_level ?? null;
    let status='<span class="status-pill status-in">Not tracked</span>';
    if(qty===0) status='<span class="status-pill status-out">Out of stock</span>';
    else if(qty!==null && level!==null && qty<=level) status='<span class="status-pill status-low">Low stock</span>';
    else if(qty!==null) status='<span class="status-pill status-in">In stock</span>';
    const category=categoriesCache.find(c=>c.id===p.category_id)?.name || p.category?.name || `#${p.category_id}`;
    const supplier=suppliersCache.find(s=>s.id===p.supplier_id)?.name || p.supplier?.name || `#${p.supplier_id}`;
    return `<tr><td><strong>${esc(p.name)}</strong><div class="muted">${esc(p.barcode||"No barcode")}</div></td><td>${esc(category)}</td><td>₹${Number(p.price).toFixed(2)}</td><td>${esc(supplier)}</td><td>${qty===null?"—":qty}</td><td>${status}</td><td class="text-end"><button class="action-btn" title="Edit" onclick="editProduct(${p.id})"><i class="bi bi-pencil"></i></button><button class="action-btn delete" title="Delete" onclick="deleteProduct(${p.id})"><i class="bi bi-trash3"></i></button></td></tr>`;
  }).join("");
  document.getElementById("productCount").textContent=`Showing ${filtered.length} of ${productsCache.length} products`;
}
function openCreateModal(){
  document.getElementById("productForm").reset();document.getElementById("productId").value="";
  document.getElementById("productModalTitle").textContent="Add product";document.getElementById("productFormError").textContent="";
  productModal.show();
}
function editProduct(id){
  const p=productsCache.find(x=>x.id===id);if(!p)return;
  document.getElementById("productId").value=p.id;document.getElementById("productName").value=p.name||"";
  document.getElementById("productBarcode").value=p.barcode||"";document.getElementById("productPrice").value=p.price;
  document.getElementById("productCategory").value=p.category_id;document.getElementById("productSupplier").value=p.supplier_id;
  document.getElementById("productDescription").value=p.description||"";
  document.getElementById("productModalTitle").textContent="Edit product";document.getElementById("productFormError").textContent="";
  productModal.show();
}
async function saveProduct(event){
  event.preventDefault();const id=document.getElementById("productId").value;
  const payload={name:document.getElementById("productName").value.trim(),barcode:document.getElementById("productBarcode").value.trim()||null,description:document.getElementById("productDescription").value.trim()||null,price:Number(document.getElementById("productPrice").value),category_id:Number(document.getElementById("productCategory").value),supplier_id:Number(document.getElementById("productSupplier").value)};
  const error=document.getElementById("productFormError");error.textContent="";
  try{if(id)await API.put(`/products/${id}`,payload);else await API.post("/products/",payload);productModal.hide();showToast(id?"Product updated.":"Product created.");await loadProducts();}
  catch(e){error.textContent=e.message;}
}
async function deleteProduct(id){
  const p=productsCache.find(x=>x.id===id);if(!p)return;
  if(!confirm(`Delete "${p.name}"? This cannot be undone.`))return;
  try{await API.delete(`/products/${id}`);showToast("Product deleted.");await loadProducts();}
  catch(e){showToast(e.message,"error");}
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
