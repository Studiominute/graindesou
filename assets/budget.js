/* Grain de Sou – budget 50/30/20 : lignes libres + graphique « où va ton argent » */

const PARTS = { besoins: 0.5, envies: 0.3, epargne: 0.2 };
const CATEGORIES = [
  { cle: "besoins", nom: "L'essentiel", couleur: "#1F63D1" },
  { cle: "envies", nom: "Les envies", couleur: "#D99A0B" },
  { cle: "epargne", nom: "L'épargne", couleur: "#2B9C80" }
];
const COULEUR_RESTE = "#9AA8BC";
const COULEUR_DEPASSEMENT = "#B3361F";
const COULEUR_SOURCE = "#0B2554";

function simulerBudget(revenu, reel) {
  const cible = {
    besoins: revenu * PARTS.besoins,
    envies: revenu * PARTS.envies,
    epargne: revenu * PARTS.epargne
  };
  const total = reel.besoins + reel.envies + reel.epargne;
  return { cible, reel, total, reste: revenu - total, rempli: total > 0 };
}

/* Flux à dessiner : sources (à gauche) → postes (à droite), chaque source répartie au prorata */
function construireFlux(sources, postes) {
  const totalG = sources.reduce((a, x) => a + x.valeur, 0);
  const totalD = postes.reduce((a, x) => a + x.valeur, 0);
  const total = Math.max(totalG, totalD);
  const liens = [];
  if (total <= 0) return { sources, postes, liens, total };
  sources.forEach((s, i) => postes.forEach((p, j) => {
    const v = s.valeur * p.valeur / total;
    if (v > 0.005) liens.push({ i, j, valeur: v });
  }));
  return { sources, postes, liens, total };
}

if (typeof module !== "undefined") module.exports = { simulerBudget, construireFlux };

