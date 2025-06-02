const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'segredo123', 
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 600000 } // 10 minutos
}));

// Conexão MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sistema_agendamentos'
});

db.connect(err => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err);
    process.exit(1);
  }
  console.log('Conectado ao banco MySQL!');
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para checar autenticação
function checkAuth(req, res, next) {
  if (req.session.userId) return next();

  const aceitaJson = req.headers.accept?.includes('application/json');
  if (aceitaJson || req.originalUrl.startsWith('/agendamentos')) {
    return res.status(401).json({ erro: 'Não autorizado' });
  } else {
    return res.redirect('/login.html');
  }
}

// Login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).send('Email e senha são obrigatórios!');

  const query = 'SELECT * FROM usuarios WHERE email = ? AND senha = ?';
  db.query(query, [email, senha], (err, results) => {
    if (err) {
      console.error('Erro na consulta:', err);
      return res.status(500).send('Erro no servidor');
    }

    if (results.length > 0) {
      req.session.userId = results[0].id;
      req.session.userName = results[0].nome;
      res.redirect('/index.html');
    } else {
      res.status(401).send('Email ou senha incorretos!');
    }
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

// Páginas protegidas
app.get('/index.html', checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/agendamento.html', checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'agendamento.html'));
});

app.get('/controle-agendamentos.html', checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'controle-agendamentos.html'));
});

// Rota para obter usuários
app.get('/usuarios', checkAuth, (req, res) => {
  const sql = 'SELECT id, nome, email, senha FROM usuarios ORDER BY id';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erro ao buscar usuários:', err);
      return res.status(500).json({ erro: 'Erro ao buscar usuários' });
    }
    res.json(results);
  });
});

// Rota para atualizar usuário
app.put('/usuarios/:id', checkAuth, (req, res) => {
  const { id } = req.params;
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
  }

  const sql = 'UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?';
  db.query(sql, [nome, email, senha, id], (err) => {
    if (err) {
      console.error('Erro ao atualizar usuário:', err);
      return res.status(500).json({ erro: 'Erro ao atualizar usuário' });
    }
    res.sendStatus(200);
  });
});

// API para agendamentos
app.get('/agendamentos', checkAuth, (req, res) => {
  const sql = `
    SELECT a.id, a.data_hora, a.descricao, a.status, u.nome as usuario 
    FROM agendamentos a
    JOIN usuarios u ON a.usuario_id = u.id
    WHERE a.usuario_id = ? 
    ORDER BY a.data_hora`;
  db.query(sql, [req.session.userId], (err, results) => {
    if (err) return res.status(500).send('Erro no servidor');
    res.json(results);
  });
});

app.post('/agendamentos', checkAuth, (req, res) => {
  const { data_hora, descricao } = req.body;
  if (!data_hora || !descricao) return res.status(400).send('Campos obrigatórios');

  const sql = 'INSERT INTO agendamentos (usuario_id, data_hora, descricao) VALUES (?, ?, ?)';
  db.query(sql, [req.session.userId, data_hora, descricao], (err, result) => {
    if (err) return res.status(500).send('Erro ao salvar agendamento');
    res.status(201).send('Agendamento criado');
  });
});


// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
