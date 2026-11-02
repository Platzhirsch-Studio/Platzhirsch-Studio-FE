// WebGL2-Prüfung ohne three.js (damit die Seite three erst mit der 3D-Ansicht lädt).
export function hatWebgl2() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    const ok = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}
