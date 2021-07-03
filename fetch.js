// Dépendences
const fetch = require('node-fetch');
var apiLink = "https://ecochat-api.herokuapp.com"

// Crée les fonctions - compte
module.exports.account = {
    // Crée un compte
    create: async function (username) {
        let data = await fetch(apiLink + '/api/account/create?username=' + username, { method: 'POST', follow: 20, size: 500000})
            .then(res => res.json());
        return data
    },
    
    // Voir les informations sur un compte
    view: async function (token) {
        let data = await fetch(apiLink + '/api/account/info?token=' + token, { method: 'GET', follow: 20, size: 500000})
            .then(res => res.json());
        return data
    },

    // Bannir un compte
    ban: async function (id, code, type) {
        let data = await fetch(apiLink + '/api/account/ban?id=' + id + '&code=' + code + '&type=' + type, { method: 'POST', follow: 20, size: 500000})
            .then(res => res.json());
        return data
    }
}

// Crée les fonctions - chat
module.exports.chat = {
    // Envoyer un message dans le chat
    say: async function (token, message) {
        let data = await fetch(apiLink + '/api/chat/say?token=' + token + '&message=' + message, { method: 'POST', follow: 20, size: 500000})
            .then(res => res.json());
        return data
    },
    
    // Obtenir la liste des messages dans le chat
    list: async function (token) {
        let data = await fetch(apiLink + '/api/chat/list?token=' + token, { method: 'GET', follow: 20, size: 500000})
            .then(res => res.json());
        return data
    }
}

// Crée les fonctions - autre
module.exports.other = {
    // Obtenir la version recommendé d'Ecochat
    version: async function (type) {
        // Faire un fetch
        let data = await fetch(apiLink + '/api/version', { method: 'GET', follow: 20, size: 500000})
            .then(res => res.json());

        // Obtenir dans des variables quelques trucs
            // Erreur
            if(data && data.error === true) var error = data.shortError
           	if(data && data.error === false) var error = ""
            if(data && data.error === false) var jsonError = ""

            // Version
            if(data && data.error === false) var versionApi = data.versions.api
            if(data && data.error === false) var versionTerminal = data.versions.terminal
            if(data && data.error === false) var versionAutomate = data.versions.automate
            if(data && data.error === false) var versionList = data.versions

        // Donner la réponse
        if(type === "api") return versionApi || error
        if(type === "terminal") return versionTerminal || error
        if(type === "automate") return versionAutomate || error
        if(type === "all") return versionList || error
        if(type && type !== "api" && !type !== "terminal" && !type !== "automate" && !type !== "all") return "invalidType";
        if(!type && data) return data || error
    },
}
