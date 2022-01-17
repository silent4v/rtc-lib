declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: number;
      API_KEY: string;
      AES_SECRET_KEY: string;
      AES_SECRET_IV: string;
    }
  }
}

export {}
