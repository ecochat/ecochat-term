#!/usr/bin/env node

// Importer quelques modules
const term = require('terminal-kit').terminal;
const editJsonFile = require("edit-json-file");
const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const util = require('util');
const ora = require('ora'); const spinner = ora('');
const client = require('./client.js');

// Obtenir le chemin de la configuration
function configPath(jsonExtension=true){
	// (copié collé de johan-perso/twitterminal)
	if(require('os').platform() === "win32") var configPath = require('path').join(process.env.APPDATA, "johanstickman-cli", "ecochat")
	if(require('os').platform() === "darwin") var configPath = require('path').join(require('os').homedir(), "library", "Preferences", "johanstickman-cli", "ecochat")
	if(require('os').platform() === "linux") var configPath = require('path').join(require('os').homedir(), ".config", "johanstickman-cli", "ecochat")

	if(jsonExtension === true) configPath = require('path').join(configPath, "ecochatConfig.json")
	return configPath;
}

// Préparer une configuration
const Conf = require('conf');
const config = new Conf({ cwd: configPath(false), configName: 'ecochatConfig' })

// "Vider" l'écran
function cleanScreen() { for (var i = 0; i < process.stdout.rows; i++) console.log() }; cleanScreen();

// Obtenir l'UUID du compte
let uuid = config.get('uuid')
if(!uuid) askUUID()
if(uuid){
	spinner.text = "Démarrage d\'Ecochat..."
	spinner.start()
	client.setUUID(uuid).then(result => {
		if(result !== "Compte existant !"){
			spinner.text = `Impossible d'accéder à votre compte : ${result}`
			spinner.fail()
			config.delete('uuid')
			addToLog("Vérification du compte impossible : suppression du token enregistré")
			return stop()
		}

		spinner.stop()
		mainMenu()
	})
}

// Préparer une liste de comptes
var accountsInformations = editJsonFile(`${path.join(config.path, '..', 'accountsInformations.json')}`);

// Préparer les logs
	// Crée le fichier si il n'existe pas
	if(!fs.existsSync(path.join(config.path, '..', 'logs.txt'))) fs.writeFileSync(path.join(config.path, '..', 'logs.txt'), '### Fichier de logs créé par ecochat pour terminal.\n### https://ecochat.github.io/ecochat')

	// Fonction pour ajouter du texte dans les logs
	var logFile = fs.createWriteStream(path.join(config.path, '..', 'logs.txt'), { flags: 'w' });
	function addToLog(content) {
		if(logFile) logFile.write(`\n[${moment().format('HH:mm:ss')}]  ${util.format(content)}`)
	};

	// Ajouter quelques trucs dans les logs
	logFile.write(`${fs.readFileSync(path.join(config.path, '..', 'logs.txt')).toString()}\n\n\n***** ${moment().format("DD/MM/YYYY")} *****\n\n[${moment().format('HH:mm:ss')}]  Démarrage d'Ecochat`)

// Fonction pour demander un UUID
async function askUUID(){
	addToLog("Affichage d'explications sur les comptes Johanstickman (premier démarrage)")
	console.log("Pour utiliser Ecochat, vous aurez besoin d'un compte Johanstickman ainsi que son UUID.")
	console.log("Rendez-vous sur " + chalk.cyan("https://johanstickman.com/uuid") + " pour obtenir votre UUID de compte.")

	setTimeout(async function () {
		// Liste des questions
		const questions = [
			{
				type: 'input',
				name: 'uuid',
				message: 'UUID de votre compte :',
				validate(text) {
					if (text.length < 1) { return 'Veuillez entrer un UUID' }
					return true;
				}
			}
		];

		// Poser la question
		var answer = await inquirer.prompt(questions)

		// Afficher un texte et un spinner
		addToLog("Vérification de l'UUID de compte donné")
		spinner.text = "Vérification de l'UUID"
		spinner.start()

		// Définir l'UUID pour le client
		var setUUID = await client.setUUID(answer?.uuid)

		// Si l'UUID n'a pas été défini
		if(setUUID !== "Compte existant !"){
			spinner.text = spinner.text = `Impossible d'accéder à votre compte : ${setUUID}`
			return spinner.fail()
		}

		// Ajouter l'UUID à la configuration
		config.set('uuid', answer?.uuid)
		addToLog("Modification de l'UUID de compte enregistré")

		// Arrêter un spinner
		spinner.text = "UUID validé. Veuillez redémarrer Ecochat."
		spinner.succeed()

		// Arrêter le processus
		stop()
	}, 2500)
}

