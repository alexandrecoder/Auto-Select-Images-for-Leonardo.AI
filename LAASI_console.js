async function selectAllWithScrollAndUIStatus() {
  const STATUS_ELEMENT_ID = 'image-selector-status-div';

  // --- Funções Auxiliares ---
  function dispatchMouseEvent(target, eventType) {
    // ... (mesma função da versão anterior) ...
    if (!target) return false;
    try {
      const event = new MouseEvent(eventType, {
        bubbles: true, cancelable: true, view: window, composed: true
      });
      return target.dispatchEvent(event);
    } catch (e) {
      console.error(`❌ Erro ao disparar ${eventType} em`, target, e);
      return false;
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- Funções de UI ---
  function createOrGetStatusElement() {
    let statusDiv = document.getElementById(STATUS_ELEMENT_ID);
    if (!statusDiv) {
      statusDiv = document.createElement('div');
      statusDiv.id = STATUS_ELEMENT_ID;
      // Estilos básicos (pode personalizar)
      Object.assign(statusDiv.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(40, 40, 60, 0.9)',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '8px',
        zIndex: '9999',
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        cursor: 'default',
        transition: 'opacity 0.3s ease' // Suaviza o aparecimento/desaparecimento
      });
      document.body.appendChild(statusDiv);
    }
    statusDiv.style.opacity = '1'; // Garante visibilidade
    statusDiv.onclick = null; // Remove listener antigo ao reiniciar
    return statusDiv;
  }

  function updateStatus(message, allowClose = false) {
    const statusDiv = createOrGetStatusElement(); // Garante que exista
    if (statusDiv) {
      statusDiv.innerHTML = message; // Usar innerHTML permite links ou formatação simples se necessário
      if (allowClose) {
        statusDiv.style.cursor = 'pointer';
        statusDiv.title = 'Clique para fechar';
        statusDiv.onclick = () => {
          statusDiv.style.opacity = '0';
          // Remove o elemento após a transição
          setTimeout(() => statusDiv.remove(), 300);
        };
      } else {
        statusDiv.style.cursor = 'default';
        statusDiv.title = '';
      }
    }
    console.log(message); // Mantém o log no console também
  }

  // --- Configurações do Script ---
  const processedButtons = new Set();
  const selector = 'div.chakra-u8jb2w > button[aria-label="Select Image"]'; // *** VERIFIQUE ESTE SELETOR! ***
  const scrollDelay = 2000;
  const clickEventDelay = 50;
  const mainClickDelay = 350; // Um pouco mais rápido que antes, ajuste se precisar
  let lastScrollHeight = 0;
  let continueScrolling = true;
  let totalClicksAttempted = 0;

  // --- Início da Execução ---
  updateStatus("🚀 Iniciando seleção...");
  await delay(1000); // Pequena pausa inicial

  // --- Loop Principal ---
  while (continueScrolling) {
    let newButtonsFoundInPass = false;
    let clickedInThisPass = 0;

    const currentButtons = document.querySelectorAll(selector);
    const unprocessedButtons = Array.from(currentButtons).filter(btn => !processedButtons.has(btn));

    updateStatus(`🔎 ${unprocessedButtons.length} botões novos visíveis (Total: ${currentButtons.length}). Processando...`);

    if (unprocessedButtons.length === 0 && currentButtons.length > 0) {
        updateStatus("✨ Nenhum botão *novo* na área visível. Preparando para rolar...");
        await delay(500); // Pausa antes de rolar se não há nada novo para clicar
    } else if (currentButtons.length === 0 && processedButtons.size === 0) {
        updateStatus("🤷 Nenhum botão encontrado com o seletor na página. Verifique-o.");
        continueScrolling = false;
        break;
    }


    for (const button of unprocessedButtons) {
        // Verifica de novo, caso algo tenha mudado enquanto esperava
        if (processedButtons.has(button)) continue;

        newButtonsFoundInPass = true;
        processedButtons.add(button);
        totalClicksAttempted++;

        const cardBody = button.closest('.chakra-card__body');
        updateStatus(`🖱️ Tentando clicar #${totalClicksAttempted}...`);

        // Simula hover
        dispatchMouseEvent(cardBody, 'mouseover');
        await delay(clickEventDelay);
        dispatchMouseEvent(button, 'mouseover');
        await delay(clickEventDelay);

        // Simula clique
        let clickSuccessful = dispatchMouseEvent(button, 'mousedown');
        await delay(clickEventDelay);
        clickSuccessful = dispatchMouseEvent(button, 'mouseup') && clickSuccessful;
        await delay(clickEventDelay);
        clickSuccessful = dispatchMouseEvent(button, 'click') && clickSuccessful;

        if (clickSuccessful) {
            clickedInThisPass++;
        } else {
            console.warn(`⚠️ Falha nos eventos do botão #${totalClicksAttempted}.`);
            // Não remove do set, para não tentar de novo infinitamente.
        }
        await delay(mainClickDelay); // Pausa entre cliques
    } // Fim for

    // --- Lógica de Scroll ---
    lastScrollHeight = document.documentElement.scrollHeight;
    updateStatus(`📜 Rolando (Total processado: ${processedButtons.size})...`);
    window.scrollTo({ top: lastScrollHeight, behavior: 'smooth' });

    updateStatus(`⏳ Esperando ${scrollDelay / 1000}s carregar... (Total processado: ${processedButtons.size})`);
    await delay(scrollDelay);

    // Condição de parada
    let currentScrollHeight = document.documentElement.scrollHeight;
    if (currentScrollHeight <= lastScrollHeight) {
       // Rola uma última vez um pouco mais devagar para garantir
       updateStatus('🏁 Checando final da página...');
       window.scrollTo({ top: currentScrollHeight + 500, behavior: 'smooth' }); // Tenta rolar um pouco mais
       await delay(scrollDelay + 1000); // Espera um pouco mais
       currentScrollHeight = document.documentElement.scrollHeight; // Verifica de novo
       if (currentScrollHeight <= lastScrollHeight) {
          updateStatus("🏁 Fim da página alcançado ou não carregou mais. Finalizando...", true);
          continueScrolling = false; // Para o loop
       } else {
          updateStatus("🔄 Ainda carregando... continuando.");
          lastScrollHeight = currentScrollHeight; // Atualiza para a próxima comparação
       }

    } else {
        updateStatus("🔄 Conteúdo novo pode ter carregado, continuando...");
    }

  } // Fim while

  // Mensagem final já é dada dentro do loop na condição de parada.
  // Se saiu por outro motivo (ex: erro inicial), garante uma mensagem final.
  if (continueScrolling === false && document.getElementById(STATUS_ELEMENT_ID)?.onclick === null) {
      updateStatus(`🎉 Processo interrompido. ${processedButtons.size} botões tiveram tentativa de clique. (Clique para fechar)`, true);
  }
}

// --- Como Usar ---
// 1. Abra o Console (F12)
// 2. Cole TODO este código
// 3. Pressione Enter
selectAllWithScrollAndUIStatus();
