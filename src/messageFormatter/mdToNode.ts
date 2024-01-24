import type Token from 'markdown-it/lib/token';
import MarkdownIt from 'markdown-it';
import * as markdownUtils from 'markdown-it/lib/common/utils';
import type {
  MessageNode,
  MessageBulletNode,
  MessageContent,
  MessageLinkNode,
  MessageNumberBulletNode,
  MessageQuoteNode,
  MessageTextNode,
  MessageLinkDeprecatedNode,
} from '@cord-sdk/types';
import { MessageNodeType } from '@cord-sdk/types';
import { slackMarkdownRulers } from 'src/messageFormatter/slackMarkdownRulers';

const md = MarkdownIt('zero').enable([
  'code',
  'fence',
  'list',
  'emphasis',
  'backticks',
  'blockquote',
  'link',
  'newline',
  'text',
]);

md.use(slackMarkdownRulers);
md.options.breaks = true;

// Use markdown-it to parse the markdown into "tokens"
export function markdownToNode(message: string): MessageContent {
  const tokens = md.parse(message, {});
  return markdownBlockTokens(tokens);
}

// Text node can't live on it's own so it wont be a top level node, and this
// saves a lot of type checking for children just to make typescript happy.
// We also don't take into account `MessageLinkDeprecatedNode`s anymore.
type AnyButTextNode = Exclude<
  MessageNode,
  MessageTextNode | MessageLinkDeprecatedNode
>;

// Parse `block` tokens into our message content. These are tokens that will
// determine the node of the entire line. Ie. paragraph, list, quote or code
// block. Currently we do not accept nested lists, therefore (with the exception
// of paragraph in certain cases) you cannot have a block token within another
// block token.
function markdownBlockTokens(tokens: Token[]): MessageContent {
  const result: MessageContent = [];
  let openTokens: AnyButTextNode[] = [];
  let openBulletListToken: MessageBulletNode | undefined = undefined;
  let openQuoteToken: MessageQuoteNode | undefined = undefined;
  let openNumberedBulletListToken: MessageNumberBulletNode | undefined =
    undefined;
  let listTokenType: 'bullet' | 'numbered_bullet' | undefined = undefined;

  for (const token of tokens) {
    switch (token.type) {
      case 'paragraph_open':
        if (openTokens[0]) {
          // Other than bullets or quotes, there should never be any open tokens
          // when opening a paragraph.
          throw new Error(
            'Opened paragraph with non-bullet/non-quote token open',
          );
        }
        openTokens = [
          {
            type: MessageNodeType.PARAGRAPH,
            children: [],
          },
        ];
        break;
      case 'inline':
        if (!openTokens) {
          throw new Error('Inline tokens with no open block token');
        }
        if (!token.children) {
          throw new Error('Inline token with no children');
        }
        openTokens = markdownInlineTokens(token.children, openTokens);
        break;
      case 'paragraph_close':
        if (!openTokens[0]) {
          throw new Error('Closed paragraph without open paragraph');
        }
        if (openBulletListToken) {
          openBulletListToken.children.push(...openTokens);
        } else if (
          openQuoteToken &&
          !openBulletListToken &&
          !openNumberedBulletListToken
        ) {
          openQuoteToken.children.push(...openTokens[0].children);
        } else if (openNumberedBulletListToken) {
          openNumberedBulletListToken.children.push(...openTokens);
        } else {
          result.push(...openTokens);
        }
        openTokens = [];
        break;
      case 'fence':
      case 'code_block':
        result.push({
          type: MessageNodeType.CODE,
          children: [{ text: token.content }],
        });
        break;
      case 'bullet_list_open':
        if (openBulletListToken) {
          throw new Error('Opened bullet with bullet token already open');
        }
        listTokenType = 'bullet';
        break;
      case 'bullet_list_close':
        listTokenType = undefined;
        break;
      case 'ordered_list_open':
        if (openNumberedBulletListToken) {
          throw new Error(
            'Opened numbered bullet with numbered bullet token already open',
          );
        }
        listTokenType = 'numbered_bullet';
        break;
      case 'ordered_list_close':
        listTokenType = undefined;
        break;
      case 'list_item_open': {
        if (listTokenType === 'bullet') {
          openBulletListToken = {
            type: MessageNodeType.BULLET,
            children: [],
          };
        } else if (listTokenType === 'numbered_bullet') {
          const bulletNumber = +token.info;
          if (!bulletNumber) {
            throw new Error('No bullet number provided');
          }
          openNumberedBulletListToken = {
            type: MessageNodeType.NUMBER_BULLET,
            children: [],
            bulletNumber,
          };
        }
        break;
      }
      case 'list_item_close':
        if (listTokenType === 'bullet' && openBulletListToken) {
          if (!openQuoteToken) {
            result.push(openBulletListToken);
          } else {
            openQuoteToken.children.push(openBulletListToken);
          }
          openBulletListToken = undefined;
        } else if (
          listTokenType === 'numbered_bullet' &&
          openNumberedBulletListToken
        ) {
          if (!openQuoteToken) {
            result.push(openNumberedBulletListToken);
          } else {
            openQuoteToken.children.push(openNumberedBulletListToken);
          }
          openNumberedBulletListToken = undefined;
        }
        break;
      case 'blockquote_open':
        if (openQuoteToken) {
          throw new Error('Opened quote with quote token already open');
        }
        openQuoteToken = {
          type: MessageNodeType.QUOTE,
          children: [],
        };
        break;
      case 'blockquote_close':
        if (!openQuoteToken) {
          throw new Error('Closed quote without quote token open');
        }
        result.push(openQuoteToken);
        openQuoteToken = undefined;
        break;
      default:
        throw new Error(`Unknown block token type: ${token.type}`);
    }
  }
  return result;
}

