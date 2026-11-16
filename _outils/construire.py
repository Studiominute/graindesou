"""Fabrique les pages du site Grain de Sou à partir de morceaux communs.
Lancer : python3 _outils/construire.py  (écrit à la racine du dépôt)"""
import re
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent  # racine du dépôt
DOMAINE = "https://graindesou.studiominute.fr"
CONTACT = "graindesou@studiominute.fr"
# Inscription par e-mail : fermée tant que le site est édité à titre non professionnel (choix du 16/11/2026).
# Le jour de la micro-entreprise : passer à True, compléter l'éditeur, brancher Brevo dans assets/commun.js.
INSCRIPTION_OUVERTE = False

RESEAUX = [
    ("YouTube", "https://www.youtube.com/@graindesou"),
    ("Instagram", "https://www.instagram.com/graindesou"),
    ("TikTok", "https://www.tiktok.com/@graindesou"),
    ("Facebook", "https://www.facebook.com/profile.php?id=1434997603028314"),
]

# Les calculateurs : ajouter une ligne ici suffit pour qu'un nouvel outil apparaisse dans le menu déroulant.
OUTILS = [
    ("petites-depenses/", "Petites dépenses", "Le vrai prix d'une dépense qui revient"),
    ("budget/", "Budget 50/30/20", "La part de ton salaire pour chaque poste"),
    ("sci-ir-ou-is/", "SCI à l'IR ou à l'IS", "Les impôts des deux options, revente comprise"),
]


def tete(titre, description, chemin, racine):
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titre}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{DOMAINE}/{chemin}">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="Grain de Sou">
<meta property="og:title" content="{titre}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{DOMAINE}/{chemin}">
<meta name="theme-color" content="#0B2554">
<link rel="icon" href="{racine}assets/sou.svg" type="image/svg+xml">
<link rel="preload" href="{racine}assets/fonts/montserrat-latin-900-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{racine}assets/fonts/caveat-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{racine}assets/style.css">
</head>
<body>
"""


def entete(chemin, racine):
    dans_outils = any(c == chemin for c, _, _ in OUTILS)
    actuel = lambda c: ' aria-current="page"' if c == chemin else ""
    liste = "\n".join(
        f'          <li><a href="{racine}{c}"{actuel(c)}><strong>{t}</strong><span>{d}</span></a></li>' for c, t, d in OUTILS
    )
    return f"""<header class="entete">
  <div class="cadre barre">
    <a class="marque" href="{racine}"><img src="{racine}assets/sou.svg" alt="" width="40" height="40">Grain de Sou</a>
    <button class="menu-bouton" type="button" aria-expanded="false" aria-controls="menu">Menu</button>
    <nav class="menu" id="menu" aria-label="Menu principal">
      <a class="onglet" href="{racine}"{actuel("")}>Accueil</a>
      <details class="deroulant">
        <summary class="onglet{" actif" if dans_outils else ""}">Calculateurs</summary>
        <ul>
{liste}
        </ul>
      </details>
      <a class="onglet" href="{racine}formations/"{actuel("formations/")}>Formations <span class="badge">bientôt</span></a>
    </nav>
  </div>
</header>
"""


def inscription(racine):
    return f"""<section class="inscription" aria-labelledby="titre-inscription">
  <div class="cadre">
    <div>
      <h2 id="titre-inscription">Reçois les prochains outils en avant-première</h2>
      <p class="promesse">Au plus un e-mail par semaine : les nouveaux calculateurs de Grain de Sou et l'essentiel des sujets décryptés en vidéo, chiffres à l'appui.</p>
    </div>
    <form class="form-inscription" novalidate>
      <div class="rangee">
        <label class="visually-hidden" for="email-{{id}}">Ton adresse e-mail</label>
        <input type="email" id="email-{{id}}" name="email" placeholder="ton.adresse@exemple.fr" autocomplete="email" required>
        <button class="bouton" type="submit">Je m'inscris</button>
      </div>
      <label class="case"><input type="checkbox" name="consentement" required>
        <span>J'accepte de recevoir les e-mails de Grain de Sou. Je peux me désinscrire en un clic depuis chaque e-mail. <a href="{racine}confidentialite/">Ce que deviennent mes données</a></span></label>
      <div class="cache-robot" aria-hidden="true"><input type="text" name="email_address_check" tabindex="-1" autocomplete="off"></div>
      <p class="message-form" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>
"""


def suivre():
    liens = "".join(f'<a class="bouton secondaire" href="{u}" rel="noopener">{n}</a>' for n, u in RESEAUX)
    return f"""<section class="inscription" aria-labelledby="titre-suivre">
  <div class="cadre">
    <div>
      <h2 id="titre-suivre">Une vidéo chaque jour, de nouveaux outils au fil des vidéos</h2>
      <p class="promesse">Suis Grain de Sou pour découvrir ce qui se cache derrière ton argent, et les prochains calculateurs dès leur sortie.</p>
    </div>
    <nav class="liens-reseaux" aria-label="Grain de Sou sur les réseaux">{liens}</nav>
  </div>
