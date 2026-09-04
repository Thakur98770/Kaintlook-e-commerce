import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCategories, searchProducts } from "../api/shop";
import Seo, { siteName, siteUrl } from "../components/Seo";

export default function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getCategories().then((categories) => {
      const found = categories.find((item) => item.slug === slug);
      if (!found) throw new Error("Category not found");
      if (active) setCategory(found);
      return searchProducts({ category: found.name, limit: 100 });
    }).then((result) => { if (active) setProducts(result.products || []); }).catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [slug]);

  if (error) return <main style={pageStyle}><Seo title="Category not found | KaintLook" description="The requested KaintLook category could not be found." path={`/category/${slug}`} noindex /><h1>Category not found</h1><Link to="/shop">Browse all products</Link></main>;
  if (!category) return <main style={pageStyle}>Loading…</main>;

  const description = `Browse ${category.name} products from the ${siteName} collection.`;
  const breadcrumb = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` }, { "@type": "ListItem", position: 2, name: category.name, item: `${siteUrl}/category/${category.slug}` }] };
  return <main style={pageStyle}>
    <Seo title={`${category.name} | ${siteName}`} description={description} path={`/category/${category.slug}`} image={category.image} jsonLd={breadcrumb} />
    <nav style={{ fontSize: 13, marginBottom: 18 }}><Link to="/">Home</Link> <span aria-hidden="true">/</span> <span>{category.name}</span></nav>
    <h1 style={headingStyle}>{category.name}</h1>
    <p style={{ color: "#767676", lineHeight: 1.6 }}>{description}</p>
    {products.length === 0 ? <p style={{ color: "#767676" }}>No products in this category yet.</p> : <div style={gridStyle}>{products.map((product) => <Link key={product._id} to={`/products/${product._id}`} style={cardStyle}><img src={product.images?.[0] || `https://picsum.photos/seed/${product._id}/300/300`} alt={product.name} loading="lazy" decoding="async" style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} /><strong>{product.name}</strong><span>₹{product.price}</span></Link>)}</div>}
  </main>;
}

const pageStyle = { maxWidth: 1180, margin: "0 auto", padding: "32px 20px 60px", fontFamily: "'Work Sans', sans-serif" };
const headingStyle = { fontFamily: "'Fraunces', serif", fontSize: 30, margin: "0 0 8px" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 18, marginTop: 26 };
const cardStyle = { display: "flex", flexDirection: "column", gap: 8, color: "#1B1B1B", textDecoration: "none", border: "1px solid #E7E5DF", borderRadius: 8, overflow: "hidden", paddingBottom: 12 };
