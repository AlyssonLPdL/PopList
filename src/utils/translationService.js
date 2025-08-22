// translationService.js

/**
 * Serviço de tradução usando API não oficial do Google Translate
 * Pode ser reutilizado por múltiplas APIs
 */

export const TRANSLATION_CONFIG = {
  enabled: true,
  targetLanguage: 'pt'
};

/**
 * Traduz texto usando API não oficial do Google Translate
 * @param {string} text - Texto a ser traduzido
 * @param {string} targetLang - Idioma de destino (padrão: 'pt')
 * @returns {Promise<string>} Texto traduzido
 */
export async function translateText(text, targetLang = 'pt') {
  try {
    if (!text || text.length === 0) return text;
    
    // Limitar o tamanho do texto para a API de tradução
    const textToTranslate = text.length > 1000 ? text.substring(0, 1000) + '...' : text;
    
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`
    );
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    return data[0].map(item => item[0]).join('');
  } catch (error) {
    console.error('Erro na tradução:', error);
    return text; // Retorna o texto original em caso de erro
  }
}

/**
 * Verifica se a tradução está habilitada
 * @returns {boolean} Status da tradução
 */
export function isTranslationEnabled() {
  return TRANSLATION_CONFIG.enabled;
}

/**
 * Obtém o idioma de destino configurado
 * @returns {string} Código do idioma de destino
 */
export function getTargetLanguage() {
  return TRANSLATION_CONFIG.targetLanguage;
}