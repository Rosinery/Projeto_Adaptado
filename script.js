// Inicialização do Widget VLibras
new window.VLibras.Widget('https://vlibras.gov.br/app');

// Sintetizador de Voz Nativo (Web Speech API)
const synth = window.speechSynthesis;
let speechQueue = [];
let currentUtteranceIndex = 0;
let isSpeaking = false;

// Controle de cliques para o triplo clique (Parar áudio)
let clickTimestamps = [];

// Controle de leitura automática por scroll
let lastScannedCardId = null;

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

// 1. LER PÁGINA COMPLETA (Com o aviso prévio de instruções solicitado)
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
  
  // Mensagem inicial solicitada explicando que pode parar com 3 cliques e ler rolando a tela
  let fullText = `Aviso de acessibilidade: Você pode parar a leitura a qualquer momento dando três cliques rápidos em qualquer lugar da tela. Ao deslizar a tela para baixo, as etapas e suas descrições de imagens serão lidas automaticamente. Iniciando a leitura do site. Rompendo barreiras, buscando acessibilidade. ${tituloPrincipal}. ${subtitulo}. ${resumo}. A seguir, apresentamos as seis etapas do projeto: `;

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

// Ler card específico por ID diretamente (usado no scroll)
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

  // 1. DOIS CLIQUES EM QUALQUER LUGAR DA TELA PARA LER O SITE DO INÍCIO
  let lastTapTime = 0;
  document.addEventListener('click', (e) => {
    // Evita conflito se clicar em botões específicos de ação que já possuem comportamento próprio
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) return;

    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;

    // Se der 2 cliques rápidos (menos de 400ms) em qualquer lugar vazio da página
    if (tapLength < 400 && tapLength > 0) {
      speakFullStory();
    }
    lastTapTime = currentTime;
  });

  // 2. TRÊS CLIQUES EM QUALQUER LUGAR DA TELA PARA PARAR O ÁUDIO IMEDIATAMENTE
  document.addEventListener('click', () => {
    const now = new Date().getTime();
    clickTimestamps.push(now);

    // Mantém apenas cliques dos últimos 700ms
    clickTimestamps = clickTimestamps.filter(timestamp => now - timestamp < 700);

    if (clickTimestamps.length >= 3) {
      stopSpeech();
      clickTimestamps = [];
    }
  });

  // 3. ROLAR A TELA LÊ AUTOMATICAMENTE CADA CARD QUE CHEGA NA TELA
  const cardsEtapas = document.querySelectorAll('.card-etapa');
  const observerOptions = {
    root: null,
    rootMargin: '-10% 0px -40% 0px', 
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const cardId = card.getAttribute('data-title');

        if (cardId && cardId !== lastScannedCardId) {
          lastScannedCardId = cardId;
          
          const titleId = card.getAttribute('data-title');
          const textId = card.getAttribute('data-text');
          const imgId = card.getAttribute('data-img');

          speakCardDirect(titleId, textId, imgId);
        }
      }
    });
  }, observerOptions);

  cardsEtapas.forEach(card => {
    observer.observe(card);
  });
});