// Parse `inline` tokens to our message content shape. `inline` refers to
// token types that are within a line. Eg. bold, italic, code, normal text and links.
// There can be multiple tokens within an `inline` token.
function markdownInlineTokens(
  tokens: Token[],
  openTokens: AnyButTextNode[],
): AnyButTextNode[] {
  const state: Pick<MessageTextNode, 'italic' | 'bold'> = {};
  let openLinkToken: MessageLinkNode | undefined = undefined;

  for (const token of tokens) {
    // Unless adding an entirely new token, we only ever want to update the last one
    const lastOpenToken = openTokens[openTokens.length - 1];

    switch (token.type) {
      case 'text':
        if (token.content.length > 0) {
          if (openLinkToken) {
            openLinkToken.children.push({
              text: markdownUtils.unescapeMd(token.content),
              ...state,
            });
          } else {
            lastOpenToken.children.push({
              text: markdownUtils.unescapeMd(token.content),
              ...state,
            });
          }
        }
        break;
      /* cspell:disable-next-line */
      case 'softbreak':
        break;
      /* cspell:disable-next-line */
      case 'hardbreak':
        // nothing to do, but just let the other text nodes be pushed...
        break;
      case 'code_inline':
        lastOpenToken.children.push({
          text: markdownUtils.unescapeMd(token.content),
          code: true,
          ...state,
        });
        break;
      case 'em_open':
        state.italic = true;
        break;
      case 'em_close':
        delete state.italic;
        break;
      case 'strong_open':
        state.bold = true;
        break;
      case 'strong_close':
        delete state.bold;
        break;
      case 'link_open': {
        const url = token.attrGet('href');
        if (!url) {
          throw new Error('Url not provided to link');
        }
        openLinkToken = {
          type: MessageNodeType.LINK,
          url,
          children: [],
        };
        break;
      }
      case 'link_close':
        if (!openLinkToken) {
          throw new Error('Closed link without open link token');
        }
        lastOpenToken.children.push(openLinkToken);
        openLinkToken = undefined;
        break;
      default:
        throw new Error(`Unknown inline token type: ${token.type}`);
    }
  }
  return openTokens;
}
