(function() {
    'use strict';

    // Données des lieux avec positions optimisées
    const places = [
        { id: 'users_idle', name: 'Utilisateurs Libres', x: 100, y: 100, tokens: 8 },
        { id: 'user_borrow_capacity', name: 'Limite d\'Emprunt par Utilisateur', x: 100, y: 200, tokens: 24 },
        { id: 'users_requesting', name: 'Demandes d\'Emprunt', x: 100, y: 300, tokens: 0 },
        { id: 'users_waiting', name: 'File d\'Attente', x: 100, y: 400, tokens: 0 },
        { id: 'users_with_books', name: 'Utilisateurs avec Livres', x: 100, y: 500, tokens: 0 },
        { id: 'books_available', name: 'Livres Disponibles', x: 400, y: 150, tokens: 5 },
        { id: 'books_borrowed', name: 'Livres Empruntés', x: 400, y: 300, tokens: 0 },
        { id: 'borrow_station_free', name: 'Borne Emprunt Libre', x: 700, y: 150, tokens: 2 },
        { id: 'return_station_free', name: 'Borne Retour Libre', x: 700, y: 300, tokens: 2 }
    ];

    // Données des transitions avec positions optimisées
    const transitions = [
        { id: 'request_book', name: 'Demander Livre', x: 250, y: 200 },
        { id: 'process_borrow', name: 'Traiter Emprunt', x: 550, y: 150 },
        { id: 'wait_for_book', name: 'Mise en Attente', x: 250, y: 350 },
        { id: 'return_book', name: 'Retourner Livre', x: 550, y: 300 },
        { id: 'serve_waiting', name: 'Servir File d\'Attente', x: 550, y: 400 }
    ];

    // Données des arcs
    const arcs = [
        { transition: 'request_book', type: 'input', place: 'users_idle', weight: 1 },
        { transition: 'request_book', type: 'input', place: 'user_borrow_capacity', weight: 1 },
        { transition: 'request_book', type: 'output', place: 'users_requesting', weight: 1 },
        { transition: 'process_borrow', type: 'input', place: 'users_requesting', weight: 1 },
        { transition: 'process_borrow', type: 'input', place: 'books_available', weight: 1 },
        { transition: 'process_borrow', type: 'input', place: 'borrow_station_free', weight: 1 },
        { transition: 'process_borrow', type: 'output', place: 'users_with_books', weight: 1 },
        { transition: 'process_borrow', type: 'output', place: 'books_borrowed', weight: 1 },
        { transition: 'process_borrow', type: 'output', place: 'borrow_station_free', weight: 1 },
        { transition: 'wait_for_book', type: 'input', place: 'users_requesting', weight: 1 },
        { transition: 'wait_for_book', type: 'output', place: 'users_waiting', weight: 1 },
        { transition: 'return_book', type: 'input', place: 'users_with_books', weight: 1 },
        { transition: 'return_book', type: 'input', place: 'books_borrowed', weight: 1 },
        { transition: 'return_book', type: 'input', place: 'return_station_free', weight: 1 },
        { transition: 'return_book', type: 'output', place: 'books_available', weight: 1 },
        { transition: 'return_book', type: 'output', place: 'return_station_free', weight: 1 },
        { transition: 'return_book', type: 'output', place: 'users_idle', weight: 1 },
        { transition: 'return_book', type: 'output', place: 'user_borrow_capacity', weight: 1 },
        { transition: 'serve_waiting', type: 'input', place: 'users_waiting', weight: 1 },
        { transition: 'serve_waiting', type: 'input', place: 'books_available', weight: 1 },
        { transition: 'serve_waiting', type: 'input', place: 'borrow_station_free', weight: 1 },
        { transition: 'serve_waiting', type: 'output', place: 'users_with_books', weight: 1 },
        { transition: 'serve_waiting', type: 'output', place: 'books_borrowed', weight: 1 },
        { transition: 'serve_waiting', type: 'output', place: 'borrow_station_free', weight: 1 }
    ];

    const canvas = document.getElementById('petriCanvas');
    const ctx = canvas.getContext('2d');
    let highlightedPlace = null;
    let highlightedTransition = null;
    let firingTransition = null;
    let logEntries = [];

    function drawPlace(place) {
        ctx.beginPath();
        ctx.arc(place.x, place.y, 25, 0, 2 * Math.PI);
        ctx.strokeStyle = (place.id === highlightedPlace || (firingTransition && arcs.some(arc => arc.place === place.id && arc.transition === firingTransition))) ? '#3b82f6' : (highlightedTransition && arcs.some(arc => arc.place === place.id && arc.transition === highlightedTransition) ? '#ef4444' : '#3b82f6');
        ctx.fillStyle = '#0f172a';
        ctx.lineWidth = (place.id === highlightedPlace || (firingTransition && arcs.some(arc => arc.place === place.id && arc.transition === firingTransition))) ? 4 : (highlightedTransition && arcs.some(arc => arc.place === place.id && arc.transition === highlightedTransition) ? 4 : 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#e5e7eb';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(place.name, place.x, place.y - 30);
        ctx.fillText(place.tokens.toString(), place.x, place.y + 5);
    }

    function drawTransition(transition) {
        const x = transition.x - 20;
        const y = transition.y - 10;
        ctx.beginPath();
        ctx.rect(x, y, 40, 20);
        ctx.fillStyle = (transition.id === firingTransition) ? '#3b82f6' : 
                       (transition.id === highlightedTransition || (highlightedPlace && arcs.some(arc => arc.transition === transition.id && arc.place === highlightedPlace)) ? '#ef4444' : 
                       (canFire(transition.id) ? '#10b981' : '#374151'));
        ctx.strokeStyle = (transition.id === firingTransition) ? '#3b82f6' : 
                         (transition.id === highlightedTransition || (highlightedPlace && arcs.some(arc => arc.transition === transition.id && arc.place === highlightedPlace)) ? '#ef4444' : 
                         (canFire(transition.id) ? '#10b981' : '#6b7280'));
        ctx.lineWidth = (transition.id === firingTransition || transition.id === highlightedTransition || (highlightedPlace && arcs.some(arc => arc.transition === transition.id && arc.place === highlightedPlace)) || canFire(transition.id)) ? 4 : 2;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#e5e7eb';
        ctx.font = '9px Arial';
        ctx.fillText(transition.name, transition.x, transition.y - 15);
    }

    function drawArc(from, to, type, weight, arcIndex = 0) {
        let startX = from.x, startY = from.y, endX = to.x, endY = to.y;
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const offset = arcIndex * 40;
        const perpX = -dy / distance;
        const perpY = dx / distance;
        const controlX = midX + perpX * (30 + offset);
        const controlY = midY + perpY * (30 + offset);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        ctx.strokeStyle = (firingTransition && (from.id === firingTransition || to.id === firingTransition)) ? '#3b82f6' : ((highlightedPlace && (from.id === highlightedPlace || to.id === highlightedPlace)) || (highlightedTransition && (from.id === highlightedTransition || to.id === highlightedTransition)) ? '#ef4444' : (type === 'input' ? '#ef4444' : '#10b981'));
        ctx.lineWidth = (firingTransition && (from.id === firingTransition || to.id === firingTransition)) || (highlightedPlace && (from.id === highlightedPlace || to.id === highlightedPlace)) || (highlightedTransition && (from.id === highlightedTransition || to.id === highlightedTransition)) ? 4 : 2;
        ctx.setLineDash(type === 'input' ? [5, 5] : []);
        ctx.stroke();
        ctx.setLineDash([]);

        const t = 1.0;
        const tangentX = 2 * (controlX - startX) * (1 - t) + 2 * (endX - controlX) * t;
        const tangentY = 2 * (controlY - startY) * (1 - t) + 2 * (endY - controlY) * t;
        const angle = Math.atan2(tangentY, tangentX);
        const arrowLength = 10;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - arrowLength * Math.cos(angle - Math.PI / 6), endY - arrowLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - arrowLength * Math.cos(angle + Math.PI / 6), endY - arrowLength * Math.sin(angle + Math.PI / 6));
        ctx.strokeStyle = (firingTransition && (from.id === firingTransition || to.id === firingTransition)) ? '#3b82f6' : ((highlightedPlace && (from.id === highlightedPlace || to.id === highlightedPlace)) || (highlightedTransition && (from.id === highlightedTransition || to.id === highlightedTransition)) ? '#ef4444' : (type === 'input' ? '#ef4444' : '#10b981'));
        ctx.stroke();
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const arcCounts = {};
        arcs.forEach(arc => {
            const key = `${arc.place}-${arc.transition}-${arc.type}`;
            arcCounts[key] = (arcCounts[key] || 0) + 1;
            const transition = transitions.find(t => t.id === arc.transition);
            const place = places.find(p => p.id === arc.place);
            if (arc.type === 'input') {
                drawArc(place, transition, arc.type, arc.weight, arcCounts[key] - 1);
            } else {
                drawArc(transition, place, arc.type, arc.weight, arcCounts[key] - 1);
            }
        });
        places.forEach(place => drawPlace(place));
        transitions.forEach(transition => drawTransition(transition));
    }

    function canFire(transitionId) {
        if (transitionId === 'wait_for_book') {
            return places.find(p => p.id === 'users_requesting').tokens > 0 && places.find(p => p.id === 'books_available').tokens === 0;
        }
        return arcs.every(arc => {
            if (arc.transition === transitionId && arc.type === 'input') {
                const place = places.find(p => p.id === arc.place);
                return place.tokens >= arc.weight;
            }
            return true;
        });
    }

    function fireTransition(transitionId) {
        if (!canFire(transitionId)) return false;
        firingTransition = transitionId;
        render(); // Afficher la surbrillance bleue
        arcs.forEach(arc => {
            if (arc.transition === transitionId) {
                const place = places.find(p => p.id === arc.place);
                if (arc.type === 'input') {
                    place.tokens -= arc.weight;
                } else {
                    place.tokens += arc.weight;
                }
            }
        });

        // Ajouter une entrée au journal
        const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
        const transitionName = transitions.find(t => t.id === transitionId).name;
        const state = places.map(p => `${p.name}: ${p.tokens}`).join(', ');
        logEntries.push({ timestamp, transition: transitionName, state });
        if (logEntries.length > 10) {
            logEntries.shift(); // Supprimer la plus ancienne entrée
        }
        window.renderLog(); // Mettre à jour le journal

        setTimeout(() => {
            firingTransition = null;
            render();
            updateButtons();
            updateTokenInputs();
        }, 1000); // Supprimer la surbrillance après 1 seconde
        return true;
    }

    function updateTokens(tokenInputs) {
        const allowedPlaces = ['users_idle', 'user_borrow_capacity', 'books_available'];
        places.forEach(place => {
            if (allowedPlaces.includes(place.id) && tokenInputs[place.id] !== undefined) {
                place.tokens = parseInt(tokenInputs[place.id]);
            }
        });
        render();
        updateButtons();
        updateTokenInputs();
    }

    function updateTokenInputs() {
        const allowedPlaces = ['users_idle', 'user_borrow_capacity', 'books_available'];
        places.forEach(place => {
            if (allowedPlaces.includes(place.id)) {
                const input = document.getElementById(`tokens-${place.id}`);
                if (input) {
                    input.value = place.tokens;
                }
            }
        });
    }

    function updateButtons() {
        transitions.forEach(transition => {
            const button = document.getElementById(`fire-${transition.id}`);
            if (button) {
                button.disabled = !canFire(transition.id);
            }
        });
    }

    let isRunning = false;
    let simulationInterval = null;

    function runSimulation() {
        if (isRunning) return;
        isRunning = true;
        const runButton = document.getElementById('runSimulation');
        runButton.textContent = 'Arrêter Simulation';
        runButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        runButton.classList.add('bg-red-600', 'hover:bg-red-700');
        runButton.onclick = stopSimulation; // Changer l'événement du bouton

        simulationInterval = setInterval(() => {
            const enabledTransitions = transitions.filter(t => canFire(t.id));
            if (enabledTransitions.length === 0) {
                stopSimulation();
                return;
            }
            const randomTransition = enabledTransitions[Math.floor(Math.random() * enabledTransitions.length)];
            fireTransition(randomTransition.id);
        }, 1500); // Intervalle augmenté pour voir la surbrillance
    }

    function stopSimulation() {
        if (!isRunning) return;
        isRunning = false;
        if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
        }
        const runButton = document.getElementById('runSimulation');
        runButton.textContent = 'Lancer Simulation';
        runButton.classList.remove('bg-red-600', 'hover:bg-red-700');
        runButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
        runButton.onclick = runSimulation; // Restaurer l'événement
        updateButtons();
        firingTransition = null;
        render();
    }

    function highlightPlace(placeId) {
        highlightedPlace = placeId;
        highlightedTransition = null;
        render();
    }

    function highlightTransition(transitionId) {
        highlightedTransition = transitionId;
        highlightedPlace = null;
        render();
    }

    // Exposer les fonctions et données globalement
    window.places = places;
    window.transitions = transitions;
    window.logEntries = logEntries;
    window.highlightPlace = highlightPlace;
    window.highlightTransition = highlightTransition;
    window.fireTransition = fireTransition;
    window.runSimulation = runSimulation;
    window.stopSimulation = stopSimulation;
    window.updateTokens = updateTokens;

    document.addEventListener('DOMContentLoaded', () => {
        render();
        updateButtons();
        updateTokenInputs();
    });
})();