/* Grain de Sou – simulateur SCI à l'IR ou à l'IS
   Règles générales en vigueur en 2026 (vérifiées le 16/11/2026) :
   - IR : revenus fonciers au régime réel, barème (taux marginal choisi) + prélèvements sociaux 17,2 %.
     Déficit foncier hors intérêts imputable sur le revenu global jusqu'à 10 700 € par foyer et par an,
     le reste (et la part due aux intérêts) reporté 10 ans sur les revenus fonciers.
     Plus-value des particuliers : 19 % + 17,2 %, abattements pour durée de détention (22 ans / 30 ans),
     surtaxe au-delà de 50 000 € par associé, forfaits 7,5 % (frais d'achat) et 15 % (travaux, après 5 ans).
   - IS : 15 % jusqu'à 42 500 € de bénéfice, 25 % au-delà ; amortissement du bâtiment (hors terrain) ;
     plus-value = prix de vente − valeur nette comptable ; dividendes au PFU 31,4 % (12,8 % + 18,6 %).
*/

const REGLES_2026 = {
  ps_foncier: 0.172,
  plafond_deficit: 10700,
  report_deficit_ans: 10,
  is_taux_reduit: 0.15,
  is_seuil: 42500,
  is_taux_normal: 0.25,
  pfu: 0.314,
  pv_ir: 0.19,
  pv_ps: 0.172,
  forfait_frais_achat: 0.075,
  forfait_travaux: 0.15
};

function tableauEmprunt(capital, tauxAnnuel, dureeAns, horizon) {
  const interets = new Array(horizon + 1).fill(0);
  const restant = new Array(horizon + 1).fill(0);
  if (capital <= 0 || dureeAns <= 0) return { interets, restant, mensualite: 0 };
  const n = Math.round(dureeAns * 12);
  const tm = tauxAnnuel / 12;
  const mensualite = tm === 0 ? capital / n : capital * tm / (1 - Math.pow(1 + tm, -n));
  let crd = capital;
  for (let m = 1; m <= Math.min(n, horizon * 12); m++) {
    const i = crd * tm;
    crd -= (mensualite - i);
    interets[Math.ceil(m / 12)] += i;
  }
  for (let a = 1; a <= horizon; a++) {
    const mois = Math.min(a * 12, n);
    restant[a] = mois >= n ? 0 : (tm === 0 ? capital - mensualite * mois : capital * Math.pow(1 + tm, mois) - mensualite * (Math.pow(1 + tm, mois) - 1) / tm);
  }
  return { interets, restant, mensualite };
}

function impotSocietes(base) {
  if (base <= 0) return 0;
  const r = REGLES_2026;
  return Math.min(base, r.is_seuil) * r.is_taux_reduit + Math.max(0, base - r.is_seuil) * r.is_taux_normal;
}

function surtaxePlusValue(pv) {
  if (pv <= 50000) return 0;
  if (pv <= 60000) return 0.02 * pv - (60000 - pv) / 20;
  if (pv <= 100000) return 0.02 * pv;
  if (pv <= 110000) return 0.03 * pv - (110000 - pv) / 10;
  if (pv <= 150000) return 0.03 * pv;
  if (pv <= 160000) return 0.04 * pv - (160000 - pv) * 0.15;
  if (pv <= 200000) return 0.04 * pv;
  if (pv <= 210000) return 0.05 * pv - (210000 - pv) * 0.20;
  if (pv <= 250000) return 0.05 * pv;
  if (pv <= 260000) return 0.06 * pv - (260000 - pv) * 0.25;
  return 0.06 * pv;
}

function abattementIR(annees) {
  if (annees <= 5) return 0;
  if (annees <= 21) return 0.06 * (annees - 5);
  return 1;
}

function abattementPS(annees) {
  if (annees <= 5) return 0;
  if (annees <= 21) return 0.0165 * (annees - 5);
  if (annees === 22) return 0.0165 * 16 + 0.016;
  if (annees < 30) return 0.0165 * 16 + 0.016 + 0.09 * (annees - 22);
  return 1;
}

