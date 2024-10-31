'use strict';

/**
 * @typedef {import('eris').EmbedBase} EmbedBase
 * @typedef {Object} PaginationOptions An optional options object for overwriting defaults
 * @property {Boolean} [showPageNumbers] Whether or not to show the current page index over the embed. Defaults to: true
 * @property {Boolean} [cycling] Cycle through all embeds jumping from the first page to the last page on going back and from the last page to the first page going forth. Defaults to: false
 * @property {Number} [timeout] How long the paginator should work before the reaction listener times out. Defaults to: 300000ms (5 minutes). Maximum: 900000ms (15 minutes)
 * @property {Number} [startPage] Which page of the submitted embed array should be shown first. Defaults to: 1 (The 1st page / element in the array)
 */
/**
 * Embed Pagination class
 * @class PaginationEmbed
 * @classdesc Handles the creation, listening and updating of paginated Rich Embeds
 */
class PaginationEmbed {
    /**
     * Constructor for the Embed Paginator
     * @param {Message} message A message object emitted from a messageCreate event coming from Eris, used as an invoker.
     * @param {EmbedBase[]} pages An array containing all embed objects
     * @param {PaginationOptions} [options] An optional options object for overwriting defaults
     * @param {components} Array<Eris.ActionRow> components to attach to the message
     */
    constructor(message, pages = [], options = {}) {
        // this.textChannel = textChannel;
        // this.authorID = authorID;
        this.invoker    = message;
        this.pages      = pages;
        this.options    = options;
        this.disable    = { type: 2, label: 'Disable Controls', custom_id: 'disable', style: 4 };
        this.firstPage  = { type: 2, emoji: { id: null, name: '⏮' }, custom_id: 'first', style: '2' };
        this.lastPage   = { type: 2, emoji: { id: null, name: '⏭' }, custom_id: 'last', style: '2'};
        this.previous   = { type: 2, emoji: { id: null, name: '⬅' }, custom_id: 'previous', style: '2' };
        this.next       = { type: 2, emoji: { id: null, name: '➡' }, custom_id: 'next', style: '2' };
        this.page       = options.startPage     || 1;
        this.timeout    = options.timeout       || 300000;
        this.cycling    = options.cycling       || false
        this.showPages  = (typeof options.showPageNumbers !== 'undefined') ? options.showPageNumbers : true;
        this.components = [ this.firstPage, this.previous, this.next, this.lastPage, this.disable ];
    }

    /**
     * Runs a set of initialization checks and displays the initial embed with pagination controls
     * @async
     */
    async initialize() {
        if (this.pages.length < 2) {
            return Promise.reject(new Error('A Pagination Embed must contain at least 2 pages!'));
        }

        if (this.page < 1 || this.page > this.pages.length) {
            return Promise.reject(new Error(`Invalid start page! Must be between 1 (first) and ${this.pages.length} (last)`));
        }

        if (this.timeout > 900000) {
            return Promise.reject(new Error('Embed Timeout too high! Maximum pagination lifespan allowed is 15 minutes (900000 ms)!'));
        }

        let embed = this.pages[this.page - 1];
        
        const pageText = `Page ${this.page} of ${this.pages.length}`;
        const messageContent = {
            embeds: [Object.assign({}, embed, { footer: { text: embed.footer ? `${pageText} | ${embed.footer.text}` : pageText } })],
            components: [ { type: 1, components: this.components } ]
        }

        this.message = await this.invoker.channel.createMessage(messageContent);

        this.createTimeout();

        this.client = this.invoker._client;
    }

    /**
     * Updates the embed's content with the new page
     */
    update() {
        let embed = this.pages[this.page - 1];

        const pageText = `Page ${this.page} of ${this.pages.length}`;
        this.message.edit({
            embeds: [Object.assign({}, embed, { footer: { text: embed.footer ? `${pageText} | ${embed.footer.text}` : pageText } })]
        });

        this.resetTimeout();
    }

    /**
     * Disables pagination controls and resets the timeout
     */
    disableControls() {
        for (let button of this.components) button.disabled = true;
        this.message.edit({ embed: this.pages[this.page - 1], components: [ { type: 1, components: this.components } ] });
        clearTimeout(this.timeoutID);
    }

    createTimeout() {
        this.timeoutID = setTimeout(() => this.disableControls(), this.timeout);
    }

    resetTimeout() {
        clearTimeout(this.timeoutID);
        this.createTimeout();
    }

    /**
     * Main method handling the interaction listening and content updating
     */
    run() {
        this.client.on('interactionCreate', (interaction) => {
            if (interaction.message.id !== this.message.id) return;

            if (interaction.member.id !== this.invoker.author.id) {
                return interaction.createMessage({ content: 'You\'re not allowed to use the controls on this message!', flags: 64 })
            }

            interaction.acknowledge();
            
            switch (interaction.data.custom_id) {
                case 'first': {
                    if (this.page > 1) {
                        this.page = 1;
                        this.update();
                    }

                    break;
                }

                case 'previous': {
                    if (this.page > 1) {
                        this.page--;
                        this.update();
                    } else if (this.page === 1 && this.cycling === true) {
                        this.page = this.pages.length;
                        this.update();
                    }

                    break;
                }

                case 'next': {
                    if (this.page < this.pages.length) {
                        this.page++;
                        this.update();
                    } else if (this.page === this.pages.length && this.cycling === true) {
                        this.page = 1;
                        this.update();
                    }

                    break;
                }

                case 'last': {
                    if (this.page < this.pages.length) {
                        this.page = this.pages.length;
                        this.update();
                    }

                    break;
                }

                case 'disable': {
                    this.disableControls();
                }
            }
        });
    }
}

module.exports = {
    /**
     * Create an Embed Paginator
     *
     * @param {Message} message A message object emitted from a messageCreate event coming from Eris, used as an invoker.
     * @param {EmbedBase[]} pages An array containing all embed objects
     * @param {PaginationOptions} [options] An optional options object for overwriting defaults
     */
    createPaginationEmbed: async (message, pages, options) => {
        const paginationEmbed = new PaginationEmbed(message, pages, options);
        await paginationEmbed.initialize();
        paginationEmbed.run();

        return Promise.resolve(paginationEmbed.message);
    }
};
