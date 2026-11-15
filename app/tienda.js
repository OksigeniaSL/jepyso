// The app of Google Play, a Trusted Web Activity of this same web, sells nothing (Google Play's rules on payments;
// Enrique, 15-11-2026, docs/decisiones.md of hq): there, no prices, no buttons and no links to the purchase, only
// «Amplía tu plan en nuestra web», and the licence that was bought is activated by its link or pasted. The app says it
// is the one of the store by its start address (?app=android, android/twa-manifest.json) or, when a routine link opens
// it, by the referrer Android gives (android-app://com.oksigenia.jepyso); it is kept for the rest of the visit.
const PAQUETE = 'android-app://com.oksigenia.jepyso';
function deLaTienda() {
  let marcada = false;
  try {
    marcada = sessionStorage.getItem('tienda') === 'android';
  } catch {
    // Without storage: what the address and the referrer say now.
  }
  const ahora = new URLSearchParams(location.search).get('app') === 'android' || document.referrer.startsWith(PAQUETE);
  if (ahora && !marcada) {
    try {
      sessionStorage.setItem('tienda', 'android');
    } catch {
      // It is said for this page only.
    }
  }
  return ahora || marcada;
}
export const enAppDeLaTienda = typeof location !== 'undefined' && deLaTienda();

// The page with the plans, on jepyso.com: only the web links to it.
const PAGINA_PLANES = 'https://jepyso.com/precios/';
export function ampliarPlan() {
  if (enAppDeLaTienda || !PAGINA_PLANES) return 'Amplía tu plan en nuestra web.';
  return `<a href="${PAGINA_PLANES}" target="_blank" rel="noopener">Amplía tu plan</a> en nuestra web.`;
}
