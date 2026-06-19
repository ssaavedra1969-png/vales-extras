const base = 'https://vales-extras-delta.vercel.app';
const res = await fetch(base + '/dashboard/cargar');
const html = await res.text();
const regex = /src="([^"]+\.js)"/g;
let match;
const urls = [];
while ((match = regex.exec(html)) !== null) {
  const u = match[1];
  if (!urls.includes(u)) urls.push(u);
}
for (const u of urls) {
  const fullUrl = u.startsWith('http') ? u : base + u;
  const r = await fetch(fullUrl);
  const content = await r.text();
  if (content.includes('double-arbor')) {
    console.log('FOUND double-arbor in:', u.split('/').pop());
    const idx = content.indexOf('double-arbor');
    console.log('  Context:', content.substring(Math.max(0,idx-80), idx+80));
  }
  if (content.includes('AIzaSyCgZbvB2dVT8gEAX3Mk79h0DSELQRmmvkE')) {
    console.log('FOUND API key in:', u.split('/').pop());
  }
  if (content.includes('TU_API_KEY')) {
    console.log('FOUND placeholder API key in:', u.split('/').pop());
  }
}
console.log('Search complete');
