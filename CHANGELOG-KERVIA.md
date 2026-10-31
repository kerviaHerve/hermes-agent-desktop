# Journal des changements / Changelog

La version **Kervia** et la révision **Hermes source** sont suivies séparément. Le numéro Kervia décrit le client Desktop distribué ici. Le SHA Hermes identifie précisément la base officielle intégrée, sans prétendre correspondre au dernier commit amont.

The **Kervia** version and **Hermes source** revision are tracked separately. The Kervia number identifies the Desktop client distributed here. The Hermes SHA identifies the exact integrated upstream source, without implying it is the latest upstream commit.

## Kervia 0.1.6 · Hermes source `c419cf7c864ac0ee511dbd9f7091a8bba0b567ee` (candidate, non publiée)

**FR** — Candidate de synchronisation avec les 52 commits Hermes officiels depuis `5057eaa`. Elle inclut les changements amont du Desktop, du contrat partagé et de la passerelle. La compatibilité est ciblée sur une passerelle Hermes de même révision. Tests automatisés en cours ; aucun DMG ni mise à jour publiée.

**EN** — Candidate synced with 52 official Hermes commits since `5057eaa`. It includes upstream Desktop, shared contract, and gateway changes. Compatibility targets a Hermes gateway at the same revision. Automated validation is in progress; no DMG or update has been published.

## Kervia 0.1.5 · Hermes source `5057eaa3a4d0cbef0e30078418a5115faa62889e`

**FR** — Corrige les notes de mise à jour : le client Kervia affiche désormais les versions et changements de ce dépôt, tandis que les mises à jour du moteur Hermes continuent de renvoyer vers Nous Research. Le parcours 0.1.3 → 0.1.4 a été vérifié dans une copie isolée de l'application : détection, téléchargement et installation du ZIP signé, sans modifier l'application installée dans Applications. Aucun changement au moteur Hermes.

**EN** — Fixes update notes: the Kervia client now links to this repository's releases and changes, while Hermes engine updates continue to link to Nous Research. The 0.1.3 → 0.1.4 path was verified in an isolated app copy: detection, download, and installation of the signed ZIP without changing the app installed in Applications. No Hermes engine changes.

## Kervia 0.1.4 · Hermes source `5057eaa3a4d0cbef0e30078418a5115faa62889e`

**FR** — Les sections de la barre latérale (Épinglées, Agents ou Sessions, plateformes de messagerie et tâches planifiées) peuvent être déplacées avec le menu discret de leur en-tête. Leur ordre est enregistré séparément pour chaque passerelle Hermes et conservé quand une section disparaît temporairement. La liste des agents garde une hauteur adaptée lorsqu'une section est placée après elle. Cette version intègre également les 30 commits Hermes suivants : formulaire unique pour les questions de clarification, indication plus juste lorsqu'un serveur de modèle local est arrêté, corrections des raccourcis et de la configuration distante. Les fonctionnalités dépendantes de la passerelle restent soumises à ses capacités.

**EN** — Sidebar sections (Pinned, Agents or Sessions, messaging platforms, and scheduled jobs) can be moved through a discreet header menu. Their order is saved separately for each Hermes gateway and retained when a section is temporarily absent. The agent list keeps a suitable height when another section follows it. This version also integrates the next 30 Hermes commits: a single form for multi-question clarification, clearer feedback when a local model server is stopped, shortcut fixes, and remote configuration fixes. Gateway-dependent features remain subject to the connected gateway's capabilities.

## Kervia 0.1.3 · Hermes source `bff22bde93db8d9fd57b63ee1bcb47947ed04fd2`

**FR** — Synchronise les 37 commits Hermes publiés depuis la base de Kervia 0.1.2. Le Desktop bénéficie des corrections de reconnexion, de stabilité de la connexion et de lecture des médias, ainsi que du signalement des notifications natives dans le Dock. Le code amont ajoute aussi l'arrêt et le rattrapage des tâches planifiées ; ces commandes ne s'affichent que si la passerelle les prend en charge. L'interface Kervia, le dossier de données séparé et le mécanisme de mise à jour restent conservés. La compilation vérifie désormais que le paquet contient bien l'interface Kervia. Le suivi de l'amont et l'application en branche locale sont reproductibles avec `scripts/kervia-sync-upstream.sh`.

