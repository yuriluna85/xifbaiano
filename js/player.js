/**
 * player.js - Motor de Exibição do Mural Digital IF Baiano (TV Display Mode)
 * DICOM / YLuna85 LABs
 *
 * Máquina de Estados:
 * 1. Mídias em Texto/Imagem: Timer fixo de exibição.
 * 2. Mídias em Vídeo: Pausa o timer geral. Executa o vídeo completo sem 'loop'.
 *    Ao terminar o vídeo ('ended') ou ocorrer erro ('error'), retoma e avança o slide imediatamente.
 * 3. Vídeos em iFrame (YouTube/Drive Embed): Utiliza a duração configurada no admin.
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

  // 2. Extração de ID de Arquivo do Google Drive
  function extrairGoogleDriveId(url) {
    if (!url) return null;
    const matchId = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    return matchId ? matchId[1] : null;
  }

  // 3. Sistema de Cache Offline de Mídias (Cache API)
  async function obterMediaCachedUrl(urlOriginal) {
    if (!urlOriginal || !('caches' in window)) return urlOriginal;

    try {
      const cacheStorage = await caches.open('mural_video_cache_v1');
      const cachedResponse = await cacheStorage.match(urlOriginal);

      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        return URL.createObjectURL(blob);
      }

      if (navigator.onLine && (urlOriginal.endsWith('.mp4') || urlOriginal.includes('drive.google.com'))) {
        fetch(urlOriginal).then(response => {
          if (response.ok) {
            cacheStorage.put(urlOriginal, response);
          }
        }).catch(err => console.warn('[CACHE] Falha ao pré-baixar mídia:', err));
      }
    } catch (e) {
      console.warn('[CACHE] Erro no Cache API:', e);
    }
    return urlOriginal;
  }

  // 4. Carregar Playlist
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
        avancarProximoSlide();
      });
    }
  });

  // Função Auxiliar de Transição de Slides Seguro
  function avancarProximoSlide() {
    if (timerSlide) {
      clearTimeout(timerSlide);
      timerSlide = null;
    }
    exibirSlide();
  }

  // 5. Renderizador de Slide com Pausa e Retomada de Sequência
  async function exibirSlide() {
    if (playlist.length === 0) return;

    if (timerSlide) {
      clearTimeout(timerSlide);
      timerSlide = null;
    }

    if (indexAtual >= playlist.length) {
      indexAtual = 0;
    }

    const item = playlist[indexAtual];
    const duracaoPadraoMs = (item.duracao_segundos || 10) * 1000;

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
      indexAtual++;
      timerSlide = setTimeout(avancarProximoSlide, duracaoPadraoMs);

    } else if (item.tipo === 'imagem') {
      const urlCached = await obterMediaCachedUrl(item.url || '');
      wrapper.innerHTML = `
        <div class="slide-media-wrapper">
          <img src="${urlCached}" alt="${item.titulo || 'Mídia IF Baiano'}">
        </div>
      `;

      const imgElem = wrapper.querySelector('img');
      if (imgElem) {
        imgElem.addEventListener('load', () => {
          if (imgElem.naturalHeight > imgElem.naturalWidth) {
            wrapper.classList.add('is-portrait');
          } else {
            wrapper.classList.add('is-landscape');
          }
        });
      }

      indexAtual++;
      timerSlide = setTimeout(avancarProximoSlide, duracaoPadraoMs);

    } else if (item.tipo === 'video') {
      const urlOriginal = item.url || '';
      let embedHtml = '';

      const driveId = extrairGoogleDriveId(urlOriginal);

      if (driveId) {
        const urlStreamDrive = `https://drive.usercontent.google.com/download?id=${driveId}&confirm=t`;
        const urlCachedDrive = await obterMediaCachedUrl(urlStreamDrive);
        const urlPreviewDrive = `https://drive.google.com/file/d/${driveId}/preview`;

        // ATENÇÃO: Sem a propriedade 'loop', para que o evento 'ended' seja disparado no final
        embedHtml = `
          <video src="${urlCachedDrive}" autoplay muted playsinline style="width:100%; height:100%; object-fit:contain; border-radius:16px;" onerror="this.outerHTML='<iframe src=\\'${urlPreviewDrive}?autoplay=1\\' frameborder=\\'0\\' style=\\'width:100%; height:100%; border-radius:16px;\\' allow=\\'autoplay; encrypted-media\\'></iframe>'"></video>
        `;
      } else if (urlOriginal.includes('youtube.com') || urlOriginal.includes('youtu.be')) {
        let videoId = '';
        if (urlOriginal.includes('youtu.be/')) {
          videoId = urlOriginal.split('youtu.be/')[1].split('?')[0];
        } else if (urlOriginal.includes('v=')) {
          videoId = urlOriginal.split('v=')[1].split('&')[0];
        }
        embedHtml = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0" frameborder="0" allow="autoplay; encrypted-media" style="width:100%; height:100%; border-radius:16px;"></iframe>`;
      } else if (urlOriginal.includes('photos.app.goo.gl') || urlOriginal.includes('photos.google.com')) {
        embedHtml = `
          <div class="card-notice category-urgente" style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center;">
            <span class="card-notice-badge">Usar o Google Drive</span>
            <h2 class="card-notice-title">${item.titulo || 'Vídeo Grande'}</h2>
            <p class="card-notice-body">
              Para vídeos grandes sem estourar o espaço do GitHub, suba para o <strong>Google Drive</strong> e altere o compartilhamento para <em>"Qualquer pessoa com o link"</em>.<br><br>
              O sistema baixará o vídeo para o cache local da TV e reproduzirá offline!
            </p>
          </div>
        `;
      } else {
        const urlCached = await obterMediaCachedUrl(urlOriginal);
        embedHtml = `<video src="${urlCached}" autoplay muted playsinline style="width:100%; height:100%; object-fit:contain; border-radius:16px;"></video>`;
      }

      wrapper.innerHTML = `
        <div class="slide-media-wrapper">
          ${embedHtml}
        </div>
      `;

      indexAtual++;

      // Timer de fallback padrão para iFrames/Embeds que não disparam evento HTML5 'ended'
      timerSlide = setTimeout(() => {
        console.log('[MURAL TV] Tempo limite da mídia atingido, avançando slide...');
        avancarProximoSlide();
      }, Math.max(duracaoPadraoMs, 15000));

      // Se for elemento <video> nativo, controlar rigorosamente o término ('ended') e duração
      const videoElem = wrapper.querySelector('video');
      if (videoElem) {
        videoElem.muted = true;
        videoElem.playsInline = true;

        videoElem.addEventListener('loadedmetadata', () => {
          // Detecção de Orientação (Horizontal vs Vertical)
          if (videoElem.videoHeight > videoElem.videoWidth) {
            wrapper.classList.add('is-portrait');
          } else {
            wrapper.classList.add('is-landscape');
          }

          // Atualiza o timer de segurança para o tempo real do vídeo + 1 segundo
          if (videoElem.duration && !isNaN(videoElem.duration) && videoElem.duration > 0) {
            const duracaoExataMs = Math.ceil(videoElem.duration) * 1000;
            console.log(`[MURAL TV] Vídeo detectado (${videoElem.duration}s). Timer de segurança estendido para ${videoElem.duration}s.`);
            if (timerSlide) clearTimeout(timerSlide);
            timerSlide = setTimeout(avancarProximoSlide, duracaoExataMs + 1200);
          }
        });

        // QUANDO O VÍDEO TERMINAR: Retoma a apresentação de slides imediatamente!
        videoElem.addEventListener('ended', () => {
          console.log('[MURAL TV] Vídeo finalizado nativamente! Retomando apresentação de slides...');
          avancarProximoSlide();
        });

        videoElem.addEventListener('error', (err) => {
          console.warn('[MURAL TV] Erro no vídeo, avançando para o próximo slide...', err);
          avancarProximoSlide();
        });

        videoElem.play().catch(() => {
          videoElem.muted = true;
          videoElem.play();
        });
      }
    }

    containerSlide.appendChild(wrapper);

    // Efeito Fade In
    requestAnimationFrame(() => {
      wrapper.classList.add('active');
    });
  }

  // 6. Carregar Feed de Notícias no Ticker
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

    setInterval(carregarPlaylist, 60000);
    setInterval(carregarNoticiasTicker, 300000);
  }

  iniciarPlayer();
});
