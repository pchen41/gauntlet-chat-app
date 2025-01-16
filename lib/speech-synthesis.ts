export class SpeechSynthesisManager {
  private synthesis: typeof window.speechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis;
      this.initializeVoice();
    }
  }

  private initializeVoice() {
    if (!this.synthesis) return;

    // Wait for voices to be loaded
    if (this.synthesis.getVoices().length === 0) {
      this.synthesis.addEventListener('voiceschanged', () => {
        this.selectVoice();
      });
    } else {
      this.selectVoice();
    }
  }

  private selectVoice() {
    if (!this.synthesis) return;

    const voices = this.synthesis.getVoices();
    // Prefer an English female voice
    this.voice = voices.find(voice => 
      voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female')
    ) || voices.find(voice => 
      voice.lang.startsWith('en')
    ) || voices[0];
  }

  private removeEmojis(text: string): string {
    return text.replace(
      /[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, 
      ''
    ).trim();
  }

  speak(text: string) {
    if (!this.synthesis || !this.voice) return;

    // Cancel any ongoing speech
    this.synthesis.cancel();

    // Remove emojis and clean up any double spaces that might result
    const cleanText = this.removeEmojis(text).replace(/\s+/g, ' ').trim();
    if (!cleanText) return; // Don't speak if the text is empty after cleaning

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice = this.voice;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    this.synthesis.speak(utterance);
  }

  stop() {
    if (!this.synthesis) return;
    this.synthesis.cancel();
  }
}

export function createSpeechSynthesis() {
  return new SpeechSynthesisManager();
} 