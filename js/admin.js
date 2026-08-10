/**
 * admin.js - Gerenciador do Painel da DICOM / IF Baiano
 * Permite cadastrar, editar, desativar e ordenar mídias da playlist.
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginOverlay = document.getElementById('login-overlay');
  const loginForm = document.getElementById('login-form');
  const loginInput = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const btnLogout = document.getElementById('btn-logout');

  const formNovoItem = document.getElementById('form-novo-item');
  const playlistContainer = document.getElementById('playlist-items-container');
  const btnSalvarTudo = document.getElementById('btn-salvar-tudo');

  let playlistLocal = [];

  // 1. Checagem de Autenticação
  if (usuarioEstaAutenticado()) {
    loginOverlay.style.display = 'none';
    carregarDadosAdmin();
  } else {
    loginOverlay.style.display = 'flex';
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const senha = loginInput.value;
    const valida = await validarSenhaAdmin(senha);
    if (valida) {
      registrarSessaoAutenticada();
      loginOverlay.style.display = 'none';
      loginError.style.display = 'none';
      carregarDadosAdmin();
    } else {
      loginError.style.display = 'block';
    }
  });

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      encerrarSessao();
    });
  }

  // 2. Carregar Playlist (Prioriza a playlist customizada salva pelo usuário)
  async function carregarDadosAdmin() {
    const custom = localStorage.getItem('mural_playlist_custom');
    if (custom) {
      try {
        playlistLocal = JSON.parse(custom);
        renderizarListaAdmin();
        return;
      } catch (e) {
        console.warn('[ADMIN] Erro no JSON customizado:', e);
      }
    }

    try {
      const res = await fetch(`data/playlist.json?t=${Date.now()}`);
      if (res.ok) {
        const dados = await res.json();
        playlistLocal = dados.itens || [];
      }
    } catch (e) {
      console.warn('[ADMIN] Falha ao carregar playlist estática inicial');
    }
    renderizarListaAdmin();
  }

  // 3. Renderizar Lista de Itens no Painel
  function renderizarListaAdmin() {
    if (!playlistContainer) return;
    playlistContainer.innerHTML = '';

    if (playlistLocal.length === 0) {
      playlistContainer.innerHTML = '<p style="color:#64748b; font-size:0.95rem;">Nenhum item cadastrado na playlist.</p>';
      return;
    }

    playlistLocal.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'playlist-card-item';
      card.innerHTML = `
        <div>
          <div>
            <span class="item-badge">${item.tipo || 'aviso'}</span>
            <span class="item-badge" style="background:#e0f2fe; color:#0369a1;">${item.categoria || 'Geral'}</span>
            <span class="item-badge" style="background:#fef3c7; color:#92400e;">⏱️ ${item.duracao_segundos || 10}s</span>
          </div>
          <div class="item-info-title" style="margin-top:6px;">${item.titulo || 'Sem Título'}</div>
          <div class="item-info-sub">${item.conteudo ? item.conteudo.substring(0, 80) + '...' : item.url || ''}</div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn-danger" onclick="removerItemPlaylist(${index})">Excluir</button>
        </div>
      `;
      playlistContainer.appendChild(card);
    });
  }

  window.removerItemPlaylist = function(index) {
    if (confirm('Deseja realmente remover este aviso da programação?')) {
      playlistLocal.splice(index, 1);
      renderizarListaAdmin();
    }
  };

  // 4. Cadastrar Novo Item
  if (formNovoItem) {
    formNovoItem.addEventListener('submit', (e) => {
      e.preventDefault();
      const tipo = document.getElementById('item-tipo').value;
      const titulo = document.getElementById('item-titulo').value;
      const categoria = document.getElementById('item-categoria').value;
      const duracao = parseInt(document.getElementById('item-duracao').value) || 10;
      const conteudo = document.getElementById('item-conteudo').value;
      const url = document.getElementById('item-url').value;

      const novoItem = {
        id: 'item-' + Date.now(),
        tipo,
        titulo,
        categoria,
        duracao_segundos: duracao,
        conteudo: tipo === 'aviso_texto' ? conteudo : '',
        url: tipo !== 'aviso_texto' ? url : '',
        ativo: true
      };

      playlistLocal.push(novoItem);
      formNovoItem.reset();
      renderizarListaAdmin();
      alert('Item adicionado à fila da programação!');
    });
  }

  // 5. Salvar Playlist e Notificar Player em Tempo Real
  if (btnSalvarTudo) {
    btnSalvarTudo.addEventListener('click', () => {
      localStorage.setItem('mural_playlist_custom', JSON.stringify(playlistLocal));
      alert('Programação salva e transmitida com sucesso para o Player da TV!');
    });
  }

  // 6. Restaurar Padrão Inicial
  const btnRestaurarPadrao = document.getElementById('btn-restaurar-padrao');
  if (btnRestaurarPadrao) {
    btnRestaurarPadrao.addEventListener('click', () => {
      if (confirm('Deseja restaurar a programação padrão original?')) {
        localStorage.removeItem('mural_playlist_custom');
        carregarDadosAdmin();
        alert('Programação padrão restaurada.');
      }
    });
  }

  // 7. Baixar Arquivo JSON da Playlist
  const btnBaixarJson = document.getElementById('btn-baixar-json');
  if (btnBaixarJson) {
    btnBaixarJson.addEventListener('click', () => {
      const conteudoJson = JSON.stringify({
        versao: '1.0.0',
        atualizado_em: new Date().toISOString(),
        tempo_padrao_slide: 10,
        itens: playlistLocal
      }, null, 2);

      const blob = new Blob([conteudoJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'playlist.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
});

