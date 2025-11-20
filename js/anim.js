// anim.js — anima cada letra de elementos con clase `letrasAnima`
// Letras "caen" desde la zona de `.div1` con colores aleatorios
// Configuración ajustable: puedes modificar estos valores
const CONFIG = {
    // Duración fija de animación principal: 3000ms (3s)
    minDuration: 3000,
    maxDuration: 3000,
    // Duración de la transición de color (ms)
    minColorDur: 1000,
    maxColorDur: 1400,
    // retrasos y stagger
    maxInitialDelay: 350,
    perCharStagger: 20,
    // (breakpoint removed — animation always runs per-character)
};

function randomColor() {
    // HSL con saturación/ligereza agradables
    const h = Math.floor(Math.random() * 360);
    const s = 60 + Math.floor(Math.random() * 20);
    const l = 45 + Math.floor(Math.random() * 15);
    return `hsl(${h} ${s}% ${l}%)`;
}

function wrapTextNodes(el) {
    // Wrap text into per-word containers where each word contains per-character spans.
    // This preserves word integrity (no line breaks inside words) while allowing
    // individual letter animation.
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach(node => {
        if (!node.nodeValue) return;
        const text = node.nodeValue;
        if (!text) return;
        const frag = document.createDocumentFragment();

        // split into words and whitespace tokens, keep whitespace as text nodes
        const parts = text.split(/(\s+)/);
        parts.forEach(token => {
            if (!token) return;
            if (/^\s+$/.test(token)) {
                frag.appendChild(document.createTextNode(token));
            } else {
                const wordWrap = document.createElement('span');
                wordWrap.className = 'word-wrap';
                // create char spans inside the word container
                for (const ch of token.split('')) {
                    const span = document.createElement('span');
                    span.className = 'char';
                    span.textContent = ch;
                    wordWrap.appendChild(span);
                }
                frag.appendChild(wordWrap);
            }
        });

        node.parentNode.replaceChild(frag, node);
    });
}

function unwrapSpans(el) {
    // Replace existing .char or .word-wrap spans back into plain text nodes
    const spans = el.querySelectorAll('.char, .word-wrap');
    if (!spans.length) return;
    const frag = document.createDocumentFragment();
    // We'll iterate through child nodes and rebuild text
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    while (walk.nextNode()) nodes.push(walk.currentNode);
    // Simple approach: serialize current textContent and replace the element's contents with a text node
    const text = el.textContent;
    el.textContent = text; // replaces children with a single text node
}

// (word/baseline detection removed — animation always per-character)

