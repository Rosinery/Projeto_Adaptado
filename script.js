// Inicialização do Widget VLibras
new window.VLibras.Widget('https://vlibras.gov.br/app');

// Sintetizador de Voz Nativo (Web Speech API)
const synth = window.speechSynthesis;
let speechQueue = [];
let currentUtteranceIndex = 0;
let isSpeaking = false;

// Controle unificado de toques/cliques (funciona em qualquer lugar, inclusive nos cards)
let tapCount = 0;
let tapTimeout = null;

// Controle de rastreamento de scroll para os cards (permite re-leitura infinita)
let lastReadCardId = null;

// Função universal que toca a fila de frases sem cortar (com prioridade para voz feminina)
function processQueue() {
  if (!isSpeaking || currentUtteranceIndex >= speechQueue.length) {
    stopSpeech();
    return;
  }

  const textChunk = speechQueue[currentUtteranceIndex];
  if (!textChunk || !textChunk.trim()) {
    currentUtteranceIndex++;
    processQueue();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(textChunk.trim());
  utterance.lang = 'pt-BR';
  utterance.rate = 1.0;

  // Seleção de voz em Português com foco em VOZ FEMININA
  const voices = synth.getVoices();
  let selectedVoice = voices.find(v => 
    v.lang && (v.lang.includes('pt') || v.lang.includes('PT')) && 
    (v.name.toLowerCase().includes('female') || 
     v.name.toLowerCase().includes('luciana') || 
     v.name.toLowerCase().includes('maria') || 
     v.name.toLowerCase().includes('francisca') || 
     v.name.toLowerCase().includes('google do brasil') ||
     v.name.toLowerCase().includes('raquel'))
  );

  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang && (v.lang.includes('pt') || v.lang.includes('PT')));
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onend = () => {
    currentUtteranceIndex++;
    processQueue();
  };

  utterance.onerror = (e) => {
    console.error('Erro na fala:', e);
    currentUtteranceIndex++;
    processQueue();
  };

  synth.speak(utterance);
}

// Parar o áudio imediatamente e resetar estado
function stopSpeech() {
  isSpeaking = false;
  speechQueue = [];
  currentUtteranceIndex = 0;
  
  if (synth) {
    synth.cancel();
  }
  
  const btnOuvirTudo = document.getElementById('btn-ouvir-tudo');
  if (btnOuvirTudo) {
    btnOuvirTudo.innerHTML = '🔊 Ouvir ';
  }

  const botoesEtapas = document.querySelectorAll('.btn-ouvir-card');
  botoesEtapas.forEach((btn, index) => {
    btn.innerHTML = `🔊 Ouvir Etapa ${index + 1}`;
  });
}

// 1. LER PÁGINA COMPLETA (Com a mensagem inicial explicativa solicitada)
function speakFullStory() {
  if (!synth) {
    alert('Seu navegador não suporta leitura em voz alta.');
    return;
  }

  stopSpeech();

  const elTituloPrincipal = document.querySelector('h1');
  const elSubtitulo = document.querySelector('.header-subtitle');
  const tituloPrincipal = elTituloPrincipal ? elTituloPrincipal.innerText : '';
  const subtitulo = elSubtitulo ? elSubtitulo.innerText : '';

  const elementoResumo = document.getElementById('texto-resumo');
  const resumo = elementoResumo ? elementoResumo.innerText : '';
  
  let fullText = `Aviso de acessibilidade: Você pode parar a leitura a qualquer momento dando três toques na tela com um, dois ou três dedos. Ao deslizar a tela para baixo, o Sobre o Projeto, as etapas e as descrições das imagens serão lidas automaticamente. Iniciando a leitura do site. Rompendo barreiras, buscando acessibilidade. ${tituloPrincipal}. ${subtitulo}. ${resumo}. A seguir, apresentamos as seis etapas do projeto: `;

  for (let i = 1; i <= 6; i++) {
    const elTitulo = document.getElementById(`card${i}-titulo`);
    const elTexto = document.getElementById(`card${i}-texto`);
    const elImg = document.getElementById(`img-card-${i}`) || document.getElementById(`img-card${i}`);

    const titulo = elTitulo ? elTitulo.innerText : '';
    const texto = elTexto ? elTexto.innerText : '';
    const imgAlt = (elImg && elImg.alt) ? elImg.alt : '';

    fullText += `Etapa ${i}: ${titulo}. ${imgAlt ? 'Descrição da imagem: ' + imgAlt + '.' : ''} ${texto}. `;
  }

  const cleanText = fullText.replace(/\s+/g, ' ').trim();
  speechQueue = cleanText.split(/(?<=[.?!])\s+/);
  
  currentUtteranceIndex = 0;
  isSpeaking = true;

  const btnOuvirTudo = document.getElementById('btn-ouvir-tudo');
  if (btnOuvirTudo) {
    btnOuvirTudo.innerHTML = '🔊 Lendo...';
  }

  processQueue();
}

// 2. LER ETAPA INDIVIDUAL POR BOTÃO
function speakCardTextFromButton(button) {
  const btnOuvirTudo = document.getElementById('btn-ouvir-tudo');
  if (btnOuvirTudo) btnOuvirTudo.innerHTML = '🔊 Lendo...';
  
  if (!synth) return;

  stopSpeech();

  const idTitulo = button.getAttribute('data-title');
  const idTexto = button.getAttribute('data-text');
  const idImg = button.getAttribute('data-img');

  const elTitulo = idTitulo ? document.getElementById(idTitulo) : null;
  const elTexto = idTexto ? document.getElementById(idTexto) : null;
  const elImg = idImg ? document.getElementById(idImg) : null;

  const titulo = elTitulo ? elTitulo.innerText : '';
  const texto = elTexto ? elTexto.innerText : '';
  const imgAlt = (elImg && elImg.alt) ? elImg.alt : '';

  let textToSpeak = '';
  if (titulo) textToSpeak += `${titulo}. `;
  if (imgAlt) textToSpeak += `Descrição da imagem: ${imgAlt}. `;
  if (texto) textToSpeak += `${texto}`;

  speechQueue = textToSpeak.split(/(?<=[.?!])\s+/);
  currentUtteranceIndex = 0;
  isSpeaking = true;

  processQueue();
}

