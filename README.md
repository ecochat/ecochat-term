# Ecochat pour terminal

Ecochat pour terminal est un client permettant d'utiliser l'API d'Ecochat afin d'envoyer des messages, de crée un compte ou autre depuis un terminal.

## Prérequis

* Un appareil sous Windows, MacOS, Linux ou ChromeOS (Avec Crostini)
* [nodejs et npm](https://nodejs.org) d'installé


## Installation : NPMJS

[Node.js et npm](https://nodejs.org) sont requis.

```
$ npm install --global ecochat-term
```


## Installation : Classique

Assure-toi d'avoir [Node.js et npm](https://nodejs.org) d'installer sur ton appareil puis suis ces étapes dans l'ordre (tu auras peut-être besoin de redémarrer ton terminal après l'installation pour l'utiliser :

- Télécharger tous les fichiers (index.js, fetch.js et package.json) et mettez les quelque part sur votre appareil.
- Ouvrez un terminal dans le dossier où se trouve les fichiers téléchargés lors de la dernière étape.
- Faite quelques commandes...
```
$ npm install
.........
$ npm link
```


## Comment utiliser le client

Ouvrez un terminal et faite la commande `ecochat` pour lancer Ecochat. Une fois cela fait, une interface apparaitra : si c'est votre premier démarrage vous serez invité à créer un compte ou à configurer Ecochat en rentrant un token de compte.


## Utilisé pour la création

* [Conf](https://www.npmjs.com/package/) (Sauvegarder et modifier la configuration)
* [node-fetch](https://www.npmjs.com/package/) (Envoyer des requêtes à l'API)
* [prompt](https://www.npmjs.com/package/) (Assistant pour la configuration)
* [terminal-kit](https://www.npmjs.com/package/) (Afficher des textes, couleurs, menu, demande de texte, etc)

* [Ecochat](https://ecochat.github.io/ecochat/docs/intro)


## Licence

ISC © [Johan](https://johan-perso.glitch.me)