// Fonction pour afficher le menu principal
async function mainMenu(){
	addToLog("Affichage du menu principal")

	// Afficher le menu principal
	return inquirer.prompt([
		{
			type: 'list',
			name: 'action',
			message: 'Que voulez-vous faire ?',
			choices: [
				'Discuter',
				'Votre compte',
				'Configuration'
			]
		}
	])
	.then(answer => {
		if(answer.action.toLowerCase() === "discuter") return addToLog("Choix via le menu principal : « discuter »") & console.log(chalk.dim("(Appuyer sur ENTER pour écrire un message)\n(Appuyer sur ESPACE pour actualiser)")) & chat();
		if(answer.action.toLowerCase() === "votre compte") return addToLog("Choix via le menu principal : « votre compte »") & accountSettings();
		if(answer.action.toLowerCase() === "configuration") return addToLog("Choix via le menu principal : « configuration »") & configuration("main");
	});
}

// Fonction pour la configuration
async function configuration(action){
	// Si l'action est "main"
	if(action === "main"){
		addToLog("Affichage du menu de configuration principale")

		// Afficher le menu principal
		inquirer.prompt([
			{
				type: 'list',
				name: 'action',
				message: 'Que voulez-vous faire ?',
				choices: [
					'Vider le cache',
					'Se déconnecter'
				]
			}
		])
		.then(answer => {
			if(answer.action.toLowerCase() === "vider le cache") return addToLog("Choix via le menu principal : « vider le cache »") & configuration("emptyCache");
			if(answer.action.toLowerCase() === "se déconnecter") return addToLog("Choix via le menu principal : « se déconnecter »") & configuration("logout");
		});
	}

	// Si l'action est "emptyCache"
	if(action === "emptyCache"){
		console.log("Suppression du cache...")
		var cacheFiles = [path.join(config.path, '..', 'logs.txt'),path.join(config.path, '..', 'accountsInformations.json')]

		cacheFiles.forEach(f => {
			fs.unlink(f, function (err) {
				if(err && !err?.toString()?.includes("ENOENT")) return console.log(chalk.red(`Impossible de supprimer un fichier : ${err?.toString()?.split(":")[1]}`))
				if(err) return;
				console.log(chalk.dim(`"${path.basename(f)}" supprimé.`));
			}); 
		})
	}

	// Si l'action est "logout"
	if(action === "logout"){
		// Afficher un spinner
		addToLog("Suppression du token enregistré...")
		spinner.text = "Déconnexion..."
		spinner.start()

		// Modification de la configuration
		config.delete('uuid')

		// Modifier le spinner
		spinner.text = "Déconnexion effectuée !"
		spinner.succeed()
	}
}

// Obtenir des informations sur son compte
async function accountSettings(){
	// Afficher un spinner
	addToLog("Obtention d'informations sur le compte")
	spinner.text = "Obtention d'informations sur votre compte"
	spinner.start()

	// Obtenir des informations sur soi même
	var accountInfo = await client.getOwnInfo()
	if(accountInfo?.error === true){
		spinner.text = "Impossible d'obtenir des informations sur votre compte"
		spinner.fail()
		addToLog("Impossible d'obtenir des informations sur le compte")
		return console.log(chalk.red(`${accountInfo?.message}. ${chalk.bold("Code erreur #" + accountInfo?.code)}`))
	}

	// Afficher les informations
		// Arrêter le spinner
		spinner.stop()

		// Donner des informations sur le compte
		addToLog("Affichage d'informations sur le compte")
		console.log(`Vous êtes connecté en tant que ${chalk.bold.cyan(accountInfo?.data?.username + "#" + accountInfo?.data?.tag)}`)
		console.log(`     ${chalk.bold("Identifiant  :  ") + accountInfo?.data?.id}`)
		if(accountInfo?.data?.certified === true) console.log(`     ${chalk.bold("Certifié     :  ") + "oui"}`)

		// Dire si on est banni
		if(accountInfo?.data?.banned === true) console.log(chalk.dim(`Votre compte est banni.`)); else console.log(chalk.dim("Plus d'information sur johanstickman.com/account"))
}