</section>
"""


def pied(racine, scripts=()):
    reseaux = " ".join(f'<a href="{u}" rel="noopener">{n}</a>' for n, u in RESEAUX)
    js = "\n".join(f'<script src="{racine}assets/{s}"></script>' for s in ("commun.js", *scripts))
    return f"""<footer class="pied-page">
  <div class="cadre">
    <div>
      <p><strong>Grain de Sou</strong>, ce qui se cache derrière ton argent.<br>Contenu pédagogique, pas un conseil financier personnalisé.</p>
      <nav aria-label="Réseaux">{reseaux}</nav>
    </div>
    <nav aria-label="Informations">
      <a href="{racine}mentions-legales/">Mentions légales</a>
      <a href="{racine}confidentialite/">Confidentialité</a>
      <a href="mailto:{CONTACT}">Contact</a>
    </nav>
  </div>
</footer>
{js}
</body>
</html>
"""


def typo(html):
    """Espaces insécables de la typographie française (hors balises)."""
    morceaux = re.split(r"(<[^>]+>)", html)
    for i, m in enumerate(morceaux):
        if not m.startswith("<"):
            morceaux[i] = re.sub(r" ([%€:?!;»])", "\u00a0\\1", m).replace("« ", "«\u00a0")
    return "".join(morceaux)


def ecrire(chemin, contenu):
    contenu = typo(contenu)
    fichier = SITE / chemin / "index.html" if chemin else SITE / "index.html"
    fichier.parent.mkdir(parents=True, exist_ok=True)
    fichier.write_text(contenu, encoding="utf-8")


def page(chemin, titre, description, corps, scripts=(), avec_inscription=True):
    racine = "../" * chemin.count("/")
    html = tete(titre, description, chemin, racine) + entete(chemin, racine) + "<main>\n" + corps
    if avec_inscription:
        html += inscription(racine).replace("{id}", "bas") if INSCRIPTION_OUVERTE else suivre()
    html += "</main>\n" + pied(racine, scripts)
    ecrire(chemin, html)


SOU = (SITE / "assets" / "sou.svg").read_text(encoding="utf-8").replace("<svg ", '<svg class="sou-geant" ', 1)

# ---------------------------------------------------------------- Accueil
page("", "Grain de Sou : les calculateurs gratuits",
     "Calculateurs gratuits de Grain de Sou : le vrai prix des petites dépenses, le budget 50/30/20 et le comparatif SCI à l'IR ou à l'IS.",
     f"""<section class="accueil-haut">
  <div class="cadre">
    <div>
      <h1>Ce qui se cache derrière ton argent</h1>
      <p>Trois calculateurs gratuits pour y voir clair en deux minutes. Tu entres tes chiffres, le ticket se calcule tout seul.</p>
    </div>
    <div class="sou-zone">{SOU}<p class="note-main">Salut, moi c'est Sou !</p></div>
  </div>
</section>
<div class="cadre outils">
  <a class="outil-ligne" href="petites-depenses/">
    <div><h2>Ta petite dépense, sur 10 ans</h2><p>Café, abonnement, repas livré : découvre ce que ça représente vraiment.</p></div>
    <div class="apercu"><small>4 € par jour</small><b>14 600 €</b><small>en 10 ans</small></div>
    <span class="bouton petit-bouton">Calculer ma dépense</span>
  </a>
  <a class="outil-ligne" href="budget/">
    <div><h2>Ton budget 50/30/20</h2><p>La part de ton salaire pour l'essentiel, pour les envies et pour l'épargne.</p></div>
    <div class="apercu"><small>2 000 € par mois</small><b>400 €</b><small>d'épargne par mois</small></div>
    <span class="bouton petit-bouton">Faire mon budget</span>
  </a>
  <a class="outil-ligne" href="sci-ir-ou-is/">
    <div><h2>SCI à l'IR ou à l'IS ?</h2><p>Les impôts des deux options sur toute la durée du projet, revente comprise.</p></div>
    <div class="apercu"><small>Bien à 200 000 €, 15 ans</small><b>{{ECART_SCI}}</b><small>{{GAGNANT_SCI}}</small></div>
    <span class="bouton petit-bouton">Comparer les deux options</span>
  </a>
  <a class="outil-ligne bientot" href="formations/">
    <div><h2>Les formations arrivent</h2><p>Apprendre la comptabilité simplement, pour gérer ses comptes ou réussir ses examens.</p></div>
    <span class="bouton petit-bouton secondaire">Découvrir le programme</span>
  </a>
</div>
<section class="cadre" style="padding-top:2.5rem"><div class="lecture">
  <h2>Grain de Sou, c'est quoi ?</h2>
  <p>Chaque jour, une vidéo courte qui explique l'argent et l'économie simplement : l'actualité de ton porte-monnaie, des astuces concrètes et les grands sujets (impôts, immobilier, entreprise) décryptés, chiffres à l'appui. Ces calculateurs prolongent les vidéos : tu y appliques les règles à tes propres chiffres.</p>
  <p class="petit">Tout se calcule dans ton navigateur : les chiffres que tu entres restent chez toi.</p>
