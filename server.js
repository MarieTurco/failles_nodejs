const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Base de données en mémoire pour l'exo
const db = new sqlite3.Database(':memory:');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER, username TEXT, password TEXT, role TEXT)");
  db.run("INSERT INTO users VALUES (1, 'admin', 'password123', 'admin')");
  db.run("INSERT INTO users VALUES (2, 'user1', 'azerty', 'user')");
});

app.get('/api/user', (req, res) => {
  const username = req.query.username;
  const query = "SELECT id, username, role FROM users WHERE username = ?";
  db.get(query, [username], (err, row) => {
    if (err) res.status(500).send(err.message);
    else res.json(row);
  });
});

app.post('/api/delete-user', (req, res) => {
  const token = req.headers['authorization'];
  if (token === ADMIN_TOKEN) {
    // Vérification du rôle admin
    db.get("SELECT role FROM users WHERE username = 'admin'", (err, row) => {
      if (err) return res.status(500).send("Erreur serveur");
      if (row && row.role === 'admin') {
        const id = req.body.id;
        db.run("DELETE FROM users WHERE id = ?", [id], (err) => {
          if (err) return res.status(500).send("Erreur suppression");
          res.send("Utilisateur supprimé");
        });
      } else {
        res.status(403).send("Accès refusé : rôle insuffisant");
      }
    });
  } else {
    res.status(403).send("Accès refusé : token invalide");
  }
});

app.get('/api/welcome', (req, res) => {
  const name = req.query.name || "Visiteur";
  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  res.send(`<h1>Bienvenue sur l'API, ${escapeHtml(name)} !</h1>`);
});

app.get('/api/debug', (req, res) => {
    res.status(500).send("Erreur interne du serveur. Veuillez contacter l'administrateur.");
});


app.listen(3000, () => console.log('🚀 API vulnérable lancée sur http://localhost:3000'));