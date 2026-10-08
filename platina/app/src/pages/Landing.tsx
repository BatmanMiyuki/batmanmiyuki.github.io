import { useEffect, useState } from "react";
import { PhoneFrame } from "../components/PhoneFrame";
import { Reveal } from "../components/Reveal";
import { SheetProvider } from "../components/Sheet";
import { NavCtx } from "../lib/nav";
import { SCREENS } from "../lib/screens";
import { CrownIcon, PlatinaLogo, PlatinumBadge, TrophyCup } from "../lib/icons";
import { earnedTrophies, levelOf, progressOf, useStore } from "../lib/store";
import { CountUp } from "../components/CountUp";
import { ProjectExport } from "../components/ProjectExport";
import { useInstall } from "../lib/pwa";
import { DownloadIcon } from "../lib/icons2";
import type { ScreenId } from "../lib/data";

const CAPTIONS: { id: ScreenId; index: string; title: string; note: string }[] = [
  { id: "stats", index: "01", title: "Stats", note: "Niveau, trophées & progression" },
  { id: "games", index: "02", title: "Jeux", note: "En cours & platinés" },
  { id: "play", index: "03", title: "Play", note: "Temps de jeu & dépenses" },
  { id: "settings", index: "04", title: "Paramètres", note: "Compte & préférences" },
];

const NAV = [
  { label: "Aperçu", href: "#apercu" },
  { label: "Fonctions", href: "#fonctions" },
  { label: "Démarrer", href: "#demarrer" },
  { label: "FAQ", href: "#faq" },
];

function ShowcasePhone({ initial }: { initial: ScreenId }) {
  const [tab, setTab] = useState<ScreenId>(initial);
  const Active = SCREENS[tab];
  return (
    <NavCtx.Provider value={{ tab, setTab }}>
      <PhoneFrame active={tab} onNavigate={setTab}>
        <Active />
      </PhoneFrame>
    </NavCtx.Provider>
  );
}

/* --------------------------------------------------- stats réelles du compte */

function LiveStats() {
  const { state } = useStore();
  const items = [
    { value: levelOf(state), label: "Niveau actuel" },
    { value: earnedTrophies(state), label: "Trophées obtenus" },
    { value: state.games.filter((g) => g.counts[0] > 0).length, label: "Platinés" },
    { value: Math.round(state.totalHours), label: "Heures de jeu" },
  ];
  return (
    <ul className="grid grid-cols-2 gap-[10px] sm:grid-cols-4">
      {items.map((it, i) => (
        <li
          key={it.label}
          className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] px-4 py-5 backdrop-blur-sm"
        >
          <CountUp
            value={it.value}
            delay={i * 120}
            duration={1700}
            className="tnum block text-[28px] leading-none font-extrabold tracking-[-0.03em] text-white sm:text-[32px]"
          />
          <div className="mt-[8px] text-[10.5px] font-medium tracking-[0.06em] text-mut uppercase">
            {it.label}
          </div>
        </li>
      ))}
    </ul>
  );
}

function AccountBadge() {
  const { state } = useStore();
  const total = state.games.reduce((a, g) => a + g.total, 0);
  if (!state.loggedIn) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-[13px] py-[6px] text-[11.5px] font-medium text-mut-2">
        <span className="h-[6px] w-[6px] rounded-full bg-mut" />
        Aucun compte connecté
      </span>
    );
  }
  if (total === 0) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-[13px] py-[6px] text-[11.5px] font-medium text-mut-2">
        <span className="h-[6px] w-[6px] rounded-full bg-[#3ddc97]" />
        Connecté · {state.profile.name} · collection vide
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-[13px] py-[6px] text-[11.5px] font-medium text-mut-2">
      <span className="h-[6px] w-[6px] rounded-full bg-[#3ddc97]" />
      Connecté · {state.profile.name} · {state.games.length} jeu
      {state.games.length > 1 ? "x" : ""}
    </span>
  );
}

