/**
 * auth.js - Módulo de Autenticação Segura SHA-256
 * Mural Digital IF Baiano - DICOM
 *
 * Valida a senha do admin no cliente sem expor o texto puro.
 */

// Hash SHA-256 da senha 'Dicom!@#123'
const HASH_SENHA_DICOM = '7decdd9e24d429ba4eba72f013c2170fdbdaf31af15c3c812b886a8cac0fedc6';

async function gerarHashSHA256(texto) {
  const encoder = new TextEncoder();
  const data = encoder.encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function validarSenhaAdmin(senhaDigitada) {
  if (!senhaDigitada) return false;
  const hashInput = await gerarHashSHA256(senhaDigitada);
  return hashInput === HASH_SENHA_DICOM;
}

function usuarioEstaAutenticado() {
  return sessionStorage.getItem('mural_dicom_auth') === 'true';
}

function registrarSessaoAutenticada() {
  sessionStorage.setItem('mural_dicom_auth', 'true');
}

function encerrarSessao() {
  sessionStorage.removeItem('mural_dicom_auth');
  window.location.reload();
}
