#!/usr/bin/env node

import { GoogleGenerativeAI } from '@google/generative-ai';
import readline from 'readline';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// .env 파일 로드
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: chalk.blue('🤖 Gemini CLI > ')
});

class GeminiCLI {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = null;
    this.model = null;
    this.chat = null; // 대화 세션을 관리할 속성 추가
    this.conversationHistory = [];
    this.spinner = null;
    this.currentMode = 'chat';
    this.userProfile = this.loadUserProfile();
  }

  loadUserProfile() {
    try {
      const profilePath = path.join(process.cwd(), '.gemini-profile.json');
      const data = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
      return data;
    } catch {
      return {
        name: 'User',
        learningLevel: 'intermediate',
        interests: ['technology', 'science'],
        language: 'korean'
      };
    }
  }

  async saveUserProfile() {
    try {
      const profilePath = path.join(process.cwd(), '.gemini-profile.json');
      await fs.writeFile(profilePath, JSON.stringify(this.userProfile, null, 2));
    } catch (error) {
      console.log(chalk.yellow('⚠️ 프로필 저장 실패:', error.message));
    }
  }

  async initialize() {
    if (!this.apiKey) {
      console.log(chalk.red('❌ GEMINI_API_KEY 환경변수가 설정되지 않았습니다.'));
      console.log(chalk.yellow('📝 .env 파일을 생성하고 API 키를 설정하세요:'));
      console.log(chalk.cyan('GEMINI_API_KEY=your_api_key_here'));
      console.log(chalk.yellow('또는 Google AI Studio에서 API 키를 발급받으세요: https://makersuite.google.com/app/apikey'));
      process.exit(1);
    }

    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      this.startNewChat(); // 새 대화 세션 시작
      console.log(chalk.green('✅ Gemini AI에 연결되었습니다!'));
      console.log(chalk.cyan('💡 도움말: /help, 종료: /quit, 대화 초기화: /clear'));
      console.log(chalk.gray('─'.repeat(50)));
    } catch (error) {
      console.log(chalk.red('❌ Gemini AI 초기화 실패:', error.message));
      process.exit(1);
    }
  }

  startNewChat() {
    const systemInstruction = this.buildContextualPrompt(''); // 초기 시스템 지침 생성
    this.chat = this.model.startChat({
      history: this.conversationHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        // (필요 시 설정)
      },
      systemInstruction: systemInstruction,
    });
    console.log(chalk.yellow(`✨ 새로운 대화 세션을 시작합니다. (모드: ${this.currentMode})`));
  }

  async generateResponse(prompt) {
    try {
      if (!this.chat) {
        this.startNewChat();
      }
      const result = await this.chat.sendMessage(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      throw new Error(`AI 응답 생성 실패: ${error.message}`);
    }
  }

  buildContextualPrompt(userPrompt) {
    const userContext = `User Profile: ${this.userProfile.name} (${this.userProfile.learningLevel} level, speaks ${this.userProfile.language}, interested in ${this.userProfile.interests.join(', ')})`;
    
    switch (this.currentMode) {
      case 'english-tutor':
        return `You are an English tutor helping a ${this.userProfile.learningLevel} level student. ${userContext}
        
        Guidelines:
        - Provide clear explanations and examples
        - Correct grammar and vocabulary mistakes gently
        - Suggest improvements and alternatives
        - Use appropriate complexity for the student's level
        - Encourage practice and learning
        
        Student's question/text: ${userPrompt}`;
        
      case 'code-review':
        return `You are an expert code reviewer. ${userContext}
        
        Guidelines:
        - Analyze code quality, performance, and best practices
        - Identify bugs and security issues
        - Suggest improvements and optimizations
        - Explain complex concepts clearly
        - Provide refactored code examples when helpful
        
        Code to review: ${userPrompt}`;
        
      case 'article-generator':
        return `You are a skilled article writer. ${userContext}
        
        Guidelines:
        - Create engaging, well-structured articles
        - Use clear, accessible language
        - Include relevant examples and insights
        - Maintain professional tone
        - Structure with proper headings and sections
        
        Article topic/request: ${userPrompt}`;
        
      default: // chat mode
        return `You are a helpful AI assistant. ${userContext}
        
        Be conversational, helpful, and adapt your responses to the user's preferences and level.
        
        User's message: ${userPrompt}`;
    }
  }

  async chat() {
    rl.prompt();
    rl.on('line', async (input) => {
      try {
        if (!input.trim()) {
          rl.prompt();
          return;
        }
        if (input.startsWith('/')) {
          await this.handleCommand(input);
          rl.prompt();
          return;
        }
        this.conversationHistory.push({ role: 'user', content: input });
        this.spinner = ora('AI가 응답을 생성하고 있습니다...').start();
        const response = await this.generateResponse(input);
        this.spinner.stop();
        console.log(chalk.green('\n🤖 Gemini:'));
        console.log(chalk.white(response));
        console.log(chalk.gray('─'.repeat(50)));
        this.conversationHistory.push({ role: 'assistant', content: response });
      } catch (error) {
        if (this.spinner) this.spinner.stop();
        console.log(chalk.red('❌ 오류:', error.message));
        console.log(chalk.gray('─'.repeat(50)));
      }
      rl.prompt();
    });
  }

  async handleCommand(command) {
    const cmd = command.toLowerCase().trim();

    switch (cmd) {
      case '/help':
        this.showHelp();
        break;
        
      case '/mode':
        this.showModes();
        break;
        
      case '/tutor':
        this.currentMode = 'english-tutor';
        this.startNewChat();
        console.log(chalk.green('📚 영어 튜터 모드로 변경되었습니다.'));
        console.log(chalk.cyan('영어 학습에 도움이 되는 대화를 시작하세요!'));
        break;
        
      case '/review':
        this.currentMode = 'code-review';
        this.startNewChat();
        console.log(chalk.green('🔍 코드 리뷰 모드로 변경되었습니다.'));
        console.log(chalk.cyan('코드를 붙여넣으면 리뷰해드릴게요!'));
        break;
        
      case '/article':
        this.currentMode = 'article-generator';
        this.startNewChat();
        console.log(chalk.green('📝 기사 생성 모드로 변경되었습니다.'));
        console.log(chalk.cyan('주제를 알려주시면 영어 기사를 만들어드릴게요!'));
        break;
        
      case '/chat':
        this.currentMode = 'chat';
        this.startNewChat();
        console.log(chalk.green('💬 일반 채팅 모드로 변경되었습니다.'));
        break;
        
      case '/profile':
        this.showProfile();
        break;
        
      case '/setup':
        await this.setupProfile();
        break;
        
      case '/save':
        await this.saveConversation();
        break;
        
      case '/load':
        await this.loadConversation();
        break;

      case '/clear':
        this.conversationHistory = [];
        this.startNewChat(); // 대화 세션도 새로 시작
        console.log(chalk.green('✅ 대화 기록이 초기화되었습니다.'));
        console.log(chalk.gray('─'.repeat(50)));
        break;

      case '/history':
        if (this.conversationHistory.length === 0) {
          console.log(chalk.yellow('📝 대화 기록이 없습니다.'));
        } else {
          console.log(chalk.yellow('\n📝 대화 기록:'));
          this.conversationHistory.forEach((msg, index) => {
            const role = msg.role === 'user' ? '👤 사용자' : '🤖 Gemini';
            const color = msg.role === 'user' ? chalk.blue : chalk.green;
            console.log(color(`${role} (${index + 1}):`));
            console.log(chalk.white(msg.content));
            console.log(chalk.gray('─'.repeat(30)));
          });
        }
        break;

      case '/quit':
        console.log(chalk.yellow('👋 Gemini CLI를 종료합니다.'));
        rl.close();
        process.exit(0);
        break;

      default:
        console.log(chalk.red('❌ 알 수 없는 명령어입니다. /help를 입력하여 사용 가능한 명령어를 확인하세요.'));
        break;
    }
  }

  showHelp() {
    console.log(chalk.cyan('\n📚 Gemini CLI - Available Commands'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.green('/help') + '          Show this help message');
    console.log(chalk.green('/mode') + '          Show available AI modes');
    console.log(chalk.green('/chat') + '          Switch to general chat mode');
    console.log(chalk.green('/tutor') + '         Switch to English tutor mode');
    console.log(chalk.green('/review') + '        Switch to code review mode');
    console.log(chalk.green('/article') + '       Switch to article generator mode');
    console.log(chalk.green('/profile') + '       Show user profile');
    console.log(chalk.green('/setup') + '         Setup user profile');
    console.log(chalk.green('/save') + '          Save conversation to file');
    console.log(chalk.green('/load') + '          Load conversation from file');
    console.log(chalk.green('/clear') + '         Clear conversation history');
    console.log(chalk.green('/history') + '       Show conversation history');
    console.log(chalk.green('/quit') + '          Exit the CLI');
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.cyan('💡 Current mode: ') + chalk.yellow(this.currentMode));
    console.log(chalk.gray('─'.repeat(50)));
  }

  showModes() {
    console.log(chalk.cyan('\n🤖 Available AI Modes'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.green('💬 chat') + '             General conversation and Q&A');
    console.log(chalk.green('📚 english-tutor') + '    English learning and practice');
    console.log(chalk.green('🔍 code-review') + '       Code analysis and suggestions');
    console.log(chalk.green('📝 article-generator') + ' Generate articles on topics');
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.cyan('💡 Current mode: ') + chalk.yellow(this.currentMode));
    console.log(chalk.cyan('🔄 Use /chat, /tutor, /review, or /article to switch modes'));
    console.log(chalk.gray('─'.repeat(50)));
  }

  showProfile() {
    console.log(chalk.cyan('\n👤 User Profile'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white('Name: ') + chalk.green(this.userProfile.name));
    console.log(chalk.white('Learning Level: ') + chalk.green(this.userProfile.learningLevel));
    console.log(chalk.white('Language: ') + chalk.green(this.userProfile.language));
    console.log(chalk.white('Interests: ') + chalk.green(this.userProfile.interests.join(', ')));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.cyan('💡 Use /setup to modify your profile'));
  }

  async setupProfile() {
    console.log(chalk.cyan('\n⚙️ Profile Setup'));
    console.log(chalk.gray('─'.repeat(50)));
    
    try {
      // Name setup
      const name = await this.askQuestion('Enter your name: ');
      if (name.trim()) this.userProfile.name = name.trim();
      
      // Learning level setup
      console.log(chalk.yellow('\nSelect your English learning level:'));
      console.log('1. Beginner');
      console.log('2. Intermediate');
      console.log('3. Advanced');
      const levelChoice = await this.askQuestion('Choose (1-3): ');
      const levels = ['beginner', 'intermediate', 'advanced'];
      if (levelChoice >= '1' && levelChoice <= '3') {
        this.userProfile.learningLevel = levels[parseInt(levelChoice) - 1];
      }
      
      // Language setup
      console.log(chalk.yellow('\nSelect your preferred language:'));
      console.log('1. Korean (한국어)');
      console.log('2. English');
      console.log('3. Japanese (日本語)');
      const langChoice = await this.askQuestion('Choose (1-3): ');
      const languages = ['korean', 'english', 'japanese'];
      if (langChoice >= '1' && langChoice <= '3') {
        this.userProfile.language = languages[parseInt(langChoice) - 1];
      }
      
      // Interests setup
      const interests = await this.askQuestion('Enter your interests (comma-separated): ');
      if (interests.trim()) {
        this.userProfile.interests = interests.split(',').map(i => i.trim()).filter(i => i);
      }
      
      await this.saveUserProfile();
      console.log(chalk.green('\n✅ Profile updated successfully!'));
      console.log(chalk.gray('─'.repeat(50)));
      
    } catch (error) {
      console.log(chalk.red('❌ Profile setup failed:', error.message));
    }
  }

  async askQuestion(question) {
    return new Promise((resolve) => {
      const tempRl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      tempRl.question(chalk.cyan(question), (answer) => {
        tempRl.close();
        resolve(answer);
      });
    });
  }

  async saveConversation() {
    try {
      if (this.conversationHistory.length === 0) {
        console.log(chalk.yellow('📝 No conversation to save.'));
        return;
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `gemini-conversation-${timestamp}.json`;
      const conversationData = {
        timestamp: new Date().toISOString(),
        mode: this.currentMode,
        userProfile: this.userProfile,
        history: this.conversationHistory
      };
      
      await fs.writeFile(filename, JSON.stringify(conversationData, null, 2));
      console.log(chalk.green(`💾 Conversation saved to: ${filename}`));
      
    } catch (error) {
      console.log(chalk.red('❌ Failed to save conversation:', error.message));
    }
  }

  async loadConversation() {
    try {
      const filename = await this.askQuestion('Enter conversation filename: ');
      if (!filename.trim()) {
        console.log(chalk.yellow('📝 No filename provided.'));
        return;
      }
      
      const data = await fs.readFile(filename.trim(), 'utf8');
      const conversationData = JSON.parse(data);
      
      this.conversationHistory = conversationData.history || [];
      this.currentMode = conversationData.mode || 'chat';
      
      if (conversationData.userProfile) {
        this.userProfile = { ...this.userProfile, ...conversationData.userProfile };
      }
      
      console.log(chalk.green(`📂 Conversation loaded from: ${filename.trim()}`));
      console.log(chalk.cyan(`🔄 Mode set to: ${this.currentMode}`));
      console.log(chalk.cyan(`💬 Loaded ${this.conversationHistory.length} messages`));
      
    } catch (error) {
      console.log(chalk.red('❌ Failed to load conversation:', error.message));
    }
  }
}

// 메인 실행 함수
async function main() {
  console.log(chalk.cyan('🚀 Gemini CLI 시작 중...'));
  
  const cli = new GeminiCLI();
  await cli.initialize();
  await cli.chat();
}

// 프로그램 시작
main().catch((error) => {
  console.log(chalk.red('❌ 프로그램 실행 중 오류 발생:', error.message));
  process.exit(1);
}); 