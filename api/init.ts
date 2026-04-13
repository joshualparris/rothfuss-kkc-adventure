import { handleInit } from './game';

export default async function handler(request: any, response: any) {
  try {
    const payload = await handleInit();
    response.status(200).json(payload);
  } catch (error) {
    response.status(500).json({ error: String(error) });
  }
}