if (typeof document !== "undefined") {
  const form = document.getElementById("form-budget");
  const E = n => GDS.euros(n, 0);

  /* ----- Lignes libres : ajouter, retirer ----- */
  form.addEventListener("click", e => {
    const groupe = e.target.closest(".groupe");
    if (!groupe) return;
    if (e.target.matches(".ajouter")) {
      const modele = groupe.querySelector(".ligne-saisie");
      const ligne = modele ? modele.cloneNode(true) : null;
      if (!ligne) return;
      ligne.querySelector(".libelle").value = "";
      ligne.querySelector(".libelle").placeholder = groupe.dataset.groupe === "revenus" ? "Ex. : prime, loyer perçu…" : "Ex. : animaux, cadeaux…";
      ligne.querySelector(".montant").value = "";
      groupe.querySelector(".lignes").appendChild(ligne);
      ligne.querySelector(".libelle").focus();
      calculer();
    }
    if (e.target.matches(".retirer")) {
      const lignes = groupe.querySelectorAll(".ligne-saisie");
      const ligne = e.target.closest(".ligne-saisie");
      if (lignes.length > 1) ligne.remove();
      else { ligne.querySelector(".montant").value = ""; }
      calculer();
    }
  });

  function lireGroupe(cle) {
    return [...form.querySelectorAll(`.groupe[data-groupe="${cle}"] .ligne-saisie`)].map((l, k) => {
      const brut = l.querySelector(".montant").value.replace(/\s/g, "").replace(",", ".");
      const v = parseFloat(brut);
      return { nom: l.querySelector(".libelle").value.trim() || `Ligne ${k + 1}`, valeur: Number.isFinite(v) && v > 0 ? v : 0 };
    });
  }
  const somme = lignes => lignes.reduce((a, x) => a + x.valeur, 0);

  function barre(id, valeur, cible, revenu) {
    const max = Math.max(revenu, 1);
    const rempli = document.getElementById(id);
    rempli.style.width = Math.min(100, valeur / max * 100) + "%";
    rempli.parentElement.querySelector(".repere").style.left = `calc(${Math.min(100, cible / max * 100)}% - 1px)`;
  }

  function calculer() {
    const groupes = { revenus: lireGroupe("revenus"), besoins: lireGroupe("besoins"), envies: lireGroupe("envies"), epargne: lireGroupe("epargne") };
    Object.entries(groupes).forEach(([k, l]) => {
      const el = form.querySelector(`[data-total="${k}"]`);
      if (el) el.textContent = E(somme(l));
    });
    const revenu = somme(groupes.revenus);
    const reel = { besoins: somme(groupes.besoins), envies: somme(groupes.envies), epargne: somme(groupes.epargne) };
    const s = simulerBudget(revenu, reel);

    GDS.ecrire("t-revenu", E(revenu));
    GDS.ecrire("t-besoins", E(s.cible.besoins));
    GDS.ecrire("t-envies", E(s.cible.envies));
    GDS.ecrire("t-epargne", E(s.cible.epargne));
    GDS.ecrire("t-epargne-an", E(s.cible.epargne * 12));
    GDS.resume("Épargne visée par mois", E(s.cible.epargne));

    const bloc = document.getElementById("comparaison");
    bloc.hidden = !s.rempli;
    if (s.rempli && revenu > 0) {
      ["besoins", "envies", "epargne"].forEach(k => {
        GDS.ecrire(`r-${k}`, `${E(s.reel[k])} (${GDS.pourcent(s.reel[k] / revenu * 100)})`);
        barre(`b-${k}`, s.reel[k], s.cible[k], revenu);
      });
      /* Mêmes couleurs que le graphique ; rouge quand le repère est dépassé */
      CATEGORIES.forEach(c => {
        const depasse = c.cle !== "epargne" && s.reel[c.cle] > s.cible[c.cle];
        document.getElementById(`b-${c.cle}`).style.background = depasse ? COULEUR_DEPASSEMENT : c.couleur;
      });
      const reste = document.getElementById("t-reste");
      reste.textContent = E(s.reste);
      reste.className = "montant" + (s.reste < 0 ? " rouge" : "");
      GDS.ecrire("t-reste-etiquette", s.reste >= 0 ? "Pas encore attribué chaque mois" : "Dépassement chaque mois");
      const conseils = [];
      if (s.reel.besoins > s.cible.besoins) conseils.push(`Tes dépenses essentielles prennent ${GDS.pourcent(s.reel.besoins / revenu * 100)} de tes revenus. L'objectif de 50 % demande de les alléger de ${E(s.reel.besoins - s.cible.besoins)} par mois : c'est souvent le logement, la voiture ou les factures qui donnent le plus de marge.`);
      if (s.reel.envies > s.cible.envies) conseils.push(`Tes envies dépassent la part prévue de ${E(s.reel.envies - s.cible.envies)} par mois.`);
      if (s.reel.epargne >= s.cible.epargne) conseils.push(`Bravo : tu mets de côté ${E(s.reel.epargne)} par mois, soit ${E(s.reel.epargne * 12)} par an.`);
      else if (s.reste > 0) conseils.push(`Avec ${E(Math.min(s.reste, s.cible.epargne - s.reel.epargne))} de plus mis de côté chaque mois (pris sur ce qui n'est pas encore attribué), tu te rapproches des 20 % d'épargne.`);
      if (s.reste > 0 && s.reel.epargne >= s.cible.epargne) conseils.push(`Il reste ${E(s.reste)} par mois sans destination : tu peux choisir de les épargner ou de te faire plaisir.`);
      if (s.reste < 0) conseils.push(`Tes dépenses dépassent tes revenus de ${E(-s.reste)} par mois : commence par les postes les plus gros.`);
      document.getElementById("conseils").innerHTML = conseils.map(c => `<li>${c}</li>`).join("");
    }

    /* ----- Graphique ----- */
    const sources = groupes.revenus.filter(x => x.valeur > 0).map(x => ({ ...x, couleur: COULEUR_SOURCE }));
    let postes;
    if (s.rempli) {
      postes = CATEGORIES.map(c => ({ nom: c.nom, valeur: reel[c.cle], couleur: c.couleur }));
      if (s.reste > 0) postes.push({ nom: "Pas encore attribué", valeur: s.reste, couleur: COULEUR_RESTE });
      if (s.reste < 0) sources.push({ nom: "Dépassement", valeur: -s.reste, couleur: COULEUR_DEPASSEMENT });
      GDS.ecrire("flux-legende", "Tes revenus à gauche, tes dépenses et ton épargne à droite. Chaque revenu est réparti au prorata entre les postes.");
    } else {
      postes = CATEGORIES.map(c => ({ nom: c.nom + " (repère)", valeur: s.cible[c.cle], couleur: c.couleur }));
      GDS.ecrire("flux-legende", "Le repère 50/30/20 appliqué à tes revenus. Entre tes dépenses pour voir ta vraie répartition.");
    }
    dessinerFlux(document.getElementById("flux"), construireFlux(sources, postes.filter(p => p.valeur > 0)));
  }

  /* ----- Dessin du graphique en flux (SVG) ----- */
  function dessinerFlux(zone, f) {
    const L = Math.max(280, zone.clientWidth || 700);
    const petit = L < 560;
    const marge = petit ? Math.round(L * 0.34) : Math.min(210, Math.round(L * 0.22));
    const largeurNoeud = 14, ecart = 12;
    const nMax = Math.max(f.sources.length, f.postes.length, 1);
    const H = Math.max(220, Math.min(420, 70 * nMax + 80));
    const hautUtile = H - 20 - ecart * (nMax - 1);
    const echelle = f.total > 0 ? hautUtile / f.total : 0;
    const xG = marge, xD = L - marge - largeurNoeud;
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${L} ${H}`);
    svg.setAttribute("width", L); svg.setAttribute("height", H);
    svg.setAttribute("role", "img");
    if (f.total <= 0) { zone.replaceChildren(); return; }

    const placer = (liste) => {
      const totalH = liste.reduce((a, x) => a + x.valeur * echelle, 0) + ecart * (liste.length - 1);
      let y = (H - totalH) / 2;
      liste.forEach(n => { n.y = y; n.h = Math.max(2, n.valeur * echelle); n.curseur = y; y += n.h + ecart; });
    };
    placer(f.sources); placer(f.postes);

    /* Raccourcit un texte SVG jusqu'à ce qu'il tienne dans la marge */
    const ajuster = (el, max) => {
      let t = el.textContent;
      while (el.getComputedTextLength() > max && t.length > 3) { t = t.slice(0, -2); el.textContent = t + "…"; }
    };
    const total = f.total;
    const texte = [];
    const aAjuster = [];

    // Liens (sous les nœuds)
    f.liens.forEach(l => {
      const s = f.sources[l.i], p = f.postes[l.j];
      const h = l.valeur * echelle;
      const y0 = s.curseur, y1 = p.curseur;
      s.curseur += h; p.curseur += h;
      const x0 = xG + largeurNoeud, x1 = xD, xm = (x0 + x1) / 2;
      const chemin = document.createElementNS(NS, "path");
      chemin.setAttribute("d", `M${x0},${y0} C${xm},${y0} ${xm},${y1} ${x1},${y1} L${x1},${y1 + h} C${xm},${y1 + h} ${xm},${y0 + h} ${x0},${y0 + h} Z`);
      chemin.setAttribute("fill", p.couleur);
      chemin.setAttribute("fill-opacity", ".38");
      chemin.setAttribute("class", "lien");
      const titre = document.createElementNS(NS, "title");
      titre.textContent = `${s.nom} → ${p.nom} : ${E(l.valeur)} par mois`;
      chemin.appendChild(titre);
      svg.appendChild(chemin);
    });

    // Nœuds et étiquettes
    const noeud = (n, x, aGauche) => {
      const r = document.createElementNS(NS, "rect");
      r.setAttribute("x", x); r.setAttribute("y", n.y); r.setAttribute("width", largeurNoeud); r.setAttribute("height", n.h);
      r.setAttribute("rx", 4); r.setAttribute("fill", n.couleur);
      svg.appendChild(r);
      const t = document.createElementNS(NS, "text");
      const tx = aGauche ? x - 8 : x + largeurNoeud + 8;
      t.setAttribute("x", tx); t.setAttribute("y", n.y + n.h / 2 - 2);
      t.setAttribute("text-anchor", aGauche ? "end" : "start");
      t.setAttribute("class", "flux-nom" + (petit ? " petit" : ""));
      t.textContent = n.nom;
      const v = document.createElementNS(NS, "text");
      v.setAttribute("x", tx); v.setAttribute("y", n.y + n.h / 2 + (petit ? 12 : 15));
      v.setAttribute("text-anchor", aGauche ? "end" : "start");
      v.setAttribute("class", "flux-valeur" + (petit ? " petit" : ""));
      v.textContent = petit ? E(n.valeur) : `${E(n.valeur)} (${GDS.pourcent(n.valeur / total * 100)})`;
      svg.appendChild(t); svg.appendChild(v);
      aAjuster.push(t);
      texte.push(`${n.nom} : ${E(n.valeur)}`);
    };
    f.sources.forEach(n => noeud(n, xG, true));
    f.postes.forEach(n => noeud(n, xD, false));

    zone.replaceChildren(svg);
    aAjuster.forEach(t => ajuster(t, marge - 12));
    GDS.ecrire("flux-texte", "Répartition mensuelle. " + texte.join(" ; ") + ".");
    svg.setAttribute("aria-label", "Graphique en flux : " + texte.join(", "));
  }

  window.addEventListener("resize", () => { clearTimeout(window.__fluxT); window.__fluxT = setTimeout(calculer, 150); });
  GDS.surSaisie(form, calculer);
}