</div></section>
""")

# ---------------------------------------------------------------- Petites dépenses
page("petites-depenses/", "Le vrai prix de tes petites dépenses | Grain de Sou",
     "Un café par jour, un abonnement, un repas livré : calcule ce que ta petite dépense représente sur un mois, un an et dix ans.",
     """<section class="outil-haut"><div class="cadre">
  <h1>Ta petite dépense, sur 10 ans</h1>
  <p>Choisis une dépense qui revient souvent : le ticket te montre ce qu'elle pèse sur un mois, un an, dix ans… et ce que ça donnerait mis de côté.</p>
</div></section>
<div class="cadre atelier">
  <form class="saisie" id="form-depenses">
    <div class="raccourcis" aria-label="Exemples">
      <button type="button" data-quoi="Café à emporter" data-montant="2,50" data-frequence="jour" aria-pressed="true">☕ Café 2,50 € par jour</button>
      <button type="button" data-quoi="Abonnement streaming" data-montant="13,99" data-frequence="mois" aria-pressed="false">📺 Streaming 13,99 € par mois</button>
      <button type="button" data-quoi="Repas livré" data-montant="18" data-frequence="semaine" aria-pressed="false">🛵 Repas livré 18 € par semaine</button>
      <button type="button" data-quoi="Snack au distributeur" data-montant="1,80" data-frequence="jour" aria-pressed="false">🍫 Snack 1,80 € par jour</button>
      <button type="button" data-quoi="Paquet de cigarettes" data-montant="13" data-frequence="jour" aria-pressed="false">🚬 Paquet 13 € par jour</button>
    </div>
    <fieldset>
      <legend>Ta dépense</legend>
      <div class="champs">
        <div class="champ"><label for="quoi">C'est quoi ?</label><input class="seul" id="quoi" type="text" value="Café à emporter" maxlength="40"></div>
        <div class="champ"><label for="montant">Montant</label><div class="unite"><input id="montant" inputmode="decimal" value="2,50"><span>€</span></div></div>
      </div>
    </fieldset>
    <fieldset>
      <legend>Elle revient…</legend>
      <div class="choix">
        <label><input type="radio" name="frequence" value="jour" checked> chaque jour</label>
        <label><input type="radio" name="frequence" value="semaine"> chaque semaine</label>
        <label><input type="radio" name="frequence" value="mois"> chaque mois</label>
      </div>
    </fieldset>
    <fieldset>
      <legend>Sur combien de temps ?</legend>
      <div class="champs">
        <div class="champ"><label for="annees">Durée</label><div class="unite"><input id="annees" inputmode="numeric" value="10"><span>ans</span></div></div>
        <div class="champ"><label for="taux">Si c'était mis de côté à</label><div class="unite"><input id="taux" inputmode="decimal" value="1,7"><span>% par an</span></div>
          <span class="aide">Livret A : 1,7 % par an depuis le 1er août 2026. Mets 0 pour compter seulement la dépense.</span></div>
      </div>
    </fieldset>
  </form>

  <aside class="ticket" aria-live="polite" aria-label="Résultat">
    <div class="ticket-tete"><strong>TICKET DE TA DÉPENSE</strong><span id="t-quoi"></span></div>
    <div class="ligne"><span>Par mois</span><b id="t-mois"></b></div>
    <div class="ligne"><span>Par an</span><b id="t-an"></b></div>
    <div class="ligne"><span id="t-annees-label">Sur 10 ans</span><b id="t-total"></b></div>
    <div class="total">
      <span class="etiquette" id="t-place-label"></span>
      <span class="montant" id="t-place"></span>
      <span class="petit" id="t-interets"></span>
    </div>
    <p class="phrase" id="t-phrase"></p>
    <p class="pied main">Merci de ta visite ! Sou</p>
  </aside>
</div>
<section class="cadre explications"><div class="lecture">
  <h2>Comment c'est calculé</h2>
  <ul>
    <li>Une dépense par jour compte 365 fois par an, par semaine 52 fois, par mois 12 fois.</li>
    <li>« Mis de côté » : chaque mois, tu verses l'équivalent de ta dépense sur un placement qui rapporte le taux indiqué, et les intérêts produisent à leur tour des intérêts. C'est une estimation : le Livret A calcule ses intérêts par quinzaine et son taux change deux fois par an.</li>
    <li>Le prix de ta dépense reste le même pendant toute la durée : avec l'inflation, le vrai total serait un peu plus élevé.</li>
  </ul>
  <p>L'idée n'est pas de tout supprimer : c'est de choisir en connaissant le vrai prix. Une dépense qui te fait plaisir chaque jour vaut peut-être ses 900 € par an. Une autre que tu fais par habitude, peut-être moins.</p>
