#!/usr/bin/env node

// Dépendences
var term = require('terminal-kit').terminal;
const fetch = require('./fetch.js');
const Conf = require('conf');
const config = new Conf();
var prompt = require('prompt');

// Accès a la configuration
    // Token : get puis mettre un statut par défaut (si besoin)
    let token = config.get('token')
    if(!token) config.set('token', '')

// Fonction pour afficher la configuration
function showConfig(){
	// Sauter une ligne
	console.log("\n")	

	// Liste des questions
	const properties = [
		{
			name: 'token',
			message: "Token utilisé pour votre compte Ecochat",
			warning: "Veuillez choisir un token.",
			default: ''
		}
	];

	// Demander des réponses
	prompt.start();

	// Obtenir les réponses
	prompt.get(properties, function (err, result) {
		if (err) return term.red("\n" + err) && process.exit()

		// Noter dans la config les réponses
		config.set('token', result.token);

		// Afficher les résultats
		console.log("Token : " + result.token.slice(0, -15) + '***************');
		term.green("Ecochat a besoin d'être redémarrer pour effectuer les modifications.\n") && process.exit()
	});
}

// Fonction pour voir le compte
async function account(){
	// Si aucun compte n'est connecté
	if(!token){
		term("\nVous n'êtes pas connecté. Utiliser l'option configuration pour vous connecter à un compte existant ou sinon, créé un nouveau compte.")

		// Afficher un menu
		term("\nQue voulez vous faire ?")
		term.singleColumnMenu(["Configuration", "Crée un compte", "Sortir"], function(error, response){
			// Option choisis
			if(response.selectedIndex === 0) var option = "config"
			if(response.selectedIndex === 1) var option = "create"
			if(response.selectedIndex === 2) var option = "stop"

			// Si l'option est "config"
			if(option === "config"){
				term.windowTitle("Ecochat | Configuration")
				showConfig()
			}

			// Si l'option est "create"
			if(option === "create"){
				term.windowTitle("Ecochat | Création d'un compte")
				term("\nPseudo du compte : ")
				term.inputField( async function(error, input){
					if(error) return term.red("\nUne erreur s'est produite et votre choix n'a pas pu être détecté.") && process.exit()
					var data = await fetch.account.create(input)

					if(data && data.error === true) return term.red("\nUne erreur s'est produite : " + data.message) && process.exit()
					if(data) term("\n\n") && term.bold(data.message) && term("\n\nToken : ") && term.cyan(data.token) && term("\nID : ") && term.cyan(data.id)
					if(data) config.set('token', data.token)
					
					process.exit()
				});
			}

			// Si l'option est "stop"
			if(option === "stop"){
				process.exit()
			}
		});
	} else {
		// Obtenir les informations du compte
		var data = await fetch.account.view(token)

		// Si il y a une erreur
		if(data && data.error === true && data.shortError === "accountNoAccountFound") return term.red("\nCompte non trouvé...\n") && config.set("token", "") && process.exit()
		if(data && data.error === true && data.shortError !== "accountNoAccountFound") return term.red("\nUne erreur s'est produite : " + data.message) && process.exit()

		// Obtenir le statut du ban
		if(data && data.data.banned === "true") var banStatut = "Votre compte est banni d'Ecochat."
		if(data && data.data.banned === "false") var banStatut = "Votre compte n'est pas banni d'Ecochat."
		if(data && data.data.banned !== "true" && data && data.data.banned !== "false") var banStatut = ""

		// Donner les informations
		if(data) term("\n\n") && term.bold(data.message) && term("\n\nPseudo : ") && term.cyan(data.data.username) && term("\nID : ") && term.cyan(data.data.id) && term("\nToken : ") && term.cyan(token) && term("\n\n" + banStatut)

		// Arrêter le processus
		process.exit()
	}
}

