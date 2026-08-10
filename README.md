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

### [10/08/2026] - Versão Inicial 1.0.0
- Criada a estrutura do projeto sob a assinatura da Diretoria de Comunicação Social (DICOM) do IF Baiano.
- Desenvolvido o **System Design Oficial do IF Baiano** (`css/system-design-ifbaiano.css`) com as cores Verde Institucional (`#13884D`), Vermelho Destaque (`#C8191E`) e fundos noturnos otimizados para telas de TV.
- Implementado o **Player da TV (`player.html`)** com relógio em tempo real, rotação de slides, transições CSS3 e letreiro digital de notícias (Ticker Bar).
- Implementado o **Painel Admin (`admin.html`)** autenticado via hash criptográfico SHA-256 para a senha `Dicom!@#123`.
- Registrada a especificação técnica em `_System_Designs/IF_Baiano_APPs/system_design_mural_digital_ifbaiano.md`.
