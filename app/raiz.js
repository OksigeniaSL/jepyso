// Where the files of the app are, seen from the page that runs it: beside it ('') at app.jepyso.com, or the folder of the
// player in a Moodle activity, whose page is one level up.
const carpeta = (u) => new URL('.', u).pathname;
export const RAIZ = typeof location === 'undefined' || carpeta(import.meta.url) === carpeta(location.href) ? '' : carpeta(import.meta.url);
