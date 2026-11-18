// Inicialização do Widget VLibras
new window.VLibras.Widget('https://vlibras.gov.br/app');

// Sintetizador de Voz Nativo (Web Speech API)
const synth = window.speechSynthesis;
let speechQueue = [];
let currentUtteranceIndex = 0;
let isSpeaking = false;

// Controle de toques na tela (1, 2 ou 3 dedos)
let tapCount = 0;
let tapTimeout = null;

// Controle de rastreamento de scroll para os blocos e cards
let lastReadCardId = null;

// Função universal que toca a fila de frases sem cortar (prioridade para voz feminina)
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

  // Seleção de voz em Português (Foco em voz feminina)
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
    if (index === 0) {
      btn.innerHTML = '🔊 Ouvir Sobre o Projeto';
    } else {
      btn.innerHTML = `🔊 Ouvir Etapa ${index}`;
    }
  });
}

// 1. LER PÁGINA COMPLETA (Com a mensagem inicial explicativa)
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

// 2. LER ETAPA OU SOBRE O PROJETO INDIVIDUAL POR BOTÃO
function speakCardTextFromButton(button) {
  const btnOuvirTudo = document.getElementById('btn-ouvir-tudo');
  if (btnOuvirTudo) btnOuvirTudo.innerHTML = '🔊 Lendo...';
  
  if (!synth) return;

  stopSpeech();

  const idTitulo = button.getAttribute('data-title');
  const idTexto = button.getAttribute('data-text');

  const elTitulo = idTitulo ? document.getElementById(idTitulo) : null;
  const elTexto = idTexto ? document.getElementById(idTexto) : null;
  
  // Procura imagem associada se houver dentro do mesmo card/seção
  const parentContainer = button.closest('section') || button.closest('article');
  const elImg = parentContainer ? parentContainer.querySelector('img') : null;

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
function speakCardDirect(idTitulo, idTexto, elImg) {
  if (!synth) return;
  stopSpeech();

  const elTitulo = idTitulo ? document.getElementById(idTitulo) : null;
  const elTexto = idTexto ? document.getElementById(idTexto) : null;

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

  // DETECÇÃO GLOBAL DE TOQUES (2 toques para falar, 3 para parar em qualquer lugar)
  function registerTap(e) {
    if (e.target.closest('input[type="file"]')) return;

    tapCount++;

    if (tapTimeout) {
      clearTimeout(tapTimeout);
    }

    tapTimeout = setTimeout(() => {
      if (tapCount === 2) {
        speakFullStory();
      } else if (tapCount >= 3) {
        stopSpeech();
      }
      tapCount = 0;
    }, 400);
  }

  document.addEventListener('touchend', registerTap, { passive: true });
  document.addEventListener('click', (e) => {
    if (e.pointerType === 'touch' || (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents)) return;
    registerTap(e);
  });

  // ROLAGEM CONTÍNUA (SCROLL READER): LEITURA AUTOMÁTICA DO SOBRE O PROJETO E DOS CARDS
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
        const imgElement = blocoAtivo.querySelector('img');

        speakCardDirect(titleId, textId, imgElement);
      }
    }

    if (!activeCardId) {
      lastReadCardId = null;
    }
  });
});