</div></section>
""", scripts=("petites-depenses.js",))

# ---------------------------------------------------------------- Budget
champ = lambda i, l, aide="": f'<div class="champ"><label for="{i}">{l}</label><div class="unite"><input id="{i}" inputmode="decimal" placeholder="0"><span>€</span></div>{f"<span class=aide>{aide}</span>" if aide else ""}</div>'
page("budget/", "Ton budget 50/30/20 | Grain de Sou",
     "Calcule ton budget avec la méthode 50/30/20 : la part de ton salaire pour l'essentiel, les envies et l'épargne, puis compare avec tes vraies dépenses.",
     f"""<section class="outil-haut"><div class="cadre">
  <h1>Ton budget 50/30/20</h1>
  <p>Un repère simple : la moitié pour l'essentiel, 30 % pour les envies, 20 % pour l'épargne. Entre ton revenu, puis tes vraies dépenses si tu veux comparer.</p>
</div></section>
<div class="cadre atelier">
  <form class="saisie" id="form-budget">
    <fieldset>
      <legend>Ton revenu</legend>
      <div class="champs">
        <div class="champ"><label for="revenu">Revenu net par mois</label><div class="unite"><input id="revenu" inputmode="decimal" value="2 000"><span>€</span></div>
          <span class="aide">Ce qui arrive sur ton compte, après impôt prélevé à la source. Pour un couple, additionne les deux.</span></div>
      </div>
    </fieldset>
    <details class="plus" open>
      <summary>Compare avec tes vraies dépenses (facultatif)</summary>
      <fieldset>
        <legend>L'essentiel, chaque mois</legend>
        <div class="champs">
          {champ("logement", "Loyer ou crédit + charges")}
          {champ("courses", "Courses")}
          {champ("transport", "Transport", "Carburant, assurance auto, abonnement transports")}
          {champ("factures", "Factures", "Énergie, eau, internet, téléphone, assurance habitation")}
          {champ("autres-besoins", "Autres dépenses obligatoires", "Santé, crèche, cantine, crédit conso…")}
        </div>
      </fieldset>
      <fieldset>
        <legend>Les envies, chaque mois</legend>
        <div class="champs">
          {champ("sorties", "Sorties et restaurants")}
          {champ("shopping", "Shopping et loisirs")}
          {champ("abonnements", "Abonnements plaisir", "Streaming, salle de sport, jeux…")}
          {champ("vacances", "Vacances", "Ton budget annuel divisé par 12")}
        </div>
      </fieldset>
      <fieldset>
        <legend>L'épargne, chaque mois</legend>
        <div class="champs">{champ("epargne", "Mis de côté", "Livret, virement automatique, placements")}</div>
      </fieldset>
    </details>
  </form>

  <aside class="ticket" aria-live="polite" aria-label="Résultat">
    <div class="ticket-tete"><strong>TICKET DE TON BUDGET</strong><span>Méthode 50/30/20, par mois</span></div>
    <div class="ligne"><span>Revenu</span><b id="t-revenu"></b></div>
    <div class="ligne sep"><span>🏠 L'essentiel (50 %)</span><b id="t-besoins"></b></div>
    <div class="ligne"><span>🎉 Les envies (30 %)</span><b id="t-envies"></b></div>
    <div class="ligne"><span>🐷 L'épargne (20 %)</span><b id="t-epargne"></b></div>
    <div class="total"><span class="etiquette">Épargne visée sur un an</span><span class="montant" id="t-epargne-an"></span></div>
    <div id="comparaison" hidden>
      <div class="barres" aria-label="Tes vraies dépenses comparées aux repères (trait noir)">
        <div class="barre"><div class="haut"><span>L'essentiel</span><span id="r-besoins"></span></div><div class="piste"><div class="rempli" id="b-besoins"></div><div class="repere"></div></div></div>
        <div class="barre"><div class="haut"><span>Les envies</span><span id="r-envies"></span></div><div class="piste"><div class="rempli or" id="b-envies"></div><div class="repere"></div></div></div>
        <div class="barre"><div class="haut"><span>L'épargne</span><span id="r-epargne"></span></div><div class="piste"><div class="rempli" id="b-epargne"></div><div class="repere"></div></div></div>
      </div>
      <p class="petit">Le trait noir marque le repère 50/30/20.</p>
      <div class="total"><span class="etiquette" id="t-reste-etiquette"></span><span class="montant" id="t-reste"></span></div>
      <ul class="phrase" id="conseils"></ul>
    </div>
    <p class="pied main">Merci de ta visite ! Sou</p>
  </aside>
</div>
<section class="cadre explications"><div class="lecture">
  <h2>La méthode 50/30/20 en bref</h2>
  <ul>
    <li><strong>50 % pour l'essentiel</strong> : ce que tu dois payer quoi qu'il arrive (logement, courses, transport pour aller travailler, factures, assurances).</li>
    <li><strong>30 % pour les envies</strong> : ce qui rend la vie agréable et que tu peux ajuster (sorties, shopping, abonnements, vacances).</li>
    <li><strong>20 % pour l'épargne</strong> : l'épargne de précaution d'abord (souvent 3 à 6 mois de dépenses), puis tes projets.</li>
  </ul>
  <p>C'est un repère, pas une règle. Dans une grande ville avec un loyer élevé, un partage 60/20/20 est souvent plus réaliste. L'important, c'est de savoir où va chaque euro et de garder une part pour l'épargne, même petite.</p>
  <p class="petit">Astuce : programme un virement automatique vers ton épargne le jour où ton salaire arrive. Ce qui part en premier ne se dépense pas.</p>
