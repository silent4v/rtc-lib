declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: number;
      WS_PORT: number;
      API_KEY: string;
      AES_SECRET_KEY: string;
      AES_SECRET_IV: string;
      BAN_WORDS: string;
    }
  }
}

export {}
