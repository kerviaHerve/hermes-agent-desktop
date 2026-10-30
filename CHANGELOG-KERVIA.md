# Journal des changements / Changelog

La version **Kervia** et la révision **Hermes source** sont suivies séparément. Le numéro Kervia décrit le client Desktop distribué ici. Le SHA Hermes identifie précisément la base officielle intégrée, sans prétendre correspondre au dernier commit amont.

The **Kervia** version and **Hermes source** revision are tracked separately. The Kervia number identifies the Desktop client distributed here. The Hermes SHA identifies the exact integrated upstream source, without implying it is the latest upstream commit.

## Kervia 0.1.3 · Hermes source `2d2808ee84549f9836b0056750265058e5488a8a`

**FR** — Synchronise les 31 commits Hermes publiés depuis la base de Kervia 0.1.2. Le Desktop bénéficie des corrections de reconnexion, de stabilité de la connexion et de lecture des médias. Le code amont ajoute aussi l'arrêt et le rattrapage des tâches planifiées ; ces commandes ne s'affichent que si la passerelle les prend en charge. L'interface Kervia, le dossier de données séparé et le mécanisme de mise à jour restent conservés. La compilation vérifie désormais que le paquet contient bien l'interface Kervia. Le suivi de l'amont et l'application en branche locale sont reproductibles avec `scripts/kervia-sync-upstream.sh`.

**EN** — Syncs the 31 Hermes commits since the Kervia 0.1.2 base. Desktop picks up reconnect, connection stability and media playback fixes. Upstream also adds stopping and catch-up policies for scheduled jobs; these controls appear only when the gateway supports them. The Kervia interface, separate data directory and update mechanism remain intact. The release build now verifies that the packaged renderer contains the Kervia edition. `scripts/kervia-sync-upstream.sh` provides a repeatable upstream check and local branch integration.

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
