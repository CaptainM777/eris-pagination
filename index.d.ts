import { EmbedOptions, Message } from 'eris';

declare module 'eris-pagination' {

  /**
   * An optional options object for overwriting defaults
   */
  interface PaginationOptions {
    /** Whether or not to show the current page index over the embed. Defaults to: true */
    showPageNumbers?: boolean;
    /** Cycle through all embeds jumping from the first page to the last page on going back and from the last page to the first page going forth. Defaults to: false */
    cycling?: boolean;
    /** How long the paginator should work before the reaction listener times out. Defaults to: 300000ms (5 minutes). Maximum: 900000ms (15 minutes) */
    timeout?: number;
    /** Which page of the submitted embed array should be shown first. Defaults to: 1 (The 1st page / element in the array) */
    startPage?: number;
  }

  /**
   * Create an Embed Paginator
   * @param {Message} message A message object emitted from a messageCreate event coming from Eris, used as an invoker.
   * @param pages An array containing all embed objects
   * @param options An optional options object for overwriting defaults
   */
  function createPaginationEmbed(message: Message, pages: Array<EmbedOptions>, options?: PaginationOptions): Promise<Message>;

}
