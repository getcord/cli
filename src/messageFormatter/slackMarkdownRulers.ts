import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import type StateInline from 'markdown-it/lib/rules_inline/state_inline';

// Inspired by https://github.com/mayashavin/markdown-it-slack
// && https://github.com/markdown-it/markdown-it/blob/master/lib/rules_inline/emphasis.js

/**
 * This function is what markdown-it calls a "ruler". Because the default syntax for
 * emphasis in Markdown is different from Slack (the syntax that we use) we have to
 * rewrite these rules. This function looks at `*`s as marks for bold and `_` as marks
 * for italics.
 */
export function slackMarkdownRulers(md: MarkdownIt) {
  /* cspell:disable-next-line */
  // This "tokenizes" the input. Ie. it will identify marks that signify emphasized text
  // and add them as "delimiters" - an object with specific data of the emphasized text
  // and it's markers
  md.inline.ruler.at('emphasis', function emphasis(state, silent) {
    return tokenize(state, silent);
  });

  // This processes the delimiters, turning them into tokens with data on what the emphasis
  // is, ie. bold or underline.
  md.inline.ruler2.at('emphasis', function emphasis(state) {
    postProcessor(state);
    return true;
  });
}

function tokenize(state: StateInline, silent: boolean) {
  let token;
  const marker = state.src.charCodeAt(state.pos);
  if (silent) {
    return false;
  }
  if (marker !== 0x5f /* _ */ && marker !== 0x2a /* * */) {
    return false;
  }

  const scanned = state.scanDelims(state.pos, marker === 0x2a);

  for (let i = 0; i < scanned.length; i++) {
    token = state.push('text', '', 0);
    token.content = String.fromCharCode(marker);

    state.delimiters.push({
      // Char code of the starting marker (number).
      marker: marker,

      // Total length of these series of delimiters.
      length: scanned.length,

      // A position of the token this delimiter corresponds to.
      token: state.tokens.length - 1,
      // If this delimiter is matched as a valid opener, `end` will be
      // equal to its position, otherwise it's `-1`. This value is recalculated
      // after tokenize, but before post process in markdown-it tokenize
      end: -1,
      open: scanned.can_open,
      close: scanned.can_close,
      jump: i,
    });
  }
  state.pos += scanned.length;
  return true;
}

function postProcessor(state: StateInline) {
  updateTokens(state, state.delimiters);

  // For some nested inline tokens (ie. emphasis within links) the delimiters will
  // be added to the `tokens_meta`. This makes sure we iterate through those too.
  for (let curr = 0; curr < state.tokens_meta.length; curr++) {
    const currentTokensMeta = state.tokens_meta[curr]?.delimiters;
    if (currentTokensMeta) {
      updateTokens(state, currentTokensMeta);
    }
  }
}

function updateTokens(
  state: StateInline,
  delimiters: StateInline['delimiters'],
) {
  for (let i = delimiters.length - 1; i >= 0; i--) {
    const startDelim = delimiters[i];
    if (
      (startDelim.marker !== 0x5f /* _ */ &&
        startDelim.marker !== 0x2a) /* * */ ||
      startDelim.end === -1
    ) {
      continue;
    }

    const endDelim = delimiters[startDelim.end];
    const isStrong = startDelim.marker === 0x2a;
    const ch = String.fromCharCode(startDelim.marker);

    setEmphasisToken(state.tokens[startDelim.token], true, isStrong, ch);
    setEmphasisToken(state.tokens[endDelim.token], false, isStrong, ch);
  }
}

const setEmphasisToken = (
  originalToken: Token,
  isOpen: boolean,
  isBold: boolean,
  markup: string,
): Token => {
  return Object.assign(originalToken, {
    type: isBold
      ? `strong_${isOpen ? 'open' : 'close'}`
      : `em_${isOpen ? 'open' : 'close'}`,
    tag: isBold ? 'strong' : 'em',
    nesting: isOpen ? 1 : -1,
    markup: markup,
    content: '',
  });
};