function animateLettersFromDiv1() {
    const originEl = document.querySelector('.div1');
    if (!originEl) return;
    const originRect = originEl.getBoundingClientRect();
    const targets = document.querySelectorAll('.letrasAnima');
    targets.forEach((container) => {
        // ensure container is in plain-text form before wrapping (support repeated runs)
        unwrapSpans(container);
        // force per-letter wrapping/animation for every container
        container.dataset.wrapMode = 'char';
        wrapTextNodes(container);

        const selector = '.char';
        const chars = Array.from(container.querySelectorAll(selector));

        chars.forEach((ch, i) => {
            const computed = window.getComputedStyle(ch);
            const finalRect = ch.getBoundingClientRect();
            // Skip invisible/zero-width nodes
            if (finalRect.width === 0 && finalRect.height === 0) return;

            const finalColor = computed.color;

            // pick a random start point inside div1
            const startX = originRect.left + Math.random() * originRect.width;
            const startY = originRect.top + Math.random() * originRect.height;

            const dx = startX - finalRect.left;
            const dy = startY - finalRect.top;

            // create a placeholder so layout doesn't jump
            const placeholder = document.createElement('span');
            placeholder.className = 'char-placeholder';
            // copy font/box styles so the placeholder occupies the same space precisely
            placeholder.style.display = 'inline-block';
            placeholder.style.width = finalRect.width + 'px';
            placeholder.style.height = finalRect.height + 'px';
            placeholder.style.verticalAlign = computed.verticalAlign || 'middle';
            // copy key font properties to keep spacing identical (prevents reflow differences)
            ['fontFamily','fontSize','fontWeight','fontStyle','letterSpacing','lineHeight','textTransform','fontVariant','fontStretch'].forEach(p => {
                try { if (computed[p]) placeholder.style[p] = computed[p]; } catch(e){}
            });
            // ensure whitespace behaviour matches
            placeholder.style.whiteSpace = 'pre';

            // capture computed font styles so the floating letter matches
            const fontProps = [
                'fontFamily','fontSize','fontWeight','fontStyle','letterSpacing','lineHeight','textTransform'
            ];
            const floatingStyles = {};
            fontProps.forEach(p => floatingStyles[p] = computed[p]);

            // replace the in-flow char with placeholder
            ch.parentNode.replaceChild(placeholder, ch);

            // add char to body so we can position it freely
            document.body.appendChild(ch);

            // apply initial floating styles
            ch.style.position = 'fixed';
            ch.style.left = finalRect.left + 'px';
            ch.style.top = finalRect.top + 'px';
            ch.style.margin = '0';
            ch.style.padding = '0';
            // initial random offset/rotation/scale for visual variety
            const extraY = -20 + Math.random() * -60;
            const extraRot = Math.random() * 60 - 30;
            const extraScale = 0.85 + Math.random() * 0.4;
            ch.style.transform = `translate(${dx}px, ${dy + extraY}px) rotate(${extraRot}deg) scale(${extraScale})`;
            ch.style.color = randomColor();
            ch.style.zIndex = '9999';
            ch.style.pointerEvents = 'none';
            ch.style.whiteSpace = 'pre';
            ch.style.opacity = '0.95';

            // copy font-related properties to keep appearance
            ch.style.fontFamily = floatingStyles.fontFamily;
            ch.style.fontSize = floatingStyles.fontSize;
            ch.style.fontWeight = floatingStyles.fontWeight;
            ch.style.fontStyle = floatingStyles.fontStyle;
            ch.style.letterSpacing = floatingStyles.letterSpacing;
            ch.style.lineHeight = floatingStyles.lineHeight;
            ch.style.textTransform = floatingStyles.textTransform;

            // allow per-container overrides via data- attributes (data-min-duration, data-max-duration, data-min-color-dur, data-max-color-dur, data-max-initial-delay, data-per-char-stagger)
            const getNum = (v, fallback) => (v !== undefined ? Number(v) : fallback);
            const minD = getNum(container.dataset.minDuration, CONFIG.minDuration);
            const maxD = getNum(container.dataset.maxDuration, CONFIG.maxDuration);
            const minCD = getNum(container.dataset.minColorDur, CONFIG.minColorDur);
            const maxCD = getNum(container.dataset.maxColorDur, CONFIG.maxColorDur);
            const maxDelay = getNum(container.dataset.maxInitialDelay, CONFIG.maxInitialDelay);
            const perChar = getNum(container.dataset.perCharStagger, CONFIG.perCharStagger);

            const randRange = (a, b) => a + Math.random() * (b - a);
            // if min===max this becomes a fixed duration (we set both to 3000ms)
            const duration = Math.round(randRange(minD, maxD));
            const colorDur = Math.round(randRange(minCD, maxCD));
            ch.style.transition = `transform ${duration}ms cubic-bezier(.2,.7,.2,1), color ${colorDur}ms linear, opacity ${Math.round(duration/2)}ms ease`;

            // slight stagger
            const delay = Math.random() * maxDelay + i * perChar;
            setTimeout(() => {
                // move to final position and color
                ch.style.transform = 'translate(0,0) rotate(0deg) scale(1)';
                ch.style.color = finalColor;
                ch.style.opacity = '1';
            }, 30 + delay);

            // when animation finishes, restore element into the DOM in place of placeholder
            const cleanup = (e) => {
                if (e.propertyName !== 'transform') return;
                ch.style.position = '';
                ch.style.left = '';
                ch.style.top = '';
                ch.style.transform = '';
                ch.style.transition = '';
                ch.style.zIndex = '';
                ch.style.pointerEvents = '';
                ch.style.whiteSpace = '';
                ch.style.fontFamily = '';
                ch.style.fontSize = '';
                ch.style.fontWeight = '';
                ch.style.fontStyle = '';
                ch.style.letterSpacing = '';
                ch.style.lineHeight = '';
                ch.style.textTransform = '';
                ch.style.color = finalColor;
                // put back into the original place
                if (placeholder.parentNode) placeholder.parentNode.replaceChild(ch, placeholder);
                ch.removeEventListener('transitionend', cleanup);
            };

            ch.addEventListener('transitionend', cleanup);
        });
    });
}

window.addEventListener('load', () => {
    // give a tiny moment for fonts/layout
    setTimeout(animateLettersFromDiv1, 80);
});

// resize-based word-mode switching removed — animation always runs per-character
