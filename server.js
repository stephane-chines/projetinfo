require('dotenv').config(); // Charge les variables d'environnement

const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  user: 'bddinfo_user',
  host: 'dpg-d0u8fpc9c44c73ago1og-a',
  database: 'bddinfo',
  password: 'USRjowqt1ZFDT9LRTP0erD0w6zVfAGyA',
  port: 5432,
});

// Création des tables
const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reponses (
        IDReponse SERIAL PRIMARY KEY,
        IDQuestion INT,
        username TEXT,
        corps TEXT,
        votes INT DEFAULT 0,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        url TEXT,
        FOREIGN KEY(IDQuestion) REFERENCES questions(IDQuestion)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat (
        IDChat SERIAL PRIMARY KEY,
        corps TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        username TEXT,
        subject TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS document (
        IDDocument SERIAL PRIMARY KEY,
        url TEXT,
        DateHeure TIMESTAMP,
        subject TEXT,
        type TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS Utilisateurs (
        IDUser SERIAL PRIMARY KEY,
        motdepasse TEXT,
        nom TEXT,
        prenom TEXT,
        username TEXT,
        email TEXT UNIQUE,
        professeur INTEGER,
        admin INTEGER DEFAULT 0,
        IDDocument INT,
        IDChat INT,
        IDReponse INT,
        FOREIGN KEY(IDDocument) REFERENCES document(IDDocument),
        FOREIGN KEY(IDChat) REFERENCES chat(IDChat),
        FOREIGN KEY(IDReponse) REFERENCES reponses(IDReponse)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        IDQuestion SERIAL PRIMARY KEY,
        titre TEXT,
        corps TEXT,
        votes INT DEFAULT 0,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        username TEXT,
        url TEXT,
        IDUser INT,
        IDReponse INT,
        subject TEXT,
        FOREIGN KEY(IDUser) REFERENCES Utilisateurs(IDUser),
        FOREIGN KEY(IDReponse) REFERENCES reponses(IDReponse)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS Images (
        IDImages SERIAL PRIMARY KEY,
        IDQuestion INT,
        FOREIGN KEY(IDQuestion) REFERENCES questions(IDQuestion)
      );
    `);

    console.log("Tables créées");
  } catch (err) {
    console.error("Erreur lors de la création des tables :", err);
  }
};

createTables();

// Routes identiques, sauf pour les requêtes SQL (avec $1, $2...)
app.post('/api/question', async (req, res) => {
  let { titre, corps, username, votes } = req.body;
  if (!titre) return res.status(400).json({ error: "Le titre est obligatoire" });
  if (!username) username = 'Utilisateur Anonyme';
  if (!votes) votes = 0;

  try {
    const result = await pool.query(
      'INSERT INTO questions (titre, corps, username, votes) VALUES ($1, $2, $3, $4) RETURNING IDQuestion',
      [titre, corps, username, votes]
    );
    res.json({ IDQuestion: result.rows[0].idquestion, titre, corps, username, votes, date: new Date().toISOString() });
  } catch (err) {
    console.error("Erreur PostgreSQL :", err);
    res.status(500).json({ error: "Erreur lors de l'insertion" });
  }
});

app.post('/api/reponse', async (req, res) => {
  let { IDQuestion, corps, username, votes } = req.body;
  if (!IDQuestion || !corps) return res.status(400).json({ error: "IDQuestion et corps sont obligatoires" });
  if (!username) username = 'Utilisateur Anonyme';
  if (!votes) votes = 0;

  try {
    const result = await pool.query(
      'INSERT INTO reponses (IDQuestion, corps, username, votes) VALUES ($1, $2, $3, $4) RETURNING IDReponse',
      [IDQuestion, corps, username, votes]
    );
    res.json({ IDReponse: result.rows[0].idreponse, IDQuestion, corps, username, votes, date: new Date().toISOString() });
  } catch (err) {
    console.error("Erreur PostgreSQL :", err);
    res.status(500).json({ error: "Erreur lors de l'insertion de la réponse" });
  }
});

// Tu continues avec le même principe pour les autres routes
// Exemple GET :
app.get('/get-question', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM questions');
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur PostgreSQL lors de la lecture :", err);
    res.status(500).json({ error: "Erreur lors de la lecture" });
  }
});

// Exemple POST connexion :
app.post('/api/connexion', async (req, res) => {
  const { email, motdepasse } = req.body;
  if (!email || !motdepasse) return res.status(400).json({ error: "Email et mot de passe requis" });

  try {
    const result = await pool.query(
      'SELECT * FROM Utilisateurs WHERE email = $1 AND motdepasse = $2',
      [email, motdepasse]
    );

    if (result.rowCount === 0) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

    const user = result.rows[0];
    res.json({ message: "Connexion réussie", prenom: user.prenom, nom: user.nom, username: user.username });
  } catch (err) {
    console.error("Erreur PostgreSQL lors de la vérification :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.listen(3000, () => {
  console.log('Serveur PostgreSQL démarré sur http://localhost:3000');
});
