/**
 * Audio Transcription Tool for Gemini MCP Server.
 * Transcribes audio files to text using Gemini's multimodal capabilities.
 *
 * @author Cline
 */

const BaseTool = require('./base-tool');
const { log } = require('../utils/logger');
const { readFileAsBuffer, validateFileSize, getMimeType } = require('../utils/file-utils');
const { validateNonEmptyString, validateString } = require('../utils/validation');
const config = require('../config');

class AudioTranscriptionTool extends BaseTool {
  constructor(intelligenceSystem, geminiService) {
    super(
      'gemini-transcribe-audio',
      'Transcribe audio files to text using Gemini\'s multimodal capabilities (with learned user preferences)',
      {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Path to the audio file to transcribe (supports MP3, WAV, FLAC, AAC, OGG, WEBM)',
          },
          language: {
            type: 'string',
            description: 'Optional language hint for better transcription accuracy (e.g., "en", "es", "fr")',
          },
          context: {
            type: 'string',
            description: 'Optional context for intelligent enhancement (e.g., "medical", "legal", "technical")',
          },
          preserve_spelled_acronyms: {
            type: 'boolean',
            description: 'Keep spelled-out letters (U-R-L) instead of converting to acronyms (URL)',
          },
        },
        required: ['file_path'],
      },
      intelligenceSystem,
      geminiService,
    );
  }

  /**
   * Executes the audio transcription tool.
   * @param {Object} args - The arguments for the tool.
   * @param {string} args.file_path - Path to the audio file to transcribe.
   * @param {string} [args.language] - Optional language hint.
   * @param {string} [args.context] - Optional context about the audio content.
   * @returns {Promise<Object>} A promise that resolves to the tool's result.
   */
  async execute(args) {
    const filePath = validateNonEmptyString(args.file_path, 'file_path');
    const language = args.language ? validateString(args.language, 'language') : '';
    const context = args.context ? validateString(args.context, 'context') : null;
    const preserveSpelledAcronyms = args.preserve_spelled_acronyms || false;

    log(`Transcribing audio file: "${filePath}" with context: ${context || 'general'}`, this.name);

    try {
      validateFileSize(filePath, config.MAX_AUDIO_SIZE_MB);
      const audioBuffer = readFileAsBuffer(filePath);
      const audioBase64 = audioBuffer.toString('base64');
      const mimeType = getMimeType(filePath, config.SUPPORTED_AUDIO_MIMES);

      log(`Audio file loaded: ${(audioBuffer.length / 1024).toFixed(2)}KB, MIME type: ${mimeType}`, this.name);

      let basePrompt = 'Please transcribe this audio file accurately. Provide the complete text of what is spoken.';
      if (language) {
        basePrompt += ` The audio is in ${language}.`;
      }

      let enhancedPrompt = basePrompt;
      if (this.intelligenceSystem.initialized && context !== 'verbatim') {
        try {
          enhancedPrompt = await this.intelligenceSystem.enhancePrompt(basePrompt, context, this.name);
          log('Applied Tool Intelligence enhancement', this.name);
        } catch (err) {
          log(`Tool Intelligence enhancement failed: ${err.message}`, this.name);
        }
      } else if (context === 'verbatim') {
        // For verbatim mode, apply special enhancement directly
        enhancedPrompt = 'TRANSCRIBE VERBATIM: Provide ONLY an exact word-for-word transcription of the spoken content. Do NOT analyze, interpret, or explain the content. ';
        
        enhancedPrompt += 'Include all utterances, pauses, filler words (um, uh, etc.), repetitions, and incomplete sentences. Preserve emotional expressions in brackets like [laughs] or [sighs]. ';
        
        if (preserveSpelledAcronyms) {
          enhancedPrompt += 'Keep spelled-out letters exactly as spoken with hyphens (like U-R-L, H-T-T-P-S, not URL or HTTPS). ';
        } else {
          enhancedPrompt += 'Keep spelled-out letters as hyphenated (like U-R-L not URL). ';
        }
        
        enhancedPrompt += 'Maintain original punctuation including ellipses (...) and dashes. Do not add any artifacts or sounds at the end of the transcription. ';
        enhancedPrompt += 'CRITICAL: Do NOT provide analysis, interpretation, summary, or explanation. ONLY provide the exact spoken words. ';
        enhancedPrompt += 'This is a verbatim transcription task - transcribe exactly what is spoken, nothing more.';
        
        log('Applied verbatim transcription enhancement', this.name);
      }

      let transcriptionPrompt = enhancedPrompt;
      if (context) {
        transcriptionPrompt += ` Context: ${context}`;
      }

      let transcriptionText = await this.geminiService.transcribeAudio('AUDIO_TRANSCRIPTION', audioBase64, mimeType, transcriptionPrompt);

      // Post-process transcription for verbatim mode
      if (context === 'verbatim' && transcriptionText) {
        transcriptionText = this.cleanVerbatimTranscription(transcriptionText, preserveSpelledAcronyms);
      }

      if (transcriptionText) {
        log('Audio transcription completed successfully', this.name);

        if (this.intelligenceSystem.initialized) {
          try {
            await this.intelligenceSystem.learnFromInteraction(basePrompt, enhancedPrompt, `Transcription completed successfully: ${transcriptionText.length} characters`, context, this.name);
            log('Tool Intelligence learned from interaction', this.name);
          } catch (err) {
            log(`Tool Intelligence learning failed: ${err.message}`, this.name);
          }
        }

        let finalResponse = `✓ Audio file transcribed successfully:\n\n**File:** ${filePath}\n**Size:** ${(audioBuffer.length / 1024).toFixed(2)}KB\n**Format:** ${filePath.split('.').pop().toUpperCase()}\n\n**Transcription:**\n${transcriptionText}`; // eslint-disable-line max-len
        if (context && this.intelligenceSystem.initialized) {
          finalResponse += `\n\n---\n_Enhancement applied based on context: ${context}_`;
        }

        return {
          content: [
            {
              type: 'text',
              text: finalResponse,
            },
          ],
        };
      }
      log('No transcription text generated', this.name);
      return {
        content: [
          {
            type: 'text',
            text: `Could not transcribe audio file: "${filePath}". The audio may be unclear, too quiet, or in an unsupported language.`,
          },
        ],
      };
    } catch (error) {
      log(`Error transcribing audio: ${error.message}`, this.name);
      throw new Error(`Error transcribing audio: ${error.message}`);
    }
  }

  /**
   * Cleans verbatim transcription to handle common edge cases.
   * @param {string} text - The raw transcription text.
   * @returns {string} The cleaned transcription.
   */
  cleanVerbatimTranscription(text, preserveSpelledAcronyms = false) {
    // Remove common end-of-file artifacts (pppp, Ppppppppppp)
    text = text.replace(/\s*[Pp]+\s*$/, '');
    
    // Fix spacing before punctuation
    text = text.replace(/\s+([.!?,;:])/g, '$1');
    
    // Fix common emotional expressions that may have lost brackets
    const emotions = [
      'laughs?', 'laugh', 'laughing', 'laughed',
      'sighs?', 'sigh', 'sighing', 'sighed',
      'clears? throat', 'clearing throat', 'cleared throat',
      'coughs?', 'cough', 'coughing', 'coughed',
      'sniffles?', 'sniffle', 'sniffling', 'sniffled',
      'pauses?', 'pause', 'pausing', 'paused',
      'giggles?', 'giggle', 'giggling', 'giggled',
      'whispers?', 'whisper', 'whispering', 'whispered',
      'yells?', 'yell', 'yelling', 'yelled',
      'groans?', 'groan', 'groaning', 'groaned',
      'gasps?', 'gasp', 'gasping', 'gasped',
      'chuckles?', 'chuckle', 'chuckling', 'chuckled',
      'smiles?', 'smile', 'smiling', 'smiled',
      'cries?', 'cry', 'crying', 'cried',
      'frustrated sigh', 'heavy sigh', 'deep sigh', 'long sigh',
      'nervous laugh', 'awkward laugh', 'bitter laugh',
      'scoffs?', 'scoff', 'scoffing', 'scoffed',
      'mumbles?', 'mumble', 'mumbling', 'mumbled',
      'mutters?', 'mutter', 'muttering', 'muttered',
      'stammers?', 'stammer', 'stammering', 'stammered',
      'stutters?', 'stutter', 'stuttering', 'stuttered',
      'shouts?', 'shout', 'shouting', 'shouted',
      'screams?', 'scream', 'screaming', 'screamed',
      'exhales?', 'exhale', 'exhaling', 'exhaled',
      'inhales?', 'inhale', 'inhaling', 'inhaled',
      'breathes? deeply', 'breathing deeply', 'breathed deeply',
      'nods?', 'nod', 'nodding', 'nodded',
      'shakes? head', 'shaking head', 'shook head',
      'silence', 'long pause', 'brief pause', 'awkward silence'
    ];
    const emotionRegex = new RegExp(`\\b(${emotions.join('|')})\\b`, 'gi');
    text = text.replace(emotionRegex, '[$1]');
    
    // Ensure ellipses are preserved properly
    text = text.replace(/\s+\.\s+\.\s+\./g, '...');
    
    // Clean up any double spaces
    text = text.replace(/\s{2,}/g, ' ');
    
    return text.trim();
  }
}

module.exports = AudioTranscriptionTool;
