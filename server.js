const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./BDD.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS reponses(
   IDReponse INTEGER PRIMARY KEY AUTOINCREMENT,
   IDQuestion INT,
   username TEXT,
   corps TEXT,
   votes INT,
   date DATETIME DEFAULT CURRENT_TIMESTAMP,
   url TEXT,
   FOREIGN KEY(IDQuestion) REFERENCES questions(IDQuestion)
   );`
);

db.run(`CREATE TABLE IF NOT EXISTS chat(
   IDChat INTEGER PRIMARY KEY AUTOINCREMENT,
   corps TEXT,
   date DATETIME DEFAULT CURRENT_TIMESTAMP,
   username TEXT,
   subject TEXT
   );`
);

db.run(`CREATE TABLE IF NOT EXISTS document(
   IDDocument INTEGER PRIMARY KEY AUTOINCREMENT,
   url TEXT,
   DateHeure DATETIME,
   subject TEXT,
   type TEXT
);`
);

db.run(`CREATE TABLE IF NOT EXISTS Utilisateurs(
   IDUser INTEGER PRIMARY KEY AUTOINCREMENT,
   motdepasse TEXT,
   nom TEXT,
   prenom TEXT,
   username TEXT,
   email TEXT,
   professeur INTEGER,
   admin INTEGER DEFAULT 0,
   IDDocument INT,
   IDChat INT,
   IDReponse INT,
   FOREIGN KEY(IDDocument) REFERENCES document(IDDocument),
   FOREIGN KEY(IDChat) REFERENCES chat(IDChat),
   FOREIGN KEY(IDReponse) REFERENCES reponses(IDReponse)
);`
);

db.run(`CREATE TABLE IF NOT EXISTS questions(
   IDQuestion INTEGER PRIMARY KEY AUTOINCREMENT,
   titre TEXT,
   corps TEXT,
   votes INT,
   date DATETIME DEFAULT CURRENT_TIMESTAMP,
   username TEXT,
   url TEXT,
   IDUser INT,
   IDReponse INT,
   subject TEXT,
   FOREIGN KEY(IDUser) REFERENCES Utilisateurs(IDUser),
   FOREIGN KEY(IDReponse) REFERENCES reponses(IDReponse)
);`
);

db.run(`CREATE TABLE IF NOT EXISTS Images(
   IDImages INTEGER PRIMARY KEY AUTOINCREMENT,
   IDQuestion INT,
   FOREIGN KEY(IDQuestion) REFERENCES questions(IDQuestion)
);`
);


})


// Nouvelle route POST pour écrire une question (pour fetch côté client)
app.post('/api/question', (req, res) => {
  let { titre, corps, username, votes } = req.body;
  if (!titre) return res.status(400).json({ error: "Le titre est obligatoire" });
  if (!username) username = 'Utilisateur Anonyme';
  if (!votes) votes = 0;
  const sql = 'INSERT INTO questions (titre, corps, username, votes) VALUES (?, ?, ?, ?)';
  db.run(sql, [titre, corps, username, votes], function(err) {
    if (err) {
      console.error("Erreur SQLite lors de l'insertion :", err);
      return res.status(500).json({ error: "Erreur lors de l'insertion" });
    }
    // On renvoie l'objet inséré
    res.json({ IDQuestion: this.lastID, titre, corps, username, votes,date : new Date().toISOString() });
  });
});

// Rote POST pour écrire une réponse (pour fetch côté client)
app.post('/api/reponse', (req, res) => {
  let { IDQuestion, corps, username, votes } = req.body;
  if (!IDQuestion || !corps) return res.status(400).json({ error: "IDQuestion et corps sont obligatoires" });
  if (!username) username = 'Utilisateur Anonyme';
  if (!votes) votes = 0;
  const sql = 'INSERT INTO reponses (IDQuestion, corps, username, votes) VALUES (?, ?, ? , ?)';
  db.run(sql, [IDQuestion, corps, username, votes], function(err) {
    if (err) {
      console.error("Erreur SQLite lors de l'insertion de la réponse :", err);
      return res.status(500).json({ error: "Erreur lors de l'insertion de la réponse" });
    }
    res.json({ IDReponse: this.lastID, IDQuestion, corps, username, votes, date: new Date().toISOString() });
  });
});

// Route GET pour lire toutes les questions (utilisée pour l'affichage)
app.get('/get-question', (req, res) => {
  db.all('SELECT * FROM questions', [], (err, rows) => {
    if (err) {
      console.error("Erreur SQLite lors de la lecture :", err);
      return res.status(500).json({ error: "Erreur lors de la lecture" });
    }
    res.json(rows);
  });
});

// Route GET pour lire le chat d'un subject

app.get('/get-chat/:subject', (req, res) => {
  const subject = req.params.subject;
  db.all('SELECT * FROM chat WHERE subject = ?', [subject], (err, rows) => {
    if (err) {
      console.error("Erreur SQLite lors de la lecture du chat :", err);
      return res.status(500).json({ error: "Erreur lors de la lecture du chat" });
    }
    res.json(rows);
  });
});

// Route GET pour lire les réponses d'une question
app.get('/get-reponses/:id', (req, res) => {
  const id = req.params.id;
  db.all('SELECT * FROM reponses WHERE IDQuestion = ?', [id], (err, rows) => {
    if (err) {
      console.error("Erreur SQLite lors de la lecture des réponses :", err);
      return res.status(500).json({ error: "Erreur lors de la lecture des réponses" });
    }
    res.json(rows);
  });
});

// Route GET pour obtenir le nombre de réponses d'une question
app.get('/get-nb-reponses/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT COUNT(*) AS nbReponses FROM reponses WHERE IDQuestion = ?', [id], (err, row) => {
    if (err) {
      console.error("Erreur SQLite lors de la lecture du nombre de réponses :", err);
      return res.status(500).json({ error: "Erreur lors de la lecture du nombre de réponses" });
    }
    res.json({ nbReponses: row.nbReponses });
  });
});

// Route GET pour obtenir le nombre de votes d'une réponse à une question
app.get('/get-votes-reponse/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT votes FROM reponses WHERE IDReponse = ?', [id], (err, row) => {
    if (err) {
      console.error("Erreur SQLite lors de la lecture des votes :", err);
      return res.status(500).json({ error: "Erreur lors de la lecture des votes" });
    }
    if (!row) return res.status(404).json({ error: "Réponse non trouvée" });
    res.json({ votes: row.votes });
  });
});

// Route GET pour lire les votes d'une question
app.get('/get-votes-question/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT votes FROM questions WHERE IDQuestion = ?', [id], (err, row) => {
    if (err) {
      console.error("Erreur SQLite lors de la lecture des votes :", err);
      return res.status(500).json({ error: "Erreur lors de la lecture des votes" });
    }
    if (!row) return res.status(404).json({ error: "Question non trouvée" });
    res.json({ votes: row.votes });
  });
});

// Route GET pour connâitre le nombre de chats d'un subject
app.get('/get-nb-chats/:subject', (req, res) => {
  const subject = req.params.subject;
  db.get('SELECT COUNT(*) AS nbchats FROM chat WHERE subject = ?', [subject], (err, row) => {
    if (err) {
      console.error("Erreur SQLite lors de la lecture du nombre de chats :", err);
      return res.status(500).json({ error: "Erreur lors de la lecture du nombre de chats" });
    }
    res.json({ nbchats: row.nbchats });
  });
});

// Ajout d'une route POST pour la création côté JS (fetch)
app.post('/add-question', (req, res) => {
  const { titre, corps, username, votes } = req.body;
  if (!titre) return res.status(400).json({ error: "Le titre est obligatoire" });

  const sql = 'INSERT INTO questions (titre, corps, username, votes) VALUES (?, ?, ? , ?)';
  db.run(sql, [titre, corps, username, votes], function(err) {
    if (err) {
      console.error("Erreur SQLite lors de l\'insertion :", err);
      return res.status(500).json({ error: "Erreur lors de l\'insertion" });
    }
    res.json({ IDQuestion: this.lastID, titre, corps, username, votes, date: new Date().toISOString() });
  });
});

app.post('/add-reponse', (req, res) => {
  const { IDQuestion, corps, username, votes } = req.body;
  if (!IDQuestion || !corps) return res.status(400).json({ error: "IDQuestion et corps sont obligatoires" });
  const sql = "INSERT INTO reponses (IDQuestion, corps) VALUES (? , ?)";
  db.run(sql, [IDQuestion, corps, username, votes], function (err) {
    if (err) {
      console.error("Erreur SQLite lors de l'insertion de la réponse :", err);
      return res.status(500).json({ error: "Erreur lors de l'insertion de la réponse" });
    }
    res.json({ IDReponse: this.lastID, IDQuestion, corps, username, votes, date: new Date().toISOString() });
  });
});

// Route POST pour écrire un message dans le chat
app.post('/api/new-chat', (req, res) => {
  const { corps, username, subject } = req.body;
  if (!corps || !username || !subject) return res.status(400).json({ error: "Corps, username et subject sont obligatoires" });

  const sql = 'INSERT INTO chat (corps, username, subject) VALUES (?, ?, ?)';
  db.run(sql, [corps, username, subject], function(err) {
    if (err) {
      console.error("Erreur SQLite lors de l'insertion du chat :", err);
      return res.status(500).json({ error: "Erreur lors de l'insertion du chat" });
    }
    res.json({ IDChat: this.lastID, corps, username, date: new Date().toISOString(), subject });
  });
});

// Route POST pour voter pour une question
app.post('/api/vote', (req, res) => {
  const { IDQuestion } = req.body; 
  if (!IDQuestion) return res.status(400).json({ error: "ID Manquante" });

  const sql = 'UPDATE questions SET votes = votes + 1 WHERE IDQuestion = ?';
  db.run(sql, [IDQuestion], function (err) {
    if (err) {
      console.error("Erreur SQLite lors du vote :", err);
      return res.status(500).json({ error: "Erreur lors du vote" });
    }
    res.json({ success: true });
  });
});

// Route POST pour voter pour une réponse
app.post('/api/vote-reponse', (req, res) => {
  const { IDReponse } = req.body;
  if (!IDReponse) return res.status(400).json({ error: "ID Manquante" });

  const sql = 'UPDATE reponses SET votes = votes + 1 WHERE IDReponse = ?';
  db.run(sql, [IDReponse], function (err) {
    if (err) {
      console.error("Erreur SQLite lors du vote pour la réponse :", err);
      return res.status(500).json({ error: "Erreur lors du vote pour la réponse" });
    }
    res.json({ success: true });
  });
});

app.listen(3000, () => {
  console.log('Serveur démarré sur http://localhost:3000');
});

app.post('/api/inscription', (req, res) => {
  const { email, motdepasse, prenom, nom, professeur,username} = req.body;
  if (!email) return res.status(400).json({ error: "Le mail est obligatoire" });
  if (!motdepasse) return res.status(400).json({ error: "Le mot de passe est obligatoire" });
  
  const sql = 'INSERT INTO Utilisateurs (email, motdepasse, prenom, nom, professeur, username) VALUES (?, ?, ?, ?, ?, ?)';
  db.run(sql, [email,motdepasse,prenom,nom,professeur, username], function(err) {
    if (err) {
      console.error("Erreur SQLite lors de l'insertion :", err);
      return res.status(500).json({ error: "Erreur lors de l'insertion" });
    }
    // On renvoie l'objet inséré
    res.json({ email, motdepasse,prenom,nom,professeur,username});
  });
});



app.post('/api/connexion', (req, res) => {
  const { email, motdepasse } = req.body;
  if (!email || !motdepasse) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }
  db.get('SELECT * FROM Utilisateurs WHERE email = ? AND motdepasse = ?', [email, motdepasse], (err, row) => {
    if (err) {
      console.error("Erreur SQLite lors de la vérification :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    if (!row) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
    res.json({ message: "Connexion réussie", prenom: row.prenom, nom: row.nom, username :row.username });
  })
});
