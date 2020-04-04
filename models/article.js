const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const commentSchema=new Schema({
    liked: {
        type: Boolean,
        default: false
    },
    text: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const articleSchema=new Schema({
    title: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    categorytype: {
        type: String,
        default: 'Technical'
    },
    isupdated: {
        type: Boolean,
        default: false
    },
    previewcontent: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    likescount: {
        type: Number,
        required: true,
        default: 0
    },
    comments: [commentSchema]
}, {
    timestamps: true
});

const Article=mongoose.model('Article', articleSchema);

module.exports=Article;