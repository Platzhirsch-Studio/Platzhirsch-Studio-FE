"""Graph-Attrappe für Site-Tests: frappe.flags.ph_ms_graph_client = GraphAttrappe(...). Kein Netzwerk."""

from ph_microsoft.graph.client import GraphFehler


class GraphAttrappe:
    def __init__(self, regeln=None):
        """regeln: [(methode, pfad_teil, antwort | callable(pfad, json, params) | GraphFehler)] – erste passende gewinnt."""
        self.regeln = list(regeln or [])
        self.aufrufe = []

    def _antwort(self, methode, pfad, json=None, params=None):
        self.aufrufe.append((methode, pfad, json, params))
        for m, teil, antwort in self.regeln:
            if m == methode and teil in pfad:
                if isinstance(antwort, GraphFehler):
                    raise antwort
                return antwort(pfad, json, params) if callable(antwort) else antwort
        return {}

    def get(self, pfad, params=None, headers=None):
        return self._antwort("GET", pfad, params=params)

    def post(self, pfad, json=None, headers=None):
        return self._antwort("POST", pfad, json=json)

    def patch(self, pfad, json=None, headers=None):
        return self._antwort("PATCH", pfad, json=json)

    def delete(self, pfad, headers=None):
        return self._antwort("DELETE", pfad)

    def seiten(self, pfad, params=None, headers=None, max_seiten=50):
        return iter((self._antwort("GET", pfad, params=params) or {}).get("value", []))

    def delta(self, pfad, params=None, headers=None, max_seiten=100):
        body = self._antwort("GET", pfad, params=params) or {}
        return body.get("value", []), body.get("@odata.deltaLink", "https://graph.microsoft.com/v1.0/delta?token=neu")

    def aufrufe_mit(self, methode, teil):
        return [a for a in self.aufrufe if a[0] == methode and teil in a[1]]
