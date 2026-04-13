import { handleCommand } from './game';

export default async function handler(request: any, response: any) {
  try {
    const body = request.body && typeof request.body === 'object' ? request.body : {};
    const command = typeof body.command === 'string' ? body.command.trim() : '';

    if (!command) {
      response.status(400).json({ error: 'Missing command.' });
      return;
    }

    const payload = await handleCommand(command);
    response.status(200).json(payload);
  } catch (error) {
    response.status(500).json({ error: String(error) });
  }
}
