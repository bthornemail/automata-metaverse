// Type declarations for wordnet-db
declare module 'wordnet-db' {
  export function lookup(word: string, pos?: string): WordNetEntry[] | null;
  
  export interface WordNetEntry {
    lemma: string;
    pos: string;
    gloss: string;
    synonyms: string[];
    antonyms: string[];
    hypernyms: string[];
    hyponyms: string[];
    holonyms: string[];
    meronyms: string[];
  }
}