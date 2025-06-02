const mysql = require('mysql2');

const conexao = mysql.createConnection({
  host: 'localhost',
  user: 'root',               // ou outro usuário
  password: '',
  database: 'sistema_agendamentos'
});

conexao.connect((erro) => {
  if (erro) throw erro;
  console.log('Conectado ao MySQL!');
});

module.exports = conexao;