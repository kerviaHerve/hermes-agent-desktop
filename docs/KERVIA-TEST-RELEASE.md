# Protocole de test et de publication · Hermes Desktop Kervia Edition

Ce protocole concerne **uniquement le client macOS**. Il ne publie ni n'installe le moteur Hermes et ne modifie aucune passerelle distante. Les sources officielles restent attribuées à Nous Research. GitHub Actions n'est pas utilisé : les vérifications, la signature et la notarisation se font sur le Mac de publication.

## Politique de compatibilité

Chaque version Kervia est basée sur une révision officielle **récente et précise** de `NousResearch/hermes-agent/main`, inscrite dans `apps/desktop/kervia-release.json` et le journal des changements. Le client est validé avec une passerelle de test construite à partir de **cette même révision**. Les anciennes versions de passerelle ne font pas partie de la cible de test et leur compatibilité n'est pas garantie. Une révision Hermes publiée après le gel doit être examinée avant d'être annoncée comme compatible. L'application ne met jamais à jour le serveur Hermes de l'utilisateur.

La version Kervia et la révision Hermes sont deux identifiants distincts. `package.json` du Desktop officiel n'est pas le numéro de version du moteur. En cas d'écart entre le client et la passerelle, vérifier d'abord la révision affichée dans « À propos » et celle de la passerelle ; ne pas supposer qu'une connexion réussie couvre les fonctions récentes.

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
npm run test:desktop:all
KERVIA_DESKTOP_EDITION=1 HERMES_DESKTOP_VARIANT=light npm run build
cd ../..
scripts/run_tests.sh
```

Le dernier appel utilise le lanceur Python canonique du dépôt. Pour une branche de synchronisation, commencer par les tests ciblés du diff, puis lancer la suite complète avant publication. Un test ignoré, une erreur, une sortie interrompue ou un avertissement nouveau non expliqué n'est pas un succès. Conserver les commandes, le commit testé, les résultats et les écarts dans le compte rendu de version. Vérifier ensuite que l'arbre suivi est propre.

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
2. Installer le DMG **réel** sur un profil macOS propre. Relancer l'application, refaire connexion et conversation, contrôler nom, icône, version, « À propos » et absence de moteur embarqué. Vérifier qu'Hermes officiel et Hermes F restent utilisables. Tester le ZIP signé dans une copie isolée de la version précédente et les tests de mise à jour automatisés. Le téléchargement par le canal public ne peut être confirmé qu'après publication ; le contrôler immédiatement avant d'annoncer la version.
3. Si toutes les portes précédentes sont vertes, créer le tag immuable `kervia-vX.Y.Z` sur le commit vérifié. Préparer un GitHub Release avec notes FR/EN, DMG, ZIP, les deux `.blockmap` et `stable-mac.yml`. Vérifier noms, tailles et empreintes des fichiers téléchargés avant de le rendre public et `latest`. Ne jamais remplacer un binaire sous un même numéro de version.
4. Après publication, vérifier la page de téléchargement, une installation fraîche et « Check for Updates… » depuis la version Kervia signée précédente. En cas d'échec, suspendre l'annonce, documenter le défaut et publier un correctif avec **un numéro supérieur** après reprise des portes ; une ancienne version ne peut pas être imposée aux clients déjà mis à jour.

**Décision de mise en ligne :** aucun DMG public tant qu'un test requis échoue ou manque, que la révision Hermes n'est plus actuelle, que le client réel n'a pas été testé, ou que la signature/notarisation ne passe pas. Le compte rendu doit séparer ce qui est automatisé, observé dans l'application et encore non vérifié.
