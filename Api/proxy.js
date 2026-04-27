// api/proxy.js
// Ce fichier ne sera pas utilisé directement, mais sa présence est importante.
// La configuration se fera via vercel.json
export default async function handler(req, res) {
  // Définir les en-têtes CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Répondre immédiatement aux requêtes "pre-flight" (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Ici, vous pourriez ajouter la logique pour contacter sheet.best,
  // mais nous allons utiliser 'vercel.json' pour le faire plus simplement.
  // Nous laissons donc cette fonction vide pour le moment.
  res.status(200).json({ message: 'Proxy function is ready.' });
}
