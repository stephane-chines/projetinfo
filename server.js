require('dotenv').config(); // Charge les variables d'environnement

const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());
// Sert les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Redirige / vers le vrai point d’entrée
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Connexion', 'connexion.html'));
});

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // obligatoire sur Render ou Heroku
      }
    : {
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: process.env.PGPORT
      }
);

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('🕒 Heure actuelle depuis la base :', result.rows[0].now);
    client.release();
  } catch (err) {
    console.error('❌ Erreur de connexion à la base de données :', err.stack);
  }
}

// Vérifie si une contrainte existe dans une table
async function constraintExists(client, tableName, constraintName) {
  const res = await client.query(
    `SELECT 1 FROM information_schema.table_constraints 
     WHERE table_name = $1 AND constraint_name = $2`,
    [tableName.toLowerCase(), constraintName]
  );
  return res.rowCount > 0;
}

// Création des tables et contraintes si elles n'existent pas
async function taskCreateTables() {
  const client = await pool.connect();
  try {
    // 1. Création des tables
    await client.query(`CREATE TABLE IF NOT EXISTS document (
      IDDocument SERIAL PRIMARY KEY,
      url TEXT,
      DateHeure TIMESTAMP,
      subject TEXT,
      type TEXT
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS Subject (
      IDSubject SERIAL PRIMARY KEY,
      subject TEXT UNIQUE,
      Semestre INTEGER,
      imageLink TEXT
    )`);
    await pool.query(`INSERT INTO Subject 
      (IDSubject, subject, Semestre, imageLink) VALUES
      (0, 'FPGA', 1, 'image/FPGA.jpg'),
      (1, 'Microcontrôleur', 1, 'image/Electronique-numérique-Microcontrolleur.jpg'),
      (2, 'Ethique', 1, 'image/Ethique.jpg'),
      (3, 'Gestion de Projet', 1, 'image/Gestion-de-projets.jpg'),
      (4, 'Langage C', 1, 'image/Langage-C.jpg'),
      (5, 'Mécanique Quantique', 1, 'image/Mécanique-quantique.jpg'),
      (6, 'Oddyssée', 1, 'image/Oddyssée.png'),
      (7, 'Probabilités Statistiques', 1, 'image/Probabilités-Statistiques.jpg'),
      (8, 'Transformations Intégrales', 1, 'image/Transformations-intégrales.png'),
      (9, 'Analyse des signaux', 2, 'image/Analyse-des-signaux.jpg'),
      (10, 'Automatique', 2, 'image/Automatique.jpg'),
      (11, 'Bases de données', 2, 'image/Base-de-données.jpg'),
      (12, 'Comptabilité', 2, 'image/Comptabilité.jpg'),
      (13, 'Economie', 2, 'image/Economie.png'),
      (14, 'Electronique Analogique', 2, 'image/Electronique-analogique.jpg'),
      (15, 'Marketing', 2, 'image/Marketing.png'),
      (16, 'Physique du Solide', 2, 'image/Physique-du-solide.png'),
      (17, 'Programmation Orientée Objet', 2, 'image/Programation-orienté-objet.jpg'),
      (18, 'Réseaux', 2, 'image/Réseau.jpg')
    ON CONFLICT (IDSubject) DO NOTHING;
    `);



    

    await client.query(`CREATE TABLE IF NOT EXISTS Utilisateurs (
      IDUser SERIAL PRIMARY KEY,
      motdepasse TEXT,
      nom TEXT,
      prenom TEXT,
      username TEXT,
      email TEXT,
      professeur BOOLEAN,
      admin BOOLEAN DEFAULT false
      
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS chat (
      IDChat SERIAL PRIMARY KEY,
      corps TEXT,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      username TEXT,
      IDSubject INT,
      IDuser INT,
      FOREIGN KEY(IDSubject) REFERENCES Subject(IDSubject),
      FOREIGN KEY(IDuser) REFERENCES Utilisateurs(IDUser)
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS questions (
      IDQuestion SERIAL PRIMARY KEY,
      titre TEXT,
      corps TEXT,
      votes INT ,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      IDUser INT,
      IDSubject INT,
      FOREIGN KEY(IDSubject) REFERENCES Subject(IDSubject),
      FOREIGN KEY(IDUser) REFERENCES Utilisateurs(IDUser)
      
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS reponses (
      IDReponse SERIAL PRIMARY KEY,
      IDQuestion INT,
      
      corps TEXT,
      votes INT,
      IDUSER INT,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY(IDQuestion) REFERENCES questions(IDQuestion),
      FOREIGN KEY(IDUser) REFERENCES Utilisateurs(IDUser)
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS Images (
      IDImages SERIAL PRIMARY KEY,
      IDQuestion INT,
      url TEXT,
      FOREIGN KEY(IDQuestion) REFERENCES questions(IDQuestion)
    )`);

    console.log('✅ Tables et contraintes créées ou vérifiées avec succès');
  } catch (err) {
    console.error('Erreur création des tables :', err);
  } finally {
    client.release();
  }
}

