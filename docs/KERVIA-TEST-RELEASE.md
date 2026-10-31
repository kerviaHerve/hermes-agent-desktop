# Protocole de test et de publication · Hermes Desktop Kervia Edition

Ce protocole concerne **uniquement le client macOS**. Il ne publie ni n'installe le moteur Hermes et ne modifie aucune passerelle distante. Les sources officielles restent attribuées à Nous Research. GitHub Actions n'est pas utilisé : les vérifications, la signature et la notarisation se font sur le Mac de publication.

## Politique de compatibilité

Chaque version Kervia est basée sur une révision officielle **récente et précise** de `NousResearch/hermes-agent/main`, inscrite dans `apps/desktop/kervia-release.json` et le journal des changements. Le client est validé avec une passerelle de test construite à partir de **cette même révision**. Les anciennes versions de passerelle ne font pas partie de la cible de test et leur compatibilité n'est pas garantie. Une révision Hermes publiée après le gel doit être examinée avant d'être annoncée comme compatible. L'application ne met jamais à jour le serveur Hermes de l'utilisateur.

La version Kervia et la révision Hermes sont deux identifiants distincts. `package.json` du Desktop officiel n'est pas le numéro de version du moteur. En cas d'écart entre le client et la passerelle, vérifier d'abord la révision affichée dans « À propos » et celle de la passerelle ; ne pas supposer qu'une connexion réussie couvre les fonctions récentes.

## Cadence de suivi et décision rapide

Le contrôle automatique des sources officielles s'exécute chaque matin. Dès qu'un changement touche le Desktop, `apps/shared` ou un contrat de passerelle utilisé par le client, ouvrir ou actualiser la branche locale de synchronisation **le jour même** et noter les chemins modifiés. Les tests ciblés du diff donnent un premier verdict rapide ; les portes complètes ci-dessous décident seules de la publication. Un changement purement documentaire est consigné sans nouvelle version. Si l'amont avance pendant les tests, comparer le nouveau delta avant de décider si la candidate doit être actualisée. Aucune tâche GitHub Actions ni mise à jour du serveur de l'utilisateur n'est déclenchée.

| État | Action | Sortie vérifiable |
| --- | --- | --- |
| Détecté | Lire le diff officiel et l'impact Desktop/passerelle. | SHA amont et chemins affectés. |
| Candidat local | Intégrer, adapter l'interface, exécuter les tests ciblés. | Commit isolé et liste des résultats/échecs. |
| Prêt pour publication | Finir toutes les portes automatisées et réelles, puis signer. | Compte rendu complet, DMG et ZIP vérifiés. |
| Publié | Vérifier le flux `latest` et l'installation initiale. | Liens, empreintes et lancement observés. |
| Vérifié sur le Mac du propriétaire | Le propriétaire effectue **lui-même** la mise à jour depuis l'application installée. | Détection, téléchargement, redémarrage, connexion et conversation contrôlés ; toute anomalie déclenche un correctif. |

## Porte 1 · Sources et traçabilité

1. Partir d'une branche locale isolée issue du dernier commit Kervia publié. Exécuter `scripts/kervia-sync-upstream.sh --check`, puis intégrer les changements officiels avec `--apply` ou examiner la branche de synchronisation existante. Comparer explicitement `apps/desktop`, `apps/shared` et les méthodes de passerelle utilisées par le Desktop. Préserver le thème, la navigation, les projets et les préférences Kervia.
2. Inscrire le nouveau SHA complet dans `apps/desktop/kervia-release.json`, augmenter la version Kervia, mettre à jour `README.md` et `CHANGELOG-KERVIA.md`. Faire un commit propre. Exécuter `python3 scripts/kervia-release-preflight.py`. Ce contrôle échoue si le SHA n'est plus la tête officielle de `main`, si les métadonnées divergent, si la version est déjà taguée localement ou si des fichiers suivis sont modifiés.
3. Noter dans le compte rendu la version Kervia, le commit Kervia et le SHA Hermes. Si l'amont avance avant publication, réexaminer le diff et refaire les portes affectées. Ne jamais remplacer silencieusement le SHA dans les métadonnées sans intégrer le code correspondant.

## Porte 2 · Tests automatisés

Sur un `HERMES_HOME` temporaire, sans les données ni les identifiants de production :

```sh
cd apps/shared && npm run check
cd ../desktop && npm run typecheck && npm run lint
npm run test:ui && npm run test:desktop:platforms
KERVIA_DESKTOP_EDITION=1 HERMES_DESKTOP_VARIANT=light npm run build
cd ../..
scripts/run_tests.sh tests/desktop tests/tui_gateway tests/scripts/desktop_update
```

Ajouter à cette sélection **tous les tests Python modifiés par la synchronisation**, les tests des chemins Desktop/passerelle affectés même s'ils n'ont pas changé, et les tests d'authentification HTTP native et de mise à jour du client. Inscrire la liste exacte et la raison de chaque sélection dans le compte rendu. Exécuter cette sélection avec `HERMES_TEST_FILE_RETRIES=0` : une réussite au second essai signale une instabilité à corriger. Le dernier appel utilise le lanceur Python canonique du dépôt.

