// js/security.js
// Protección del lado del cliente para disuadir la inspección rápida de código

(function () {
    'use strict';

    // 1. Desactivar menú contextual (Clic derecho)
    document.addEventListener('contextmenu', (event) => event.preventDefault());

    // 2. Desactivar teclas de acceso rápido para herramientas de desarrollo
    document.addEventListener('keydown', (event) => {
        const key = event.key.toUpperCase();

        // Bloquear F12
        if (key === 'F12') {
            event.preventDefault();
        }

        // Bloquear Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C
        if (event.ctrlKey && event.shiftKey && ['I', 'J', 'C'].includes(key)) {
            event.preventDefault();
        }

        // Bloquear Ctrl+U (Ver código fuente) y Ctrl+S (Guardar página)
        if (event.ctrlKey && ['U', 'S'].includes(key)) {
            event.preventDefault();
        }
    });

    // 3. Desactivar arrastre involuntario de imágenes
    document.addEventListener('dragstart', (event) => {
        if (event.target.tagName === 'IMG') {
            event.preventDefault();
        }
    });
})();