</div></section>
""", scripts=("budget.js",))

# ---------------------------------------------------------------- SCI
def num(i, label, valeur, unite, aide=""):
    a = f'<span class="aide">{aide}</span>' if aide else ""
    return f'<div class="champ"><label for="{i}">{label}</label><div class="unite"><input id="{i}" inputmode="decimal" value="{valeur}"><span>{unite}</span></div>{a}</div>'

tmi = "".join(f'<label><input type="radio" name="tmi" value="{v}"{" checked" if v == 30 else ""}> {v} %</label>' for v in (0, 11, 30, 41, 45))
page("sci-ir-ou-is/", "SCI à l'IR ou à l'IS : le comparatif 2026 | Grain de Sou",
     "Compare les impôts d'une SCI à l'impôt sur le revenu et d'une SCI à l'impôt sur les sociétés, année par année et à la revente, avec les règles 2026.",
     f"""<section class="outil-haut"><div class="cadre">
  <h1>SCI à l'IR ou à l'IS ?</h1>
  <p>Les impôts des deux options sur toute la durée du projet, revente comprise, avec les règles 2026. Change les chiffres : le ticket se met à jour.</p>
</div></section>
<div class="cadre atelier">
  <form class="saisie" id="form-sci">
    <fieldset>
      <legend>Le bien</legend>
      <div class="champs">
        {num("prix", "Prix d'achat", "200 000", "€", "Sans les frais de notaire ni d'agence.")}
        {num("frais", "Frais d'achat", "8", "% du prix", "Notaire et agence : souvent 7 à 8 % dans l'ancien.")}
        {num("terrain", "Part du terrain", "15", "% du prix", "Le terrain ne s'amortit pas à l'IS. Souvent 10 à 20 %.")}
      </div>
    </fieldset>
    <fieldset>
      <legend>Les loyers et les charges</legend>
      <div class="champs">
        {num("loyer", "Loyer", "900", "€ / mois", "Hors charges, location vide.")}
        {num("charges", "Charges du propriétaire", "2 000", "€ / an", "Taxe foncière, assurance, copropriété non récupérable, entretien.")}
      </div>
    </fieldset>
    <fieldset>
      <legend>L'emprunt</legend>
      <div class="champs">
        {num("emprunt", "Montant emprunté", "180 000", "€", "Mets 0 pour un achat sans crédit.")}
        {num("taux", "Taux", "3,5", "%")}
        {num("duree-emprunt", "Durée", "20", "ans")}
      </div>
    </fieldset>
    <fieldset>
      <legend>Les associés</legend>
      <div class="champ" style="margin-bottom:1rem"><span class="titre" id="tmi-titre">Tranche d'imposition des associés</span>
        <div class="choix" role="radiogroup" aria-labelledby="tmi-titre">{tmi}</div>
        <span class="aide">Le taux marginal indiqué sur l'avis d'impôt. Le simulateur prend le même pour tous les associés.</span></div>
      <div class="champs">{num("associes", "Nombre de foyers associés", "2", "foyers", "Parts égales. Compte un couple marié comme un seul foyer.")}</div>
    </fieldset>
    <fieldset>
      <legend>La durée et la revente</legend>
      <div class="champs">
        {num("duree", "Durée de détention", "15", "ans", "Entre 1 et 30 ans.")}
        {num("hausse", "Hausse du prix du bien", "1,5", "% par an")}
      </div>
      <label class="case" style="margin-top:1rem"><input type="checkbox" id="revente" checked> Inclure la revente à la fin</label>
    </fieldset>
    <details class="plus">
      <summary>Réglages de la SCI à l'IS</summary>
      <div class="champs">
        {num("amort", "Durée d'amortissement du bâtiment", "30", "ans", "Souvent entre 25 et 40 ans.")}
        {num("compta", "Comptabilité en plus à l'IS", "1 000", "€ / an", "Bilan et liasse fiscale, souvent confiés à un expert-comptable.")}
      </div>
      <label class="case" style="margin-top:1rem"><input type="checkbox" id="verser" checked> Les bénéfices sont versés aux associés chaque année</label>
    </details>
  </form>

  <aside class="ticket" aria-live="polite" aria-label="Résultat">
    <div class="ticket-tete"><strong>TICKET SCI : IR OU IS</strong><span id="t-duree"></span></div>
    <div class="ligne"><span><strong>SCI à l'IR</strong></span><b></b></div>
    <div class="ligne"><span>Impôt et prélèvements sur les loyers</span><b id="t-ir-annuel"></b></div>
    <div class="ligne"><span>Impôt sur la plus-value</span><b id="t-ir-pv"></b></div>
    <div class="ligne"><span>Total</span><b id="t-ir-total"></b></div>
    <div class="ligne sep"><span><strong>SCI à l'IS</strong></span><b></b></div>
    <div class="ligne"><span>Impôt sur les sociétés</span><b id="t-is-impot"></b></div>
    <div class="ligne"><span>Impôt sur les sommes versées (31,4 %)</span><b id="t-is-pfu"></b></div>
    <div class="ligne"><span>Comptabilité en plus</span><b id="t-is-compta"></b></div>
    <div class="ligne"><span>Total</span><b id="t-is-total"></b></div>
    <div class="barres">
      <div class="barre"><div class="haut"><span>IR</span><span id="b-ir-val"></span></div><div class="piste"><div class="rempli" id="b-ir"></div></div></div>
      <div class="barre"><div class="haut"><span>IS</span><span id="b-is-val"></span></div><div class="piste"><div class="rempli or" id="b-is"></div></div></div>
    </div>
    <div class="total"><span class="etiquette" id="t-ecart-etiquette"></span><span class="montant" id="t-ecart"></span></div>
    <p class="phrase" id="t-phrase"></p>
    <p class="pied">Règles générales 2026. Simulation pédagogique, pas un conseil personnalisé.</p>
  </aside>
