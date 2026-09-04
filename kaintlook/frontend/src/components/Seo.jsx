import { useEffect } from "react";

const siteUrl = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, "");
const siteName = "KaintLook";

function setMeta(name, content, attribute = "name") {
  if (!content) return;
  let tag = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;
}

export default function Seo({ title, description, path = "/", image, type = "website", noindex = false, jsonLd }) {
  useEffect(() => {
    const canonical = `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
    document.title = title;
    setMeta("description", description);
    setMeta("robots", noindex ? "noindex,nofollow" : "index,follow");
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", canonical, "property");
    setMeta("og:type", type, "property");
    setMeta("og:site_name", siteName, "property");
    setMeta("twitter:card", image ? "summary_large_image" : "summary");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    if (image) {
      setMeta("og:image", image, "property");
      setMeta("twitter:image", image);
    } else {
      document.head.querySelector('meta[property="og:image"]')?.remove();
      document.head.querySelector('meta[name="twitter:image"]')?.remove();
    }
    setCanonical(canonical);

    let script = document.head.querySelector('script[data-seo-jsonld="true"]');
    if (jsonLd) {
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.dataset.seoJsonld = "true";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }
  }, [title, description, path, image, type, noindex, jsonLd]);

  return null;
}

export { siteUrl, siteName };
