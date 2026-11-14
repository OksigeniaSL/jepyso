// jepyso.com: the «Accesibilidad» link opens Oksigenia's accessibility panel (no floating button over the page).
document.addEventListener('click', (ev) => {
  if (!ev.target.closest('[data-acceso]')) return;
  document.querySelector('oksigenia-access-panel')?.open?.();
});
