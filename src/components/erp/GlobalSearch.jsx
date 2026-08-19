import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Truck, User, FileText, Package, Car, ShoppingCart, Wrench } from "lucide-react";
import { entities } from "@/api";

const searchConfigs = [
  { entity: "Client", label: "Client", path: "/crm", icon: User, fields: ["nom", "email", "telephone", "ville"] },
  { entity: "Supplier", label: "Fournisseur", path: "/fournisseurs", icon: ShoppingCart, fields: ["nom", "email", "telephone", "ville"] },
  { entity: "Employee", label: "Employé", path: "/rh", icon: User, fields: ["nom", "prenom", "email", "poste", "departement"] },
  { entity: "Fleet", label: "Véhicule", path: "/flotte", icon: Car, fields: ["matricule", "marque", "modele"] },
  { entity: "Invoice", label: "Facture", path: "/factures", icon: FileText, fields: ["numero", "client", "description"] },
  { entity: "CustomerOrder", label: "Commande Client", path: "/commandes-clients", icon: Package, fields: ["numero", "client", "article_ref"] },
  { entity: "PurchaseOrder", label: "Commande Achat", path: "/commandes-achat", icon: ShoppingCart, fields: ["numero", "fournisseur_nom", "article_ref"] },
  { entity: "Transport", label: "Mission Transport", path: "/transport", icon: Truck, fields: ["numero", "chauffeur", "vehicule", "destination"] },
  { entity: "Article", label: "Article", path: "/articles", icon: Package, fields: ["reference", "nom", "categorie"] },
  { entity: "Subcontractor", label: "Sous-traitant", path: "/sous-traitants", icon: Wrench, fields: ["nom", "prestation"] },
];

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      const lowerQuery = query.toLowerCase();
      const allResults = [];

      await Promise.all(
        searchConfigs.map(async (cfg) => {
          try {
            const items = await entities[cfg.entity].list("-created_date", 50);
            const filtered = items
              .filter((item) =>
                cfg.fields.some((f) =>
                  String(item[f] || "").toLowerCase().includes(lowerQuery)
                )
              )
              .slice(0, 5)
              .map((item) => ({
                entity: cfg.entity,
                label: cfg.label,
                path: cfg.path,
                icon: cfg.icon,
                title: item[cfg.fields[0]] || item.nom || item.numero || "—",
                subtitle: cfg.fields.slice(1).map((f) => item[f]).filter(Boolean).join(" · "),
                id: item.id,
              }));
            allResults.push(...filtered);
          } catch (err) {
            // entity might fail due to RLS, skip
          }
        })
      );

      setResults(allResults.slice(0, 15));
      setLoading(false);
      setOpen(true);
    }, 300);

    return () => clearTimeout(delay);
  }, [query]);

  const handleSelect = (result) => {
    navigate(result.path);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Rechercher (clients, factures, véhicules...)"
          className="w-full h-9 pl-9 pr-8 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-11 left-0 right-0 z-50 rounded-lg border bg-popover shadow-enterprise-lg max-h-96 overflow-y-auto scrollbar-thin">
          {loading && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Recherche en cours...
            </div>
          )}
          {!loading && results.length === 0 && query.trim().length >= 2 && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Aucun résultat pour "{query}"
            </div>
          )}
          {!loading && results.length > 0 && (
            <div className="py-1">
              {results.map((r, i) => (
                <button
                  key={`${r.entity}-${r.id}-${i}`}
                  onClick={() => handleSelect(r)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent text-left transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <r.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    {r.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                    {r.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}