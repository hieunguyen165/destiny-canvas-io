import { useEffect } from "react";
import { useAppSettings } from "@/lib/admin";

export const SEO_SETTING_KEYS = [
  "seo_google_verification",
  "seo_bing_verification",
  "seo_yandex_verification",
  "seo_coccoc_verification",
  "seo_ga_measurement_id",
  "seo_gtm_id",
  "seo_fb_pixel_id",
  "seo_head_extra",
] as const;

const MARK = "data-dctt-seo";

function setMeta(name: string, content: string, useProperty = false) {
  if (!content) return;
  const sel = useProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(sel + `[${MARK}]`);
  if (!el) {
    el = document.createElement("meta");
    if (useProperty) el.setAttribute("property", name);
    else el.setAttribute("name", name);
    el.setAttribute(MARK, "1");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function addScript(id: string, src?: string, inline?: string, async = true) {
  const sel = `script[${MARK}="${id}"]`;
  const old = document.head.querySelector(sel);
  if (old) old.remove();
  const s = document.createElement("script");
  s.setAttribute(MARK, id);
  if (src) { s.src = src; if (async) s.async = true; }
  if (inline) s.text = inline;
  document.head.appendChild(s);
}

function clearAll() {
  document.head.querySelectorAll(`[${MARK}]`).forEach((n) => n.remove());
}

export function SeoHead() {
  const s = useAppSettings(SEO_SETTING_KEYS as unknown as string[]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    clearAll();
    if (s.seo_google_verification) setMeta("google-site-verification", s.seo_google_verification);
    if (s.seo_bing_verification) setMeta("msvalidate.01", s.seo_bing_verification);
    if (s.seo_yandex_verification) setMeta("yandex-verification", s.seo_yandex_verification);
    if (s.seo_coccoc_verification) setMeta("coccoc-verification", s.seo_coccoc_verification);

    if (s.seo_ga_measurement_id) {
      const id = s.seo_ga_measurement_id.trim();
      addScript("ga-lib", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
      addScript("ga-init", undefined,
        `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`);
    }
    if (s.seo_gtm_id) {
      const id = s.seo_gtm_id.trim();
      addScript("gtm", undefined,
        `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`);
    }
    if (s.seo_fb_pixel_id) {
      const id = s.seo_fb_pixel_id.trim();
      addScript("fbp", undefined,
        `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`);
    }
    if (s.seo_head_extra && s.seo_head_extra.trim()) {
      const wrap = document.createElement("div");
      wrap.innerHTML = s.seo_head_extra;
      Array.from(wrap.childNodes).forEach((n) => {
        if (n.nodeType === 1) {
          const el = n as HTMLElement;
          el.setAttribute(MARK, "extra");
          document.head.appendChild(el);
        }
      });
    }
    return () => { clearAll(); };
  }, [s.seo_google_verification, s.seo_bing_verification, s.seo_yandex_verification, s.seo_coccoc_verification, s.seo_ga_measurement_id, s.seo_gtm_id, s.seo_fb_pixel_id, s.seo_head_extra]);
  return null;
}
