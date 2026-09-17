export type ThinkingMode = "fast" | "balanced" | "deep";
export type SearchMode = "off" | "auto" | "on";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  ts: number;
  photo?: string;
};

export type UserRecord = {
  id: string;
  telegramId?: number;
  name: string;
  username?: string;
  facts: string[];
  summary: string;
  notes: string;
  messages: ChatMessage[];
  subscribed: boolean;
  subscribedUntil: number | null;
  starsSpent: number;
  blocked: boolean;
  imagesToday: number;
  imagesDay: string;
  messagesToday: number;
  messagesDay: string;
  lastSeen: number;
  createdAt: number;
};

export type PhotoMeta = {
  id: string;
  file: string;
  caption: string;
  createdAt: number;
};

export type BotConfig = {
  characterName: string;
  characterAge: number;
  characterCity: string;
  characterStatus: string;
  characterRole: string;
  telegramName: string;
  telegramBio: string;
  lookPrompt: string;
  personality: string;
  dialect: string;
  emojiStyle: string;
  instructions: string;
  constraints: string;
  filters: string;
  globalMemory: string;
  autoMemory: boolean;
  maxFacts: number;
  thinking: ThinkingMode;
  searchMode: SearchMode;
  welcome: string;
  subscriptionPrice: number;
  freeImagesPerDay: number;
  freeMessagesPerDay: number;
  botEnabled: boolean;
  profilePhoto: string;
  photos: PhotoMeta[];
  autoSendPhotos: boolean;
  allowUserGenerate: boolean;
  imageStyle: string;
  updatedAt: number;
  replyLength: "short" | "medium" | "long";
  emojiLevel: "none" | "light" | "heavy";
  humor: "off" | "light" | "high";
  warmth: "cool" | "warm" | "very";
  formality: "casual" | "mixed" | "formal";
  curiosity: "low" | "medium" | "high";
  energy: "calm" | "normal" | "lively";
  sarcasm: "off" | "light" | "on";
  photoMode: "off" | "album" | "generate" | "both";
  language: "ar" | "ar-en";
  useName: boolean;
  askQuestions: boolean;
  signOff: boolean;
  signOffText: string;
  hideAi: boolean;
  allowFlirt: boolean;
  allowPolitics: boolean;
  allowReligion: boolean;
  allowInsults: boolean;
  maintenance: boolean;
  maintenanceMessage: string;
  fallbackReply: string;
  quickReplies: string;
  ownerAlias: string;
  maxReplyChars: number;
};

export type Stats = {
  messagesTotal: number;
  usersTotal: number;
  imagesTotal: number;
  starsTotal: number;
  byDay: { date: string; messages: number; images: number }[];
};

export type BotStatus = {
  running: boolean;
  username: string;
  firstName: string;
  lastError: string | null;
  lastHeartbeat: number;
  offset: number;
};

export type ChatResult = {
  text: string;
  photoFile?: string;
  photoCaption?: string;
  generatedPath?: string;
  needSubscribe?: boolean;
  blocked?: boolean;
};
