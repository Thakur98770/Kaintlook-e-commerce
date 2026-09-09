import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Reads the GA4 Measurement ID from an env var — never hard-code it here.
// Set VITE_GA_MEASUREMENT_ID in frontend/.env (see .env.example). If it's
// unset, this component does nothing, so local dev / preview builds never
// send analytics data.
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let gaLoaded = false;

function loadGaScript(id) {
  if (gaLoaded || typeof window === "undefined") return;
  gaLoaded = true;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  // send_page_view is disabled here — we send page_view manually on each
  // route change below, since this is a single-page app and GA's automatic
  // page_view (fired only once, on initial script load) would otherwise
  // miss every in-app navigation.
  gtag("config", id, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);
}

export default function Analytics() {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!GA_ID) return;
    loadGaScript(GA_ID);
  }, []);

  useEffect(() => {
    if (!GA_ID || typeof window.gtag !== "function") return;
    // Skip nothing — also send the very first page load, so landing pages
    // (not just subsequent navigations) get counted.
    isFirstRender.current = false;
    window.gtag("event", "page_view", {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location.pathname, location.search]);

  return null;
}