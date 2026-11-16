/* Grain de Sou – ce que coûtent vraiment les petites dépenses */

const TAUX_LIVRET_A = 1.7; // % par an depuis le 1er août 2026 (à mettre à jour à chaque changement)

const FOIS_PAR_AN = { jour: 365, semaine: 52, mois: 12, an: 1 };

function simulerDepense(montant, frequence, annees, tauxPct, fois = 1) {
  const parAn = montant * fois * FOIS_PAR_AN[frequence];
  const parMois = parAn / 12;
  const total = parAn * annees;
  const r = tauxPct / 100;
  const n = Math.round(annees * 12);
  let place = total;
  if (r > 0) {
    const rm = Math.pow(1 + r, 1 / 12) - 1;
    place = parMois * (Math.pow(1 + rm, n) - 1) / rm;
  }
  return { parMois, parAn, total, place, interets: place - total };
}

if (typeof module !== "undefined") module.exports = { simulerDepense };

if (typeof document !== "undefined") {
  const form = document.getElementById("form-depenses");
  document.getElementById("taux").value = String(TAUX_LIVRET_A).replace(".", ",");

  const boutons = document.querySelectorAll(".raccourcis button");
  boutons.forEach(b => b.addEventListener("click", () => {
    boutons.forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    document.getElementById("fois").value = "1";
    if (b.dataset.perso) {
      /* Ta propre dépense : champs vidés, prêts à remplir */
      document.getElementById("quoi").value = "";
      document.getElementById("montant").value = "";
      document.getElementById("quoi").focus();
    } else {
      document.getElementById("montant").value = b.dataset.montant;
      document.getElementById("quoi").value = b.dataset.quoi;
      document.querySelector(`input[name=frequence][value=${b.dataset.frequence}]`).checked = true;
    }
    form.dispatchEvent(new Event("change"));
  }));

  function calculer() {
    const montant = Math.max(0, GDS.lire("montant"));
    const frequence = document.querySelector("input[name=frequence]:checked").value;
    const annees = Math.min(50, Math.max(1, Math.round(GDS.lire("annees", 10))));
    const taux = Math.max(0, GDS.lire("taux"));
    const fois = Math.min(100, Math.max(1, Math.round(GDS.lire("fois", 1))));
    const quoi = document.getElementById("quoi").value.trim() || "Ta dépense";
    const s = simulerDepense(montant, frequence, annees, taux, fois);
    const E = GDS.euros;
    const periode = { jour: "par jour", semaine: "par semaine", mois: "par mois", an: "par an" }[frequence];
    const motFreq = (fois > 1 ? `${fois} fois ` : "") + periode;

    GDS.ecrire("t-quoi", `${quoi} : ${E(montant)} ${motFreq}`);
    GDS.ecrire("t-mois", E(s.parMois));
    GDS.ecrire("t-an", E(s.parAn));
    GDS.ecrire("t-annees-label", `Sur ${annees} an${annees > 1 ? "s" : ""}`);
    GDS.ecrire("t-total", E(s.total));
    GDS.ecrire("t-place-label", `Mis de côté à ${GDS.pourcent(taux, taux % 1 ? 1 : 0)} par an`);
    GDS.ecrire("t-place", E(s.place));
    GDS.ecrire("t-interets", taux > 0 ? `dont ${E(s.interets)} d'intérêts` : "");
    GDS.resume(`Sur ${annees} an${annees > 1 ? "s" : ""}`, E(s.total));
    GDS.ecrire("t-phrase", montant > 0
      ? `${E(montant)} ${motFreq}, ça paraît peu. Sur ${annees} an${annees > 1 ? "s" : ""}, ça fait ${E(s.total)}. Si tu le mettais de côté chaque mois, tu aurais environ ${E(s.place)}.`
      : "Entre un montant pour voir ce qu'il représente sur plusieurs années.");
  }

  GDS.surSaisie(form, calculer);
}
