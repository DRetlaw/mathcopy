(() => {
  if (window.__mathCopyInstalled) return;
  window.__mathCopyInstalled = true;

  const isMath = el => el?.closest?.(
    'math, mjx-container, .MathJax, .katex, .katex-display, [data-math], [aria-label*="math"]'
  );

  function getMathSource(el) {
    if (!el) return null;
    const root = el.closest('mjx-container, .MathJax, .katex, .katex-display, math, [data-math]') || el;

    // MathJax v3 commonly keeps original TeX in an annotation or assistive MathML.
    const annotation = root.querySelector?.('annotation[encoding="application/x-tex"], annotation[encoding="application/x-latex"]');
    if (annotation?.textContent?.trim()) return annotation.textContent.trim();

    // KaTeX stores source TeX in an annotation.
    const katexAnnotation = root.querySelector?.('annotation[encoding="application/x-tex"]');
    if (katexAnnotation?.textContent?.trim()) return katexAnnotation.textContent.trim();

    const dataMath = root.getAttribute?.('data-math') || root.getAttribute?.('data-tex');
    if (dataMath) return dataMath;

    if (root.tagName?.toLowerCase() === 'math') return mathmlToReadable(root);
    return null;
  }

  function mathmlToReadable(math) {
    const tag = n => n?.tagName?.toLowerCase();
    const children = n => Array.from(n.children || []);
    function walk(n) {
      if (n.nodeType === Node.TEXT_NODE) return n.textContent.trim();
      const t = tag(n), c = children(n);
      const v = i => walk(c[i]);
      if (t === 'mi' || t === 'mn' || t === 'mo' || t === 'mtext') return n.textContent.trim();
      if (t === 'msup') return `${v(0)}^(${v(1)})`;
      if (t === 'msub') return `${v(0)}_${v(1)}`;
      if (t === 'msubsup') return `${v(0)}_${v(1)}^(${v(2)})`;
      if (t === 'mfrac') return `(${v(0)}) / (${v(1)})`;
      if (t === 'msqrt') return `√(${c.map(walk).join('')})`;
      if (t === 'mroot') return `${v(1)}√(${v(0)})`;
      if (t === 'mfenced') return `${n.getAttribute('open') || '('}${c.map(walk).join(', ')}${n.getAttribute('close') || ')'}`;
      if (t === 'mrow' || t === 'math' || t === 'mstyle') return c.map(walk).filter(Boolean).join(' ');
      return c.map(walk).filter(Boolean).join(' ');
    }
    return walk(math).replace(/\s+/g, ' ').trim();
  }

  function texToReadable(tex) {
    let s = tex.trim();
    const replacements = [
      [/\\(?:text|mathrm|mathbf|mathit|operatorname)\s*\{([^{}]*)\}/g, '$1'],
      [/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)'],
      [/\\sqrt\s*\{([^{}]*)\}/g, '√($1)'],
      [/\\times\b/g, '×'], [/\\cdot\b/g, '·'], [/\\pm\b/g, '±'],
      [/\\leq?\b/g, '≤'], [/\\geq?\b/g, '≥'], [/\\neq\b/g, '≠'],
      [/\\infty\b/g, '∞'], [/\\sum\b/g, '∑'], [/\\prod\b/g, '∏'],
      [/\\alpha\b/g, 'α'], [/\\beta\b/g, 'β'], [/\\gamma\b/g, 'γ'],
      [/\\theta\b/g, 'θ'], [/\\lambda\b/g, 'λ'], [/\\mu\b/g, 'μ'],
      [/\\sigma\b/g, 'σ'], [/\\pi\b/g, 'π'], [/\\Delta\b/g, 'Δ'],
      [/\\rightarrow\b/g, '→'], [/\\left\b/g, ''], [/\\right\b/g, ''],
      [/\\,/g, ' '], [/\\;/g, ' '], [/\\!/g, ''], [/\\quad\b/g, ' '],
      [/[{}]/g, ''], [/\\(?:displaystyle|mathrm|mathbf)\b/g, '']
    ];
    for (const [pattern, replacement] of replacements) s = s.replace(pattern, replacement);
    s = s.replace(/\^\{([^}]*)\}/g, '^($1)').replace(/_\{([^}]*)\}/g, '_($1)');
    s = s.replace(/\^\s*([A-Za-z0-9])/g, '^$1').replace(/_\s*([A-Za-z0-9])/g, '_$1');
    return s.replace(/\\/g, '').replace(/\s+/g, ' ').trim();
  }

  function findSelectedMath() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const candidates = [selection.anchorNode, selection.focusNode].filter(Boolean);
    for (let node of candidates) {
      if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
      const found = isMath(node);
      if (found) return found;
    }
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    return container?.closest?.('mjx-container, .MathJax, .katex, .katex-display, math, [data-math]') ||
      container?.querySelector?.('mjx-container, .MathJax, .katex, .katex-display, math, [data-math]') || null;
  }

  function getReadableForSelection() {
    const selectedMath = findSelectedMath();
    if (selectedMath) {
      const source = getMathSource(selectedMath);
      if (source) return selectedMath.tagName?.toLowerCase() === 'math'
        ? source : texToReadable(source);
      const alt = selectedMath.getAttribute?.('aria-label') ||
        selectedMath.querySelector?.('[aria-label]')?.getAttribute('aria-label');
      if (alt) return alt;
      const text = selectedMath.innerText || selectedMath.textContent;
      if (text?.trim()) return text.trim();
    }

    // Support selection that includes a math element even if anchor is nearby.
    const sel = window.getSelection();
    if (sel?.rangeCount) {
      const range = sel.getRangeAt(0);
      const container = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
      const math = container?.querySelector?.('mjx-container, .katex, math, [data-tex], [data-math]');
      if (math) {
        const source = getMathSource(math);
        if (source) return math.tagName?.toLowerCase() === 'math' ? source : texToReadable(source);
        return math.getAttribute('aria-label') || math.innerText || math.textContent;
      }
    }
    return null;
  }

  async function writeClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.documentElement.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    }
  }

  document.addEventListener('copy', async event => {
    const readable = getReadableForSelection();
    if (!readable) return; // Preserve normal copying when no math is detected.
    event.preventDefault();
    event.clipboardData?.setData('text/plain', readable);
    if (event.clipboardData) event.clipboardData.setData('text/html', `<span>${readable.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`);
  }, true);


  // Keyboard fallback: some sites stop or replace the native copy event.
  // Run at document capture phase so Cmd/Ctrl+C is handled before site handlers.
  document.addEventListener('keydown', async event => {
    const isCopy = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c';
    if (!isCopy) return;
    const readable = getReadableForSelection();
    if (!readable) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const ok = await writeClipboard(readable);
    if (!ok) {
      // Fallback to the synchronous copy event path where supported.
      const copyEvent = new ClipboardEvent('copy', { bubbles: true, cancelable: true });
      document.dispatchEvent(copyEvent);
    }
  }, true);

  chrome.runtime?.onMessage?.addListener((message) => {
    if (message?.type !== 'MATHCOPY_CONTEXT_COPY') return;
    const readable = getReadableForSelection();
    if (readable) writeClipboard(readable);
  });
})();

//Added a keydown listener to intercept Cmd+C / Ctrl+C before webpage handlers.
//Added a direct clipboard write fallback using writeClipboard().
//Improved selection detection to check both anchor and focus nodes, as well as the selection's common ancestor.