</div>
<section class="cadre explications">
  <div class="lecture">
    <h2>Pourquoi cet écart</h2>
    <ul id="pourquoi"></ul>
  </div>
  <h2>Année par année</h2>
  <div class="tableau-defile">
    <table id="tableau-sci">
      <caption class="visually-hidden">Résultat et impôts de la SCI année par année, à l'IR et à l'IS</caption>
      <thead><tr><th>Année</th><th>IR : résultat foncier</th><th>IR : impôt et prélèvements</th><th>IS : résultat</th><th>IS : impôt sur les sociétés</th><th>IS : impôt sur les sommes versées</th></tr></thead>
      <tbody></tbody>
      <tfoot></tfoot>
    </table>
  </div>
  <p class="petit">Un montant négatif côté IR est une économie d'impôt : le déficit foncier baisse l'impôt sur les autres revenus des associés.</p>
  <div class="lecture">
    <h2>Les règles utilisées (2026)</h2>
    <ul>
      <li><strong>SCI à l'IR</strong> : les loyers, moins les charges et les intérêts d'emprunt, sont imposés chez chaque associé à sa tranche d'imposition, plus 17,2 % de prélèvements sociaux.</li>
      <li><strong>Déficit foncier</strong> : la part qui vient des charges (hors intérêts) baisse le revenu global jusqu'à 10 700 € par foyer et par an ; le reste se reporte sur les loyers des 10 années suivantes.</li>
      <li id="bloc-revente"><strong>Revente à l'IR</strong> : la plus-value est taxée à 19 % d'impôt et 17,2 % de prélèvements sociaux, avec un abattement chaque année à partir de la 6e (plus d'impôt après 22 ans, plus de prélèvements après 30 ans) et une surtaxe au-delà de 50 000 € de plus-value par associé. Les frais d'achat (réels ou forfait de 7,5 %) et un forfait travaux de 15 % après 5 ans s'ajoutent au prix d'achat.</li>
      <li><strong>SCI à l'IS</strong> : la société paie 15 % jusqu'à 42 500 € de bénéfice, 25 % au-delà. Elle déduit les frais d'achat la 1re année et amortit le bâtiment (hors terrain). Un déficit se reporte sur les bénéfices suivants.</li>
      <li><strong>Revente à l'IS</strong> : la plus-value se calcule sur le prix d'achat diminué des amortissements déjà déduits, puis elle est imposée à l'IS. Ici, tout le bénéfice est versé aux associés l'année de la vente.</li>
      <li><strong>Sommes versées aux associés</strong> (dividendes) : 31,4 % (12,8 % d'impôt et 18,6 % de prélèvements sociaux).</li>
    </ul>
    <h2>Ce que la simulation laisse de côté</h2>
    <ul>
      <li>Les loyers et les charges restent fixes : pas de hausse, pas de mois sans locataire, pas de gros travaux.</li>
      <li>À l'IS, les associés peuvent aussi récupérer sans impôt l'argent qu'ils ont prêté à la SCI (compte courant) : le simulateur traite toutes les sommes versées comme des dividendes.</li>
      <li>Le taux réduit de 15 % suppose un capital entièrement versé et détenu à 75 % au moins par des personnes physiques.</li>
      <li>La CSG déductible, la CFE, les frais de revente, l'IFI, la donation et la succession des parts.</li>
      <li>Le passage à l'IS se décide une fois : on peut encore y renoncer pendant les 5 premières années, ensuite il devient définitif.</li>
    </ul>
    <div class="avertissement">
      <p>Ce simulateur applique des règles générales à tes chiffres. Il ne connaît pas toute ta situation (autres revenus, famille, projets). Pour une décision, un professionnel (expert-comptable, avocat fiscaliste, notaire) peut étudier ton cas.</p>
    </div>
  </div>
</section>
""", scripts=("sci.js",))

# ---------------------------------------------------------------- Inscription confirmée
if INSCRIPTION_OUVERTE: page("inscription-confirmee/", "Inscription confirmée | Grain de Sou", "Ton inscription à Grain de Sou est confirmée.",
     """<div class="cadre"><div class="texte lecture">
  <h1>C'est confirmé, bienvenue !</h1>
  <p>Tu recevras les prochains outils de Grain de Sou en avant-première, au plus un e-mail par semaine. Un lien en bas de chaque e-mail te permet de te désinscrire quand tu veux.</p>
  <p>En attendant, les calculateurs sont là :</p>
  <ul>
    <li><a href="../petites-depenses/">Ta petite dépense, sur 10 ans</a></li>
    <li><a href="../budget/">Ton budget 50/30/20</a></li>
    <li><a href="../sci-ir-ou-is/">SCI à l'IR ou à l'IS ?</a></li>
  </ul>
</div></div>
""", avec_inscription=False)

# ---------------------------------------------------------------- Formations (teasing)
page("formations/", "Les formations Grain de Sou arrivent bientôt", "Bientôt sur Grain de Sou : des formations pour apprendre la comptabilité simplement, pour les indépendants, les propriétaires de SCI et les étudiants.",
     """<section class="outil-haut"><div class="cadre">
  <p class="note-main clair">En préparation…</p>
  <h1>Les formations Grain de Sou arrivent bientôt</h1>
  <p>Apprendre la comptabilité simplement : des explications claires, des exemples chiffrés et des outils prêts à servir.</p>
</div></section>
<div class="cadre formations">
  <article class="carte-formation">
    <span class="pastille">Bientôt</span>
    <h2>Pour les indépendants et les propriétaires de SCI</h2>
    <p>Tenir ses comptes, comprendre ses impôts et remplir ses déclarations (dont la 2072 d'une SCI) avec méthode et sérénité.</p>
  </article>
  <article class="carte-formation">
    <span class="pastille">Bientôt</span>
    <h2>Pour les étudiants en DCG et DSCG</h2>
    <p>Méthodes, fiches et cas pratiques pour réviser efficacement et aborder chaque épreuve avec confiance.</p>
  </article>
</div>
<section class="cadre explications"><div class="lecture">
  <h2>Ton avis compte</h2>
  <p>Dis en commentaire, sous une vidéo de Grain de Sou, ce que tu aimerais apprendre en premier : les formations se construisent avec tes questions.</p>
</div></section>
""")

# ---------------------------------------------------------------- Pages légales, version anonyme (site non professionnel)
if not INSCRIPTION_OUVERTE:
    page("mentions-legales/", "Mentions légales | Grain de Sou", "Mentions légales du site Grain de Sou.",
     f"""<div class="cadre"><div class="texte lecture">
  <h1>Mentions légales</h1>
  <h2>Éditeur du site</h2>
  <p>Grain de Sou est un site personnel, édité à titre non professionnel par un particulier. Conformément à la loi pour la confiance dans l'économie numérique, ses coordonnées ont été communiquées à l'hébergeur ci-dessous.</p>
  <p>Contact : <a href="mailto:{CONTACT}">{CONTACT}</a></p>
  <h2>Hébergeur</h2>
  <p>GitHub Inc. (service GitHub Pages)<br>88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis<br>Site : github.com</p>
  <h2>Contenu</h2>
  <p>Les calculateurs et les textes de ce site sont pédagogiques. Ils appliquent des règles générales en vigueur à la date indiquée et ne constituent ni un conseil juridique ou fiscal personnalisé, ni un conseil en investissement. Pour une décision qui dépend de ta situation, un professionnel peut étudier ton cas.</p>
  <h2>Propriété intellectuelle</h2>
  <p>Les textes, les illustrations et la mascotte Sou appartiennent à Grain de Sou. Tu peux partager librement le lien des pages.</p>
  <p>Police de caractères : Montserrat, sous licence SIL Open Font License, installée sur le site.</p>
  <h2>Données personnelles</h2>
  <p>Voir la page <a href="../confidentialite/">Confidentialité</a>.</p>
</div></div>
""", avec_inscription=False)

    page("confidentialite/", "Confidentialité | Grain de Sou", "Ce que Grain de Sou fait de tes données personnelles.",
     f"""<div class="cadre"><div class="texte lecture">
  <h1>Confidentialité</h1>
  <h2>Les calculateurs</h2>
  <p>Les chiffres que tu entres dans les calculateurs restent dans ton navigateur. Ils ne sont ni envoyés, ni enregistrés. Le site ne dépose aucun cookie et ne mesure pas l'audience.</p>
  <h2>Si tu écris à Grain de Sou</h2>
  <p>Ton adresse e-mail et ton message servent uniquement à te répondre. Ils ne sont ni vendus, ni prêtés, et sont supprimés quand l'échange est terminé.</p>
  <h2>Hébergement du site</h2>
  <p>Le site est hébergé par GitHub Pages (GitHub Inc., États-Unis). Comme tout hébergeur, GitHub enregistre des informations techniques de connexion (dont l'adresse IP) pour assurer la sécurité du service.</p>
</div></div>
""", avec_inscription=False)

# ---------------------------------------------------------------- Mentions légales
AC = '<span class="a-completer">'
if INSCRIPTION_OUVERTE: page("mentions-legales/", "Mentions légales | Grain de Sou", "Mentions légales du site Grain de Sou.",
     f"""<div class="cadre"><div class="texte lecture">
  <h1>Mentions légales</h1>
  <h2>Éditeur du site</h2>
  <p>{AC}[À COMPLÉTER : nom et prénom de l'éditeur, ou formule choisie avant la mise en ligne]</span><br>
  Contact : <a href="mailto:{CONTACT}">{CONTACT}</a></p>
  <p>Directeur de la publication : {AC}[À COMPLÉTER]</span></p>
  <h2>Hébergeur</h2>
  <p>GitHub Inc. (service GitHub Pages)<br>88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis<br>Site : github.com</p>
  <h2>Contenu</h2>
  <p>Les calculateurs et les textes de ce site sont pédagogiques. Ils appliquent des règles générales en vigueur à la date indiquée et ne constituent ni un conseil juridique ou fiscal personnalisé, ni un conseil en investissement. Pour une décision qui dépend de ta situation, un professionnel peut étudier ton cas.</p>
  <h2>Propriété intellectuelle</h2>
  <p>Les textes, illustrations et la mascotte Sou sont la propriété de Grain de Sou. Tu peux partager librement le lien des pages.</p>
  <p>Police de caractères : Montserrat, sous licence SIL Open Font License, installée sur le site.</p>
  <h2>Données personnelles</h2>
  <p>Voir la page <a href="../confidentialite/">Confidentialité</a>.</p>
</div></div>
""", avec_inscription=False)

# ---------------------------------------------------------------- Confidentialité
if INSCRIPTION_OUVERTE: page("confidentialite/", "Confidentialité | Grain de Sou", "Ce que Grain de Sou fait de tes données personnelles.",
     f"""<div class="cadre"><div class="texte lecture">
  <h1>Confidentialité</h1>
  <p>Version du {AC}[date de mise en ligne]</span>.</p>
  <h2>Les calculateurs</h2>
  <p>Les chiffres que tu entres dans les calculateurs restent dans ton navigateur. Ils ne sont ni envoyés, ni enregistrés. Le site n'utilise pas de cookies et ne mesure pas l'audience.</p>
  <h2>L'inscription aux e-mails</h2>
  <ul>
    <li><strong>Ce qui est collecté</strong> : ton adresse e-mail, la date de ton inscription et la preuve de ton accord (confirmation par e-mail).</li>
    <li><strong>Pourquoi</strong> : t'envoyer les e-mails de Grain de Sou (nouveaux outils, sujets décryptés), au plus un par semaine.</li>
    <li><strong>Sur quelle base</strong> : ton accord, donné en cochant la case puis en confirmant ton adresse.</li>
    <li><strong>Qui y a accès</strong> : Grain de Sou et son outil d'envoi d'e-mails, Brevo (Sendinblue SAS, entreprise française, données hébergées dans l'Union européenne). L'adresse n'est jamais vendue ni prêtée.</li>
    <li><strong>Combien de temps</strong> : jusqu'à ta désinscription. Une adresse qui n'ouvre plus aucun e-mail pendant 3 ans est supprimée.</li>
  </ul>
  <h2>Tes droits</h2>
  <p>Tu peux te désinscrire à tout moment avec le lien en bas de chaque e-mail. Tu peux aussi demander à consulter, corriger ou supprimer tes données en écrivant à <a href="mailto:{CONTACT}">{CONTACT}</a>. Si tu estimes que tes droits ne sont pas respectés, tu peux t'adresser à la CNIL (cnil.fr).</p>
  <h2>Responsable du traitement</h2>
  <p>{AC}[À COMPLÉTER : même identité que l'éditeur]</span>, joignable à <a href="mailto:{CONTACT}">{CONTACT}</a>.</p>
  <h2>Hébergement du site</h2>
  <p>Le site est hébergé par GitHub Pages (GitHub Inc., États-Unis). Comme tout hébergeur, GitHub enregistre des informations techniques de connexion (dont l'adresse IP) pour assurer la sécurité du service.</p>
</div></div>
""", avec_inscription=False)

print("Pages écrites dans", SITE)

# ---------------------------------------------------------------- Aperçu SCI de l'accueil (calculé avec le simulateur)
import json, subprocess
code = """const s=require('./assets/sci.js');const r=s.simulerSCI({prix:200000,fraisAchatPct:.08,terrainPct:.15,loyerMensuel:900,charges:2000,emprunt:180000,tauxEmprunt:.035,dureeEmprunt:20,tmi:.30,associes:2,duree:15,revente:true,hausse:.015,dureeAmort:30,compta:1000,verser:true});console.log(JSON.stringify({ecart:r.ecart}))"""
ecart = json.loads(subprocess.run(["node", "-e", code], capture_output=True, text=True, cwd=SITE).stdout)["ecart"]
accueil = SITE / "index.html"
montant = f"{round(abs(ecart)):,}".replace(",", " ") + " €"
gagnant = "d'écart, ici en faveur de l'IS" if ecart > 0 else "d'écart, ici en faveur de l'IR"
accueil.write_text(accueil.read_text(encoding="utf-8").replace("{ECART_SCI}", montant).replace("{GAGNANT_SCI}", gagnant), encoding="utf-8")
print("Aperçu SCI :", montant, gagnant)
