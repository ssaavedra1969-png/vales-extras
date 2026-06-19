const apiKey = 'AIzaSyCgZbvB2dVT8gEAX3Mk79h0DSELQRmmvkE';
const projectId = 'double-arbor-448717-j9';
const url = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/contadores/vale_counter?key=' + apiKey;
try {
  const res = await fetch(url);
  const body = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', body.substring(0, 500));
} catch (e) {
  console.error(e.message);
}
