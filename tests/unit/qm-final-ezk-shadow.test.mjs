// node --test tests/unit/qm-final-ezk-shadow.test.mjs
// QM-Endabnahme 02.11.2026: Im Ezarri-Konfigurator überdeckte `X` aus useKonfCopy() (FR/IT-Zusatztexte,
// in DE/EN null) das gleichnamige lucide-Icon – Mosaik-Auswahl und Vorher/Nachher brachen in die
// Fehlergrenze ab („Element type is invalid … got: null. Check the render method of `Picker`“).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const DIR = path.resolve(import.meta.dirname, "../../src/components/Ezarri/Konfigurator");

test("Konfigurator: kein lucide-Icon heißt wie ein Feld aus useKonfCopy()", () => {
  for (const f of fs.readdirSync(DIR).filter((n) => n.endsWith(".js"))) {
    const src = fs.readFileSync(path.join(DIR, f), "utf8");
    const icons = [...src.matchAll(/import \{([^}]*)\} from "lucide-react"/g)]
      .flatMap((m) => m[1].split(","))
      .map((s) => s.trim().split(/\s+as\s+/).pop())
      .filter(Boolean);
    const copy = [...src.matchAll(/const \{([^}]*)\} = useKonfCopy\(\)/g)]
      .flatMap((m) => m[1].split(","))
      .map((s) => s.trim().split(":").pop().trim())
      .filter(Boolean);
    const clash = icons.filter((i) => copy.includes(i));
    assert.deepEqual(clash, [], `${f}: ${clash.join(", ")}`);
  }
});
