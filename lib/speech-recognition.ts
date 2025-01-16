// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: {
    item(index: number): {
      isFinal: boolean;
      item(index: number): {
        transcript: string;
      };
    };
    length: number;
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export class SpeechRecognitionManager {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private currentTranscript = '';
  private finalizedResults: string[] = [];
  private lastProcessedIndex = 0;

  constructor(
    private onTranscript: (transcript: string, isFinal: boolean) => void,
    private onListeningChange: (isListening: boolean) => void
  ) {
    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      // If we detect new speech after a final result, clear previous results
      if (this.lastProcessedIndex < event.results.length && event.results.item(this.lastProcessedIndex).item(0).transcript.trim()) {
        this.finalizedResults = [];
      }

      let finalTranscript = '';
      let interimTranscript = '';

      // Process only the new results
      for (let i = this.lastProcessedIndex; i < event.results.length; i++) {
        const result = event.results.item(i).item(0);
        if (event.results.item(i).isFinal) {
          finalTranscript = result.transcript;
          this.finalizedResults.push(finalTranscript);
          this.lastProcessedIndex = event.results.length;
        } else {
          interimTranscript = result.transcript;
        }
      }

      // Combine all finalized results with current interim result
      const fullTranscript = [...this.finalizedResults, interimTranscript]
        .filter(Boolean)
        .join(' ')
        .trim();

      this.onTranscript(fullTranscript, !interimTranscript);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onListeningChange(false);
      // Clear all transcripts when stopping
      this.currentTranscript = '';
      this.finalizedResults = [];
      this.lastProcessedIndex = 0;
    };
  }

  startListening() {
    if (!this.recognition || this.isListening) return;
    
    this.currentTranscript = '';
    this.finalizedResults = [];
    this.lastProcessedIndex = 0;
    this.recognition.start();
    this.isListening = true;
    this.onListeningChange(true);
  }

  stopListening() {
    if (!this.recognition || !this.isListening) return;
    
    this.recognition.stop();
    this.isListening = false;
    this.onListeningChange(false);
  }

  cleanup() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }
}

export function createSpeechRecognition(
  onTranscript: (transcript: string, isFinal: boolean) => void,
  onListeningChange: (isListening: boolean) => void
) {
  return new SpeechRecognitionManager(onTranscript, onListeningChange);
} 