// Fonction pour voir le chat
async function chat(){
		// Obtenir la liste des derniers messages
		var list = await fetch.chat.list(token)

		// Effacer l'écran
		term.eraseDisplay() && term.reset()

		// Regarder si une erreur est survenu
		if(list && list.error === true && list.shortError === "chatNoMessageFound") return term.red("\n" + list.message + "\n\n") && speak()
		if(list && list.error === true  && list.shortError !== "chatNoMessageFound") term.red("\n" + list.message) && process.exit()

		// Changer le titre de la fenêtre du terminal
		term.windowTitle("Ecochat | Discution")

		// A chaque message
		list.messages.slice(Math.max(list.messages.length - 40, 0)).forEach(msg => {
			// Trouver le pseudo, id et le texte du message
			var [username, id, message] = msg.split("⁜")

			// Afficher les messages
			term.brightGreen("\n[" + id + "] ")
			term.bold(username)
			term(" : " + message)
		})

		// Afficher un menu
		term.singleColumnMenu(["Ecrire", "Actualiser","Sortir"], function(error, response){
			// Si l'option est la première
			if(response.selectedIndex === 0){
				speak()
				term.windowTitle("Ecochat | Ecrire un message")
			}

			// Si l'option est la deuxième
			if(response.selectedIndex === 1){
				chat()
			}

			// Si l'option est la troisième
			if(response.selectedIndex === 2){
				process.exit()
			}
		});
}

// Fonction pour envoyer un message dans le chat
async function speak(){
	// Demander le texte à envoyer
	term("Message à envoyer : ")

	// Champ de texte
	term.inputField( async function(error, input){
		// Si il y a une erreur
		if(error) return term.red("Une erreur s'est produite et votre choix n'a pas pu être détecté.") && process.exit()

		// Envoyer le message
		var data = await fetch.chat.say(token, input.replace(token, "*********"))

		// Obtenir le texte en fonction de l'erreur
		if(data.shortError === "chatNoMessage") var text = "Veuillez écrire un message."
		if(data.shortError === "chatMessageTooLittle") var text = "Le message est trop court."
		if(data.shortError === "chatMessageTooHign") var text = "Le message est trop long."
		if(data.shortError !== "chatNoMessage" && data.shortError !== "chatMessageTooLittle" && data.shortError !== "chatMessageTooHign") var text = data.message

		// Obtenir le temps avant de reafficher le chat
		if(data.shortError !== "false") var time = "950"
		if(data.shortError === "false") var time = "400"

		// L'afficher
		term.deleteLine() && term(text)

		// Reafficher le chat
		setTimeout(function(){ chat() }, time)
	});

}

// Fonction pour afficher un menu
function showMenu(){
	// Effacer l'écran d'avant
	term.eraseDisplay() && term.reset()

	// Changer le nom de la fenêtre du terminal
	term.windowTitle("Ecochat | Menu principal")

	// Afficher un menu
	term("Que voulez vous faire ?")
	term.singleColumnMenu(["Discuter", "Compte", "Configuration", "Sortir"], function(error, response){
		// Option choisis
		if(response.selectedIndex === 0) var option = "chat"
		if(response.selectedIndex === 1) var option = "account"
		if(response.selectedIndex === 2) var option = "config"
		if(response.selectedIndex === 3) var option = "stop"

		// Si l'option est "chat"
		if(option === "chat"){
			term.windowTitle("Ecochat | Disscution")
			chat()
		}

		// Si l'option est "account"
		if(option === "account"){
			term.windowTitle("Ecochat | Compte")
            account()
        }

		// Si l'option est "config"
		if(option === "config"){
			term.windowTitle("Ecochat | Configuration")
			showConfig()
		}

		// Si l'option est "stop"
		if(option === "stop"){
			process.exit()
		}
	});
}

// Afficher le menu
if(!token) term.eraseDisplay() && term.reset() && account()
if(token) showMenu()

// Ecouter les appuis de touche
term.grabInput(true);
term.on('key', function(name, matches, data){
    // Arrêter le processus avec CTRL_Z ou CTRL_C
    if(name === 'CTRL_Z' || name === 'CTRL_C'){
		// Sauter quelques lignes (au cas où on est dans un menu)
		console.log("\n\n\n")

        // Arrêter le processus
        process.exit()
    } 
});