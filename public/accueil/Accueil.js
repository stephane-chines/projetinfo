// Centrage du conteneur principal
gallery.style.display = 'flex';
gallery.style.flexDirection = 'column';
gallery.style.alignItems = 'center';

// Conteneurs semestre 1
const containerSem1 = document.createElement("div");
containerSem1.id = "semestre1";
containerSem1.style.textAlign = "center";

const subjectsContainerSem1 = document.createElement("div");
subjectsContainerSem1.style.display = "flex";
subjectsContainerSem1.style.flexWrap = "wrap";
subjectsContainerSem1.style.justifyContent = "center";
containerSem1.appendChild(subjectsContainerSem1);

// Conteneurs semestre 2
const containerSem2 = document.createElement("div");
containerSem2.id = "semestre2";
containerSem2.style.textAlign = "center";

const subjectsContainerSem2 = document.createElement("div");
subjectsContainerSem2.style.display = "flex";
subjectsContainerSem2.style.flexWrap = "wrap";
subjectsContainerSem2.style.justifyContent = "center";
containerSem2.appendChild(subjectsContainerSem2);

// Ajout au DOM
gallery.innerHTML = "";
gallery.appendChild(containerSem1);
const divider = document.createElement("hr");
divider.className = "divider";
gallery.appendChild(divider);
gallery.appendChild(containerSem2);

// Création des boutons de matières
function createSubjectButton(subjectName, subjectID, subjectImage, container) {
    const button = document.createElement("div");
    button.className = "photo";
    button.id = subjectName;

    if (subjectImage) {
        const img = document.createElement("img");
        img.src = subjectImage;
        img.alt = subjectName;
        button.appendChild(img);
    }

    const caption = document.createElement("figcaption");
    caption.textContent = subjectName;
    button.appendChild(caption);

    button.addEventListener("click", () => {
        localStorage.setItem("selectedSubjectID", subjectID);
        window.location.href = "/QR"; // Lien local relatif
    });

    container.appendChild(button);
}

// Récupération des matières
fetch('/get-subjects')
    .then(res => res.json())
    .then(data => {
        data.sort((a, b) => a.subject.localeCompare(b.subject));
        data.forEach(subject => {
            const sem = subject.semestre ?? subject.Semestre; // Selon ton backend
            if (sem === 1) {
                createSubjectButton(subject.subject, subject.idsubject ?? subject.IDSubject, subject.imagelink ?? subject.imageLink, subjectsContainerSem1);
            } else if (sem === 2) {
                createSubjectButton(subject.subject, subject.idsubject ?? subject.IDSubject, subject.imagelink ?? subject.imageLink, subjectsContainerSem2);
            } else {
                createSubjectButton(subject.subject, subject.idsubject ?? subject.IDSubject, subject.imagelink ?? subject.imageLink, gallery);
            }
        });
    })
    .catch(error => {
        console.error('Erreur lors de la récupération des matières :', error);
    });

// Fonction de normalisation pour la recherche
function normalize(str) {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Recherche
const recherche = document.getElementById("recherche");
recherche.addEventListener("input", function () {
    const texte = normalize(recherche.value);
    const photos = document.querySelectorAll('.photo');
    photos.forEach(photo => {
        const nomLisible = normalize(photo.id);
        photo.style.display = nomLisible.includes(texte) ? "block" : "none";
    });
});

// Déconnexion
logout.addEventListener("click", () => {
    localStorage.setItem("username", "DefaultUser");
    window.location.href = '/Connexion/connexion.html';
});
