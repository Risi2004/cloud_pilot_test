import axios from 'axios';
import { BaseLlm } from '@google/adk';

export class ModelProvider extends BaseLlm {
  constructor(config = {}) {
    const modelName = config.model || process.env.AI_MODEL || 'qwen3:8b';
    super(modelName);
    this.providerName = config.provider || process.env.AI_PROVIDER || 'ollama';
    this.modelName = modelName;
    this.temperature = config.temperature ?? 0.2;
  }

  /**
   * Universal completion interface
   */
  async generate(prompt, systemInstruction = '', options = {}) {
    switch (this.providerName.toLowerCase()) {
      case 'ollama':
        return this.queryOllama(prompt, systemInstruction, options);
      case 'gemini':
        return this.queryGemini(prompt, systemInstruction, options);
      case 'claude':
        return this.queryClaude(prompt, systemInstruction, options);
      default:
        throw new Error(`Unsupported model provider: ${this.providerName}`);
    }
  }

  /**
   * Universal completion interface expected by ADK agent runners
   */
  async *generateContentAsync(llmRequest, stream = false) {
    // 1. Compile conversational history into a single structured prompt for text LLMs
    let promptParts = [];
    if (llmRequest.contents && llmRequest.contents.length > 0) {
      for (const turn of llmRequest.contents) {
        const role = turn.role === 'model' ? 'Assistant' : 'User';
        const partsText = turn.parts.map(p => {
          if (p.text) {
            return p.text;
          }
          if (p.functionCall) {
            return `[Tool Call: ${p.functionCall.name} with args ${JSON.stringify(p.functionCall.args)}]`;
          }
          if (p.functionResponse) {
            return `[Tool Response from ${p.functionResponse.name}: ${JSON.stringify(p.functionResponse.response)}]`;
          }
          return '';
        }).filter(Boolean).join('\n');
        
        if (partsText) {
          promptParts.push(`${role}: ${partsText}`);
        }
      }
    }
    const prompt = promptParts.join('\n\n');

    // 2. Extract system instructions
    let systemInstruction = llmRequest.config?.systemInstruction || '';

    // If there are tools, format them and append to system instructions for non-Gemini models
    const isGemini = this.providerName.toLowerCase() === 'gemini';
    if (llmRequest.config?.tools && llmRequest.config.tools.length > 0 && !isGemini) {
      const toolsInstructions = llmRequest.config.tools.map(toolGroup => {
        return toolGroup.functionDeclarations.map(fd => {
          return `Tool Name: ${fd.name}
Description: ${fd.description}
Parameters Schema: ${JSON.stringify(fd.parameters)}`;
        }).join('\n\n');
      }).join('\n\n');

      systemInstruction += `\n\nYou have access to the following tools:\n\n${toolsInstructions}\n\n` +
        `If you decide to call a tool, you MUST return a JSON object matching this schema and nothing else:\n` +
        `{\n` +
        `  "functionCall": {\n` +
        `    "name": "Name of the tool to call",\n` +
        `    "args": { ... arguments for the tool ... }\n` +
        `  }\n` +
        `}\n` +
        `Do not write any conversational text before or after the JSON. Just return the JSON object.`;
    }

    // 3. Extract JSON format flag if responseSchema is present
    const jsonFormat = !!llmRequest.config?.responseSchema;

    console.log(`[ModelProvider] [DEBUG] Sending request to ${this.providerName} (${this.modelName})...`);
    console.log(`[ModelProvider] [DEBUG] Prompt:\n${prompt}`);
    console.log(`[ModelProvider] [DEBUG] System Instruction Length: ${systemInstruction.length}`);
    if (jsonFormat) console.log(`[ModelProvider] [DEBUG] JSON Mode Enabled`);

    const start = Date.now();
    // 4. Generate the response text
    const responseText = await this.generate(prompt, systemInstruction, { jsonFormat });
    console.log(`[ModelProvider] [DEBUG] Response received in ${Date.now() - start}ms.`);
    console.log(`[ModelProvider] [DEBUG] Response Text: "${responseText}"`);

    // 5. Parse response for a tool call if we are simulating tool calling
    let functionCall = null;
    if (!isGemini && responseText.includes('functionCall')) {
      try {
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const parsed = JSON.parse(responseText.substring(jsonStart, jsonEnd + 1));
          if (parsed.functionCall && parsed.functionCall.name) {
            functionCall = parsed.functionCall;
            console.log(`[ModelProvider] [DEBUG] Detected functionCall tool invocation: ${functionCall.name}`);
          }
        }
      } catch (e) {
        console.log(`[ModelProvider] [DEBUG] Failed to parse functionCall JSON:`, e.message);
      }
    }

    // 6. Yield response in ADK LlmResponse format
    if (functionCall) {
      yield {
        content: {
          role: 'model',
          parts: [{ functionCall }]
        },
        finishReason: 'STOP'
      };
    } else {
      yield {
        content: {
          role: 'model',
          parts: [{ text: responseText }]
        },
        finishReason: 'STOP'
      };
    }
  }

  async queryOllama(prompt, systemInstruction, options) {
    const url = process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434';
    const requestData = {
      model: this.modelName,
      prompt: systemInstruction ? `${systemInstruction}\n\nUser: ${prompt}` : prompt,
      stream: false,
      options: {
        temperature: this.temperature,
        num_predict: options.maxTokens || 1200
      }
    };
    if (options.jsonFormat || options.format === 'json') {
      requestData.format = 'json';
    }
    const response = await axios.post(`${url}/api/generate`, requestData);
    return response.data.response.trim();
  }

  async queryGemini(prompt, systemInstruction, options) {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${apiKey}`;
    const requestData = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: this.temperature,
        maxOutputTokens: options.maxTokens || 1200
      }
    };
    if (systemInstruction) {
      requestData.systemInstruction = { parts: [{ text: systemInstruction }] };
    }
    if (options.jsonFormat || options.format === 'json') {
      requestData.generationConfig.responseMimeType = 'application/json';
    }
    const response = await axios.post(url, requestData);
    return response.data.candidates[0].content.parts[0].text.trim();
  }

  async queryClaude(prompt, systemInstruction, options) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: this.modelName,
      max_tokens: options.maxTokens || 1200,
      temperature: this.temperature,
      system: systemInstruction,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });
    return response.data.content[0].text.trim();
  }
}
