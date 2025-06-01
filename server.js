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
  res.sendFile(path.join(__dirname, 'public', 'accueil', 'index.html'));
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

    await client.query(`CREATE TABLE IF NOT EXISTS chat (
      IDChat SERIAL PRIMARY KEY,
      corps TEXT,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      username TEXT,
      subject TEXT
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
      FOREIGN KEY(IDDocument) REFERENCES document(IDDocument),
      FOREIGN KEY(IDChat) REFERENCES chat(IDChat)
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
      subject TEXT,
      FOREIGN KEY(IDUser) REFERENCES Utilisateurs(IDUser)
    )`);

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

    await client.query(`CREATE TABLE IF NOT EXISTS Images (
      IDImages SERIAL PRIMARY KEY,
      IDQuestion INT,
      FOREIGN KEY(IDQuestion) REFERENCES questions(IDQuestion)
    )`);

    // 2. Ajout colonnes FK circulaires si elles n'existent pas
    await client.query(`ALTER TABLE Utilisateurs ADD COLUMN IF NOT EXISTS IDReponse INT`);
    await client.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS IDReponse INT`);

    // 3. Ajout contraintes FK circulaires si inexistantes
    if (!(await constraintExists(client, 'Utilisateurs', 'fk_utilisateurs_idreponse'))) {
      await client.query(`ALTER TABLE Utilisateurs ADD CONSTRAINT fk_utilisateurs_idreponse FOREIGN KEY (IDReponse) REFERENCES reponses(IDReponse)`);
    }
    if (!(await constraintExists(client, 'questions', 'fk_questions_idreponse'))) {
      await client.query(`ALTER TABLE questions ADD CONSTRAINT fk_questions_idreponse FOREIGN KEY (IDReponse) REFERENCES reponses(IDReponse)`);
    }

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

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });
}

startServer();
