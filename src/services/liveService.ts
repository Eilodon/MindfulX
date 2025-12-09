import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

export class LiveSessionManager {
  private client: any; // Connected session
  private audioContext: AudioContext;
  private inputContext: AudioContext | null = null;
  private inputProcessor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private onAudioData: (buffer: AudioBuffer) => void;
  private nextStartTime = 0;
  private audioQueue: AudioBufferSourceNode[] = [];

  constructor(onAudioData: (buffer: AudioBuffer) => void) {
    this.onAudioData = onAudioData;
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  async connect(apiKey: string) {
    if (!apiKey) throw new Error("API Key required");
    const ai = new GoogleGenAI({ apiKey });
    
    // Clean up previous stream/session if any
    if (this.stream) this.disconnect();

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => console.log("Zen Connection Opened"),
        onmessage: async (msg: LiveServerMessage) => {
          const data = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (data) {
            const audioBuffer = await this.pcmToAudioBuffer(data, this.audioContext);
            this.playAudio(audioBuffer);
          }
        },
        onclose: () => console.log("Zen Connection Closed"),
        onerror: (err) => console.error("Zen Connection Error", err)
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        systemInstruction: "You are a gentle Zen master. Speak calmly, slowly, and briefly. Help the user find peace.",
      },
    });

    this.client = await sessionPromise;
    await this.setupAudioInput(sessionPromise);
  }

  private async setupAudioInput(sessionPromise: Promise<any>) {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true
    }});
    
    this.inputContext = new AudioContext({ sampleRate: 16000 });
    const source = this.inputContext.createMediaStreamSource(this.stream);
    
    // Send PCM data in chunks
    this.inputProcessor = this.inputContext.createScriptProcessor(4096, 1, 1);
    this.inputProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM for Gemini
        const pcmData = this.floatTo16BitPCM(inputData);
        const base64 = this.arrayBufferToBase64(pcmData);

        sessionPromise.then(session => {
            session.sendRealtimeInput({
                media: {
                    mimeType: "audio/pcm;rate=16000",
                    data: base64
                }
            });
        });
    };

    source.connect(this.inputProcessor);
    this.inputProcessor.connect(this.inputContext.destination);
  }

  private playAudio(buffer: AudioBuffer) {
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    
    const currentTime = this.audioContext.currentTime;
    // Schedule next chunk
    if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime;
    }
    
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    this.audioQueue.push(source);
    
    // Call external hook for visualizer
    this.onAudioData(buffer);
  }

  disconnect() {
    this.inputProcessor?.disconnect();
    this.stream?.getTracks().forEach(t => t.stop());
    
    if (this.inputContext) {
        this.inputContext.close();
        this.inputContext = null;
    }

    if (this.client && typeof this.client.close === 'function') {
        this.client.close();
    }
  }

  // UTILS
  private floatTo16BitPCM(input: Float32Array) {
      const output = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]));
          output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      return output.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer) {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
  }

  private async pcmToAudioBuffer(base64: string, ctx: AudioContext) {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
          float32[i] = int16[i] / 32768.0;
      }

      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);
      return buffer;
  }
}