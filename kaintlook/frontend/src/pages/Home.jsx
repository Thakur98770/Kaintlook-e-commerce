// FILE PATH: kaintlook-auth/frontend/src/pages/Home.jsx
// Replace the existing file at this path with the contents below.

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, Sun, Moon, Phone, User, Package, ChevronRight, Star } from "lucide-react";
import { getProductSuggestions, searchProducts, getCategories, getCart, addToCart as apiAddToCart, addToWishlist, removeFromWishlist, getWishlist, getProduct } from "../api/shop";
import { useAuth } from "../context/AuthContext";
import Seo, { siteUrl, siteName } from "../components/Seo";

const CATEGORIES = [
  { name: "Kurtas", seed: "cat1" },
  { name: "Phulkari", seed: "cat2" },
  { name: "Denim", seed: "cat3" },
  { name: "Dupattas", seed: "cat4" },
  { name: "Footwear", seed: "cat5" },
  { name: "Jewellery", seed: "cat6" },
  { name: "Bags", seed: "cat7" },
  { name: "Sale", seed: "cat8" },
];

const NAV = ["Home", "New Arrival", "Kurtas", "Phulkari", "Denim", "Dupattas", "Footwear", "Sale"];
const navTarget = (name) => {
  if (name === "Home") return "/";
  if (name === "New Arrival") return "/shop?tag=New";
  if (name === "Sale") return "/shop?tag=Sale";
  return `/shop?category=${encodeURIComponent(name)}`;
};
const SHOP_SECTIONS = [
  { name: "Men", seed: "men-fashion", options: ["T-Shirts", "Shirts", "Jeans", "Trousers", "Footwear"] },
  { name: "Women", seed: "women-fashion", options: ["Tops", "Dresses", "Kurtas", "Jeans", "Footwear"] },
  { name: "Children", seed: "children-fashion", options: ["T-Shirts", "Dresses", "Jeans", "Sets", "Footwear"] },
];

