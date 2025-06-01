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

// Initialisation des tables si elles n'existent pas
taskCreateTables();

async function taskCreateTables() {
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS reponses (
      IDReponse SERIAL PRIMARY KEY,
      IDQuestion INT,
      username TEXT,
      corps TEXT,
      votes INT,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      url TEXT,
      FOREIGN KEY(IDQuestion) REFERENCES questions(IDQuestion)
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS chat (
      IDChat SERIAL PRIMARY KEY,
      corps TEXT,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      username TEXT,
      subject TEXT
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS document (
      IDDocument SERIAL PRIMARY KEY,
      url TEXT,
      DateHeure TIMESTAMP,
      subject TEXT,
      type TEXT
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS Utilisateurs (
      IDUser SERIAL PRIMARY KEY,
      motdepasse TEXT,
      nom TEXT,
      prenom TEXT,
      username TEXT,
      email TEXT,
      professeur BOOLEAN,
      admin BOOLEAN DEFAULT false,
      IDDocument INT,
      IDChat INT,
      IDReponse INT,
      FOREIGN KEY(IDDocument) REFERENCES document(IDDocument),
      FOREIGN KEY(IDChat) REFERENCES chat(IDChat),
      FOREIGN KEY(IDReponse) REFERENCES reponses(IDReponse)
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS questions (
      IDQuestion SERIAL PRIMARY KEY,
      titre TEXT,
      corps TEXT,
      votes INT,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      username TEXT,
      url TEXT,
      IDUser INT,
      IDReponse INT,
      subject TEXT,
      FOREIGN KEY(IDUser) REFERENCES Utilisateurs(IDUser),
      FOREIGN KEY(IDReponse) REFERENCES reponses(IDReponse)
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS Images (
      IDImages SERIAL PRIMARY KEY,
      IDQuestion INT,
      FOREIGN KEY(IDQuestion) REFERENCES questions(IDQuestion)
    )`);
  } catch (err) {
    console.error('Erreur création des tables :', err);
  } finally {
    client.release();
  }
}

// Routes POST et GET
app.post('/api/question', async (req, res) => {
  const { titre, corps, username = 'Utilisateur Anonyme', votes = 0 } = req.body;
  if (!titre) return res.status(400).json({ error: "Le titre est obligatoire" });

  try {
    const result = await pool.query(
      'INSERT INTO questions (titre, corps, username, votes) VALUES ($1, $2, $3, $4) RETURNING *',
      [titre, corps, username, votes]
    );
    res.json({ ...result.rows[0] });
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

// ... Tu peux continuer avec les autres routes exactement de la même manière en convertissant `db.run` et `db.get` en `await pool.query(...)`

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

app.listen(3000, () => {
  console.log('Serveur démarré sur http://localhost:3000');
});
