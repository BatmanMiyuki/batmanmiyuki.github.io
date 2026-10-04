import type { ReactNode } from "react";
import { Card, SectionLabel } from "../components/ui";
import {
  AppearanceIcon,
  BellSmallIcon,
  ChevronRight,
  CurrencyIcon,
  GlobeIcon,
  InfoIcon,
  LinkIcon,
  LockIcon,
  MailIcon,
  PaletteIcon,
  PowerIcon,
  SaveIcon,
  UploadIcon,
  UsersIcon,
} from "../lib/icons";
import { useStore } from "../lib/store";
import { CURRENCIES } from "../lib/util";
import { useSheet } from "../components/Sheet";
import { ProjectExport } from "../components/ProjectExport";
import { DownloadIcon } from "../lib/icons2";
import {
  AboutSheet,
  AccountSheet,
  AccentSheet,
  BackupSheet,
  ContactSheet,
  CurrencySheet,
  LanguageSheet,
  LinkedSheet,
  LogoutSheet,
  NotificationsSheet,
  PrivacySheet,
  ProfileSheet,
  SyncSheet,
  THEME_LABEL,
  ThemeSheet,
} from "../sheets/SettingsSheets";

type Row = {
  icon: ReactNode;
  title: string;
  sub?: string;
  value?: string;
  sheet: ReactNode;
};

export default function SettingsScreen() {
  const { state } = useStore();
  const { open } = useSheet();
  const s = state.settings;

  const groups: { label: string; rows: Row[] }[] = [
    {
      label: "Compte",
      rows: [
        {
          icon: <UsersIcon />,
          title: "Mon compte",
          sub: "Profil, mot de passe et sécurité",
          sheet: <AccountSheet />,
        },
        {
          icon: <LinkIcon />,
          title: "PlayStation Network",
          sub: state.psn.id ? `Lié à ${state.psn.id}` : "Lier ton compte PSN",
          value: state.psn.id ? "Lié" : undefined,
          sheet: <SyncSheet mode="import" />,
        },
        {
          icon: <LockIcon />,
          title: "Confidentialité",
          sub: "Gère tes informations personnelles",
          sheet: <PrivacySheet />,
        },
      ],
    },
    {
      label: "Préférences",
      rows: [
        {
          icon: <BellSmallIcon />,
          title: "Notifications",
          sub: "Gérer les alertes et rappels",
          sheet: <NotificationsSheet />,
        },
        {
          icon: <LinkIcon />,
          title: "Comptes liés",
          sub: "PlayStation Network, Twitch, Discord",
          sheet: <LinkedSheet />,
        },
        { icon: <PaletteIcon />, title: "Thème", value: THEME_LABEL[s.theme], sheet: <ThemeSheet /> },
        { icon: <GlobeIcon />, title: "Langue", value: "Français", sheet: <LanguageSheet /> },
        {
          icon: <CurrencyIcon />,
          title: "Devise",
          value: CURRENCIES[s.currency].label.replace(/ \(.*\)/, ` (${CURRENCIES[s.currency].symbol})`),
          sheet: <CurrencySheet />,
        },
        { icon: <AppearanceIcon />, title: "Apparence", sheet: <AccentSheet /> },
      ],
    },
    {
      label: "Données",
      rows: [
        {
          icon: <UploadIcon />,
          title: "Importer ses trophées",
          sub: "Depuis PlayStation Network",
          sheet: <SyncSheet mode="import" />,
        },
        {
          icon: <SaveIcon />,
          title: "Sauvegarde & Données",
          sub: "Sauvegarder ou restaurer tes données",
          sheet: <BackupSheet />,
        },
      ],
    },
    {
      label: "À propos",
      rows: [
        {
          icon: <InfoIcon />,
          title: "À propos de Platina",
          sub: "Version 1.0.0",
          sheet: <AboutSheet />,
        },
        {
          icon: <DownloadIcon className="h-[15px] w-[15px]" />,
          title: "Projet ZIP",
          sub: "Télécharger les sources, images et fichiers PWA",
          sheet: <ProjectExport />,
        },
        { icon: <MailIcon />, title: "Nous contacter", sub: "Support & FAQ", sheet: <ContactSheet /> },
      ],
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 pb-16 sm:px-8">
      <header>
        <h1 className="text-[27px] leading-none font-bold tracking-[-0.03em] text-white sm:text-[32px]">
          Paramètres
        </h1>
      </header>

      <button
        type="button"
        onClick={() => open("Modifier le profil", <ProfileSheet />)}
        className="group mt-[18px] block w-full text-left"
      >
        <Card className="flex items-center gap-[13px] p-[11px] transition-all duration-300 group-hover:border-white/20 group-active:scale-[0.99] md:p-[16px]">
          <span className="relative h-[46px] w-[46px] shrink-0 overflow-hidden rounded-full ring-1 ring-white/15 md:h-[56px] md:w-[56px]">
            <img
              src="images/avatar.jpg"
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[16px] leading-tight font-bold tracking-[-0.01em] text-white">
              {state.profile.name}
            </span>
            <span className="mt-[3px] block truncate text-[11.5px] leading-tight text-mut-2">
              @{state.profile.handle}
            </span>
          </span>
          <span className="hidden text-[11px] font-medium text-brand-2 opacity-0 transition-opacity group-hover:opacity-100 md:block">
            Modifier le profil
          </span>
          <ChevronRight className="h-[15px] w-[15px] shrink-0 text-mut transition-transform duration-300 group-hover:translate-x-[2px] group-hover:text-white" />
        </Card>
      </button>

      <div className="mt-[22px] grid gap-[22px] lg:grid-cols-2 lg:items-start">
        {groups.map((group) => (
          <section key={group.label}>
            <SectionLabel>{group.label}</SectionLabel>
            <Card className="mt-[9px] overflow-hidden">
              <ul className="divide-y divide-white/[0.05]">
                {group.rows.map((row) => (
                  <li key={row.title}>
                    <button
                      type="button"
                      onClick={() => open(row.title, row.sheet)}
                      className="group flex w-full items-center gap-[12px] px-[12px] py-[8px] text-left transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]"
                    >
                      <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[9px] border border-white/[0.07] bg-white/[0.05] text-white/80 transition-colors group-hover:border-brand/50 group-hover:text-brand-2">
                        {row.icon}
                      </span>
                      <span className="min-w-0 flex-1 py-[2px]">
                        <span className="block truncate text-[12.5px] leading-tight font-semibold text-white">
                          {row.title}
                        </span>
                        {row.sub && (
                          <span className="mt-[3px] block truncate text-[10px] leading-tight text-mut">
                            {row.sub}
                          </span>
                        )}
                      </span>
                      {row.value && <span className="shrink-0 text-[11px] text-mut-2">{row.value}</span>}
                      <ChevronRight className="h-[14px] w-[14px] shrink-0 text-mut transition-all duration-300 group-hover:translate-x-[2px] group-hover:text-white" />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))}
      </div>

      <button
        type="button"
        onClick={() => open("Déconnexion", <LogoutSheet />)}
        className="mt-[22px] flex h-[46px] w-full items-center justify-center gap-[8px] rounded-[13px] border border-[#e5484d]/30 bg-[#e5484d]/[0.10] text-[13.5px] font-semibold text-[#f2555a] transition-all duration-300 hover:border-[#e5484d]/60 hover:bg-[#e5484d]/[0.18] hover:text-white"
      >
        <PowerIcon className="h-[15px] w-[15px]" />
        Déconnexion
      </button>
    </div>
  );
}