function ProductCard({ p, theme, accent, onAddToCart, onToggleWishlist, isWishlisted }) {
  return (
    <div style={{ background: theme.panel, border: `1px solid ${theme.line}`, borderRadius: 10, overflow: "hidden" }}>
      <Link to={`/products/${p._id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div style={{ position: "relative" }}>
          <img
            src={p.images?.[0] || `https://picsum.photos/seed/${p._id}/400/400`}
            alt={p.name}
            loading="lazy"
            decoding="async"
            style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }}
          />
          <button
            onClick={(e) => { e.preventDefault(); onToggleWishlist(p._id); }}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            style={{ position: "absolute", top: 8, right: 8, background: "#fff", border: "none", borderRadius: 999, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,.15)" }}
          >
            <Heart size={13} color={isWishlisted ? "#E0475C" : "#999"} fill={isWishlisted ? "#E0475C" : "none"} />
          </button>
        </div>
        <div style={{ padding: "10px 12px 6px" }}>
          <span className="kl-mono" style={{ fontSize: 10, color: theme.sub }}>{p.category}</span>
          <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: "3px 0 6px", color: theme.text, lineHeight: 1.3 }}>{p.name}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
            <Star size={11} fill={accent} color={accent} />
            <span style={{ fontSize: 11, color: theme.sub }}>{p.rating?.toFixed(1) || "0.0"}</span>
          </div>
          <span className="kl-mono" style={{ fontSize: 15, color: accent, fontWeight: 600 }}>₹{p.price}</span>
        </div>
      </Link>
      <div style={{ padding: "0 12px 12px" }}>
        <button
          onClick={() => onAddToCart(p._id)}
          disabled={p.stock === 0}
          style={{ width: "100%", background: p.stock === 0 ? "#ccc" : theme.text, color: theme.bg, border: "none", borderRadius: 6, padding: "7px 0", fontSize: 12, fontWeight: 600, cursor: p.stock === 0 ? "not-allowed" : "pointer" }}
        >
          {p.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [status, setStatus] = useState("");
  const [newArrivals, setNewArrivals] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(() => new Set());
  const searchBoxRef = useRef(null);
  const accountBoxRef = useRef(null);

  const theme = dark
    ? { bg: "#15161B", panel: "#1D1F25", text: "#F2F1ED", sub: "#9C998F", line: "#2C2E35" }
    : { bg: "#FFFFFF", panel: "#FFFFFF", text: "#1B1B1B", sub: "#767676", line: "#E7E5DF" };

  const accent = "#2575FC";
  const wine = "#7A2E2E";

  const catalogProducts = [...newArrivals, ...trending].filter((product, index, products) =>
    products.findIndex((item) => item._id === product._id) === index
  );
  const categorySections = SHOP_SECTIONS.map((section) => {
    const sectionProducts = catalogProducts.filter((product) => product.category === section.name);
    if (sectionProducts.length === 0) return null;
    const productOptions = sectionProducts.map((product) => product.subcategory).filter(Boolean);
    const databaseOptions = categories
      .filter((category) => category.parentCategory === section.name && productOptions.includes(category.name))
      .map((category) => category.name);
    const options = [...new Set([...databaseOptions, ...productOptions])];
    return { ...section, options: options.length ? options : section.options };
  }).filter(Boolean);

  // Load real products from the database
  useEffect(() => {
    getCategories().then((items) => {
      if (items.length > 0) setCategories(items);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingProducts(true);
    Promise.all([
      searchProducts({ limit: 10 }), // default sort = newest first
      searchProducts({ sort: "rating", limit: 6 }),
    ])
      .then(([newRes, trendRes]) => {
        setNewArrivals(newRes.products || []);
        setTrending(trendRes.products || []);
        setCategories((current) => {
          if (current !== CATEGORIES) return current;
          const names = [...(newRes.products || []), ...(trendRes.products || [])]
            .map((product) => product.category)
            .filter(Boolean)
            .filter((name, index, values) => values.indexOf(name) === index)
            .slice(0, 8);
          return names.map((name) => ({ name, seed: name }));
        });
      })
      .catch(() => setStatus("Products are temporarily unavailable. Please try again."))
      .finally(() => setLoadingProducts(false));
  }, []);

  // Recently viewed - tracked client-side in localStorage by ProductDetail
  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem("kaintlook_recently_viewed") || "[]");
      if (ids.length === 0) return;
      Promise.all(ids.slice(0, 6).map((pid) => getProduct(pid).catch(() => null)))
        .then((results) => setRecentlyViewed(results.filter(Boolean)));
    } catch {
      // localStorage unavailable — just skip this section
    }
  }, []);

  // Debounced live search suggestions
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      getProductSuggestions(query).then(setSuggestions).catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) setShowSuggestions(false);
      if (accountBoxRef.current && !accountBoxRef.current.contains(e.target)) setShowAccountMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load the logged-in user's wishlist product IDs so hearts render filled
  // for products already saved (Amazon/Flipkart-style).
  useEffect(() => {
    if (!user) {
      setWishlistIds(new Set());
      return;
    }
    getWishlist()
      .then((w) => setWishlistIds(new Set((w.products || []).map((p) => p._id))))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCartCount(0);
      return;
    }
    getCart().then((cart) => setCartCount((cart.items || []).reduce((count, item) => count + item.quantity, 0))).catch(() => {});
  }, [user]);

  const handleLogout = () => {
    logout();
    setShowAccountMenu(false);
    navigate("/");
  };

  const goToSearch = (q) => {
    setShowSuggestions(false);
    navigate(`/shop?q=${encodeURIComponent(q)}`);
  };

  const handleAddToCart = async (productId) => {
    if (!user) return navigate("/login");
    setStatus("Adding…");
    try {
      const cart = await apiAddToCart(productId, 1);
      setCartCount((cart.items || []).reduce((count, item) => count + item.quantity, 0));
      setStatus("Added to cart");
    } catch (err) {
      setStatus(err.message);
    }
  };

  const handleToggleWishlist = async (productId) => {
    if (!user) return navigate("/login");
    const alreadySaved = wishlistIds.has(productId);
    try {
      if (alreadySaved) {
        await removeFromWishlist(productId);
        setWishlistIds((prev) => { const next = new Set(prev); next.delete(productId); return next; });
        setStatus("Removed from wishlist");
      } else {
        await addToWishlist(productId);
        setWishlistIds((prev) => new Set(prev).add(productId));
        setStatus("Added to wishlist");
      }
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: "100vh", fontFamily: "'Work Sans','Inter',sans-serif" }}>
      <Seo
        title={`${siteName} | Handstitched fashion for every day`}
        description="Shop KaintLook fashion, including clothing, footwear, and accessories available from the current collection."
        path="/"
        jsonLd={{ "@context": "https://schema.org", "@type": "WebSite", name: siteName, url: siteUrl, potentialAction: { "@type": "SearchAction", target: `${siteUrl}/shop?q={search_term_string}`, "query-input": "required name=search_term_string" } }}
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Work+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .kl-serif { font-family: 'Fraunces', serif; }
        .kl-mono { font-family: 'JetBrains Mono', monospace; }
        .kl-navlink { transition: color .15s ease; cursor: pointer; }
        .kl-navlink:hover { color: ${accent} !important; }
        .kl-icon-btn { transition: opacity .15s ease; cursor: pointer; background:none; border:none; }
        .kl-icon-btn:hover { opacity: .7; }
        .kl-cat-item { transition: transform .2s ease; cursor: pointer; }
        .kl-cat-item:hover { transform: translateY(-3px); }
        @media (max-width: 640px) { .kl-home-product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; } .kl-home-product-grid h3 { font-size: 12px !important; } .kl-home-product-grid > div > div:last-child { padding-left: 8px !important; padding-right: 8px !important; } }
        input:focus, button:focus-visible { outline: 2px solid ${accent}; outline-offset: 2px; }
        @media (max-width: 640px) {
          .kl-header-inner { flex-wrap: wrap; gap: 12px !important; padding: 12px 14px !important; }
          .kl-search-box { order: 3; flex-basis: 100%; max-width: none !important; }
          .kl-header-actions { gap: 12px !important; }
          .kl-header-label { display: none; }
          .kl-footer-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>

      <div style={{ background: "#1B1B1B", color: "#F2F1ED", textAlign: "center", fontSize: 12, padding: "7px 0", letterSpacing: 0.3 }}>
        Free shipping on all orders above ₹1999
      </div>

      <header style={{ borderBottom: `1px solid ${theme.line}`, position: "sticky", top: 0, zIndex: 30, background: theme.bg }}>
        <div className="kl-header-inner" style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          <Link to="/" className="kl-serif" style={{ fontSize: 24, fontWeight: 700, letterSpacing: 0.2, textDecoration: "none", color: theme.text }}>
            Kaint<span style={{ color: accent }}>Look</span>
          </Link>

          <div ref={searchBoxRef} className="kl-search-box" style={{ position: "relative", flex: 1, maxWidth: 420 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${theme.line}`, borderRadius: 6, padding: "8px 12px" }}>
              <Search size={15} color={theme.sub} style={{ cursor: "pointer" }} onClick={() => query.trim() && goToSearch(query)} />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => e.key === "Enter" && query.trim() && goToSearch(query)}
                placeholder="Search products…"
                style={{ border: "none", outline: "none", fontSize: 13, width: "100%", background: "transparent", color: theme.text }}
              />
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: "absolute", top: "110%", left: 0, right: 0, background: theme.panel, border: `1px solid ${theme.line}`, borderRadius: 8, boxShadow: "0 6px 20px rgba(0,0,0,.08)", zIndex: 40, overflow: "hidden" }}>
                {suggestions.map((s) => (
                  <div
                    key={s._id}
                    onClick={() => navigate(`/products/${s._id}`)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer" }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <img src={s.images?.[0] || `https://picsum.photos/seed/${s._id}/60/60`} alt={s.name} loading="lazy" decoding="async" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5 }}>{s.name}</div>
                      <div style={{ fontSize: 10.5, color: theme.sub }}>{s.category}</div>
                    </div>
                    <span style={{ fontSize: 12, color: accent, fontWeight: 600 }}>₹{s.price}</span>
                  </div>
                ))}
                <div
                  onClick={() => goToSearch(query)}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{ padding: "8px 12px", fontSize: 12, color: accent, cursor: "pointer", borderTop: `1px solid ${theme.line}` }}
                >
                  See all results for "{query}"
                </div>
              </div>
            )}
          </div>

          <div className="kl-header-actions" style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 12.5 }}>
            <a href="tel:+910000000000" style={{ display: "flex", alignItems: "center", gap: 6, color: theme.text, textDecoration: "none" }}>
              <Phone size={16} /> <span className="kl-navlink kl-header-label">Call</span>
            </a>
            <Link
              to={user ? "/account" : "/login"}
              className="kl-navlink"
              style={{ display: "flex", alignItems: "center", gap: 6, color: theme.text, textDecoration: "none" }}
            >
              <Package size={16} /> <span className="kl-header-label">Orders</span>
            </Link>
            <button className="kl-icon-btn" onClick={() => setDark(!dark)} aria-label="Toggle theme" title={dark ? "Light mode" : "Dark mode"} style={{ color: theme.text }}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              to={user ? "/account/wishlist" : "/login"}
              className="kl-icon-btn"
              style={{ color: theme.text, textDecoration: "none" }}
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart size={18} />
            </Link>
            <Link to="/cart" className="kl-icon-btn" style={{ position: "relative", color: theme.text, textDecoration: "none" }} aria-label="Cart" title="Cart">
              <ShoppingBag size={18} />
              {cartCount > 0 && <span className="kl-mono" style={{ position: "absolute", top: -6, right: -8, background: accent, color: "#fff", fontSize: 9, borderRadius: 999, padding: "1px 5px" }}>{cartCount}</span>}
            </Link>
            {user ? (
              <div ref={accountBoxRef} style={{ position: "relative" }}>
                <button
                  className="kl-icon-btn"
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  style={{ color: theme.text, display: "flex", alignItems: "center", gap: 6 }}
                  aria-label="Account menu"
                  title="Account"
                >
                  <User size={18} />
                  <span style={{ fontSize: 13, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.name ? user.name.split(" ")[0] : (user.email ? user.email.split("@")[0] : "Account")}
                  </span>
                </button>

                {showAccountMenu && (
                  <div style={{ position: "absolute", top: "130%", right: 0, minWidth: 160, background: theme.panel, border: `1px solid ${theme.line}`, borderRadius: 8, boxShadow: "0 6px 20px rgba(0,0,0,.08)", zIndex: 50, overflow: "hidden" }}>
                    <div
                      onClick={() => { setShowAccountMenu(false); navigate("/account"); }}
                      style={{ padding: "10px 14px", fontSize: 13, cursor: "pointer", color: theme.text }}
                    >
                      My Account
                    </div>
                    <div
                      onClick={handleLogout}
                      style={{ padding: "10px 14px", fontSize: 13, cursor: "pointer", color: "#B03434", borderTop: `1px solid ${theme.line}` }}
                    >
                      Log Out
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="kl-icon-btn" style={{ color: theme.text, textDecoration: "none" }} aria-label="Account" title="Account">
                <User size={18} />
              </Link>
            )}
          </div>
        </div>

        <nav style={{ borderTop: `1px solid ${theme.line}`, overflowX: "auto" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "10px 20px", display: "flex", gap: 26, fontSize: 13 }}>
            {NAV.map((n) => (
              <span
                key={n}
                className="kl-navlink"
                onClick={() => navigate(navTarget(n))}
                style={{ color: theme.sub, whiteSpace: "nowrap" }}
              >
                {n}
              </span>
            ))}
          </div>
        </nav>
      </header>

      {status && (
        <div style={{ maxWidth: 1280, margin: "10px auto 0", padding: "0 20px" }}>
          <p style={{ fontSize: 12.5, color: theme.sub }}>{status}</p>
        </div>
      )}

      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px 0" }}>
        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
          <img src="https://picsum.photos/seed/klhero/1280/420" alt="KaintLook seasonal collection" decoding="async" style={{ width: "100%", display: "block", aspectRatio: "3/1", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,.45), transparent 60%)", display: "flex", alignItems: "center" }}>
            <div style={{ padding: "0 40px", color: "#fff", maxWidth: 420 }}>
              <span className="kl-mono" style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: accent }}>New Season</span>
              <h1 className="kl-serif" style={{ fontSize: 34, fontWeight: 700, margin: "10px 0 16px", lineHeight: 1.1 }}>Handstitched, ready to wear</h1>
              <button onClick={() => navigate("/shop")} style={{ background: accent, color: "#fff", border: "none", borderRadius: 6, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 20px 10px" }}>
        <h2 className="kl-serif" style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>Shop by Category</h2>
        {categorySections.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {categorySections.map((section) => (
            <div key={section.name} style={{ border: `1px solid ${theme.line}`, borderRadius: 10, overflow: "hidden", background: theme.panel }}>
              <button onClick={() => navigate(`/shop?category=${encodeURIComponent(section.name)}`)} style={{ position: "relative", display: "block", width: "100%", padding: 0, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                <img src={`https://picsum.photos/seed/${section.seed}/500/220`} alt={section.name} loading="lazy" decoding="async" style={{ width: "100%", aspectRatio: "2.25/1", objectFit: "cover", display: "block" }} />
                <span className="kl-serif" style={{ position: "absolute", left: 16, bottom: 12, color: "#fff", fontSize: 22, textShadow: "0 1px 5px rgba(0,0,0,.45)" }}>{section.name}</span>
              </button>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "12px 14px 14px" }}>
                {section.options.map((option) => (
                  <button key={option} onClick={() => navigate(`/shop?category=${encodeURIComponent(section.name)}&subcategory=${encodeURIComponent(option)}`)} style={{ border: `1px solid ${theme.line}`, borderRadius: 999, background: theme.bg, color: theme.text, padding: "5px 9px", fontSize: 11.5, cursor: "pointer" }}>{option}</button>
                ))}
              </div>
            </div>
          ))}
        </div>}
      </section>

      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 20px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 className="kl-serif" style={{ fontSize: 20, fontWeight: 700 }}>New Arrival</h2>
          <span className="kl-navlink" onClick={() => navigate("/shop")} style={{ fontSize: 12.5, color: theme.sub, display: "flex", alignItems: "center", gap: 2 }}>
            View all <ChevronRight size={14} />
          </span>
        </div>
        {loadingProducts ? (
          <p style={{ color: theme.sub, fontSize: 13 }}>Loading…</p>
        ) : newArrivals.length === 0 ? (
          <p style={{ color: theme.sub, fontSize: 13 }}>
            No products yet — add some from the <Link to="/admin/products" style={{ color: accent }}>admin dashboard</Link>.
          </p>
        ) : (
          <div className="kl-home-product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
            {newArrivals.map((p) => (
              <ProductCard key={p._id} p={p} theme={theme} accent={accent} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} isWishlisted={wishlistIds.has(p._id)} />
            ))}
          </div>
        )}
      </section>

      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 20px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 className="kl-serif" style={{ fontSize: 20, fontWeight: 700 }}>Trending Products</h2>
          <span className="kl-navlink" onClick={() => navigate("/shop")} style={{ fontSize: 12.5, color: theme.sub, display: "flex", alignItems: "center", gap: 2 }}>
            View all <ChevronRight size={14} />
          </span>
        </div>
        {loadingProducts ? (
          <p style={{ color: theme.sub, fontSize: 13 }}>Loading…</p>
        ) : trending.length === 0 ? (
          <p style={{ color: theme.sub, fontSize: 13 }}>Nothing yet.</p>
        ) : (
          <div className="kl-home-product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
            {trending.map((p) => (
              <ProductCard key={p._id} p={p} theme={theme} accent={accent} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} isWishlisted={wishlistIds.has(p._id)} />
            ))}
          </div>
        )}
      </section>

      {recentlyViewed.length > 0 && (
        <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px 60px" }}>
          <h2 className="kl-serif" style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>Recently Viewed</h2>
          <div className="kl-home-product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
            {recentlyViewed.map((p) => (
              <ProductCard key={p._id} p={p} theme={theme} accent={accent} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} isWishlisted={wishlistIds.has(p._id)} />
            ))}
          </div>
        </section>
      )}

      <footer style={{ borderTop: `1px solid ${theme.line}`, background: dark ? theme.panel : "#FAF9F6" }}>
        <div className="kl-footer-grid" style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 20px", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 30 }}>
          <div>
            <span className="kl-serif" style={{ fontSize: 20, fontWeight: 700 }}>Kaint<span style={{ color: accent }}>Look</span></span>
            <p style={{ fontSize: 12.5, color: theme.sub, marginTop: 10, maxWidth: 260, lineHeight: 1.6 }}>
              Handstitched fashion, shipped from Ludhiana, Punjab.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Useful Links</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5, color: theme.sub }}>
              <span className="kl-navlink">About Us</span>
              <span className="kl-navlink">Contact Us</span>
              <span className="kl-navlink">Privacy Policy</span>
              <span className="kl-navlink">Shipping Policy</span>
              <span className="kl-navlink">Refund Policy</span>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Contact Info</h4>
            <p style={{ fontSize: 12.5, color: theme.sub, lineHeight: 1.7 }}>
              Ludhiana, Punjab — India<br />
              hello@kaintlook.com<br />
              +91 00000 00000
            </p>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${theme.line}`, textAlign: "center", padding: "16px 20px", fontSize: 11.5, color: theme.sub }}>
          © 2026 KaintLook. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}