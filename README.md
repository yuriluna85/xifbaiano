# Mural Digital IF Baiano (Digital Signage DICOM)
### YLuna85 LABs — Laboratório de Softwares / DICOM IF Baiano

Sistema serverless de sinalização digital (*Digital Signage*) para transmissão contínua de comunicados, avisos institucionais, notícias do portal e mídias em Smart TVs, monitores e murais eletrônicos dos campi e reitoria do Instituto Federal Baiano.

---

## 🚀 Como Acessar

1. **Player de Exibição da TV (Full Screen)**:
   - URL: `player.html` (ou `index.html`)
   - Modo de uso: Abrir no navegador da TV / computador em modo tela cheia (F11).

2. **Painel Gerenciador da DICOM**:
   - URL: `admin.html`
   - Senha padrão de acesso: `Dicom!@#123` (autenticado via hash SHA-256 no cliente).

---

## 🛠️ Tecnologias & Arquitetura

- **Frontend Estático**: HTML5, Vanilla CSS3 (Design System do IF Baiano), JavaScript (ES6+).
- **Sem Backend Pago**: Hospedagem 100% gratuita no GitHub Pages com atualização via `playlist.json` e armazenamento em cache local PWA.
- **Resiliência Offline**: Se a internet do campus oscilar, a TV continua exibindo os últimos comunicados salvos no `localStorage`.

---

## 📋 Log de Atualizações (Changelog)

### [10/08/2026] - Versão 1.0.1
- **Correção da Persistência e Sincronização em Tempo Real**: Ajustados os scripts [player.js](file:///G:/Meu%20Drive/APP/2.%20Projetos%20e%20Aplica%C3%A7%C3%B5es/2.2%20Aplica%C3%A7%C3%B5es%20e%20C%C3%B3digos%20%28GitHub%29/IF%20Baiano%20APPs/mural-digital-ifbaiano/js/player.js) e [admin.js](file:///G:/Meu%20Drive/APP/2.%20Projetos%20e%20Aplica%C3%A7%C3%B5es/2.2%20Aplica%C3%A7%C3%B5es%20e%20C%C3%B3digos%20%28GitHub%29/IF%20Baiano%20APPs/mural-digital-ifbaiano/js/admin.js) para priorizar as alterações da playlist salvas localmente (`mural_playlist_custom`), ativando transmissão instantânea entre abas via `storage event`.
- Adicionados os botões **Transmitir para TV**, **Baixar JSON** (para commit no repositório) e **Restaurar Padrão** no painel admin.
- Gerados os favicons oficiais do IF Baiano na pasta `assets/` (`favicon-98x98.png`, `favicon.png`, `favicon.svg` e `favicon.ico`) via script `generate_favicons.py`.

- **Autoplay Compulsório & Controle Dinâmico de Tempo**: Atualizado o [player.js](file:///G:/Meu%20Drive/APP/2.%20Projetos%20e%20Aplica%C3%A7%C3%B5es/2.2%20Aplica%C3%A7%C3%B5es%20e%20C%C3%B3digos%20%28GitHub%29/IF%20Baiano%20APPs/mural-digital-ifbaiano/js/player.js) corrigindo o temporizador de vídeos. Para cartazes e comunicados em texto é mantido o tempo configurado (ex.: 10s), enquanto para vídeos o cronômetro é **100% guiado pela duração real exata da mídia** (`video.duration` e evento `ended`), impedindo que vídeos longos sejam cortados aos 10 segundos.







- Implementado o **Player da TV (`player.html`)** com relógio em tempo real, rotação de slides, transições CSS3 e letreiro digital de notícias (Ticker Bar).
- Implementado o **Painel Admin (`admin.html`)** autenticado via hash criptográfico SHA-256 para a senha `Dicom!@#123`.
- Registrada a especificação técnica em `_System_Designs/IF_Baiano_APPs/system_design_mural_digital_ifbaiano.md`.
