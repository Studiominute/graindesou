/* Grain de Sou – outils communs : formats, lecture des champs, inscription */

/* ---------- Réglage de l'inscription (Brevo) ----------
   Adresse d'envoi du formulaire Brevo : elle se trouve dans le code
   d'intégration du formulaire (attribut action="https://….sibforms.com/serve/…").
   Tant qu'elle est vide, le formulaire affiche « L'inscription ouvre très bientôt ». */
const INSCRIPTION = {
  action: "",
  champEmail: "EMAIL",
  champConsentement: "OPT_IN",
  champsCaches: { locale: "fr", html_type: "simple" }
};

const GDS = {
  euros(n, decimales) {
    const d = decimales ?? (Math.abs(n) < 100 && n % 1 !== 0 ? 2 : 0);
    return GDS.propre(new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: d, maximumFractionDigits: d }).format(n));
  },
  nombre(n, d = 0) {
    return GDS.propre(new Intl.NumberFormat("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n));
  },
  /* espace insécable lisible et vrai signe moins */
  propre(t) {
    return t.replace(/\u202f/g, "\u00a0").replace(/^-/, "\u2212");
  },
  pourcent(n, d = 0) {
    return GDS.nombre(n, d) + "\u00a0%";
  },
  lire(id, defaut = 0) {
    const el = document.getElementById(id);
    if (!el) return defaut;
    const brut = String(el.value).replace(/\s/g, "").replace(",", ".");
    const v = parseFloat(brut);
    return Number.isFinite(v) ? v : defaut;
  },
  ecrire(id, texte) {
    const el = document.getElementById(id);
    if (el) el.textContent = texte;
  },
  /* Résumé collant sur téléphone, masqué quand le ticket est à l'écran */
  resume(texte, montant) {
    let el = document.querySelector(".resume-mobile");
    const ticket = document.querySelector(".ticket");
    if (!el && ticket) {
      ticket.id = ticket.id || "ticket";
      el = document.createElement("a");
      el.className = "resume-mobile";
      el.href = "#" + ticket.id;
      el.innerHTML = "<span></span><b></b>";
      document.body.appendChild(el);
      new IntersectionObserver(([e]) => { el.hidden = e.isIntersecting; }, { threshold: 0.15 }).observe(ticket);
    }
    if (!el) return;
    el.querySelector("span").textContent = texte;
    el.querySelector("b").textContent = montant;
  },
  /* Relance le calcul à chaque saisie */
  surSaisie(formulaire, calcul) {
    formulaire.addEventListener("input", calcul);
    formulaire.addEventListener("change", calcul);
    formulaire.addEventListener("submit", e => { e.preventDefault(); calcul(); });
    calcul();
  }
};

/* ---------- Formulaire d'inscription ---------- */
document.querySelectorAll(".form-inscription").forEach(form => {
  const message = form.querySelector(".message-form");
  const bouton = form.querySelector("button[type=submit]");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    message.className = "message-form";
    const email = form.querySelector("input[type=email]").value.trim();
    const consentement = form.querySelector("input[name=consentement]").checked;
    const robot = form.querySelector("input[name=email_address_check]").value;
    if (robot) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      message.textContent = "Vérifie ton adresse e-mail : elle doit ressembler à prenom@exemple.fr.";
      message.classList.add("erreur");
      return;
    }
    if (!consentement) {
      message.textContent = "Coche la case pour accepter de recevoir les e-mails.";
      message.classList.add("erreur");
      return;
    }
    if (!INSCRIPTION.action) {
      message.textContent = "L'inscription ouvre très bientôt. Repasse dans quelques jours !";
      return;
    }
    const donnees = new FormData();
    donnees.append(INSCRIPTION.champEmail, email);
    donnees.append(INSCRIPTION.champConsentement, "1");
    donnees.append("email_address_check", "");
    Object.entries(INSCRIPTION.champsCaches).forEach(([k, v]) => donnees.append(k, v));
    bouton.disabled = true;
    try {
      await fetch(INSCRIPTION.action, { method: "POST", body: donnees, mode: "no-cors" });
      form.reset();
      message.textContent = "C'est presque fini : ouvre l'e-mail de confirmation que tu viens de recevoir (pense à regarder dans les spams).";
    } catch {
      message.textContent = "L'envoi n'est pas passé. Vérifie ta connexion et réessaie.";
      message.classList.add("erreur");
    } finally {
      bouton.disabled = false;
    }
  });
});
