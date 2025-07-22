import { ConversationMessage } from './llmService';
import { verhuringenSchema } from './schemas/verhuringen.schema';
import { aanbodSchema } from './schemas/aanbod.schema';
import { ontwikkelingSchema } from './schemas/ontwikkeling.schema';

export class MockLlmService {
  private conversation: ConversationMessage[] = [];
  private extractedFields: Record<string, any> = {};
  private currentView: string = '';
  private lastAskedField: string = '';

  public getConversation(): ConversationMessage[] {
    return this.conversation;
  }

  public clearConversation() {
    this.conversation = [];
    this.extractedFields = {};
    this.currentView = '';
    this.lastAskedField = '';
  }

  public async sendMessage(userMessage: string): Promise<ConversationMessage[]> {
    this.conversation.push({ role: 'user', content: userMessage });
    
    // Extract information from user message
    this.extractFieldsFromMessage(userMessage);
    
    // If this is the first message, determine the view
    if (!this.currentView) {
      this.currentView = this.determineView(userMessage);
    }
    
    // Check required fields for the view
    const missingFields = this.getMissingRequiredFields(this.currentView);
    
    let response: string;
    
    if (missingFields.length > 0) {
      // Ask for missing required fields
      response = this.generateQuestionForMissingFields(this.currentView, missingFields);
    } else {
      // Generate commands when all required fields are present
      response = this.generateCommands(this.currentView);
    }
    
    this.conversation.push({ role: 'assistant', content: response });
    return this.conversation;
  }

  private extractFieldsFromMessage(message: string): void {
    const lowerMessage = message.toLowerCase();
    
    // If we asked for a specific field, try to extract it from the response
    if (this.lastAskedField) {
      this.extractSpecificField(this.lastAskedField, message);
      this.lastAskedField = '';
      return;
    }
    
    // Extract periode
    if (lowerMessage.includes('afgelopen week') || lowerMessage.includes('vorige week')) {
      this.extractedFields.periode = '1w';
    } else if (lowerMessage.includes('afgelopen dag') || lowerMessage.includes('gisteren')) {
      this.extractedFields.periode = '1d';
    } else if (lowerMessage.includes('afgelopen maand')) {
      this.extractedFields.periode = '1m';
    } else if (lowerMessage.includes('24 uur') || lowerMessage.includes('dag')) {
      this.extractedFields.periode = '1d';
    } else if (lowerMessage.includes('4 uur')) {
      this.extractedFields.periode = '4h';
    } else if (lowerMessage.includes('8 uur')) {
      this.extractedFields.periode = '8h';
    } else if (lowerMessage.includes('1 uur') || lowerMessage.includes('een uur')) {
      this.extractedFields.periode = '1h';
    }
    
    // Extract plaats (common Dutch cities)
    const cities = ['amsterdam', 'rotterdam', 'den haag', 'utrecht', 'eindhoven', 'tilburg', 'groningen', 'almere', 'breda', 'nijmegen'];
    for (const city of cities) {
      if (lowerMessage.includes(city)) {
        this.extractedFields.plaats = city;
        break;
      }
    }
    
    // Extract herkomstbestemming
    if (lowerMessage.includes('herkomst')) {
      this.extractedFields.herkomstbestemming = 'herkomst';
    } else if (lowerMessage.includes('bestemming')) {
      this.extractedFields.herkomstbestemming = 'bestemming';
    }
    
    // Extract voertuigtype
    if (lowerMessage.includes('fiets')) {
      this.extractedFields.voertuigtype = 'fiets';
    } else if (lowerMessage.includes('scooter')) {
      this.extractedFields.voertuigtype = 'scooter';
    } else if (lowerMessage.includes('auto')) {
      this.extractedFields.voertuigtype = 'auto';
    }
    
    // Extract eindtijd
    if (lowerMessage.includes('nu') || lowerMessage.includes('momenteel')) {
      this.extractedFields.eindtijd = 'now';
    } else if (lowerMessage.includes('gisteren')) {
      this.extractedFields.eindtijd = 'yesterday';
    } else if (lowerMessage.includes('vandaag')) {
      this.extractedFields.eindtijd = 'today';
    }
    
    // Extract datetime (for aanbod)
    if (lowerMessage.includes('nu') || lowerMessage.includes('momenteel')) {
      this.extractedFields.datetime = 'now';
    } else if (lowerMessage.includes('gisteren')) {
      this.extractedFields.datetime = 'yesterday';
    } else if (lowerMessage.includes('vandaag')) {
      this.extractedFields.datetime = 'today';
    }
  }

