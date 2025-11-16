const moongoose = require('mongoose');

const postSchema = moongoose.Schema({
    user: {
        type: moongoose.Schema.Types.ObjectId, ref: 'user'
    },
    title: {
        type: String,
    },
    content: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now
    },
    like: [{
        type: moongoose.Schema.Types.ObjectId, ref: 'user',

    }]
});


module.exports = moongoose.model('post', postSchema);