// Démarrage du serveur
async function startServer() {
  await testConnection();
  await taskCreateTables();

  // Routes API
  app.post('/api/question/:IDSubject', async (req, res) => {
    let { titre, corps, IDUser, votes } = req.body;
    const IDSubject = req.params.IDSubject;

    if (!titre) return res.status(400).json({ error: "Le titre est obligatoire" });
    if (!votes) votes = 0;

    try {
      const result = await pool.query(
      `INSERT INTO questions (titre, corps, IDUser, votes, IDSubject)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING IDQuestion, date`,
      [titre, corps, IDUser, votes, IDSubject]
    );

      const { idquestion, date } = result.rows[0];

      res.json({
        IDQuestion: idquestion,
        titre,
        corps,
        IDUser,
        votes,
        date,
        IDSubject
      });

    } catch (err) {
      console.error("Erreur PostgreSQL lors de l'insertion :", err);
      res.status(500).json({ error: "Erreur lors de l'insertion" });
    }
  });


  app.post('/api/reponse', async (req, res) => {
    const { IDQuestion, corps, IDUser, votes } = req.body;

    if (!IDQuestion || !corps) {
      return res.status(400).json({ error: "IDQuestion et corps sont obligatoires" });
    }

    const votesValue = votes || 0;

    try {
      const result = await pool.query(
        `INSERT INTO reponses (IDQuestion, IDUser, corps, votes)
        VALUES ($1, $2, $3, $4)
        RETURNING IDReponse, date`,
        [IDQuestion, IDUser, corps, votesValue]
      );

      const { idreponse, date } = result.rows[0];

      res.json({
        IDReponse: idreponse,
        IDQuestion,
        corps,
        IDUser,
        votes: votesValue,
        date
      });

    } catch (err) {
      console.error("Erreur PostgreSQL lors de l'insertion de la réponse :", err);
      res.status(500).json({ error: "Erreur lors de l'insertion de la réponse" });
   }
  });
  app.get('/get-subjects', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM Subject');
      res.json(result.rows);
    } catch (err) {
      console.error("Erreur PostgreSQL lors de la lecture des matières :", err);
      res.status(500).json({ error: "Erreur lors de la lecture des matières" });
    }
  });

  app.get(`/get-question/:IDSubject`, async (req, res) => {
    const IDSubject = parseInt(req.params.IDSubject, 10);

    try {
      const result = await pool.query(`
        SELECT questions.*, Utilisateurs.username
        FROM questions
        LEFT JOIN Utilisateurs ON questions.IDUser = Utilisateurs.IDUser
        WHERE questions.IDSubject = $1
      `, [IDSubject]);

    res.json(result.rows);
    } catch (err) {
      console.error("Erreur PostgreSQL lors de la lecture des questions :", err);
      res.status(500).json({ error: "Erreur lors de la lecture des questions" });
   }
  });

  

  app.get('/get-chat/:IDSubject', async (req, res) => {
    const IDSubject = req.params.IDSubject;

    try {
      const result = await pool.query(`
        SELECT chat.*, Utilisateurs.username
        FROM chat
        LEFT JOIN Utilisateurs ON chat.IDUser = Utilisateurs.IDUser
        WHERE chat.IDSubject = $1
        ORDER BY chat.date ASC
      `, [IDSubject]);

      res.json(result.rows);
    } catch (err) {
      console.error("Erreur PostgreSQL lors de la lecture du chat :", err);
      res.status(500).json({ error: "Erreur lors de la lecture du chat" });
    }
  });

  app.get('/get-reponses/:id', async (req, res) => {
    const id = req.params.id;

    try {
      const result = await pool.query(`
        SELECT reponses.*, Utilisateurs.username
        FROM reponses
        LEFT JOIN Utilisateurs ON reponses.IDUser = Utilisateurs.IDUser
        WHERE reponses.IDQuestion = $1
      `, [id]);

      res.json(result.rows);
    } catch (err) {
      console.error("Erreur PostgreSQL lors de la lecture des réponses :", err);
      res.status(500).json({ error: "Erreur lors de la lecture des réponses" });
    }
  });

  app.get('/get-nb-reponses/:id', async (req, res) => {
    const id = req.params.id;

    try {
      const result = await pool.query(
        'SELECT COUNT(*) AS "nbReponses" FROM reponses WHERE IDQuestion = $1',
       [id]
      );

    // Le résultat de COUNT(*) est retourné comme une chaîne, on peut le convertir en nombre si besoin
      const nbReponses = parseInt(result.rows[0].nbReponses, 10);

      res.json({ nbReponses });
    } catch (err) {
      console.error("Erreur PostgreSQL lors de la lecture du nombre de réponses :", err);
      res.status(500).json({ error: "Erreur lors de la lecture du nombre de réponses" });
    }
  });

  app.get('/get-votes-reponse/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);

    try {
      const result = await pool.query(
        'SELECT votes FROM reponses WHERE IDReponse = $1',
        [id]
      );
      const row = result.rows[0];
      if (!row) return res.status(404).json({ error: "Réponse non trouvée" });
      res.json({ votes: row.votes });
    } catch (err) {
      console.error("❌ Erreur PostgreSQL lors de la lecture des votes :", err);
     res.status(500).json({ error: "Erreur lors de la lecture des votes" });
    }
  });
  app.get('/get-votes-question/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);

    try {
      const result = await pool.query(
        'SELECT votes FROM questions WHERE IDQuestion = $1',
       [id]
      );
      const row = result.rows[0];
      if (!row) return res.status(404).json({ error: "Question non trouvée" });
      res.json({ votes: row.votes });
    } catch (err) {
      console.error("❌ Erreur PostgreSQL lors de la lecture des votes :", err);
      res.status(500).json({ error: "Erreur lors de la lecture des votes" });
    }
  });
  app.get('/get-nb-chats/:IDSubject', async (req, res) => {
    const IDSubject = req.params.IDSubject;

    try {
      const result = await pool.query(
        'SELECT COUNT(*) AS nbchats FROM chat WHERE IDSubject = $1',
       [IDSubject]
      );

      const nbchats = parseInt(result.rows[0].nbchats, 10);

      res.json({ nbchats });
    } catch (err) {
      console.error("Erreur PostgreSQL lors de la lecture du nombre de chats :", err);
      res.status(500).json({ error: "Erreur lors de la lecture du nombre de chats" });
    }
  });
  app.post('/api/new-chat', async (req, res) => {
    const { corps, IDUser, IDSubject } = req.body;

    try {
      const result = await pool.query(
        'INSERT INTO chat (corps, IDUser, IDSubject) VALUES ($1, $2, $3) RETURNING IDChat, date',
        [corps, IDUser, IDSubject]
      );

      const newChat = result.rows[0];
     res.json({ IDChat: newChat.IDChat, corps, IDUser, date: newChat.date, IDSubject });
    } catch (err) {
      console.error("Erreur PostgreSQL lors de l'insertion du chat :", err);
      res.status(500).json({ error: "Erreur lors de l'insertion du chat" });
    }
  });







  app.post('/api/inscription', async (req, res) => {
    const { email, motdepasse, prenom, nom, professeur } = req.body;
    const username = prenom + " " + nom;

    if (!email) return res.status(400).json({ error: "Le mail est obligatoire" });
    if (!motdepasse) return res.status(400).json({ error: "Le mot de passe est obligatoire" });

    try {
      const result = await pool.query(
        `INSERT INTO Utilisateurs (email, motdepasse, prenom, nom, professeur, username)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [email, motdepasse, prenom, nom, professeur, username]
      );

      const user = result.rows[0];
      res.status(201).json(user);

    } catch (err) {
      console.error("Erreur PostgreSQL lors de l'insertion :", err);
      res.status(500).json({ error: "Erreur lors de l'insertion" });
    }
  });


  app.post('/api/connexion', async (req, res) => {
    const { email, motdepasse } = req.body;

    if (!email || !motdepasse) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    try {
      const result = await pool.query(
        'SELECT * FROM Utilisateurs WHERE email = $1 AND motdepasse = $2',
        [email, motdepasse]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const user = result.rows[0];
    console.log("ROW UTILISATEUR :", user);

    res.json({
      message: "Connexion réussie",
      prenom: user.prenom,
        nom: user.nom,
        username: user.username,
        IDUser: user.iduser
    });

    } catch (err) {
        console.error("Erreur PostgreSQL lors de la vérification :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.post('/api/vote', async (req, res) => {
    const { IDQuestion } = req.body;
    if (!IDQuestion) return res.status(400).json({ error: "ID Manquante" });

    try {
      await pool.query('UPDATE questions SET votes = votes + 1 WHERE IDQuestion = $1', [IDQuestion]);
      res.json({ success: true });
    } catch (err) {
      console.error("Erreur PostgreSQL lors du vote :", err);
      res.status(500).json({ error: "Erreur lors du vote" });
    }
  });


  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur https://projetinfo.onrender.com/`);
  });
}

startServer();
