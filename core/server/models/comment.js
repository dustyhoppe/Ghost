// # Post Model
const _ = require('lodash');
const uuid = require('uuid');
const moment = require('moment');
const Promise = require('bluebird');
const sequence = require('../lib/promise/sequence');
const common = require('../lib/common');
const htmlToText = require('html-to-text');
const ghostBookshelf = require('./base');
const config = require('../config');
const settingsCache = require('../services/settings/cache');
const mobiledocLib = require('../lib/mobiledoc');
const relations = require('./relations');
const urlUtils = require('../lib/url-utils');
const MOBILEDOC_REVISIONS_COUNT = 10;
const ALL_STATUSES = ['pending', 'published', 'hidden', 'spam'];

let Comment;
let Comments;

Comment = ghostBookshelf.Model.extend({

    tableName: 'comments',

    defaults: function defaults() {
        return {
            uuid: uuid.v4(),
            status: 'pending',
        };
    },

    emitChange: function emitChange(event, options) {
        const eventToTrigger = 'comment' + '.' + event;
        ghostBookshelf.Model.prototype.emitChange.bind(this)(this, eventToTrigger, options);
    },

    onCreated: function onCreated(model, attrs, options) {
        ghostBookshelf.Model.prototype.onCreated.apply(this, arguments);

        model.emitChange('added', options);
    },

    onUpdated: function onUpdated(model, attrs, options) {
        ghostBookshelf.Model.prototype.onUpdated.apply(this, arguments);

        model.emitChange('edited', options);
    },

    onDestroyed: function onDestroyed(model, options) {
        ghostBookshelf.Model.prototype.onDestroyed.apply(this, arguments);

        model.emitChange('deleted', options);
    },

    onSaving: function onSaving(newTag, attr, options) {
        const self = this;

        ghostBookshelf.Model.prototype.onSaving.apply(this, arguments);

    },

    post() {
        return this.belongsTo('Post');
    },

    toJSON: function toJSON(unfilteredOptions) {
        const options = Tag.filterOptions(unfilteredOptions, 'toJSON');
        const attrs = ghostBookshelf.Model.prototype.toJSON.call(this, options);

        // @NOTE: this serialization should be moved into api layer, it's not being moved as it's not used
        attrs.parent = attrs.parent || attrs.parent_id;
        delete attrs.parent_id;

        return attrs;
    },

    getAction(event, options) {
        const actor = this.getActor(options);

        // @NOTE: we ignore internal updates (`options.context.internal`) for now
        if (!actor) {
            return;
        }

        // @TODO: implement context
        return {
            event: event,
            resource_id: this.id || this.previous('id'),
            resource_type: 'comment',
            actor_id: actor.id,
            actor_type: actor.type
        };
    }
});

Comments = ghostBookshelf.Collection.extend({
    model: Comment
});


module.exports = {
    Comment: ghostBookshelf.model('Comment', Comment),
    Comments: ghostBookshelf.collection('Comments', Comments)
};
