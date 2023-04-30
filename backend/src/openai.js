import { Configuration, OpenAIApi } from "openai";

const WHISPER_API_KEY = '';
const configuration = new Configuration({
  apiKey: WHISPER_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function FeedWhisper(stream) {
  try {
    const resp = await openai.createTranscription(
        stream,
        "whisper-1"
    );
    return resp.data;
  } catch (error) {
    console.error('Error occurred while transcribing audio:', error);
    throw error;
  }
}
