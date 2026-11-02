"""Alle USDZ des AR-Viewers wie `usdchecker --arkit` prüfen (QA R2 P1-2.2).

Nur auf dem Arbeitsplatz, keine Projekt-Abhängigkeit. Einrichtung (Windows, einmalig):

    uv venv --python 3.12 %TEMP%\\usdenv
    uv pip install --python %TEMP%\\usdenv\\Scripts\\python.exe msvc-runtime usd-core==26.11
    # ARKit-Regeln: complianceChecker.py aus usd-core 24.11 (ab 25.x nicht mehr im Wheel)
    uv venv --python 3.12 %TEMP%\\usd24
    uv pip install --python %TEMP%\\usd24\\Scripts\\python.exe usd-core==24.11

Aufruf (aus dem Repo):

    %TEMP%\\usdenv\\Scripts\\python.exe scripts/arviewer/usdchecker.py ^
        --checker %TEMP%\\usd24\\Lib\\site-packages\\pxr\\UsdUtils\\complianceChecker.py ^
        --out qa-screenshots/labs-ausbau/ar-viewer/geraete/usdchecker.txt public/labs/ar-viewer

Warum zwei Versionen: usd-core 24.11 lädt unter Windows die Shader-Definitionen nicht
(„Could not find shader resource: shaderDefs.usda“) und meldet dann jede
UsdPreviewSurface fälschlich als „invalid shader node“. 26.11 lädt sie korrekt, bringt
aber den ComplianceChecker nicht mehr mit. Daher: Regeln aus 24.11, ausgeführt mit 26.11;
drei umbenannte API-Namen werden beim Laden angepasst (Usd.ZipFile → Sdf.ZipFile,
GetInputNames/GetInput → GetShaderInputNames/GetShaderInput). Die Regeln selbst bleiben
unverändert. Wird zusätzlich Apples usdchecker/Reality Converter genutzt, gilt dessen Urteil.
"""
import argparse
import os
import sys
import types

for d in (os.path.dirname(sys.executable), os.path.dirname(os.path.dirname(sys.executable))):
    try:
        os.add_dll_directory(d)  # msvc-runtime legt msvcp140.dll in die venv
    except (OSError, AttributeError):
        pass

from pxr import Usd  # noqa: E402


def load_checker(path):
    try:
        from pxr.UsdUtils.complianceChecker import ComplianceChecker  # usd-core < 25

        return ComplianceChecker
    except ImportError:
        pass
    if not path:
        sys.exit("--checker <complianceChecker.py aus usd-core 24.11> fehlt")
    src = open(path, encoding="utf-8").read()
    src = src.replace("Usd.ZipFile", "Sdf.ZipFile")
    src = src.replace("from pxr import ", "from pxr import Sdf, ", 1)
    src = src.replace(".GetInputNames()", ".GetShaderInputNames()").replace("shadeNode.GetInput(", "shadeNode.GetShaderInput(")
    mod = types.ModuleType("complianceChecker")
    exec(compile(src, path, "exec"), mod.__dict__)
    return mod.ComplianceChecker


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--checker")
    ap.add_argument("--out", required=True)
    ap.add_argument("paths", nargs="+")
    a = ap.parse_args()
    ComplianceChecker = load_checker(a.checker)
    files = []
    for p in a.paths:
        if os.path.isdir(p):
            for root, _, names in os.walk(p):
                files += [os.path.join(root, n) for n in sorted(names) if n.endswith(".usdz")]
        else:
            files.append(p)
    lines, rules = [], None
    n_err = n_fail = n_warn = n_bad = 0
    for f in files:
        c = ComplianceChecker(arkit=True, skipARKitRootLayerCheck=False, rootPackageOnly=False, skipVariants=False, verbose=False)
        rules = rules or [type(r).__name__ for r in c._rules]
        c.CheckCompliance(f)
        errs, fails, warns = c.GetErrors(), c.GetFailedChecks(), c.GetWarnings()
        n_err, n_fail, n_warn = n_err + len(errs), n_fail + len(fails), n_warn + len(warns)
        ok = not errs and not fails
        n_bad += 0 if ok else 1
        rel = os.path.relpath(f).replace(os.sep, "/")
        lines.append(f"{'OK    ' if ok else 'FEHLER'}  {rel}  Fehler {len(errs)} · Regelverstöße {len(fails)} · Warnungen {len(warns)}")
        lines += [f"    {m}" for m in errs + fails + warns]
    head = [
        "usdchecker --arkit (ComplianceChecker arkit=True, Regeln aus usd-core 24.11, ausgeführt mit usd-core "
        + ".".join(map(str, Usd.GetVersion()))
        + ")",
        "Regeln: " + ", ".join(rules or []),
        "",
    ]
    tail = ["", f"Summe: {len(files)} Dateien · {len(files) - n_bad} ohne Befund · {n_err} Fehler · {n_fail} Regelverstöße · {n_warn} Warnungen"]
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as fh:
        fh.write("\n".join(head + lines + tail) + "\n")
    print(tail[-1].encode("ascii", "replace").decode())
    sys.exit(1 if n_bad else 0)


if __name__ == "__main__":
    main()
