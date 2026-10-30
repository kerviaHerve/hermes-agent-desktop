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
4. Sur le Mac de publication, utiliser le kit Apple Developer fourni par le propriétaire et le fichier de mot de passe P12 conservé hors du dépôt. Pour une version `X.Y.Z`, lancer :

   ```sh
   python3 apps/desktop/scripts/kervia-local-release.py \
     --kit /chemin/vers/Kervia-Apple-Developer-Kit.zip \
     --password-file /chemin/vers/Mot-de-passe-P12-PRIVE.txt \
     --version X.Y.Z
   ```

   Ce script importe le certificat dans un trousseau temporaire, construit l'application avec l'identité Kervia, utilise le profil local de notarisation Apple, vérifie le ticket, Gatekeeper et le DMG, puis restaure la liste des trousseaux. Il ne publie rien sur GitHub. Le kit et le mot de passe restent hors du dépôt. Le journal de build local est privé dans `.hermes-local-sandbox/`.
5. Contrôler aussi `Info.plist` (nom et version), `app-update.yml` (adresse et canal), `stable-mac.yml`, les empreintes et l'application réellement contenue dans le DMG. Installer dans un emplacement de test distinct de l'application officielle et de Hermes F. Une vérification sur un autre Mac propre reste nécessaire avant une diffusion large.
6. Après validation, créer manuellement le tag `kervia-vX.Y.Z` sur le commit vérifié et joindre le DMG, le ZIP, leurs deux fichiers `.blockmap` et `stable-mac.yml` à un GitHub Release public marqué « latest ». Ne pas remplacer une version publiée : augmenter la version à chaque fois. GitHub héberge les sources et les fichiers de mise à jour ; GitHub Actions est désactivé pour ce dépôt et aucun secret Apple n'est enregistré sur GitHub. Les workflows Hermes d'origine restent dans les sources pour faciliter les synchronisations futures.
7. Depuis une version antérieure signée, vérifier que « Check for Updates… » détecte la nouvelle version, télécharge le ZIP et relance cette édition sans toucher au client officiel.

Le fichier de mot de passe P12 et le P12 ne doivent jamais être ajoutés au dépôt, à un commit, à un journal public ou à un GitHub Release. Le profil de notarisation reste dans le trousseau de ce Mac.

## Synchroniser l'amont

Le dépôt garde deux remotes : `origin` pour Kervia et `upstream` pour Nous Research, dont le push est désactivé. Noter pour chaque version le SHA officiel importé. Comparer les changements de `apps/desktop`, `apps/shared` et des contrats de passerelle avant de reporter les correctifs. Les choix d'interface restent dans des modules et styles Desktop ; les adaptations de protocole sont testées avec une passerelle locale isolée et une connexion distante de test. Ne jamais mettre à niveau un serveur distant à partir de ce processus.

Base officielle intégrée pour la préparation de la version 0.1.0 : `b1d7c5b296d46f75d870583362640acc0cf8d6cb` (30 octobre 2026).

Le numéro de l'application (`0.1.0`) est celui de Kervia. La révision Hermes intégrée est déclarée dans `apps/desktop/kervia-release.json`, affichée dans « À propos » et consignée dans `CHANGELOG-KERVIA.md`. Ne pas confondre ce SHA avec une étiquette de version Hermes : le `package.json` officiel du Desktop indique `0.0.0`.

Le dépôt initial a été importé comme instantané ; son historique Git n'a pas le même ancêtre que celui d'`upstream/main`. Une synchronisation doit appliquer ou intégrer explicitement les différences entre l'ancien SHA officiel et le nouveau, puis enregistrer le nouveau SHA dans le journal de version. Un `git pull upstream main` direct n'est donc pas une procédure de mise à jour fiable pour ce fork.
