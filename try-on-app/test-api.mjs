const AI_KEY = "AIzaSyCHXnwkny7puUDoL-HCrvGXzfK36SZs5gk";

async function list() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${AI_KEY}`);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
list();
