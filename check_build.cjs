async function main() {
  const r1 = await fetch('https://vales-extras-delta.vercel.app');
  const body1 = await r1.text();
  const idx1 = body1.indexOf('self.__next_f');
  console.log('delta:', body1.substring(idx1, idx1+100));

  const r2 = await fetch('https://vales-extras.vercel.app');
  const body2 = await r2.text();
  const idx2 = body2.indexOf('self.__next_f');
  console.log('main:', body2.substring(idx2, idx2+100));
}
main().catch(e => console.error(e.message));
