async function selectAllUnselectedImages() {
  const unselectedButtons = document.querySelectorAll(
    'button[aria-label="Select Image"].css-gxscsl'
  );
  
  const selectedImages = [];
  
  for (let i = 0; i < unselectedButtons.length; i++) {
    const button = unselectedButtons[i];
    const cardBody = button.closest('.chakra-card__body');
    
    if (cardBody) {
      const img = cardBody.querySelector('img[src]');
      
      // Dispara todos os eventos de um clique real
      ['mousedown', 'mouseup', 'click'].forEach(eventType => {
        button.dispatchEvent(
          new MouseEvent(eventType, {
            bubbles: true,
            cancelable: true,
            view: window
          })
        );
      });
      
      if (img && img.src) {
        selectedImages.push(img.src);
        console.log(`✅ Imagem ${i+1}/${unselectedButtons.length} selecionada`);
      }
      
      // Delay progressivo (1s para o primeiro, depois 300ms)
      await new Promise(resolve => 
        setTimeout(resolve, i === 0 ? 1000 : 300)
      );
    }
  }
  
  console.log(`🎉 Concluído! ${selectedImages.length} imagens selecionadas:`, selectedImages);
  return selectedImages;
}

// Execute diretamente no console
selectAllUnselectedImages();