La suite Python générale peut servir de diagnostic supplémentaire, mais elle comprend aussi le moteur non livré et des relectures de CI prévues pour Linux ou Windows. Un échec général ne se transforme jamais silencieusement en succès : reproduire, identifier la plateforme et le composant, puis classer **avec preuve** son rapport avec le client livré. Tout échec touchant le Desktop, `apps/shared`, l'authentification, la passerelle utilisée ou l'installation/mise à jour bloque la publication. Un test ignoré de façon inattendue, une erreur, une sortie interrompue ou un avertissement nouveau non expliqué dans la sélection obligatoire n'est pas un succès. Noter les tests ignorés prévus pour une autre plateforme. Sur macOS, les tests de chemins sensibles à la casse doivent tourner sur un volume APFS sensible à la casse, avec un `TMPDIR` isolé ; ne pas les neutraliser pour obtenir un résultat vert. Conserver les commandes, le commit testé, les résultats et les écarts dans le compte rendu de version. Vérifier ensuite que l'arbre suivi est propre.

## Porte 3 · Parcours réels avant publication

Installer le **client candidat** dans un emplacement distinct des applications Hermes officielles et de Hermes F, avec un profil de données de test. Démarrer une passerelle Hermes **locale de test** à la révision enregistrée, puis utiliser un vrai modèle configuré pour ce test. Vérifier au minimum :

| Parcours | Résultat attendu |
| --- | --- |
| Connexion | Connexion et reconnexion au Hermes de test ; aucune installation locale ou modification d'un serveur distant déclenchée par erreur. |
| Conversation | Création, envoi, réponse diffusée en direct, arrêt, reprise et réouverture d'une discussion. |
| Organisation | Recherche limitée au Hermes sélectionné ; épingles, projets, agents, réorganisation et repli conservés après redémarrage. |
| Présentation | Fil, barre de saisie, thèmes clair/sombre, réglages de largeur et de hauteur ; pas de chevauchement sur écran standard et grand écran. |
| Fonctions Hermes | Profils, modèle, pièces jointes, outils, paramètres et présentation simple/avancée accessibles selon les droits de la passerelle testée. |
| Erreurs | Déconnexion, erreur d'authentification et fonction absente expliquées sans perte de conversation ni boucle de relance. |

Faire une capture ou un court enregistrement des états importants et noter les fonctions non vérifiées. Un parcours contre le Hermes de production peut être réalisé **en lecture seule et avec l'accord de son propriétaire**, mais il ne remplace pas le test sur la passerelle locale de même révision et n'autorise jamais une mise à niveau du serveur.

## Porte 4 · Binaire signé et publication

1. Exécuter le constructeur local `apps/desktop/scripts/kervia-local-release.py` décrit dans [KERVIA-RELEASE.md](KERVIA-RELEASE.md). Il vérifie signature Developer ID, notarisation Apple, Gatekeeper, contenu du DMG, ZIP et flux de mise à jour. Le P12 et son mot de passe restent hors du dépôt et hors de GitHub.
2. Installer le DMG **réel** sur un profil macOS propre. Relancer l'application, refaire connexion et conversation, contrôler nom, icône, version, « À propos » et absence de moteur embarqué. Vérifier qu'Hermes officiel et Hermes F restent utilisables. Vérifier le ZIP signé et son manifeste de mise à jour, puis lancer les tests automatisés de la stratégie `electron-updater`. Vérifier le même passage de version et les mêmes noms de fichiers que ceux prévus pour GitHub. Le test de paquet `test:desktop:all` de l’amont cible `Hermes.app` et ne valide pas le paquet Kervia ; la vérification du paquet Kervia est réalisée par le constructeur local et les contrôles de cette porte. Le téléchargement par le canal public ne peut être confirmé qu'après publication ; le contrôler immédiatement avant d'annoncer la version.
3. Si toutes les portes précédentes sont vertes, créer le tag immuable `kervia-vX.Y.Z` sur le commit vérifié. Préparer un GitHub Release avec notes FR/EN, DMG, ZIP, les deux `.blockmap` et `stable-mac.yml`. Vérifier noms, tailles et empreintes des fichiers téléchargés avant de le rendre public et `latest`. Ne jamais remplacer un binaire sous un même numéro de version.
4. Après publication, vérifier la page de téléchargement et une installation fraîche. Le propriétaire réalise ensuite **lui-même** le contrôle final sur **sa version déjà installée sur son Mac**, au moyen de « Check for Updates… » : notification de la nouvelle version, téléchargement, redémarrage, version affichée, reconnexion à son Hermes et une conversation de vérification. Consigner son retour dans le compte rendu ; ne pas modifier son application ni accéder à son serveur de production pour reproduire ce contrôle. En cas d'échec, suspendre l'annonce, documenter le défaut et publier un correctif avec **un numéro supérieur** après reprise des portes ; une ancienne version ne peut pas être imposée aux clients déjà mis à jour.

**Décision de mise en ligne :** aucun DMG public tant qu'un test requis échoue ou manque, que la révision Hermes n'est plus actuelle, que le client réel n'a pas été testé, ou que la signature/notarisation ne passe pas. Le compte rendu doit séparer ce qui est automatisé, observé dans l'application et encore non vérifié.
