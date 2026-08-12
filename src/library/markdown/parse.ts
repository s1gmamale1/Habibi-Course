import { Lexer, type Token, type Tokens } from "marked";

export type { Token, Tokens };

/**
 * Lex markdown to tokens. GFM is on for tables — the vault has 1,504 table rows across
 * 84 of the 100 sectioned notes, including 60 escaped pipes in Muallimi-Soniy.md that
 * marked's own table tokenizer already handles correctly.
 *
 * We take TOKENS rather than HTML on purpose: the renderer emits React elements, so
 * dangerouslySetInnerHTML never appears and `html` tokens are shown as text rather
 * than parsed (see render.tsx).
 */
export function lexNote(markdown: string): Token[] {
  return new Lexer({ gfm: true, breaks: false }).lex(markdown);
}
