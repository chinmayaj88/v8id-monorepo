declare module 'cookie-parser' {
  import type { RequestHandler } from 'express';

  interface CookieParseOptions {
    decode?(val: string): string;
  }

  interface CookieSerializeOptions {
    path?: string;
    expires?: Date;
    maxAge?: number;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
  }

  interface CookieParserOptions {
    decode?(val: string): string;
  }

  function cookieParser(
    secret?: string | string[],
    options?: CookieParserOptions
  ): RequestHandler;

  export default cookieParser;
}