function simulerSCI(p) {
  const r = REGLES_2026;
  const N = Math.max(1, Math.round(p.duree));
  const nAssocies = Math.max(1, Math.round(p.associes));
  const loyers = p.loyerMensuel * 12;
  const fraisAchat = p.prix * p.fraisAchatPct;
  const batiment = p.prix * (1 - p.terrainPct);
  const emprunt = tableauEmprunt(p.emprunt, p.tauxEmprunt, p.dureeEmprunt, N);
  const prixVente = p.prix * Math.pow(1 + p.hausse, N);

  const annees = [];
  // --- IR ---
  let reports = []; // { annee, montant }
  let totalIR = 0, totalDeficitImpute = 0;
  // --- IS ---
  let reportIS = 0, ran = 0, amortCumule = 0;
  let totalIS = 0, totalPFU = 0, totalCompta = 0, totalDividendes = 0;
  let isRevente = 0, pfuRevente = 0;

  for (let t = 1; t <= N; t++) {
    const I = emprunt.interets[t];
    const C = p.charges;
    const ligne = { annee: t, loyers, interets: I };

    // ---------- SCI à l'IR ----------
    reports = reports.filter(d => t - d.annee <= r.report_deficit_ans && d.montant > 0.005);
    const net = loyers - I - C;
    let irAnnee = 0, imposable = 0, impute = 0;
    if (net >= 0) {
      let aCompenser = net;
      for (const d of reports) {
        const u = Math.min(d.montant, aCompenser);
        d.montant -= u; aCompenser -= u;
        if (aCompenser <= 0) break;
      }
      imposable = aCompenser;
      irAnnee = imposable * (p.tmi + r.ps_foncier);
    } else {
      const plafond = r.plafond_deficit * nAssocies;
      let reporte = 0;
      if (loyers >= I) {
        const horsInterets = -net;
        impute = Math.min(horsInterets, plafond);
        reporte = horsInterets - impute;
      } else {
        impute = Math.min(C, plafond);
        reporte = (I - loyers) + (C - impute);
      }
      if (reporte > 0) reports.push({ annee: t, montant: reporte });
      irAnnee = -impute * p.tmi;
      totalDeficitImpute += impute;
    }
    ligne.resultatFoncier = net;
    ligne.irAnnee = irAnnee;
    totalIR += irAnnee;

    // ---------- SCI à l'IS ----------
    const amort = t <= p.dureeAmort ? batiment / p.dureeAmort : 0;
    amortCumule += amort;
    let resultat = loyers - C - I - amort - p.compta - (t === 1 ? fraisAchat : 0);
    let pvIS = 0;
    const venteCetteAnnee = p.revente && t === N;
    if (venteCetteAnnee) {
      const vnc = p.prix - amortCumule;
      pvIS = prixVente - vnc;
      resultat += pvIS;
    }
    let base = 0;
    if (resultat >= 0) {
      const u = Math.min(reportIS, resultat);
      reportIS -= u;
      base = resultat - u;
    } else {
      reportIS += -resultat;
    }
    const isAnnee = impotSocietes(base);
    ran += resultat - isAnnee;
    let dividende = 0;
    if ((p.verser || venteCetteAnnee) && ran > 0) { dividende = ran; ran = 0; }
    const pfuAnnee = dividende * r.pfu;
    if (venteCetteAnnee) {
      const isSansVente = impotSocietes(Math.max(0, base - pvIS));
      isRevente = isAnnee - isSansVente;
      pfuRevente = pfuAnnee;
    }
    ligne.resultatIS = resultat;
    ligne.amort = amort;
    ligne.isAnnee = isAnnee;
    ligne.dividende = dividende;
    ligne.pfuAnnee = pfuAnnee;
    totalIS += isAnnee; totalPFU += pfuAnnee; totalCompta += p.compta; totalDividendes += dividende;
    annees.push(ligne);
  }

  // ---------- Revente côté IR ----------
  let pvIR = { brute: 0, impot: 0, ir: 0, ps: 0, surtaxe: 0 };
  if (p.revente) {
    const fraisRetenus = Math.max(fraisAchat, p.prix * r.forfait_frais_achat);
    const travaux = N > 5 ? p.prix * r.forfait_travaux : 0;
    const brute = prixVente - (p.prix + fraisRetenus + travaux);
    if (brute > 0) {
      const baseIR = brute * (1 - abattementIR(N));
      const basePS = brute * (1 - abattementPS(N));
      const ir = baseIR * r.pv_ir;
      const ps = basePS * r.pv_ps;
      const surtaxe = surtaxePlusValue(baseIR / nAssocies) * nAssocies;
      pvIR = { brute, impot: ir + ps + surtaxe, ir, ps, surtaxe };
    } else {
      pvIR.brute = brute;
    }
  }

  const coutIR = totalIR + pvIR.impot;
  const coutIS = totalIS + totalPFU + totalCompta;
  return {
    N, prixVente, fraisAchat, mensualite: emprunt.mensualite, annees,
    ir: { annuel: totalIR, plusValue: pvIR, total: coutIR, deficitImpute: totalDeficitImpute },
    is: { impot: totalIS, pfu: totalPFU, compta: totalCompta, dividendes: totalDividendes,
          amortissements: amortCumule, isRevente, pfuRevente, garde: ran, total: coutIS },
    ecart: coutIR - coutIS
  };
}