// Ler card ou seção específica diretamente (usado na rolagem contínua)
function speakCardDirect(idTitulo, idTexto, idImg) {
  if (!synth) return;
  stopSpeech();

  const elTitulo = idTitulo ? document.getElementById(idTitulo) : null;
  const elTexto = idTexto ? document.getElementById(idTexto) : null;
  const elImg = idImg ? document.getElementById(idImg) : null;

  const titulo = elTitulo ? elTitulo.innerText : '';
  const texto = elTexto ? elTexto.innerText : '';
  const imgAlt = (elImg && elImg.alt) ? elImg.alt : '';

  let textToSpeak = '';
  if (titulo) textToSpeak += `${titulo}. `;
  if (imgAlt) textToSpeak += `Descrição da imagem: ${imgAlt}. `;
  if (texto) textToSpeak += `${texto}`;

  speechQueue = textToSpeak.split(/(?<=[.?!])\s+/);
  currentUtteranceIndex = 0;
  isSpeaking = true;

  processQueue();
}

function toggleHighContrast() {
  document.body.classList.toggle('high-contrast');
}

let currentFontSize = 100;

function changeFontSize(delta) {
  currentFontSize += delta * 10;
  if (currentFontSize < 80) currentFontSize = 80;
  if (currentFontSize > 160) currentFontSize = 160;

  const main = document.getElementById('conteudo-principal');
  const header = document.querySelector('header');
  
  if (main) main.style.fontSize = `${currentFontSize}%`;
  if (header) header.style.fontSize = `${currentFontSize}%`;
}

function handleImagePreview(event) {
  const file = event.target.files[0];
  const targetImgId = event.target.getAttribute('data-target');
  
  if (file && targetImgId) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = document.getElementById(targetImgId);
      if (img) img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

// --------------------------------------------------------------------------
// CONFIGURAÇÕES GLOBAIS DE ACESSIBILIDADE
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-alto-contraste').addEventListener('click', toggleHighContrast);
  document.getElementById('btn-aumentar-fonte').addEventListener('click', () => changeFontSize(1));
  document.getElementById('btn-diminuir-fonte').addEventListener('click', () => changeFontSize(-1));
  document.getElementById('btn-ouvir-tudo').addEventListener('click', speakFullStory);
  document.getElementById('btn-parar-audio').addEventListener('click', stopSpeech);

  const botoesEtapas = document.querySelectorAll('.btn-ouvir-card');
  botoesEtapas.forEach(botao => {
    botao.addEventListener('click', (e) => {
      e.preventDefault();
      speakCardTextFromButton(botao);
    });
  });

  const photoInputs = document.querySelectorAll('.input-foto');
  photoInputs.forEach(input => {
    input.addEventListener('change', handleImagePreview);
  });

  // DETECÇÃO GLOBAL DE TOQUES (Funciona EM QUALQUER LUGAR, inclusive em cima dos cards)
  function registerTap(e) {
    // Exceção apenas para inputs de upload de arquivos (para não atrapalhar a seleção de fotos)
    if (e.target.closest('input[type="file"]')) return;

    tapCount++;

    if (tapTimeout) {
      clearTimeout(tapTimeout);
    }

    tapTimeout = setTimeout(() => {
      if (tapCount === 2) {
        // 2 toques rápidos em qualquer lugar (inclusive cards) -> Lê o site inteiro
        speakFullStory();
      } else if (tapCount >= 3) {
        // 3 toques rápidos em qualquer lugar (inclusive cards) -> Para imediatamente
        stopSpeech();
      }
      tapCount = 0;
    }, 400);
  }

  // Escuta os toques em qualquer elemento do documento
  document.addEventListener('touchend', registerTap, { passive: true });
  document.addEventListener('click', (e) => {
    if (e.pointerType === 'touch' || (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents)) return;
    registerTap(e);
  });

  // ROLAGEM CONTÍNUA (SCROLL READER): LÊ OS BLOCOS E CARDS AUTOMATICAMENTE A QUALQUER MOMENTO
  const blocosEtapas = document.querySelectorAll('.card-etapa');
  
  window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY + window.innerHeight * 0.45; // Centro da tela

    let activeCardId = null;

    blocosEtapas.forEach(bloco => {
      const blocoTop = bloco.offsetTop;
      const blocoBottom = blocoTop + bloco.offsetHeight;

      if (scrollPosition >= blocoTop && scrollPosition <= blocoBottom) {
        activeCardId = bloco.getAttribute('data-title');
      }
    });

    if (activeCardId && activeCardId !== lastReadCardId) {
      lastReadCardId = activeCardId;
      
      const blocoAtivo = document.querySelector(`[data-title="${activeCardId}"]`);
      if (blocoAtivo) {
        const titleId = blocoAtivo.getAttribute('data-title');
        const textId = blocoAtivo.getAttribute('data-text');
        
        let imgId = null;
        const imgElement = blocoAtivo.querySelector('img');
        if (imgElement && imgElement.id) {
          imgId = imgElement.id;
        }

        speakCardDirect(titleId, textId, imgId);
      }
    }

    if (!activeCardId) {
      lastReadCardId = null;
    }
  });
});