# Hermes Desktop · Kervia Edition : publication macOS

## Périmètre

L'édition Kervia utilise le mode `light` du Desktop : le paquet ne contient pas de moteur Python et ne crée pas de service Hermes local. Elle se connecte à une passerelle Hermes existante. Son identifiant `ch.kervia.hermes-desktop`, son dossier de données `HermesDesktopKerviaEdition` et son schéma de liens `hermes-kervia://` la séparent de l'application Hermes officielle et de Hermes F.

## Circuit des mises à jour

La version macOS contient une adresse fixe : `https://github.com/kerviaHerve/hermes-agent-desktop/releases/latest/download/`. `electron-updater` y lit `stable-mac.yml`, télécharge le ZIP indiqué et vérifie son empreinte. Le DMG sert à la première installation. L'application vérifie les mises à jour au lancement, puis au plus une fois par jour en arrière-plan ; le menu « Check for Updates… » permet une vérification manuelle. Le téléchargement et l'installation ne sont pas automatiques : l'utilisateur les déclenche dans l'application. Les mises à jour du moteur Hermes restent indépendantes.

Une publication doit joindre au même GitHub Release public : le DMG, le ZIP, leurs deux fichiers `.blockmap` et `stable-mac.yml`. Le release doit être marqué « latest » et ne pas être une préversion. Sans release publié, aucune mise à jour ne peut être proposée.

## Préparer une version

1. Intégrer les changements de l'amont dans une branche de travail, résoudre les conflits sur les composants Desktop modifiés, puis vérifier les parcours local et distant. Garder `upstream` en lecture seule.
2. Valider les tests Desktop, la compilation TypeScript, l'identité de l'application, puis faire un commit propre. Ne jamais publier une compilation dont `install-stamp.json` indique `dirty: true`.
3. Configurer une identité **Developer ID Application** et la notarisation Apple. Le DMG et le ZIP publics doivent contenir la même application signée et notariée. Le paquet non signé est uniquement destiné aux essais locaux.
4. Pour une version `X.Y.Z`, construire sur macOS ARM64 avec :

   ```sh
   cd apps/desktop
   KERVIA_DESKTOP_EDITION=1 HERMES_DESKTOP_VARIANT=light \
   HERMES_PAYLOAD_TAG=vX.Y.Z HERMES_PAYLOAD_VERSION=X.Y.Z \
   HERMES_PYTHON=/chemin/vers/python \
   HERMES_HOME=/chemin/vers/un-dossier-de-build-isole \
   GITHUB_REPOSITORY=kerviaHerve/hermes-agent-desktop npm run dist:mac
   ```

5. Contrôler `Info.plist` (`CFBundleIdentifier`, nom, version), `app-update.yml` (fournisseur, adresse, canal), `stable-mac.yml`, les empreintes, `codesign --verify`, `spctl --assess`, ainsi que l'absence de `agent-payload`. Installer dans un emplacement de test distinct de l'application officielle et de Hermes F.
6. Créer le tag `kervia-vX.Y.Z` sur le commit vérifié et publier les cinq fichiers du dossier `apps/desktop/release` dans un GitHub Release public. Ne pas remplacer une version publiée : augmenter la version à chaque fois.
7. Depuis une version antérieure signée, vérifier que « Check for Updates… » détecte la nouvelle version, télécharge le ZIP et relance cette édition sans toucher au client officiel.

Le workflow manuel GitHub Actions `Kervia Desktop macOS release` automatise les étapes 4 à 6 depuis `main` une fois cinq secrets configurés : `KERVIA_CSC_LINK` (certificat Developer ID Application exporté en P12 puis encodé en base64), `KERVIA_CSC_KEY_PASSWORD`, `KERVIA_APPLE_API_KEY_P8`, `KERVIA_APPLE_API_KEY_ID` et `KERVIA_APPLE_API_ISSUER`. Il refuse une version déjà publiée, un paquet sale, non signé ou non notarié. Ne lancer ce workflow qu'après avoir relu la version à publier.

## Synchroniser l'amont

Le dépôt garde deux remotes : `origin` pour Kervia et `upstream` pour Nous Research, dont le push est désactivé. Noter pour chaque version le SHA officiel importé. Comparer les changements de `apps/desktop`, `apps/shared` et des contrats de passerelle avant de reporter les correctifs. Les choix d'interface restent dans des modules et styles Desktop ; les adaptations de protocole sont testées avec une passerelle locale isolée et une connexion distante de test. Ne jamais mettre à niveau un serveur distant à partir de ce processus.

Base officielle intégrée pour la préparation de la version 0.1.0 : `e864515d2651ea0b3420482d5e00ca0eb3586b24` (30 octobre 2026).

Le dépôt initial a été importé comme instantané ; son historique Git n'a pas le même ancêtre que celui d'`upstream/main`. Une synchronisation doit appliquer ou intégrer explicitement les différences entre l'ancien SHA officiel et le nouveau, puis enregistrer le nouveau SHA dans le journal de version. Un `git pull upstream main` direct n'est donc pas une procédure de mise à jour fiable pour ce fork.
