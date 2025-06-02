async function carregarAgendamentos() {
    try {
      const res = await fetch('/agendamentos', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
      });
  
      if (!res.ok) {
        if (res.status === 401) {
          alert('Sessão expirada. Faça login novamente.');
          window.location.href = '/login.html';
          return;
        }
        throw new Error('Erro ao buscar agendamentos');
      }
  
      const agendamentos = await res.json();
      const tbody = document.getElementById('lista-agendamentos');
      tbody.innerHTML = '';
  
      agendamentos.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${a.id}</td>
          <td>${a.usuario}</td>
          <td>${new Date(a.data_hora).toLocaleString('pt-BR')}</td>
          <td>${a.descricao}</td>
          <td>${a.status}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      alert(err.message);
    }
  }
  
  carregarAgendamentos();
  
  document.getElementById('form-agendamentos').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const data_hora = document.getElementById('data_hora').value;
    const descricao = document.getElementById('descricao').value;
  
    try {
      const res = await fetch('/agendamentos', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ data_hora, descricao })
      });
  
      if (!res.ok) {
        if (res.status === 401) {
          alert('Sessão expirada. Faça login novamente.');
          window.location.href = '/login.html';
          return;
        }
        let data = {};
        try {
          data = await res.json();
        } catch {
          // Ignora se não for JSON
        }
        throw new Error(data.erro || 'Erro ao criar agendamento');
      }
  
      alert('Agendamento criado com sucesso!');
      e.target.reset();
      carregarAgendamentos();
    } catch (err) {
      alert(err.message);
    }
  });
  