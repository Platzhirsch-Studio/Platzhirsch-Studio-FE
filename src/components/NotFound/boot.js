// Inline-Skript der globalen 404 (src/app/not-found.js), eigenes Modul ohne
// "use client", damit der Server-Baustein den Text und keine Client-Referenz bekommt.
// Setzt vor dem ersten Bild html[lang] und html[data-nf] aus dem ersten Pfadsegment
// (CSP erlaubt 'unsafe-inline'); globals.css zeigt dann nur den passenden Block.
export const NF_BOOT_SCRIPT = `(function(){try{var l=location.pathname.split("/")[1];if(!/^(de|en|fr|it)$/.test(l))l="de";var h=document.documentElement;h.lang=l;h.setAttribute("data-nf",l)}catch(e){}})();`;
