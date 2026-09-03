function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInline(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
}

function renderMarkdown(value) {
  const lines = String(value || '').replace(/\r\n?/g, '\n').split('\n');
  const output = [];
  let paragraph = [];
  let listType = '';
  let listItems = [];
  let codeLines = [];
  let inCode = false;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push('<p>' + paragraph.map(renderInline).join('<br/>') + '</p>');
    paragraph = [];
  };
  const flushList = () => {
    if (!listItems.length) return;
    output.push('<' + listType + '>' + listItems.map(item => '<li>' + renderInline(item) + '</li>').join('') + '</' + listType + '>');
    listType = '';
    listItems = [];
  };
  const flushCode = () => {
    output.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
    codeLines = [];
  };

  lines.forEach(line => {
    if (/^\s*```/.test(line)) {
      if (inCode) flushCode();
      else {
        flushParagraph();
        flushList();
      }
      inCode = !inCode;
      return;
    }
    if (inCode) {
      codeLines.push(line);
      return;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const unordered = line.match(/^\s*[-+*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const quote = line.match(/^>\s?(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      output.push('<h' + level + '>' + renderInline(heading[2]) + '</h' + level + '>');
    } else if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? 'ul' : 'ol';
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      listItems.push((unordered || ordered)[1]);
    } else if (quote) {
      flushParagraph();
      flushList();
      output.push('<blockquote>' + renderInline(quote[1]) + '</blockquote>');
    } else if (!line.trim()) {
      flushParagraph();
      flushList();
    } else {
      if (listItems.length) flushList();
      paragraph.push(line);
    }
  });
  if (inCode) flushCode();
  flushParagraph();
  flushList();
  return output.join('');
}

module.exports = {
  escapeHtml,
  renderMarkdown
};
