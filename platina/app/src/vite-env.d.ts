/// <reference types="vite/client" />
/**
 * Fichiers du projet embarqués au build (voir le plugin `platina-project-files`
 * dans vite.config.ts). Utilisé par l'export « Projet ZIP ».
 */
declare module "virtual:project-files" {
  const files: Record<string, string>;
  export default files;
}
