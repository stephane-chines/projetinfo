const Email = document.querySelector('#email');
const Password = document.querySelector('#password');
const BoutonConnexion = document.querySelector('#connexion');
const BoutonInscription= document.querySelector('#create-account');


BoutonConnexion.addEventListener('click', () => {
    const VerifMail = Email.value.trim();
    const VerifMotdepasse = Password.value.trim();
    
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
            localStorage.setItem("username", data.username);
            window.location.href = 'http://localhost:3000/QR/index.html';
        }
    }); 
})

BoutonInscription.addEventListener('click', () => {
    window.location.href = 'http://localhost:3000/Inscription/Inscription.html';
})
