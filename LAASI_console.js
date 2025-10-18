async function selectAllInteractive() {
  const STATUS_ELEMENT_ID = 'interactive-image-selector-status';

  // --- Funções Auxiliares ---
  function dispatchMouseEvent(target, eventType) {
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
      Object.assign(statusDiv.style, {
        position: 'fixed', bottom: '20px', right: '20px',
        backgroundColor: 'rgba(40, 40, 60, 0.95)', color: 'white',
        padding: '12px 18px', borderRadius: '8px', zIndex: '9999',
        fontSize: '14px', fontFamily: 'Arial, sans-serif',
        boxShadow: '0 3px 12px rgba(0,0,0,0.6)', cursor: 'default',
        transition: 'opacity 0.3s ease, transform 0.3s ease', // Added transform transition
        transform: 'translateY(10px)', // Start slightly lower
        opacity: '0' // Start hidden
      });
      document.body.appendChild(statusDiv);
      // Force reflow before applying visible styles for transition
      void statusDiv.offsetWidth;
      statusDiv.style.opacity = '1';
      statusDiv.style.transform = 'translateY(0)';
    }
    statusDiv.onclick = null; // Remove listener antigo
    return statusDiv;
  }

  function updateStatus(message, allowClose = false) {
    const statusDiv = createOrGetStatusElement();
    if (statusDiv) {
      statusDiv.innerHTML = message;
      if (allowClose) {
        statusDiv.style.cursor = 'pointer';
        statusDiv.title = 'Clique para fechar';
        statusDiv.onclick = () => {
          statusDiv.style.opacity = '0';
          statusDiv.style.transform = 'translateY(10px)';
          setTimeout(() => statusDiv.remove(), 300);
        };
      } else {
        statusDiv.style.cursor = 'default';
        statusDiv.title = '';
      }
    }
    // Limpa a mensagem do console anterior se for similar (evita poluição)
    // if (console.lastMessage !== message) {
        // console.log(message);
        // console.lastMessage = message;
    // }
    console.log(message); // Logar sempre pode ser útil para depuração
  }

  // --- Função de Verificação Final ---
  async function finalVerification() {
    updateStatus("🔍 Verificação final: Re-escanneando todos os botões...");
    await delay(1000); // Pausa para o usuário ler

    // Encontra TODOS os containers de botão, mesmo os já processados
    const allButtonContainers = document.querySelectorAll('div.chakra-u8jb2w');
    let foundSelected = 0;
    let foundUnselected = 0;
    const unselectedList = []; // Para logar quais faltaram (se houver)

    for (const container of allButtonContainers) {
      // Procura o botão *dentro* do container atual
      const buttonInside = container.querySelector('button[aria-label]'); // Pega qualquer botão com aria-label

      if (buttonInside) {
        // ASSUME: Se o aria-label NÃO for "Select Image", está selecionado
        if (buttonInside.getAttribute('aria-label') !== 'Select Image') {
          foundSelected++;
        } else {
          foundUnselected++;
          // Tenta pegar a URL da imagem associada ao botão não selecionado
           const cardBody = buttonInside.closest('.chakra-card__body');
           const img = cardBody?.querySelector('img[src]');
           unselectedList.push({ index: Array.from(allButtonContainers).indexOf(container), src: img?.src || 'URL não encontrada' });
        }
      } else {
          console.warn("Container de botão encontrado sem botão dentro?", container);
      }
    }

    let finalMessage = `🏁 Verificação concluída:<br/>✅ ${foundSelected} imagens parecem selecionadas.<br/>❌ ${foundUnselected} imagens parecem NÃO selecionadas.`;
    if (foundUnselected > 0) {
      finalMessage += "<br/>(Verifique o console para detalhes dos não selecionados)";
      console.warn(`Lista de ${foundUnselected} imagens não selecionadas encontradas na verificação final:`, unselectedList);
    } else {
      finalMessage += "<br/>✨ Parece que tudo foi selecionado!";
    }
    updateStatus(finalMessage, true); // Permite fechar
  }


  // --- Configurações do Script ---
  const processedButtons = new Set();
  const selector = 'div.chakra-u8jb2w > button[aria-label="Select Image"]'; // *** VERIFIQUE ESTE SELETOR! ***
  const scrollDelay = 2000;
  const clickEventDelay = 50;
  const mainClickDelay = 350;
  let lastScrollHeight = 0;
  let continueScrolling = true;
  let totalClicksAttempted = 0;
  let consecutiveFailedScrolls = 0; // Contador para tentativas de scroll sem achar nada

  // --- Início da Execução ---
  updateStatus("🚀 Iniciando seleção...");
  await delay(1000);

  // --- Loop Principal ---
  while (continueScrolling) {
    let newButtonsFoundInPass = false;
    let clickedInThisPass = 0;

    const currentButtons = document.querySelectorAll(selector);
    const unprocessedButtons = Array.from(currentButtons).filter(btn => !processedButtons.has(btn));

    if (unprocessedButtons.length > 0) {
       consecutiveFailedScrolls = 0; // Reseta o contador se achou botões novos
       updateStatus(`🔎 ${unprocessedButtons.length} botões novos visíveis (Total processado: ${processedButtons.size}). Clicando...`);
    } else if (currentButtons.length > 0) {
       updateStatus(`✨ Nenhum botão *novo* visível (Total processado: ${processedButtons.size}). Preparando para rolar...`);
       await delay(500);
    } else if (processedButtons.size === 0) {
       updateStatus("🤷 Nenhum botão encontrado com o seletor. Verifique-o e tente novamente.", true);
       return; // Interrompe tudo
    }

    for (const button of unprocessedButtons) {
      if (processedButtons.has(button)) continue;
      newButtonsFoundInPass = true;
      processedButtons.add(button);
      totalClicksAttempted++;
      const cardBody = button.closest('.chakra-card__body');
      updateStatus(`🖱️ Clicando #${totalClicksAttempted} (de ${processedButtons.size} processados)...`);

      // Simula hover
      dispatchMouseEvent(cardBody, 'mouseover'); await delay(clickEventDelay);
      dispatchMouseEvent(button, 'mouseover'); await delay(clickEventDelay);

      // Simula clique
      let clickSuccessful = dispatchMouseEvent(button, 'mousedown'); await delay(clickEventDelay);
      clickSuccessful = dispatchMouseEvent(button, 'mouseup') && clickSuccessful; await delay(clickEventDelay);
      clickSuccessful = dispatchMouseEvent(button, 'click') && clickSuccessful;

      if (clickSuccessful) clickedInThisPass++;
      else console.warn(`⚠️ Falha nos eventos do botão #${totalClicksAttempted}.`);

      await delay(mainClickDelay);
    } // Fim for

    // --- Lógica de Scroll ---
    lastScrollHeight = document.documentElement.scrollHeight;
    updateStatus(`📜 Rolando (Total processado: ${processedButtons.size})...`);
    window.scrollTo({ top: lastScrollHeight + window.innerHeight, behavior: 'smooth' }); // Rola uma tela inteira

    updateStatus(`⏳ Esperando ${scrollDelay / 1000}s carregar... (Total processado: ${processedButtons.size})`);
    await delay(scrollDelay);

    // Condição de parada + Confirmação
    let currentScrollHeight = document.documentElement.scrollHeight;
    if (currentScrollHeight <= lastScrollHeight) {
      consecutiveFailedScrolls++; // Incrementa contador de scrolls sem sucesso
      updateStatus(`⚠️ Altura não mudou. Tentativa ${consecutiveFailedScrolls}/2...`);
      await delay(scrollDelay); // Espera extra
      currentScrollHeight = document.documentElement.scrollHeight; // Verifica de novo

      if (currentScrollHeight <= lastScrollHeight) {
          // Após 2 tentativas sem mudança, pergunta ao usuário
          updateStatus(`🤔 Parece ter chegado ao fim (Total processado: ${processedButtons.size}). Deseja parar?`);
          await delay(500); // Delay para o usuário ler a msg antes do confirm

          if (window.confirm(`O script acha que chegou ao fim da página (nenhum conteúdo novo carregado após rolar ${consecutiveFailedScrolls} vezes).\n\nTotal de ${processedButtons.size} botões processados.\n\nDeseja parar e fazer a verificação final? (Clique em 'Cancelar' para tentar rolar/verificar mais uma vez)`)) {
              // Usuário clicou OK (parar)
              updateStatus("🛑 Parando por confirmação do usuário...");
              continueScrolling = false; // Finaliza o loop while
          } else {
              // Usuário clicou Cancelar (tentar mais)
              updateStatus("🔄 OK, tentando rolar/verificar mais uma vez...");
              consecutiveFailedScrolls = 0; // Reseta para dar mais chances
              await delay(1000);
          }
      } else {
          // Carregou na segunda tentativa
          consecutiveFailedScrolls = 0;
          updateStatus("🔄 OK, carregou na segunda tentativa. Continuando...");
      }
    } else {
      // Scroll bem-sucedido, carregou mais
      consecutiveFailedScrolls = 0;
      updateStatus("🔄 Conteúdo novo pode ter carregado, continuando...");
    }
  } // Fim while

  // --- Verificação Final ---
  await finalVerification();

} // Fim selectAllInteractive

// --- Como Usar ---
// 1. Abra o Console (F12)
// 2. Cole TODO este código
// 3. Pressione Enter
selectAllInteractive();
