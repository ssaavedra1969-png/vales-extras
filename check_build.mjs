const r1 = await fetch('https://vales-extras-delta.vercel.app');
const body1 = await r1.text();
const m1 = body1.match(/"buildId":"([^"]+)"/);
console.log('delta buildId:', m1 ? m1[1] : 'not found');

const r2 = await fetch('https://vales-extras.vercel.app');
const body2 = await r2.text();
const m2 = body2.match(/"buildId":"([^"]+)"/);
console.log('main  buildId:', m2 ? m2[1] : 'not found');
console.log('Same?', m1 && m2 && m1[1] === m2[1]);
