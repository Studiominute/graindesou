/* Grain de Sou – budget 50/30/20 */

const PARTS = { besoins: 0.5, envies: 0.3, epargne: 0.2 };

function simulerBudget(revenu, reel) {
  const cible = {
    besoins: revenu * PARTS.besoins,
    envies: revenu * PARTS.envies,
    epargne: revenu * PARTS.epargne
  };
  const total = reel.besoins + reel.envies + reel.epargne;
  return { cible, reel, total, reste: revenu - total, rempli: total > 0 };
}

if (typeof module !== "undefined") module.exports = { simulerBudget };

if (typeof document !== "undefined") {
  const form = document.getElementById("form-budget");
  const somme = ids => ids.reduce((s, id) => s + Math.max(0, GDS.lire(id)), 0);

  function barre(id, valeur, cible, revenu) {
    const max = Math.max(revenu, 1);
    const rempli = document.getElementById(id);
    rempli.style.width = Math.min(100, valeur / max * 100) + "%";
    rempli.parentElement.querySelector(".repere").style.left = `calc(${Math.min(100, cible / max * 100)}% - 1px)`;
  }

  function calculer() {
    const revenu = Math.max(0, GDS.lire("revenu"));
    const reel = {
      besoins: somme(["logement", "courses", "transport", "factures", "autres-besoins"]),
      envies: somme(["sorties", "shopping", "abonnements", "vacances"]),
      epargne: somme(["epargne"])
    };
    const s = simulerBudget(revenu, reel);
    const E = GDS.euros;

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
      document.getElementById("b-besoins").className = "rempli" + (s.reel.besoins > s.cible.besoins ? " rouge" : "");
      document.getElementById("b-envies").className = "rempli or" + (s.reel.envies > s.cible.envies ? " rouge" : "");

      const reste = document.getElementById("t-reste");
      reste.textContent = E(s.reste);
      reste.className = "montant" + (s.reste < 0 ? " rouge" : "");
      GDS.ecrire("t-reste-etiquette", s.reste >= 0 ? "Pas encore attribué chaque mois" : "Dépassement chaque mois");

      const conseils = [];
      if (s.reel.besoins > s.cible.besoins) conseils.push(`Tes dépenses essentielles prennent ${GDS.pourcent(s.reel.besoins / revenu * 100)} de ton revenu. L'objectif de 50\u00a0% demande de les alléger de ${E(s.reel.besoins - s.cible.besoins)} par mois : c'est souvent le logement, la voiture ou les factures qui donnent le plus de marge.`);
      if (s.reel.envies > s.cible.envies) conseils.push(`Tes envies dépassent la part prévue de ${E(s.reel.envies - s.cible.envies)} par mois.`);
      if (s.reel.epargne >= s.cible.epargne) conseils.push(`Bravo : tu mets de côté ${E(s.reel.epargne)} par mois, soit ${E(s.reel.epargne * 12)} par an.`);
      else if (s.reste > 0) conseils.push(`Avec ${E(Math.min(s.reste, s.cible.epargne - s.reel.epargne))} de plus mis de côté chaque mois (pris sur ce qui n'est pas encore attribué), tu te rapproches des 20\u00a0% d'épargne.`);
      if (s.reste > 0 && s.reel.epargne >= s.cible.epargne) conseils.push(`Il reste ${E(s.reste)} par mois sans destination : tu peux choisir de les épargner ou de te faire plaisir.`);
      if (s.reste < 0) conseils.push(`Tes dépenses dépassent ton revenu de ${E(-s.reste)} par mois : commence par les postes les plus gros.`);
      document.getElementById("conseils").innerHTML = conseils.map(c => `<li>${c}</li>`).join("");
    }
  }

  GDS.surSaisie(form, calculer);
}