function LibraryPreview() {
  const { state } = useStore();
  const games = state.games.slice(0, 4);
  if (games.length === 0) {
    return (
      <div className="rounded-[18px] border border-dashed border-white/12 px-6 py-8 text-center">
        <TrophyCup tone="plat" className="mx-auto h-9 w-9 opacity-70" />
        <p className="mt-3 text-[13px] font-semibold text-white">Ta bibliothèque est vide</p>
        <p className="mx-auto mt-1.5 max-w-[34ch] text-[12.5px] leading-relaxed text-mut-2">
          Ajoute tes jeux dans l'application : chaque trophée débloqué nourrit tes statistiques ici.
        </p>
      </div>
    );
  }
  return (
    <ul className="grid gap-[10px] sm:grid-cols-2">
      {games.map((g) => {
        const p = progressOf(g);
        return (
          <li
            key={g.id}
            className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] px-4 py-3.5"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-[13.5px] font-semibold text-white">{g.title}</span>
              <span className="tnum shrink-0 text-[12px] text-brand-2">{p}%</span>
            </div>
            <div className="mt-2.5 h-[5px] overflow-hidden rounded-full bg-white/[0.09]">
              <div
                className={p === 100 ? "h-full rounded-full bg-[linear-gradient(90deg,#7c5cff,#a78bfa)]" : "h-full rounded-full bg-[linear-gradient(90deg,#1e56d6,#4f8cff)]"}
                style={{ width: `${p}%` }}
              />
            </div>
            <div className="mt-2 flex items-center gap-2.5 text-[10.5px] text-mut">
              {g.counts[0] > 0 && <CrownIcon className="h-[10px] w-[13px] text-[#7c8cff]" />}
              <span className="tnum">
                {g.counts[0]}P · {g.counts[1]}Or · {g.counts[2]}Ag · {g.counts[3]}Bz
              </span>
              <span className="ml-auto rounded-[4px] border border-white/[0.09] px-[4px] py-[1px]">
                {g.platform}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------------------------------------------------------scroll bar */

function Progress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);
  return (
    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/[0.06]">
      <div
        className="h-full bg-[linear-gradient(90deg,#2f6bff,#8ec9ff)] transition-[width] duration-150"
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

const STEPS = [
  {
    n: "01",
    t: "Crée ton compte",
    d: "Un identifiant et un mot de passe. Tes progrès sont enregistrés et protégés sur ton appareil.",
  },
  {
    n: "02",
    t: "Lie ton PlayStation Network",
    d: "Ton NPSSO reste dans un secret GitHub : un workflow importe tes jeux, trophées et heures, puis Platina lit le fichier publié. Aucun jeton dans le navigateur.",
  },
  {
    n: "03",
    t: "Ajoute tes jeux et trophées",
    d: "Chaque trophée débloqué met à jour ton niveau, tes platinés, ton temps de jeu et tes dépenses.",
  },
];

const FEATURES = [
  {
    title: "Niveau et XP en direct",
    body: "Bronze 3 XP, argent 8, or 20, platine 40. Un niveau tous les 100 XP, recalculé à chaque trophée.",
  },
  {
    title: "Bibliothèque illimitée",
    body: "Ajoute tes jeux PS5 et PS4, fixe le nombre de trophées et suis la progression de chacun.",
  },
  {
    title: "Temps de jeu",
    body: "Enregistre tes sessions et consulte ton graphique par jour, semaine ou mois.",
  },
  {
    title: "Dépenses PS Store",
    body: "Note tes achats, suis ton budget annuel et ton abonnement PlayStation Plus.",
  },
  {
    title: "Trois thèmes",
    body: "Sombre, Minuit ou AMOLED, avec quatre couleurs d'accent au choix.",
  },
  {
    title: "Données à toi",
    body: "Export et import en JSON, réinitialisation, tout reste sur ton appareil.",
  },
];

const FAQ = [
  {
    q: "Platina récupère-t-il vraiment mes trophées PlayStation ?",
    a: "Oui, via ton jeton NPSSO — mais il ne circule jamais dans le navigateur. Tu l'enregistres une fois dans un secret GitHub (PSN_NPSSO), le workflow « Update PlayStation data » échange le jeton côté serveur et publie psn-data.json, puis Platina importe ce fichier. Sony n'a pas d'API publique : c'est le même flux que les outils communautaires (psn-api). Une méthode directe existe dans Paramètres pour les cas particuliers, avec un avertissement.",
  },
  {
    q: "Où sont stockées mes données ?",
    a: "Uniquement dans le stockage local de ton navigateur, associées à ton compte. Rien n'est envoyé sur un serveur. Utilise Paramètres → Sauvegarde & Données pour exporter un fichier JSON.",
  },
  {
    q: "Comment le niveau est-il calculé ?",
    a: "Chaque trophée rapporte de l'XP : bronze 3, argent 8, or 20 et platine 40. Un niveau correspond à 100 XP, exactement comme sur PlayStation.",
  },
  {
    q: "Comment obtient-on une platine ?",
    a: "Débloque tous les autres trophées d'un jeu : la platine devient disponible en dernier et le jeu passe automatiquement à 100 %.",
  },
  {
    q: "Puis-je utiliser Platina sans compte ?",
    a: "Oui, le mode invité fonctionne entièrement. Sans mot de passe, tes données restent simplement accessibles à quiconque utilise cet appareil.",
  },
];

export default function Landing() {
  const { state } = useStore();
  const { available: installable, install: installApp } = useInstall();
  return (
    <SheetProvider>
      <div className="relative min-h-screen bg-black text-white">
        {/* ------------------------------------------------------ fond */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              "radial-gradient(900px 520px at 18% -6%, rgba(47,107,255,0.22), transparent 60%), radial-gradient(820px 480px at 82% 4%, rgba(124,92,255,0.18), transparent 62%), radial-gradient(1000px 700px at 50% 108%, rgba(47,107,255,0.14), transparent 65%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(900px 700px at 50% 0%, black, transparent 78%)",
            WebkitMaskImage: "radial-gradient(900px 700px at 50% 0%, black, transparent 78%)",
          }}
        />

        {/* ------------------------------------------------------- nav */}
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/70 backdrop-blur-xl">
          <div className="mx-auto flex h-[62px] max-w-[1560px] items-center justify-between px-5 sm:px-8">
            <a href="#top" className="group flex items-center gap-[10px]">
              <PlatinaLogo className="h-[26px] w-[29px] transition-transform duration-500 group-hover:rotate-[-6deg]" />
              <span className="text-[19px] font-bold tracking-[-0.03em]">Platina</span>
            </a>
            <nav className="hidden items-center gap-8 md:flex">
              {NAV.map((n) => (
                <a
                  key={n.label}
                  href={n.href}
                  className="text-[13.5px] font-medium text-mut-2 transition-colors hover:text-white"
                >
                  {n.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-[10px]">
              {installable && (
                <button
                  type="button"
                  onClick={() => void installApp()}
                  className="hidden items-center gap-[6px] rounded-full border border-white/12 px-[14px] py-[8px] text-[12.5px] font-semibold text-white transition-all duration-300 hover:border-brand/60 hover:bg-brand/10 sm:flex"
                >
                  <DownloadIcon className="h-[15px] w-[15px]" />
                  Installer l'application
                </button>
              )}
              <a
                href="#/app"
                className="rounded-full bg-brand px-[18px] py-[9px] text-[13px] font-semibold text-white shadow-[0_0_28px_-6px_rgba(47,107,255,0.95)] transition-all duration-300 hover:bg-brand-2 hover:shadow-[0_0_34px_-4px_rgba(79,140,255,1)]"
              >
                {state.loggedIn ? "Ouvrir mon espace" : "Créer mon compte"}
              </a>
            </div>
          </div>
          <Progress />
        </header>

        <main id="top">
          {/* -------------------------------------------------- hero */}
          <section className="mx-auto max-w-[1560px] px-5 pt-14 pb-12 text-center sm:px-8 sm:pt-20">
            <Reveal>
              <AccountBadge />
            </Reveal>
            <Reveal delay={70}>
              <h1 className="mx-auto mt-6 max-w-[16ch] text-[clamp(2.5rem,7.4vw,5rem)] leading-[0.98] font-extrabold tracking-[-0.05em]">
                Tes trophées,
                <br />
                <span className="bg-[linear-gradient(100deg,#8ec9ff,#4f8cff_45%,#7c5cff)] bg-clip-text text-transparent">
                  ta légende.
                </span>
              </h1>
            </Reveal>
            <Reveal delay={140}>
              <p className="mx-auto mt-6 max-w-[56ch] text-[15px] leading-relaxed text-mut-2 sm:text-[17px]">
                Crée ton compte, lie ton PlayStation Network et construis ta collection trophée
                par trophée. Niveau, platinés, temps de jeu et dépenses : tout est calculé en
                direct.
              </p>
            </Reveal>
            <Reveal delay={210}>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="#/app"
                  className="rounded-full bg-white px-7 py-[14px] text-[14px] font-semibold text-black transition-transform duration-300 hover:-translate-y-[2px] hover:bg-white/90"
                >
                  {state.loggedIn ? "Continuer ma collection" : "Commencer gratuitement"}
                </a>
                <a
                  href="#apercu"
                  className="rounded-full border border-white/12 bg-white/[0.03] px-7 py-[14px] text-[14px] font-semibold text-white transition-all duration-300 hover:-translate-y-[2px] hover:border-white/30 hover:bg-white/[0.07]"
                >
                  Voir les écrans
                </a>
              </div>
            </Reveal>

            <Reveal delay={280}>
              <div className="mx-auto mt-12 max-w-[900px]">
                <LiveStats />
              </div>
            </Reveal>

            <Reveal delay={340}>
              <div className="mx-auto mt-10 max-w-[520px]">
                <LibraryPreview />
              </div>
            </Reveal>
          </section>

          {/* ---------------------------------------------- maquettes */}
          <section id="apercu" className="mx-auto max-w-[1560px] scroll-mt-20 px-5 pb-8 sm:px-8">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.07] pb-5">
                <div>
                  <span className="text-[10.5px] font-semibold tracking-[0.14em] text-mut uppercase">
                    Aperçu de l'application
                  </span>
                  <h2 className="mt-2 text-[22px] font-bold tracking-[-0.03em] sm:text-[26px]">
                    Quatre écrans, une seule obsession
                  </h2>
                </div>
                <p className="max-w-[38ch] text-[13px] leading-relaxed text-mut">
                  Ces maquettes affichent tes vraies données. Touche la barre d'onglets pour
                  naviguer.{" "}
                  <a href="#/app" className="text-brand-2 underline-offset-4 hover:underline">
                    Ouvrir l'application →
                  </a>
                </p>
              </div>
            </Reveal>

            <div className="no-bar -mx-5 mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-4 lg:gap-7">
              {CAPTIONS.map((c, i) => (
                <Reveal key={c.id} delay={i * 110} className="min-w-[80%] shrink-0 snap-center sm:min-w-0">
                  <figure id={c.id} className="group scroll-mt-20">
                    <div className="relative">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-6 top-10 bottom-4 -z-10 rounded-[60px] bg-brand/25 opacity-60 blur-[46px] transition-opacity duration-500 group-hover:opacity-100"
                      />
                      <div className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-2">
                        <ShowcasePhone initial={c.id} />
                      </div>
                    </div>
                    <figcaption className="mt-5 flex items-baseline gap-3 px-1">
                      <span className="tnum text-[11px] font-semibold text-brand-2">{c.index}</span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-semibold tracking-[-0.01em]">{c.title}</span>
                        <span className="block text-[12px] text-mut">{c.note}</span>
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </section>

          {/* --------------------------------------------------- étapes */}
          <section id="demarrer" className="mx-auto max-w-[1560px] scroll-mt-20 px-5 py-16 sm:px-8">
            <Reveal>
              <div className="max-w-[52ch]">
                <span className="text-[10.5px] font-semibold tracking-[0.14em] text-mut uppercase">
                  Démarrer
                </span>
                <h2 className="mt-3 text-[clamp(1.6rem,3.6vw,2.4rem)] leading-tight font-extrabold tracking-[-0.035em]">
                  Trois étapes, deux minutes
                </h2>
              </div>
            </Reveal>
            <ul className="mt-9 grid gap-5 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.n}>
                  <Reveal delay={i * 90} className="h-full">
                    <div className="group relative h-full overflow-hidden rounded-[20px] border border-white/[0.07] bg-gradient-to-b from-[#0b0f16] to-[#070a0f] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40">
                      <span className="tnum text-[40px] leading-none font-extrabold text-white/[0.08] transition-colors duration-300 group-hover:text-brand/30">
                        {s.n}
                      </span>
                      <h3 className="mt-3 text-[17px] font-semibold tracking-[-0.01em]">{s.t}</h3>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-mut">{s.d}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>

          {/* -------------------------------------------------- fonctions */}
          <section id="fonctions" className="mx-auto max-w-[1560px] scroll-mt-20 px-5 pb-16 sm:px-8">
            <Reveal>
              <div className="max-w-[52ch]">
                <span className="text-[10.5px] font-semibold tracking-[0.14em] text-mut uppercase">
                  Fonctions
                </span>
                <h2 className="mt-3 text-[clamp(1.6rem,3.6vw,2.4rem)] leading-tight font-extrabold tracking-[-0.035em]">
                  Pensé pour les chasseurs de platine
                </h2>
              </div>
            </Reveal>
            <ul className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <li key={f.title}>
                  <Reveal delay={i * 70} className="h-full">
                    <div className="group h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:bg-white/[0.04]">
                      <TrophyCup
                        tone={i % 4 === 0 ? "plat" : i % 4 === 1 ? "gold" : i % 4 === 2 ? "silver" : "bronze"}
                        className="h-7 w-7 transition-transform duration-300 group-hover:-translate-y-[2px]"
                      />
                      <h3 className="mt-4 text-[16px] font-semibold tracking-[-0.01em]">{f.title}</h3>
                      <p className="mt-2.5 text-[13.5px] leading-relaxed text-mut">{f.body}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>

          {/* ------------------------------------------------------- faq */}
          <section id="faq" className="mx-auto max-w-[1560px] scroll-mt-20 px-5 pb-16 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <Reveal>
                <div>
                  <span className="text-[10.5px] font-semibold tracking-[0.14em] text-mut uppercase">
                    FAQ
                  </span>
                  <h2 className="mt-3 text-[clamp(1.6rem,3.6vw,2.2rem)] leading-tight font-extrabold tracking-[-0.035em]">
                    Ce qu'il faut savoir
                  </h2>
                  <p className="mt-4 max-w-[38ch] text-[13.5px] leading-relaxed text-mut">
                    Platina est un projet indépendant, sans publicité et sans collecte de
                    données. Tout fonctionne hors ligne.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={90}>
                <div className="space-y-[9px]">
                  {FAQ.map((f) => (
                    <details
                      key={f.q}
                      className="group rounded-[16px] border border-white/[0.07] bg-white/[0.02] px-5 py-4 transition-colors hover:border-white/20"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-semibold text-white">
                        {f.q}
                        <span className="shrink-0 text-brand-2 transition-transform duration-300 group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="mt-3 text-[13px] leading-relaxed text-mut-2">{f.a}</p>
                    </details>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>

          {/* ------------------------------------------------------- cta */}
          <section className="mx-auto max-w-[1560px] px-5 pb-24 sm:px-8">
            <Reveal>
              <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(140deg,#0b1220,#070a10_55%,#0d0a1c)] px-6 py-16 text-center sm:px-12">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-70"
                  style={{
                    background: "radial-gradient(600px 260px at 50% 0%, rgba(47,107,255,0.30), transparent 65%)",
                  }}
                />
                <div className="relative">
                  <PlatinumBadge className="mx-auto h-[74px] w-[74px] drop-shadow-[0_10px_30px_rgba(79,140,255,0.45)]" />
                  <h2 className="mx-auto mt-7 max-w-[24ch] text-[clamp(1.7rem,4vw,2.6rem)] leading-tight font-extrabold tracking-[-0.04em]">
                    Ta première platine commence maintenant
                  </h2>
                  <p className="mx-auto mt-4 max-w-[46ch] text-[14.5px] leading-relaxed text-mut-2">
                    Crée ton compte, ajoute un jeu, débloque un trophée. Le reste suit tout seul.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <a
                      href="#/app"
                      className="rounded-full bg-brand px-7 py-[14px] text-[14px] font-semibold shadow-[0_0_30px_-6px_rgba(47,107,255,1)] transition-all duration-300 hover:-translate-y-[2px] hover:bg-brand-2"
                    >
                      {state.loggedIn ? "Ouvrir mon espace" : "Créer mon compte"}
                    </a>
                    <a
                      href="#faq"
                      className="rounded-full border border-white/12 px-7 py-[14px] text-[14px] font-semibold text-white transition-all duration-300 hover:-translate-y-[2px] hover:border-white/30 hover:bg-white/[0.06]"
                    >
                      En savoir plus
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>
          <section id="export-projet" className="mx-auto max-w-[1560px] scroll-mt-24 px-5 pb-16 sm:px-8">
            <div className="grid gap-8 border-t border-white/[0.07] pt-10 lg:grid-cols-[1fr_440px] lg:items-start">
              <div>
                <span className="text-[10.5px] font-semibold tracking-[0.14em] text-mut uppercase">
                  Projet ZIP
                </span>
                <h2 className="mt-3 text-[clamp(1.6rem,3.6vw,2.2rem)] font-extrabold tracking-[-0.035em]">
                  Récupérer tout le projet
                </h2>
                <p className="mt-3 max-w-[44ch] text-[13.5px] leading-relaxed text-mut-2">
                  La version de cet aperçu, prête à extraire et à mettre sur ton GitHub.
                  Pas besoin du bouton d'export de l'éditeur.
                </p>
              </div>
              <ProjectExport />
            </div>
          </section>
        </main>

        {/* ---------------------------------------------------- footer */}
        <footer className="border-t border-white/[0.07] bg-black">
          <div className="mx-auto flex max-w-[1560px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="flex items-center gap-[10px]">
              <PlatinaLogo className="h-[22px] w-[25px]" />
              <span className="text-[15px] font-bold tracking-[-0.02em]">Platina</span>
              <span className="ml-2 text-[12px] text-mut">Version 1.0.0</span>
            </div>
            <p className="max-w-[60ch] text-[12px] leading-relaxed text-mut">
              Concept d'interface. PlayStation, PS Store et PlayStation Plus sont des marques de
              Sony Interactive Entertainment. Projet de démonstration sans affiliation.
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-[12.5px] text-mut-2">
              <a href="#/app" className="transition-colors hover:text-white">
                Application
              </a>
              <a href="#fonctions" className="transition-colors hover:text-white">
                Fonctions
              </a>
              <a href="#export-projet" className="whitespace-nowrap text-brand-2 transition-colors hover:text-white">
                Projet ZIP
              </a>
              <a href="#top" className="transition-colors hover:text-white">
                Haut de page
              </a>
            </div>
          </div>
        </footer>
      </div>
    </SheetProvider>
  );
}
