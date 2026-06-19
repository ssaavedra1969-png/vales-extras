const urls = [
  'https://vales-extras.vercel.app',
  'https://vales-extras-delta.vercel.app',
];
for (const base of urls) {
  console.log('\n===', base, '===');
  const res = await fetch(base + '/dashboard/cargar');
  const html = await res.text();
  const regex = /src="([^"]+\.js)"/g;
  let match;
  const chunks = [];
  while ((match = regex.exec(html)) !== null) {
    const u = match[1];
    if (!chunks.includes(u)) chunks.push(u);
  }
  for (const chunk of chunks) {
    const fullUrl = chunk.startsWith('http') ? chunk : base + chunk;
    const r = await fetch(fullUrl);
    const content = await r.text();
    if (content.includes('projectId')) {
      const idx = content.indexOf('projectId');
      const start = Math.max(0, idx - 40);
      const end = Math.min(content.length, idx + 60);
      console.log(chunk.split('/').pop(), '->', content.substring(start, end));
    }
  }
}
