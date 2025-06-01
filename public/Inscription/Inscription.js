const Email = document.querySelector('#email');
const Password = document.querySelector('#password');
const ConfirmPassword = document.querySelector('#confirmpassword');
const BoutonRetour= document.querySelector('#retour');
const BoutonInscription= document.querySelector('#Inscription');


BoutonInscription.addEventListener('click', () => { 
    const mail = Email.value.trim();
    const motdepasse = Password.value.trim();
    const confirmMotdepasse = ConfirmPassword.value.trim();
    const nom_complet = mail.split('@')[0];
    const prenom = nom_complet.split('.')[0];
    let nom = nom_complet.split('.')[1];
    if (nom.includes('1') || nom.includes('2') ) {
        nom= nom.replace(/[1-2]/g, '');
    }
    if (mail.includes('junia.com') && motdepasse === confirmMotdepasse) {
        fetch('/api/inscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email : mail, motdepasse: motdepasse, prenom: prenom, nom: nom })
    })
    .then(res => res.json())
    .then(data => {
        window.location.href = 'https://projetinfo.onrender.com/Connexion/Connexion.html';
    });         
}   
        Email.value="";
        Password.value="";
    })


BoutonRetour.addEventListener('click', () => {
    window.location.href = 'https://projetinfo.onrender.com/Connexion/Connexion.html';
})