// Voir les messages
async function chat(){
	// Préparer certaines choses
	typing = false;
	var lastShowed = 0;

	// Afficher les messages
	showMessages()
	async function showMessages(restart = false){
		// Préparer une variable (utilisé quand on appuie sur une touche) ainsi qu'une variable "prêt à actualisé"
		let lastExecution = 0;
		readyToReload = false;

		// Si on doit recommencer, mettre à 0 certaines valeurs
		if(restart === true) lastShowed = 0 & clearInterval(reloadMessages)

		// Obtenir les derniers messages
		addToLog("Obtentions des derniers messages")
		var getMessages = await client.getMessages()
		if(getMessages.error) return console.log(chalk.red(getMessages.message))

		// A chaque messages
		var reloadMessages = setInterval(async () => {		
			getMessages.forEach(async m => {
				// Si on est en train d'écrire
				if(typing === true) return;

				// Empêcher les messages d'être affiché dans le mauvais ordre
				if(getMessages.indexOf(m).toString() !== lastShowed.toString()) return;

				// Obtenir des informations sur l'auteur
					// Si on a aucune information sur la personne
					if((accountsInformations.get(m?.id)) === undefined){
						var msgInfo = (await client.getInfo(m?.id)).data
						accountsInformations.set(m?.id, { username: msgInfo?.username, tag: msgInfo?.tag })
						accountsInformations.save();
						addToLog("Auteur de messages inconnu trouvé : sauvegarde de ses informations pour le futur")
					} else {
						// Si on a des informations sur la personne
						var msgInfo = (accountsInformations.get(m?.id))
					}

				// Afficher le message
				if(typing === false) console.log(chalk.greenBright(`[${m?.id}]`) + chalk.bold(` ${msgInfo?.username}#${msgInfo?.tag}`) + ` : ${m?.message}`)

				// Ajouter +1 au dernier message affiché
				if(typing === false) lastShowed++

				// Si c'est le dernier message, arrêter de refresh
				if(typing === false && lastShowed === 7 && getMessages.indexOf(m) === 6) return readyToReload = true & clearInterval(reloadMessages)
			})
		}, 1000)

		// Détecter les appuis de touches
		term.grabInput(true)
		term.on('key', async function(name, matches, data){
			// Entrer : pour écrire
			if(name === 'ENTER'){
				// Si on écris déjà
				if(typing === true) return;

				// Arrêter la boucle d'actualisation (on dirait une traduction foireuse mais j'ai juste aucune idée de comment le dire)
				typing = true

				// Demander un texte
					// Liste des questions
					const questions = [{
						type: 'input',
						name: 'message',
						message: 'Que souhaitez-vous dire :',
						validate(text) {
							if (text?.replace(/ /g,'')?.length < 1) return 'Veuillez entrez un message à envoyer';
							return true;
						}
					}];

					// Poser la question
					var answer = await inquirer.prompt(questions)

				// Envoyer le message
				addToLog(`Envoie d'un message : ${answer?.message}`)
				if(answer?.message?.length > 1) var send = await client.sendMessage(answer?.message?.replace(/&/g,'%26')?.replace(/#/g,'%23').replace(config.get('uuid'),'*** UUID censuré ***')); else var send = { error: true, message: "Le contenu de ce message est trop court" }
				if(send?.error === true) console.log(chalk.red(send?.message)) && addToLog(`Echec d'envoie du message : ${send?.message}`)

				// Dire que le message s'est envoyé
				if(send?.error !== true) console.log(chalk.blueBright(send?.message.toString().replace('Message envoyé','Le message a été envoyé !')))
				typing = false;

				// Afficher les messages
				showMessages(true)
			}
			// Espace : pour actualiser
			if(name === ' ' || name === 'SPACE'){
				// Si on est en train d'écrire un message ou qu'une partie du code empêche l'actualisation
				if(typing === true) return;
				if(readyToReload === false) return;

				if ((lastExecution + 1999) < Date.now()){
					// Arrêter d'afficher des messages
					if(reloadMessages) clearInterval(reloadMessages)
					readyToReload = false;
					typing = true;

					// Dire que l'actualisation est en cours
					addToLog("Actualisation des messages")
					console.log(chalk.dim("\nActualisation des messages...\n"))

					// Afficher les messages
					showMessages(true)
					typing = false;

					// Modifier la date de la dernière exécution
					lastExecution = Date.now()
				}
			}
		});
	}
}

// Si on CTRL + C / CTRL + Z
term.grabInput(true)
term.on('key', function(name, matches, data){
	if(name === 'CTRL_C' || name === 'CTRL_Z'){
		term.grabInput(false)
		stop()
	}
});

// Fonction pour arrêter le processus en loggant l'action
function stop() {
	addToLog("Arrêt d'Ecochat")
	process.exit()
};
process.on('beforeExit', () => {
	addToLog("Arrêt d'Ecochat")
	process.exit()
})
