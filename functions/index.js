const functions = require("firebase-functions");
const { TextToSpeechClient } = require("@google-cloud/text-to-speech");

const client = new TextToSpeechClient();

exports.synthesizeSpeech = functions.https.onCall(async (data, context) => {
  const text = data.text;
  if (!text) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with one argument 'text'."
    );
  }

  let ssmlText = '';
  const words = text.split(' ');
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    ssmlText += `${word}<mark name="${i}"/> `;
  }
  const ssml = `<speak>${ssmlText.trim()}</speak>`;

  const request = {
    input: { ssml },
    // 목소리를 WaveNet 기반의 여성 음성으로 변경
    voice: { languageCode: "en-US", name: "en-US-Wavenet-F" },
    audioConfig: { audioEncoding: "MP3" },
    enableTimePointing: ["SSML_MARK"],
  };

  try {
    const [response] = await client.synthesizeSpeech(request);

    const timepoints = response.timepoints
      .map(point => ({
        markName: parseInt(point.markName, 10),
        timeSeconds: point.timeSeconds,
      }))
      .sort((a, b) => a.markName - b.markName);

    const result = {
      audioContent: response.audioContent.toString("base64"),
      timepoints: timepoints,
    };

    return result;

  } catch (error) {
    console.error("ERROR:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to synthesize speech.",
      error
    );
  }
});
