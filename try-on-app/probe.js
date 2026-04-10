import { client } from "@gradio/client";

async function run() {
  try {
    const app = await client("yisol/IDM-VTON");
    const api = await app.view_api();
    console.log(JSON.stringify(api, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