if (typeof module !== "undefined") module.exports = { simulerSCI, surtaxePlusValue, abattementIR, abattementPS, impotSocietes, tableauEmprunt };

/* ---------- Interface ---------- */
if (typeof document !== "undefined") {
  const form = document.getElementById("form-sci");
  const lirePct = id => GDS.lire(id) / 100;

  function calculer() {
    const p = {
      prix: GDS.lire("prix"),
      fraisAchatPct: lirePct("frais"),
      terrainPct: lirePct("terrain"),
      loyerMensuel: GDS.lire("loyer"),
      charges: GDS.lire("charges"),
      emprunt: GDS.lire("emprunt"),
      tauxEmprunt: lirePct("taux"),
      dureeEmprunt: GDS.lire("duree-emprunt"),
      tmi: parseFloat(document.querySelector("input[name=tmi]:checked").value) / 100,
      associes: GDS.lire("associes", 1),
      duree: Math.min(30, Math.max(1, GDS.lire("duree", 15))),
      revente: document.getElementById("revente").checked,
      hausse: lirePct("hausse"),
      dureeAmort: Math.max(1, GDS.lire("amort", 30)),
      compta: GDS.lire("compta"),
      verser: document.getElementById("verser").checked
    };
    const s = simulerSCI(p);
    const E = GDS.euros;

    GDS.ecrire("t-duree", `Sur ${s.N} an${s.N > 1 ? "s" : ""}, avec tes chiffres`);
    GDS.ecrire("t-ir-annuel", E(s.ir.annuel));
    GDS.ecrire("t-ir-pv", p.revente ? E(s.ir.plusValue.impot) : "pas de revente");
    GDS.ecrire("t-ir-total", E(s.ir.total));
    GDS.ecrire("t-is-impot", E(s.is.impot));
    GDS.ecrire("t-is-pfu", E(s.is.pfu));
    GDS.ecrire("t-is-compta", E(s.is.compta));
    GDS.ecrire("t-is-total", E(s.is.total));

    const gagnant = s.ecart > 0 ? "IS" : "IR";
    const montant = document.getElementById("t-ecart");
    montant.textContent = E(Math.abs(s.ecart));
    GDS.ecrire("t-ecart-etiquette", Math.abs(s.ecart) < 1 ? "Les deux options se valent" : `Économie avec la SCI à l'${gagnant}`);
    GDS.ecrire("t-phrase", Math.abs(s.ecart) < 1
      ? "Avec ces chiffres, les deux options coûtent la même chose."
      : `Avec ces chiffres, la SCI à l'${gagnant} te laisse ${E(Math.abs(s.ecart))} de plus sur ${s.N} ans, soit environ ${E(Math.abs(s.ecart) / s.N)} par an.`
        + (s.is.garde > 0 ? ` À l'IS, ${E(s.is.garde)} restent dans la SCI et seront imposés le jour où ils seront versés.` : ""));

    GDS.resume(Math.abs(s.ecart) < 1 ? "Les deux options se valent" : `Écart en faveur de l'${gagnant}`, E(Math.abs(s.ecart)));
    const max = Math.max(Math.abs(s.ir.total), Math.abs(s.is.total), 1);
    document.getElementById("b-ir").style.width = Math.max(0, s.ir.total) / max * 100 + "%";
    document.getElementById("b-is").style.width = Math.max(0, s.is.total) / max * 100 + "%";
    GDS.ecrire("b-ir-val", E(s.ir.total));
    GDS.ecrire("b-is-val", E(s.is.total));

    // Pourquoi
    const pourquoi = [];
    pourquoi.push(`À l'IS, la SCI déduit chaque année une part du prix du bâtiment (l'amortissement) : ${E(s.is.amortissements)} au total sur ${s.N} ans. À l'IR, cette déduction n'existe pas.`);
    if (s.ir.deficitImpute > 0) pourquoi.push(`À l'IR, ${E(s.ir.deficitImpute)} de déficit foncier viennent baisser l'impôt sur les autres revenus des associés (salaires, retraites…).`);
    if (p.revente) {
      pourquoi.push(`À la revente au bout de ${s.N} ans (prix estimé ${E(s.prixVente)}), l'impôt sur la plus-value est de ${E(s.ir.plusValue.impot)} à l'IR, grâce aux abattements pour durée de détention.`);
      pourquoi.push(`À l'IS, la plus-value se calcule sur le prix diminué des amortissements déjà déduits : ${E(s.is.isRevente)} d'impôt sur les sociétés, puis ${E(s.is.pfuRevente)} d'impôt quand l'argent est versé aux associés.`);
    }
    if (!p.verser && !p.revente && s.is.garde > 0) pourquoi.push(`${E(s.is.garde)} de bénéfices restent dans la SCI : ils seront taxés à 31,4\u00a0% le jour où ils seront versés aux associés.`);
    if (s.mensualite > 0) pourquoi.push(`Mensualité de l'emprunt : ${E(s.mensualite)} par mois (elle ne change rien à la comparaison, seuls les intérêts sont déduits).`);
    document.getElementById("pourquoi").innerHTML = pourquoi.map(t => `<li>${t}</li>`).join("");

    // Tableau
    const corps = document.querySelector("#tableau-sci tbody");
    corps.innerHTML = s.annees.map(a => `<tr>
      <td>Année ${a.annee}</td>
      <td>${E(a.resultatFoncier)}</td>
      <td>${E(a.irAnnee)}</td>
      <td>${E(a.resultatIS)}</td>
      <td>${E(a.isAnnee)}</td>
      <td>${E(a.pfuAnnee)}</td>
    </tr>`).join("");
    document.querySelector("#tableau-sci tfoot").innerHTML = `<tr>
      <td>Total</td><td></td><td>${E(s.ir.annuel)}</td><td></td><td>${E(s.is.impot)}</td><td>${E(s.is.pfu)}</td></tr>
      ${p.revente ? `<tr><td>Plus-value (IR)</td><td></td><td>${E(s.ir.plusValue.impot)}</td><td colspan="3"></td></tr>` : ""}`;

    document.getElementById("bloc-revente").hidden = !p.revente;
  }

  GDS.surSaisie(form, calculer);
}
