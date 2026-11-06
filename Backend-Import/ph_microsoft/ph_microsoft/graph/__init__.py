"""Microsoft-Graph-Zugang für PH-Apps.

Ohne Frappe nutzbar: `graph.client.GraphClient`, `graph.token.TokenQuelle`.
Mit Frappe (site_config ph_ms_*): `graph_client()` und `graph_token()` – z. B. für ph_ablage (OneDrive/SharePoint):

    from ph_microsoft.graph import graph_token, graph_client
    token = graph_token()                 # str, App-Only, Cache in Redis, nie loggen
    g = graph_client()                    # Retry 429/503, Paging, Delta
    g.get("/sites/<site-id>/drive/root/children")
"""


def graph_token():
    from ph_microsoft.ph_microsoft.graph_dienst import graph_token as _t

    return _t()


def graph_client():
    from ph_microsoft.ph_microsoft.graph_dienst import graph_client as _c

    return _c()
