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
      admin BOOLEAN DEFAULT false,
      
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS chat (
      IDChat SERIAL PRIMARY KEY,
      corps TEXT,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      username TEXT,
      IDSubject INT,
      FOREIGN KEY(IDSubject) REFERENCES Subject(IDSubject)
      FOREIGN KEY(IDuser) REFERENCES Utilisateurs(IDUser)
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS questions (
      IDQuestion SERIAL PRIMARY KEY,
      titre TEXT,
      corps TEXT,
      votes INT ,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      IDUser INT,
      IDSubject TEXT,
      FOREIGN KEY(IDSubject) REFERENCES Subject(IDSubject),
      FOREIGN KEY(IDUser) REFERENCES Utilisateurs(IDUser),
      
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS reponses (
      IDReponse SERIAL PRIMARY KEY,
      IDQuestion INT,
      
      corps TEXT,
      votes INT,
      IDUSER INT,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY(IDQuestion) REFERENCES questions(IDQuestion)
      FOREIGN KEY(IDUser) REFERENCES Utilisateurs(IDUser),
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS Images (
      IDImages SERIAL PRIMARY KEY,
      IDQuestion INT,
      url TEXT,
      FOREIGN KEY(IDQuestion) REFERENCES questions(IDQuestion)
    )`);

    // 2. Ajout colonnes FK circulaires si elles n'existent pas
    
    

    // 3. Ajout contraintes FK circulaires si inexistantes
    
   

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
  app.post('/api/question', async (req, res) => {
    const { titre, corps, username = 'Utilisateur Anonyme', votes = 0 } = req.body;
    if (!titre) return res.status(400).json({ error: "Le titre est obligatoire" });

    try {
      const result = await pool.query(
        'INSERT INTO questions (titre, corps, username, votes) VALUES ($1, $2, $3, $4) RETURNING *',
        [titre, corps, username, votes]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Erreur PostgreSQL lors de l'insertion :", err);
      res.status(500).json({ error: "Erreur lors de l'insertion" });
    }
  });

  app.post('/api/reponse', async (req, res) => {
    const { IDQuestion, corps, username = 'Utilisateur Anonyme', votes = 0 } = req.body;
    if (!IDQuestion || !corps) return res.status(400).json({ error: "IDQuestion et corps sont obligatoires" });

    try {
      const result = await pool.query(
        'INSERT INTO reponses (IDQuestion, corps, username, votes) VALUES ($1, $2, $3, $4) RETURNING *',
        [IDQuestion, corps, username, votes]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Erreur PostgreSQL lors de l'insertion de la réponse :", err);
      res.status(500).json({ error: "Erreur lors de l'insertion de la réponse" });
    }
  });

  app.get('/get-question', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM questions');
      res.json(result.rows);
    } catch (err) {
      console.error("Erreur PostgreSQL lors de la lecture :", err);
      res.status(500).json({ error: "Erreur lors de la lecture" });
    }
  });

  app.get('/get-chat/:subject', async (req, res) => {
    const subject = req.params.subject;
    try {
      const result = await pool.query('SELECT * FROM chat WHERE subject = $1', [subject]);
      res.json(result.rows);
    } catch (err) {
      console.error("Erreur PostgreSQL lors de la lecture du chat :", err);
      res.status(500).json({ error: "Erreur lors de la lecture du chat" });
    }
  });
  app.get('/get-reponses/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);


    try {
      const result = await pool.query(
        'SELECT * FROM reponses WHERE IDQuestion = $1 ORDER BY date ASC',
        [id]
    );
      res.json(result.rows);
    } catch (err) {
      console.error("❌ Erreur PostgreSQL lors de la lecture des réponses :", err);
      res.status(500).json({ error: "Erreur lors de la lecture des réponses" });
    }
  });
  app.get('/get-nb-reponses/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);

    try {
      const result = await pool.query(
       'SELECT COUNT(*) AS nbReponses FROM reponses WHERE IDQuestion = $1',
        [id]
    );
      res.json({ nbReponses: parseInt(result.rows[0].nbreponses, 10) });
    } catch (err) {
     console.error("❌ Erreur PostgreSQL lors de la lecture du nombre de réponses :", err);
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
  app.get('/get-nb-chats/:subject', async (req, res) => {
    const subject = req.params.subject;
    try {
      const result = await pool.query(
        'SELECT COUNT(*) AS nbChats FROM chat WHERE subject = $1',
        [subject]
      );
      res.json({ nbchats: parseInt(result.rows[0].nbchats, 10) });
    } catch (err) {
      console.error("❌ Erreur PostgreSQL lors de la lecture du nombre de chats :", err);
      res.status(500).json({ error: "Erreur lors de la lecture du nombre de chats" });
    }
  });






  app.post('/api/inscription', async (req, res) => {
    const { email, motdepasse, prenom, nom, professeur, username } = req.body;
    if (!email || !motdepasse) return res.status(400).json({ error: "Email et mot de passe requis" });

    try {
      await pool.query(
        'INSERT INTO Utilisateurs (email, motdepasse, prenom, nom, professeur, username) VALUES ($1, $2, $3, $4, $5, $6)',
        [email, motdepasse, prenom, nom, professeur, username]
      );
      res.json({ email, motdepasse, prenom, nom, professeur, username });
    } catch (err) {
      console.error("Erreur PostgreSQL lors de l'insertion :", err);
      res.status(500).json({ error: "Erreur lors de l'insertion" });
    }
  });

  app.post('/api/connexion', async (req, res) => {
    const { email, motdepasse } = req.body;
    if (!email || !motdepasse) return res.status(400).json({ error: "Email et mot de passe requis" });

    try { 
      const result = await pool.query(
        'SELECT * FROM Utilisateurs WHERE email = $1 AND motdepasse = $2',
        [email, motdepasse]
      );
      const user = result.rows[0];
      if (!user) return res.status(401).json({ error: "Email ou mot de passe incorrect" });
      res.json({ message: "Connexion réussie", prenom: user.prenom, nom: user.nom, username: user.username });
    } catch (err) {
      console.error("Erreur PostgreSQL lors de la connexion :", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
  app.post('/api/upvote', async (req, res) => {
    const { IDQuestion } = req.body;
    if (!IDQuestion) return res.status(400).json({ error: "IDQuestion requis" });

    try {
      const result = await pool.query(
        'UPDATE questions SET votes = votes + 1 WHERE IDQuestion = $1 RETURNING votes',
        [IDQuestion]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: "Question non trouvée" });
      res.json({ votes: result.rows[0].votes });
    } catch (err) {
      console.error("❌ Erreur upvote :", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur https://projetinfo.onrender.com/`);
  });
}

startServer();