**EN** — Syncs the 37 Hermes commits since the Kervia 0.1.2 base. Desktop picks up reconnect, connection stability and media playback fixes, plus native notification attention in the Dock. Upstream also adds stopping and catch-up policies for scheduled jobs; these controls appear only when the gateway supports them. The Kervia interface, separate data directory and update mechanism remain intact. The release build now verifies that the packaged renderer contains the Kervia edition. `scripts/kervia-sync-upstream.sh` provides a repeatable upstream check and local branch integration.

## Kervia 0.1.2 · Hermes source `b1d7c5b296d46f75d870583362640acc0cf8d6cb`

**FR** — Rend la barre latérale utilisable avec de nombreuses conversations épinglées : quatre sont affichées au départ, ainsi que la conversation active si elle est épinglée plus bas. Un bouton permet d'afficher toutes les autres, puis de réduire la liste. Le nombre total reste visible et l'ordre des épinglées est conservé. Les discussions et les groupes d'agents ne sont pas supprimés ni modifiés sur le serveur.

**EN** — Keeps the sidebar usable with many pinned chats: four appear initially, plus the active chat if it is pinned further down. A button reveals every other pin and then reduces the list. The total count stays visible and pin order is preserved. No chats or agent groups are deleted or changed on the server.

## Kervia 0.1.1 · Hermes source `b1d7c5b296d46f75d870583362640acc0cf8d6cb`

**FR** — Corrige le premier démarrage : si un Hermes local existe déjà sur le Mac, l'application demande explicitement s'il faut l'utiliser ou se connecter à un Hermes distant. Elle ne lance plus automatiquement le Hermes local et son accueil guidé. L'édition Kervia ne propose pas d'installer un nouveau moteur Hermes. Le choix d'utiliser le Hermes local est mémorisé uniquement dans les données de l'application Kervia.

**EN** — Fixes first launch: when a local Hermes already exists on the Mac, the app explicitly asks whether to use it or connect to a remote Hermes. It no longer automatically opens the local Hermes and its guided onboarding. Kervia Edition does not offer to install a new Hermes backend. Opting into the existing local Hermes is saved only in Kervia app data.

## Kervia 0.1.0 · Hermes source `b1d7c5b296d46f75d870583362640acc0cf8d6cb`

Première version macOS publique de **Hermes Desktop · Kervia Edition**. Le DMG contient uniquement le client Desktop et se connecte à une passerelle Hermes existante. L'application et ses données sont séparées du client officiel.

First public macOS release of **Hermes Desktop · Kervia Edition**. The DMG contains only the Desktop client and connects to an existing Hermes gateway. The app and its data are separate from the official client.

| Français | English |
| --- | --- |
| Conversations regroupées par agent, avec réorganisation des agents et des discussions, épinglage et repli des groupes. | Chats grouped by agent, with agent and chat reordering, pinning and collapsible groups. |
| Recherche limitée au Hermes sélectionné. | Search scoped to the selected Hermes instance. |
| Messages de l'utilisateur et de l'agent plus distincts, avec activité de l'agent consultable. | Clearer user and agent messages, with inspectable agent activity. |
| Barre de saisie et largeur du fil réglables, en conservant les commandes et options Hermes. | Adjustable composer height and chat width while retaining Hermes controls and options. |
| Identité Kervia, modes clair et sombre, thèmes Hermes conservés. | Kervia branding, light and dark modes, existing Hermes themes preserved. |
| Application macOS signée et notariée ; mises à jour distribuées par les Releases de ce dépôt. | Signed and notarized macOS app; updates served from this repository's Releases. |

La compilation macOS est destinée à Apple Silicon. Windows, Linux, Intel Mac et le parcours de mise à jour depuis une version publique précédente ne sont pas encore validés.

The macOS build targets Apple Silicon. Windows, Linux, Intel Mac and updating from an earlier public release have not yet been validated.
