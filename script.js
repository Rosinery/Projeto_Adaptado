// Inicialização do Widget VLibras
new window.VLibras.Widget('https://vlibras.gov.br/app');

// Sintetizador de Voz Nativo (Web Speech API)
const synth = window.speechSynthesis;
let speechQueue = [];
let currentUtteranceIndex = 0;
let isSpeaking = false;

// Controle de toques na tela (suporta 1, 2 ou 3 dedos)
let lastTapTime = 0;
let tapCount = 0;
let tapTimeout = null;

// Controle de rastreamento de scroll para os cards
let lastReadCardId = null;

// Função universal que toca a fila de frases sem cortar
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

  // Seleção de voz em Português
  const voices = synth.getVoices();
  const ptVoice = voices.find(v => v.lang && (v.lang.includes('pt') || v.lang.includes('PT')));
  if (ptVoice) {
    utterance.voice = ptVoice;
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

// 1. LER PÁGINA COMPLETA (Com a mensagem inicial solicitada)
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
  
  // Mensagem inicial detalhada solicitada
  let fullText = `Aviso de acessibilidade: Você pode parar a leitura a qualquer momento dando três cliques na tela com um, dois ou três dedos. Ao deslizar a tela para baixo, as etapas e as descrições das imagens serão lidas automaticamente. Iniciando a leitura do site. Rompendo barreiras, buscando acessibilidade. ${tituloPrincipal}. ${subtitulo}. ${resumo}. A seguir, apresentamos as seis etapas do projeto: `;

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

  let textToSpeak = `${titulo}. `;
  if (imgAlt) {
    textToSpeak += `Descrição da imagem: ${imgAlt}. `;
  }
  textToSpeak += `${texto}`;

  speechQueue = textToSpeak.split(/(?<=[.?!])\s+/);
  currentUtteranceIndex = 0;
  isSpeaking = true;

  processQueue();
}

// Ler card específico diretamente (usado na rolagem contínua)
function speakCardDirect(idTitulo, idTexto, idImg) {
  if (!synth) return;
  stopSpeech();

  const elTitulo = document.getElementById(idTitulo);
  const elTexto = document.getElementById(idTexto);
  const elImg = document.getElementById(idImg);

  const titulo = elTitulo ? elTitulo.innerText : '';
  const texto = elTexto ? elTexto.innerText : '';
  const imgAlt = (elImg && elImg.alt) ? elImg.alt : '';

  let textToSpeak = `${titulo}. `;
  if (imgAlt) {
    textToSpeak += `Descrição da imagem: ${imgAlt}. `;
  }
  textToSpeak += `${texto}`;

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

  // SISTEMA DE TOQUES NA TELA (Compatível com 1, 2 ou 3 dedos em qualquer lugar)
  document.addEventListener('touchend', (e) => {
    if (e.target.closest('input') || e.target.closest('label')) return;

    const currentTime = new Date().getTime();
    tapCount++;

    if (tapTimeout) {
      clearTimeout(tapTimeout);
    }

    tapTimeout = setTimeout(() => {
      if (tapCount === 2) {
        // 2 toques rápidos em qualquer lugar -> Lê o site inteiro com a mensagem de aviso
        speakFullStory();
      } else if (tapCount >= 3) {
        // 3 toques rápidos em qualquer lugar -> Para a leitura imediatamente
        stopSpeech();
      }
      tapCount = 0;
    }, 400);
  });

  // SUPORTE TAMBÉM PARA CLIQUE DE MOUSE (Caso testem no computador)
  document.addEventListener('click', (e) => {
    if (e.target.closest('input') || e.target.closest('label')) return;
    
    // Evita conflito duplo caso o navegador dispare touch e click juntos
    const currentTime = new Date().getTime();
    if (currentTime - lastTapTime < 500) return;
    lastTapTime = currentTime;
  });

  // ROLAGEM CONTÍNUA DA TELA (SCROLL): LÊ OS CARDS AUTOMATICAMENTE A QUALQUER MOMENTO
  const cardsEtapas = document.querySelectorAll('.card-etapa');
  
  window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY + window.innerHeight * 0.45; // Centro da tela do celular

    let activeCardFound = false;

    cardsEtapas.forEach(card => {
      const cardTop = card.offsetTop;
      const cardBottom = cardTop + card.offsetHeight;

      if (scrollPosition >= cardTop && scrollPosition <= cardBottom) {
        activeCardFound = true;
        const cardId = card.getAttribute('data-title');

        if (cardId && cardId !== lastReadCardId) {
          lastReadCardId = cardId;
          
          const titleId = card.getAttribute('data-title');
          const textId = card.getAttribute('data-text');
          const imgId = card.getAttribute('data-img');

          speakCardDirect(titleId, textId, imgId);
        }
      }
    });

    if (!activeCardFound) {
      lastReadCardId = null;
    }
  });
});