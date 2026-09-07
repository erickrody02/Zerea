import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Plus, Minus, Trash2, X, Upload, Lock, Loader2, Check } from 'lucide-react';

const STORE_PHONE = '526271494917'; // 52 (México) + 6271494917 — ajusta aquí si el número no es correcto
const ADMIN_PASSCODE = 'ZEREA2026'; // cámbiala por la que prefieras

const C = {
  base: '#9C6C46',
  dark: '#7A4F30',
  light: '#E3BE97',
  cream: '#FBF7EF',
  creamDeep: '#F1E6D4',
  ink: '#5C4632',
};

function formatPrice(n) {
  const num = Number(n) || 0;
  return '$' + num.toLocaleString('es-MX', { maximumFractionDigits: 0 }) + ' MXN';
}

export default function Catalogo() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState(false);
  const [cart, setCart] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState('');
  const [form, setForm] = useState({ name: '', price: '', image: null });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [processingImg, setProcessingImg] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setStorageError(false);
    try {
      const res = await window.storage.get('products', true);
      setProducts(res && res.value ? JSON.parse(res.value) : []);
    } catch (e) {
      setProducts([]);
    }
    setLoading(false);
  }

  async function saveProducts(next) {
    const prev = products;
    setProducts(next);
    try {
      const res = await window.storage.set('products', JSON.stringify(next), true);
      if (!res) throw new Error('no result');
    } catch (e) {
      setProducts(prev);
      setFormError('No se pudo guardar. Intenta con una foto más ligera o revisa tu conexión.');
    }
  }

  function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setProcessingImg(true);
    setFormError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 640;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setForm((f) => ({ ...f, image: dataUrl }));
        setProcessingImg(false);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function addProduct() {
    if (!form.name.trim() || !form.price || Number(form.price) <= 0 || !form.image) {
      setFormError('Agrega nombre, precio y una foto antes de guardar.');
      return;
    }
    setSaving(true);
    const next = [
      ...products,
      {
        id: Date.now().toString(),
        name: form.name.trim(),
        price: Number(form.price),
        image: form.image,
      },
    ];
    await saveProducts(next);
    setForm({ name: '', price: '', image: null });
    if (fileRef.current) fileRef.current.value = '';
    setSaving(false);
  }

  async function removeProduct(id) {
    const next = products.filter((p) => p.id !== id);
    await saveProducts(next);
  }

  async function clearCatalog() {
    if (window.confirm('¿Seguro que quieres borrar todo el catálogo? Esta acción no se puede deshacer.')) {
      await saveProducts([]);
    }
  }

  function addToCart(id) {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  }
  function decFromCart(id) {
    setCart((c) => {
      const q = (c[id] || 0) - 1;
      const next = { ...c };
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
  }
  function removeFromCart(id) {
    setCart((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });
  }

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const p = products.find((p) => p.id === id);
      return p ? { ...p, qty } : null;
    })
    .filter(Boolean);

  const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  function sendOrder() {
    if (cartItems.length === 0) return;
    const lines = ['Hola, quiero hacer un pedido de Zeréa Jewelry:', ''];
    cartItems.forEach((i) => {
      lines.push(`• ${i.name} x${i.qty} — ${formatPrice(i.price * i.qty)}`);
    });
    lines.push('');
    lines.push(`Total: ${formatPrice(total)}`);
    const url = `https://wa.me/${STORE_PHONE}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank');
  }

  function checkPasscode() {
    if (passInput === ADMIN_PASSCODE) {
      setAdminUnlocked(true);
      setPassError('');
    } else {
      setPassError('Contraseña incorrecta.');
    }
  }

  return (
    <div className="min-h-screen w-full" style={{ background: C.creamDeep, fontFamily: "'Jost', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Beau+Rivage&family=Jost:wght@300;400;500;600&display=swap');
      `}</style>

      <header className="sticky top-0 z-20 border-b" style={{ background: C.cream, borderColor: C.light }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span style={{ fontFamily: "'Beau Rivage', cursive", fontSize: '34px', color: C.base, lineHeight: 1 }}>
              Zeréa
            </span>
            <span className="text-xs tracking-widest" style={{ color: C.base, letterSpacing: '3px' }}>
              JEWELRY
            </span>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 px-3 py-2 rounded-full border"
            style={{ borderColor: C.light, color: C.dark }}
          >
            <ShoppingBag size={18} />
            <span className="text-sm">Carrito</span>
            {cartCount > 0 && (
              <span
                className="absolute -top-1 -right-1 text-xs w-5 h-5 rounded-full flex items-center justify-center text-white"
                style={{ background: C.base }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20" style={{ color: C.dark }}>
            <Loader2 className="animate-spin mr-2" size={20} /> Cargando catálogo...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg" style={{ color: C.ink }}>
              Aún no hay productos en el catálogo.
            </p>
            <p className="text-sm mt-2" style={{ color: C.dark }}>
              Toca "Agregar producto" abajo para subir la primera pieza.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {products.map((p) => {
              const qty = cart[p.id] || 0;
              return (
                <div
                  key={p.id}
                  className="rounded-2xl overflow-hidden bg-white border flex flex-col"
                  style={{ borderColor: C.light }}
                >
                  <div className="aspect-square" style={{ background: C.creamDeep }}>
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <p className="text-sm font-medium leading-snug" style={{ color: C.ink }}>
                      {p.name}
                    </p>
                    <p className="text-sm" style={{ color: C.base }}>
                      {formatPrice(p.price)}
                    </p>
                    <div className="mt-auto">
                      {qty === 0 ? (
                        <button
                          onClick={() => addToCart(p.id)}
                          className="w-full text-sm py-2 rounded-full border"
                          style={{ borderColor: C.base, color: C.dark }}
                        >
                          Agregar
                        </button>
                      ) : (
                        <div
                          className="flex items-center justify-between rounded-full border px-2 py-1"
                          style={{ borderColor: C.base }}
                        >
                          <button onClick={() => decFromCart(p.id)} style={{ color: C.dark }}>
                            <Minus size={16} />
                          </button>
                          <span className="text-sm" style={{ color: C.ink }}>
                            {qty}
                          </span>
                          <button onClick={() => addToCart(p.id)} style={{ color: C.dark }}>
                            <Plus size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    {adminUnlocked && (
                      <button
                        onClick={() => removeProduct(p.id)}
                        className="text-xs flex items-center gap-1 justify-center mt-1"
                        style={{ color: '#a33' }}
                      >
                        <Trash2 size={13} /> Quitar del catálogo
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 border-t pt-6" style={{ borderColor: C.light }}>
          {!showAdmin ? (
            <button
              onClick={() => setShowAdmin(true)}
              className="text-sm flex items-center gap-1"
              style={{ color: C.dark }}
            >
              <Lock size={14} /> ¿Eres la tienda? Agregar producto
            </button>
          ) : !adminUnlocked ? (
            <div className="max-w-xs">
              <p className="text-sm mb-2" style={{ color: C.ink }}>
                Ingresa la contraseña de administrador:
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: C.light }}
                  placeholder="Contraseña"
                />
                <button
                  onClick={checkPasscode}
                  className="px-3 py-2 rounded-lg text-sm text-white"
                  style={{ background: C.base }}
                >
                  Entrar
                </button>
              </div>
              {passError && <p className="text-xs mt-1" style={{ color: '#a33' }}>{passError}</p>}
            </div>
          ) : (
            <div className="rounded-2xl border p-4 max-w-md" style={{ borderColor: C.light, background: C.cream }}>
              <p className="text-sm font-medium mb-3" style={{ color: C.ink }}>
                Agregar nuevo producto
              </p>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Nombre del artículo"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: C.light }}
                />
                <input
                  type="number"
                  placeholder="Precio (MXN)"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: C.light }}
                />
                <label
                  className="flex items-center justify-center gap-2 border rounded-lg px-3 py-3 text-sm cursor-pointer"
                  style={{ borderColor: C.light, color: C.dark }}
                >
                  <Upload size={16} />
                  {processingImg ? 'Procesando foto...' : form.image ? 'Cambiar foto' : 'Subir foto'}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                </label>
                {form.image && (
                  <img src={form.image} alt="preview" className="w-24 h-24 object-cover rounded-lg self-center" />
                )}
                {formError && <p className="text-xs" style={{ color: '#a33' }}>{formError}</p>}
                <button
                  onClick={addProduct}
                  disabled={saving || processingImg}
                  className="rounded-lg px-3 py-2 text-sm text-white flex items-center justify-center gap-2"
                  style={{ background: C.base, opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  Guardar producto
                </button>
              </div>
              {products.length > 0 && (
                <button onClick={clearCatalog} className="text-xs mt-4" style={{ color: '#a33' }}>
                  Vaciar todo el catálogo
                </button>
              )}
              {storageError && (
                <p className="text-xs mt-2" style={{ color: '#a33' }}>
                  Hubo un problema leyendo el catálogo guardado.
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      {showCart && (
        <div className="fixed inset-0 z-30 flex justify-end" style={{ background: 'rgba(60,40,20,0.35)' }}>
          <div className="w-full max-w-sm h-full bg-white flex flex-col" style={{ background: C.cream }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.light }}>
              <p className="font-medium" style={{ color: C.ink }}>
                Tu pedido
              </p>
              <button onClick={() => setShowCart(false)} style={{ color: C.dark }}>
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {cartItems.length === 0 ? (
                <p className="text-sm mt-6 text-center" style={{ color: C.dark }}>
                  Tu carrito está vacío.
                </p>
              ) : (
                cartItems.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 py-3 border-b" style={{ borderColor: C.light }}>
                    <img src={i.image} alt={i.name} className="w-14 h-14 object-cover rounded-lg" />
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: C.ink }}>
                        {i.name}
                      </p>
                      <p className="text-xs" style={{ color: C.base }}>
                        {i.qty} x {formatPrice(i.price)}
                      </p>
                    </div>
                    <button onClick={() => removeFromCart(i.id)} style={{ color: '#a33' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-4 border-t" style={{ borderColor: C.light }}>
              <div className="flex justify-between mb-3">
                <span className="text-sm" style={{ color: C.ink }}>
                  Total
                </span>
                <span className="text-base font-medium" style={{ color: C.dark }}>
                  {formatPrice(total)}
                </span>
              </div>
              <button
                onClick={sendOrder}
                disabled={cartItems.length === 0}
                className="w-full rounded-full py-3 text-sm text-white"
                style={{ background: cartItems.length === 0 ? '#bbb' : '#25D366' }}
              >
                Enviar pedido por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
