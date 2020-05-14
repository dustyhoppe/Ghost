const jsonSchema = require('../utils/json-schema');

module.exports = {
    add(apiConfig, frame) {
        const schema = require('./schemas/comments-add');
        const definitions = require('./schemas/comments');
        return jsonSchema.validate(schema, definitions, frame.data);
    },
};
