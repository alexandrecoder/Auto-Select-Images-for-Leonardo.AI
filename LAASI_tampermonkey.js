// ==UserScript==
// @name         Leonardo.AI - Auto Select Images
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Seleciona automaticamente todas as imagens não selecionadas no Leonardo.AI com delays inteligentes - Automatically selects all unselected images in the Leonardo.AI with smart delays
// @author       Você
// @match        https://app.leonardo.ai/library/*
// @match        https://app.leonardo.ai/library
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leonardo.ai
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    async function selectAllImages() {
        const selectButtons = document.querySelectorAll(
            'button[aria-label="Select Image"].css-gxscsl'
        );

        if (selectButtons.length === 0) {
            console.log('Nenhum botão "Select Image" não selecionado encontrado.');
            return;
        }

        console.log(`🔍 Encontrados ${selectButtons.length} imagens para selecionar...`);

        for (let i = 0; i < selectButtons.length; i++) {
            const button = selectButtons[i];
            const img = button.closest('.chakra-card__body')?.querySelector('img[src]');

            // Scroll suave até o botão
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Dispara eventos de clique realista
            ['mousedown', 'mouseup', 'click'].forEach(eventType => {
                button.dispatchEvent(
                    new MouseEvent(eventType, { bubbles: true, view: window })
                );
            });

            if (img?.src) {
                console.log(`✅ ${i+1}/${selectButtons.length}: ${img.src.split('/').pop()}`);
            }

            // Delay progressivo: 1.5s para o primeiro, depois entre 400-800ms aleatório
            const delay = i === 0 ? 1500 : Math.floor(Math.random() * 400) + 400;
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        console.log('🎉 Concluído! Todas as imagens foram selecionadas.');
    }

    // Adiciona botão na interface
    function addButton() {
        const toolbar = document.querySelector('.chakra-container') || document.body;

        if (!toolbar) return;

        const btn = document.createElement('button');
        btn.innerHTML = '⭐ Auto Select Images';
        btn.style = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            padding: 10px 15px;
            background: linear-gradient(90deg, #FA5560, #B14BF4, #4D91FF);
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        btn.onclick = selectAllImages;

        toolbar.appendChild(btn);
    }

    // Espera a página carregar e adiciona o botão
    window.addEventListener('load', function() {
        setTimeout(addButton, 3000); // Delay para garantir que a UI esteja pronta
    });
})();
