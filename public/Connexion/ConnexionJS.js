// Sélection des éléments du DOM
const Email = document.querySelector('#email');
const Password = document.querySelector('#password');
const BoutonConnexion = document.querySelector('#connexion');
const BoutonInscription = document.querySelector('#create-account');
const chat = document.getElementById('chat-anime');

// Connexion utilisateur
BoutonConnexion.addEventListener('click', () => {
    const VerifMail = Email.value.trim();
    const VerifMotdepasse = Password.value.trim();

    if (!VerifMail || !VerifMotdepasse) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    fetch('/api/connexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: VerifMail, motdepasse: VerifMotdepasse })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert("Email ou mot de passe incorrect !");
        } else {
            // Sauvegarde des informations dans le localStorage
            localStorage.setItem("IDUser", data.IDUser);
            localStorage.setItem("username", data.username);

            // Redirection vers l'accueil
            window.location.href = '/accueil/Accueil.html';
        }
    })
    .catch(error => {
        console.error("Erreur lors de la connexion :", error);
        alert("Erreur lors de la tentative de connexion.");
    });
});

// Redirection vers la page d'inscription
BoutonInscription.addEventListener('click', () => {
    window.location.href = '/Inscription/Inscription.html';
});

// Chat animé
function deplacerChat() {
    if (!chat) return;

    const chatWidth = chat.offsetWidth;
    const chatHeight = chat.offsetHeight;

    const maxX = window.innerWidth - chatWidth;
    const maxY = window.innerHeight - chatHeight;

    const x = Math.random() * maxX;
    const y = Math.random() * maxY;

    chat.style.left = `${x}px`;
    chat.style.top = `${y}px`;
}

// Démarrage animation
deplacerChat();
setInterval(deplacerChat, 3000);
window.addEventListener('resize', deplacerChat);
