// Importer node-fetch, définir l'URL de l'API et définir l'UUID
const fetch = require('node-fetch');
var apiLink = "https://ecochat-api.herokuapp.com/api"
userUuid = ""

// Fonction pour génerer une erreur
async function generateError(description, code){
	return { error: true, message: description, code: code }
}

// Définir l'UUID de l'utilisateur
module.exports.setUUID = async function(uuid){
	// Si un UUID n'est pas donné
	if(!uuid) return "UUID_NOT_GIVED";

	// Obtenir des informations sur le compte
	var request_getInfo = await fetch(`${apiLink}/accountInfo?uuid=${uuid}`, { method: 'get' })
	.then(res => res.json())
	.catch(async err => {
		return "FETCHERR_UNABLE_GET_USERINFO";
	})
	if(request_getInfo?.error === true) return request_getInfo?.message;
	if((JSON.stringify(request_getInfo?.data)).length === 2) return "UNKNOWN_ACCOUNT"

	// Définir l'UUID
	if(uuid) userUuid = uuid.toString()
	return "Compte existant !";
}

// Donner l'UUID de l'utilisateur
module.exports.getUUID = async function(){
	return userUuid || undefined;
}

// Obtenir les informations sur son compte
module.exports.getOwnInfo = async function(){
	// Si l'UUID n'est pas défini
	if(!userUuid) return "UUID_NOT_SET";

	// Obtenir des informations sur le compte
	var request_getInfo = await fetch(`${apiLink}/accountInfo?uuid=${userUuid}`, { method: 'get' })
	.then(res => res.json())
	.catch(async err => {
		return (await generateError(err.message, "FETCHERR_UNABLE_GET_USERINFO"))
	})
	if(request_getInfo?.error === true) return (await generateError(request_getInfo?.message, "UNABLE_GET_USERINFO"))
	if((JSON.stringify(request_getInfo?.data)).length === 2) return "UNKNOWN_ACCOUNT"

	// Donner les informations du compte
	return request_getInfo;
}

// Obtenir les informations sur un ID
module.exports.getInfo = async function(id){
	// Si l'ID n'est pas donné
	if(!id) return "ID_NOT_SET";

	// Obtenir des informations sur le compte
	var request_getInfo = await fetch(`https://johanstickman.com/api/infoWithId?id=${id}`, { method: 'get' })
	.then(res => res.json())
	.catch(async err => {
		return "FETCHERR_UNABLE_GET_USERINFO"
	})
	if(request_getInfo?.error === true) return (await generateError(request_getInfo?.message, "UNABLE_GET_USERINFO"))

	// Donner les informations du compte
	return request_getInfo;
}

// Obtenir les derniers messages
module.exports.getMessages = async function(){
	// Si l'UUID n'est pas défini
	if(!userUuid) return (await generateError("L'UUID n'a pas été défini (erreur dans le code)", "UUID_NOT_SET"))

	// Obtenir les derniers messages
	var request_getMessages = await fetch(`${apiLink}/messages?uuid=${userUuid}`, { method: 'get' })
	.then(res => res.json())
	.catch(async err => {
		return (await generateError(request_getMessages?.message, "FETCHERR_UNABLE_GET_MESSAGES"))
	})
	if(request_getMessages?.error === true) return (await generateError(request_getMessages?.message, "UNABLE_GET_MESSAGES"))

	// Retourner les 7 derniers messages
	return request_getMessages?.list?.slice(Math.max(request_getMessages?.list?.length - 7, 0));
}

// Envoyer un message
module.exports.sendMessage = async function(text){
	// Si l'UUID n'est pas défini / aucun texte n'est donné
	if(!userUuid) return (await generateError("L'UUID n'a pas été défini (erreur dans le code)", "UUID_NOT_SET"))
	if(!text) return (await generateError("Le contenu du message à envoyer est vide", "TEXT_NOT_SET"))

	// Envoyer le message
	var request_sendMessage = await fetch(`${apiLink}/say?uuid=${userUuid}&message=${text}`, { method: 'post' })
	.then(res => res.json())
	.catch(async err => {
		return (await generateError(request_sendMessage?.message, "FETCHERR_UNABLE_SEND_MESSAGE"))
	})
	if(request_sendMessage?.error === true) return (await generateError(request_sendMessage?.message, "UNABLE_SEND_MESSAGE"))

	// Retourner la réponse de l'API
	return request_sendMessage
}
