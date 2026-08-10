/**
 * admin.js - Gerenciador do Painel da DICOM / IF Baiano
 * Permite cadastrar, editar, desativar, ordenar e PUBLICAR a playlist no GitHub.
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

  const inputGithubRepo = document.getElementById('github-repo');
  const inputGithubToken = document.getElementById('github-token');
  const btnSalvarGithubConfig = document.getElementById('btn-salvar-github-config');

  let playlistLocal = [];

  // 1. Carregar Configurações Salvas do GitHub
  if (inputGithubRepo) {
    inputGithubRepo.value = localStorage.getItem('mural_github_repo') || 'yuriluna85/mural-digital-ifbaiano';
  }
  if (inputGithubToken) {
    inputGithubToken.value = localStorage.getItem('mural_github_token') || '';
  }

  if (btnSalvarGithubConfig) {
    btnSalvarGithubConfig.addEventListener('click', () => {
      localStorage.setItem('mural_github_repo', inputGithubRepo.value.trim());
      localStorage.setItem('mural_github_token', inputGithubToken.value.trim());
      alert('Configurações e Token do GitHub salvos com sucesso!');
    });
  }

  // 2. Checagem de Autenticação
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

  // 3. Carregar Playlist (Prioriza a playlist customizada salva no navegador)
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

  // 4. Renderizar Lista de Itens no Painel
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

  // 5. Cadastrar Novo Item
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

  // 6. Função de Publicação Remota no GitHub (Commit via REST API)
  async function publicarNoGitHub(playlistObj) {
    const repo = localStorage.getItem('mural_github_repo') || 'yuriluna85/mural-digital-ifbaiano';
    const token = localStorage.getItem('mural_github_token');

    if (!token) {
      alert('Para publicar as alterações para TODAS as TVs do IF Baiano via nuvem, insira o seu GitHub Token no painel superior.');
      return false;
    }

    try {
      const urlApi = `https://api.github.com/repos/${repo}/contents/data/playlist.json`;

      // 1. Obter o SHA do arquivo atual
      const resGet = await fetch(urlApi, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      let sha = '';
      if (resGet.ok) {
        const dataGet = await resGet.json();
        sha = dataGet.sha;
      }

      // 2. Converter o JSON para Base64 com suporte a UTF-8
      const jsonString = JSON.stringify(playlistObj, null, 2);
      const contentBase64 = btoa(unescape(encodeURIComponent(jsonString)));

      // 3. Fazer o Commit PUT na API do GitHub
      const resPut = await fetch(urlApi, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: 'Atualização de Playlist via Painel Admin DICOM (Mural Digital)',
          content: contentBase64,
          sha: sha || undefined
        })
      });

      if (resPut.ok) {
        alert('✨ SUCESSO! A nova programação foi gravada diretamente no GitHub e será distribuída para TODAS as TVs do IF Baiano em até 60 segundos.');
        return true;
      } else {
        const errData = await resPut.json();
        alert(`Falha ao gravar no GitHub: ${errData.message || 'Verifique o Token e o Repositório.'}`);
        return false;
      }
    } catch (e) {
      console.error('[GITHUB COMMIT ERRO]', e);
      alert(`Erro de conexão com a API do GitHub: ${e.message}`);
      return false;
    }
  }

  // 7. Salvar Playlist e Publicar no GitHub
  if (btnSalvarTudo) {
    btnSalvarTudo.addEventListener('click', async () => {
      localStorage.setItem('mural_playlist_custom', JSON.stringify(playlistLocal));

      const playlistObj = {
        versao: '1.0.1',
        atualizado_em: new Date().toISOString(),
        tempo_padrao_slide: 10,
        itens: playlistLocal
      };

      const token = localStorage.getItem('mural_github_token');
      if (token) {
        await publicarNoGitHub(playlistObj);
      } else {
        alert('Programação salva localmente nesta TV! Para sincronizar com TODAS as TVs do IF Baiano, insira o seu GitHub Token no painel superior.');
      }
    });
  }

  // 8. Restaurar Padrão Inicial
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

  // 9. Baixar Arquivo JSON da Playlist
  const btnBaixarJson = document.getElementById('btn-baixar-json');
  if (btnBaixarJson) {
    btnBaixarJson.addEventListener('click', () => {
      const conteudoJson = JSON.stringify({
        versao: '1.0.1',
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
