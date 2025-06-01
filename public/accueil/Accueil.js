const Analyse_des_Signaux = document.getElementById("Analyse des signaux");
const Automatique = document.getElementById("Automatique");
const Base_de_données = document.getElementById("Base de données");
const Comptabilité = document.getElementById("Comptabilité");
const Economie = document.getElementById("Economie");
const Elec = document.getElementById("Electronique analogique");
const Microcontroleur = document.getElementById("Microcontroleur");
const FPGA = document.getElementById("FPGA");
const Ethique = document.getElementById("Ethique");
const Gestion_de_projet = document.getElementById("Gestion de projet");
const Langage_C = document.getElementById("Langage C");
const Marketing = document.getElementById("Marketing");
const Mécanique_quantique = document.getElementById("Mécanique quantique");
const Oddysée = document.getElementById("Oddysée");
const PDS = document.getElementById("Physique du solide");
const Proba = document.getElementById("Probabilités statistiques");
const POO = document.getElementById("Programmation orienté objet");
const Réseau = document.getElementById("Réseau");
const Transfo = document.getElementById("Transformations integrales");


const recherche = document.getElementById("recherche");



Analyse_des_Signaux.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/Analyse_des_Signaux/Analyse_des_Signaux.html";
});
Automatique.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/Automatique/Automatique.html";
});
Base_de_données.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/Base_de_donnees/Base_de_donnees.html";
});
Comptabilité.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/Comptabilite/Comptabilite.html";
});
Economie.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/Economie/Economie.html";
});
Elec.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/Electronique_analogique/Electronique_analogique.html";
});
Microcontroleur.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/Microcontroleur/Microcontroleur.html";
});
FPGA.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/FPGA/FPGA.html";
});
Ethique.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/Ethique/Ethique.html";
});
Gestion_de_projet.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/Gestion_de_projet/Gestion_de_projet.html";
});
Langage_C.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/Langage_C/Langage_C.html";
});
Marketing.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/Marketing/Marketing.html";
});
Mécanique_quantique.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/Mecanique_quantique/Mecanique_quantique.html";
});
Oddysée.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/Oddysee/Oddysee.html";
});
PDS.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/Physique_du_Solide/Physique_du_Solide.html";
});
Proba.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/Probabilites_Statistiques/Probabilites_Statistiques.html";
});
POO.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/POO/POO.html";
});
Réseau.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/Reseau/Reseau.html";
});
Transfo.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/Transformation_Integrales/Transformation_Integrales.html";
});


function normalize(str) {
    return str
        .toLowerCase() // minuscules
        .normalize("NFD") // décompose les accents
        .replace(/[\u0300-\u036f]/g, "") // enlève les accents
}


const matiereIds = [
    "Analyse des signaux", "Automatique", "Base de données", "Comptabilité", "Economie", "Electronique analogique",
    "Microcontroleur", "FPGA", "Ethique", "Gestion de projet", "Langage C", "Marketing",
    "Mécanique quantique", "Oddysée", "Physique du solide", "Probabilités statistiques", "Programmation orienté objet", "Réseau", "Transformations integrales"
];


recherche.addEventListener("input", function() {
    const texte = normalize(recherche.value);
    for (const id of matiereIds) {
        const bouton = document.getElementById(id);
        if (bouton) {
            const blocPhoto = bouton.closest('.photo');
            const nomLisible = normalize(id);
            if (nomLisible.includes(texte)) {
                blocPhoto.style.display = "block";
            } else {
                blocPhoto.style.display = "none";
            }
        }
    }
});
const logout = document.getElementById("logout")
const DefaultUser ="Utilisateur Anonyme";

logout.addEventListener("click",(event) => {
    localStorage.setItem("username", DefaultUser);
    window.location.href = 'http://localhost:3000/Connexion/Connexion.html';

})