  private extractSpecificField(fieldName: string, message: string): void {
    const lowerMessage = message.toLowerCase();
    
    switch (fieldName) {
      case 'eindtijd':
        if (lowerMessage.includes('nu') || lowerMessage.includes('momenteel')) {
          this.extractedFields.eindtijd = 'now';
        } else if (lowerMessage.includes('gisteren')) {
          this.extractedFields.eindtijd = 'yesterday';
        } else if (lowerMessage.includes('vandaag')) {
          this.extractedFields.eindtijd = 'today';
        } else {
          // Try to extract a specific time
          const timeMatch = message.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            this.extractedFields.eindtijd = `${timeMatch[1]}:${timeMatch[2]}`;
          }
        }
        break;
        
      case 'datetime':
        if (lowerMessage.includes('nu') || lowerMessage.includes('momenteel')) {
          this.extractedFields.datetime = 'now';
        } else if (lowerMessage.includes('gisteren')) {
          this.extractedFields.datetime = 'yesterday';
        } else if (lowerMessage.includes('vandaag')) {
          this.extractedFields.datetime = 'today';
        } else {
          // Try to extract a specific time
          const timeMatch = message.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            this.extractedFields.datetime = `${timeMatch[1]}:${timeMatch[2]}`;
          }
        }
        break;
        
      case 'periode':
        if (lowerMessage.includes('1 uur') || lowerMessage.includes('een uur')) {
          this.extractedFields.periode = '1h';
        } else if (lowerMessage.includes('4 uur')) {
          this.extractedFields.periode = '4h';
        } else if (lowerMessage.includes('8 uur')) {
          this.extractedFields.periode = '8h';
        } else if (lowerMessage.includes('1 dag') || lowerMessage.includes('een dag')) {
          this.extractedFields.periode = '1d';
        } else if (lowerMessage.includes('1 week') || lowerMessage.includes('een week')) {
          this.extractedFields.periode = '1w';
        } else if (lowerMessage.includes('1 maand') || lowerMessage.includes('een maand')) {
          this.extractedFields.periode = '1m';
        }
        break;
        
      case 'plaats':
        const cities = ['amsterdam', 'rotterdam', 'den haag', 'utrecht', 'eindhoven', 'tilburg', 'groningen', 'almere', 'breda', 'nijmegen'];
        for (const city of cities) {
          if (lowerMessage.includes(city)) {
            this.extractedFields.plaats = city;
            break;
          }
        }
        // If no city found, use the message as place
        if (!this.extractedFields.plaats) {
          this.extractedFields.plaats = message.trim();
        }
        break;
        
      case 'herkomstbestemming':
        if (lowerMessage.includes('herkomst')) {
          this.extractedFields.herkomstbestemming = 'herkomst';
        } else if (lowerMessage.includes('bestemming')) {
          this.extractedFields.herkomstbestemming = 'bestemming';
        }
        break;
    }
  }

  private determineView(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('verhuringen') || lowerMessage.includes('verhuur')) {
      return 'verhuringen';
    } else if (lowerMessage.includes('aanbod')) {
      return 'aanbod';
    } else if (lowerMessage.includes('ontwikkeling') || lowerMessage.includes('trend')) {
      return 'ontwikkeling';
    } else if (lowerMessage.includes('zones')) {
      return 'zones';
    } else if (lowerMessage.includes('servicegebieden')) {
      return 'servicegebieden';
    }
    
    // Default to verhuringen if unclear
    return 'verhuringen';
  }

  private getMissingRequiredFields(view: string): string[] {
    const schemas = {
      verhuringen: verhuringenSchema,
      aanbod: aanbodSchema,
      ontwikkeling: ontwikkelingSchema
    };
    
    const schema = schemas[view as keyof typeof schemas];
    if (!schema) return [];
    
    const requiredFields = schema.filters
      .filter(filter => filter.required)
      .map(filter => filter.key);
    
    return requiredFields.filter(field => !this.extractedFields[field]);
  }

  private generateQuestionForMissingFields(view: string, missingFields: string[]): string {
    const fieldQuestions: Record<string, string> = {
      eindtijd: 'Voor welke eindtijd wil je de data bekijken? (bijv. "nu", "gisteren 15:00")',
      periode: 'Voor welke periode wil je de data bekijken? (bijv. "1 uur", "1 dag", "1 week")',
      plaats: 'Voor welke plaats wil je de data bekijken?',
      herkomstbestemming: 'Wil je de herkomst of bestemming van de verhuringen bekijken?',
      datetime: 'Voor welke datum/tijd wil je de data bekijken?'
    };
    
    const firstMissingField = missingFields[0];
    this.lastAskedField = firstMissingField;
    const question = fieldQuestions[firstMissingField] || `Wat is de waarde voor ${firstMissingField}?`;
    
    return `Ik heb nog wat informatie nodig om je vraag te beantwoorden.\n\n${question}`;
  }

  private generateCommands(view: string): string {
    let commands = `SHOWVIEW ${view}\n`;
    
    // Add filter commands based on extracted fields
    Object.entries(this.extractedFields).forEach(([key, value]) => {
      commands += `SETFILTER ${key} ${value}\n`;
    });
    
    return `Perfect! Ik heb alle benodigde informatie. Hier zijn de commando's:\n\n${commands}`;
  }
} 