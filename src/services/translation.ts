import { Translate } from '@google-cloud/translate/build/src/v2/index.js';
import { config } from '../config/index.js';

export class TranslationService {
  private translator: Translate | null;
  private enabled: boolean;

  constructor() {
    this.enabled = config.translation.enabled;
    
    if (this.enabled && config.google.translateApiKey) {
      this.translator = new Translate({
        key: config.google.translateApiKey,
      });
    } else {
      this.translator = null;
    }
  }

  async translate(text: string, targetLanguage?: string): Promise<string | undefined> {
    if (!this.enabled || !this.translator) {
      return undefined;
    }

    try {
      const target = targetLanguage || config.translation.targetLanguage;
      
      // Detect if text is already in target language
      const [detection] = await this.translator.detect(text);
      if (detection.language === target) {
        return undefined; // No translation needed
      }

      // Translate text
      const [translation] = await this.translator.translate(text, target);
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      return undefined;
    }
  }

  async translateBatch(texts: string[], targetLanguage?: string): Promise<(string | undefined)[]> {
    if (!this.enabled || !this.translator) {
      return texts.map(() => undefined);
    }

    try {
      const target = targetLanguage || config.translation.targetLanguage;
      
      // Translate all texts in batch
      const translations = await Promise.all(
        texts.map(text => this.translate(text, target))
      );

      return translations;
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts.map(() => undefined);
    }
  }

  async detectLanguage(text: string): Promise<string | null> {
    if (!this.translator) {
      return null;
    }

    try {
      const [detection] = await this.translator.detect(text);
      return detection.language;
    } catch (error) {
      console.error('Language detection error:', error);
      return null;
    }
  }

  // Fallback translation using free translation APIs
  async fallbackTranslate(text: string, targetLanguage: string = 'ru'): Promise<string | undefined> {
    // This is a placeholder for future implementation
    // Could integrate with LibreTranslate or other free APIs
    console.warn('Google Translate not configured, translation skipped');
    return undefined;
  }
}