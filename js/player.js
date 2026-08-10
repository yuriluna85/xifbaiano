/**
 * player.js - Motor de Exibição do Mural Digital IF Baiano (TV Display Mode)
 * DICOM / YLuna85 LABs
 */

document.addEventListener('DOMContentLoaded', () => {
  const containerSlide = document.getElementById('slide-container');
  const clockElement = document.getElementById('clock-display');
  const dateElement = document.getElementById('date-display');
  const tickerMove = document.getElementById('ticker-move');

  let playlist = [];
  let indexAtual = 0;
  let timerSlide = null;

  // 1. Atualizador do Relógio e Data em Tempo Real
  function atualizarRelogio() {
    const agora = new Date();
    if (clockElement) {
      clockElement.textContent = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    if (dateElement) {
      dateElement.textContent = agora.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    }
  }
  setInterval(atualizarRelogio, 1000);
  atualizarRelogio();

  // 2. Carregar Playlist (Prioriza as alterações feitas no admin em localStorage)
  async function carregarPlaylist() {
    const custom = localStorage.getItem('mural_playlist_custom');
    if (custom) {
      try {
        const itensCustom = JSON.parse(custom);
        const ativos = (itensCustom || []).filter(item => item.ativo !== false);
        if (ativos.length > 0) {
          playlist = ativos;
          return;
        }
      } catch (e) {
        console.warn('[MURAL TV] Erro ao carregar playlist customizada:', e);
      }
    }

    try {
      const res = await fetch(`data/playlist.json?t=${Date.now()}`);
      if (res.ok) {
        const dados = await res.json();
        const itensAtivos = (dados.itens || []).filter(item => item.ativo !== false);
        if (itensAtivos.length > 0) {
          playlist = itensAtivos;
        }
      }
    } catch (e) {
      console.warn('[MURAL TV] Falha na rede ao carregar playlist estática...', e);
    }

    if (playlist.length === 0) {
      playlist = [{
        id: 'fallback-0',
        tipo: 'aviso_texto',
        titulo: 'Mural Digital IF Baiano',
        conteudo: 'Diretoria de Comunicação Social (DICOM) — Aguardando atualização de mídias.',
        categoria: 'Institucional',
        duracao_segundos: 10
      }];
    }
  }

  // Escutar sincronização ao vivo caso o admin seja alterado em outra aba
  window.addEventListener('storage', (e) => {
    if (e.key === 'mural_playlist_custom') {
      carregarPlaylist().then(() => {
        indexAtual = 0;
        if (timerSlide) clearTimeout(timerSlide);
        exibirSlide();
      });
    }
  });


  // 3. Renderizador de Slide por Tipo
  function exibirSlide() {
    if (playlist.length === 0) return;

    if (indexAtual >= playlist.length) {
      indexAtual = 0;
    }

    const item = playlist[indexAtual];
    const duracaoMs = (item.duracao_segundos || 10) * 1000;

    containerSlide.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-wrapper';

    const ehUrgente = item.categoria === 'Urgente' || item.urgente === true;

    if (item.tipo === 'aviso_texto') {
      wrapper.innerHTML = `
        <div class="card-notice ${ehUrgente ? 'category-urgente' : ''}">
          <span class="card-notice-badge">${item.categoria || 'Comunicado'}</span>
          <h2 class="card-notice-title">${item.titulo || ''}</h2>
          <p class="card-notice-body">${item.conteudo || ''}</p>
        </div>
      `;
    } else if (item.tipo === 'imagem') {
      wrapper.innerHTML = `
        <div class="slide-image-container">
          <img src="${item.url}" alt="${item.titulo || 'Mídia IF Baiano'}">
        </div>
      `;
    } else if (item.tipo === 'video') {
      wrapper.innerHTML = `
        <div class="slide-video-container">
          <video src="${item.url}" autoplay muted playsinline></video>
        </div>
      `;
    }

    containerSlide.appendChild(wrapper);

    // Efeito Fade In
    requestAnimationFrame(() => {
      wrapper.classList.add('active');
    });

    indexAtual++;
    timerSlide = setTimeout(exibirSlide, duracaoMs);
  }

  // 4. Carregar Feed de Notícias no Ticker
  async function carregarNoticiasTicker() {
    if (!tickerMove) return;
    try {
      const res = await fetch(`data/noticias_ifbaiano.json?t=${Date.now()}`);
      if (res.ok) {
        const noticias = await res.json();
        if (Array.isArray(noticias) && noticias.length > 0) {
          tickerMove.innerHTML = noticias.map(n => `
            <div class="ticker-item">
              <span class="ticker-date">[${n.data || 'Notícia'}]</span>
              ${n.titulo}
            </div>
          `).join('');
        }
      }
    } catch (e) {
      console.warn('[MURAL TV] Falha ao carregar notícias do ticker', e);
    }
  }

  // Inicializar o Player
  async function iniciarPlayer() {
    await carregarPlaylist();
    await carregarNoticiasTicker();
    exibirSlide();

    // Polling a cada 60 segundos para atualizar a playlist sem reiniciar a exibição
    setInterval(carregarPlaylist, 60000);
    setInterval(carregarNoticiasTicker, 300000);
  }

  iniciarPlayer();
});
