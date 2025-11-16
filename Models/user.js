const moongoose = require('mongoose');
moongoose.connect('mongodb://127.0.0.1:27017/PostCreatorDB');

const userSchema = moongoose.Schema({
    username: {
        type: String,

    },
    name: {
        type: String,

    },
    email: {
        type: String,

    },
    age: {
        type: Number
    },
    password: {
        type: String,
    },
    posts: [{ type: moongoose.Schema.Types.ObjectId, ref: 'post' }]
});


module.exports = moongoose.model('user', userSchema);