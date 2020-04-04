const express=require('express');
const bodyParser=require('body-parser');
const Article=require('../models/article');
const authenticate=require('../authenticate');
const multer=require('multer');
const cors=require('./cors');

/*SOC--For uploading authors profile pic --SOC*/
const storage=multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },

    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});

const imageFileFilter=(req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('You can upload only image files!'), false);
    }
    cb(null, true);
};

const upload=multer({storage: storage, fileFilter: imageFileFilter});

/*EOC--For uploading authors profile pic --EOC*/
const articleRouter=express.Router();
articleRouter.use(bodyParser.json());

articleRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        Article.find()
            .populate('author', 'comments.author')
            .then(articles => {
                res.statusCode=200;
                res.setHeader('Content-Type', 'application/json');
                res.json(articles);
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {

        let data=req.body;
        data.author=req.user._id;
        console.log(data);

        try {
            let article=await Article.create(data);
            article=await article.populate('author').execPopulate();
            res.send(article);
        } catch (error) {
            next(error);
        }
        /*Article.create(data)
            .then(article => {
                console.log('Article Created ', article);
                res.statusCode=200;
                res.setHeader('Content-Type', 'application/json');
                let outputdata=article.populate('author');
                res.json(outputdata);
            })
            .catch(err => next(err));*/
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode=403;
        res.end('PUT operation not supported on /Articles');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Article.deleteMany()
            .then(response => {
                res.statusCode=200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            })
            .catch(err => next(err));
    });

articleRouter.route('/:articleId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        Article.findById(req.params.articleId)
            .populate('articles.author', 'comments.author')
            .then(article => {
                res.statusCode=200;
                res.setHeader('Content-Type', 'application/json');
                res.json(article);
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode=403;
        res.end(`POST operation not supported on /articles/${req.params.articleId}`);
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, upload.single('imageFile'), (req, res, next) => {

        // let img=fs.readFileSync(req.file.path);
        // let encodedimage=img.toString('base64');
        let data=req.body;
        // data.imagetype=req.file.type;
        // data.image=new Buffer(encodedimage, 'base64');
        console.log(data);
        if (req.file) {
            console.log(req.file);
            data.image='/images/'+req.file.filename;
        }
        Article.findByIdAndUpdate(req.params.articleId, {
            $set: data
        }, {new: true})
            .then(article => {
                res.statusCode=200;
                res.setHeader('Content-Type', 'application/json');
                // article.image=article.image.buffer;
                res.json(article);
            })
            .catch(err => next(err));
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Article.findByIdAndDelete(req.params.articleId)
            .then(response => {
                res.statusCode=200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            })
            .catch(err => next(err));
    });

articleRouter.route('/:articleId/comments')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        Article.findById(req.params.articleId)
            .populate('comments.author')
            .then(article => {
                if (article) {
                    res.statusCode=200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(article.comments);
                } else {
                    err=new Error(`Article ${req.params.articleId} not found`);
                    err.status=404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Article.findById(req.params.articleId)
            .then(article => {
                if (article) {
                    req.body.author=req.user._id;
                    article.comments.push(req.body);
                    article.save()
                        .then(article => {
                            res.statusCode=200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(article);
                        })
                        .catch(err => next(err));
                } else {
                    err=new Error(`Article ${req.params.articleId} not found`);
                    err.status=404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode=403;
        res.end(`PUT operation not supported on /articles/${req.params.articleId}/comments`);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Article.findById(req.params.articleId)
            .then(article => {
                if (article) {
                    for (let i=(article.comments.length-1);i>=0;i--) {
                        article.comments.id(article.comments[i]._id).remove();
                    }
                    article.save()
                        .then(article => {
                            res.statusCode=200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(article);
                        })
                        .catch(err => next(err));
                } else {
                    err=new Error(`Article ${req.params.articleId} not found`);
                    err.status=404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    });

articleRouter.route('/:articleId/comments/:commentId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        Article.findById(req.params.articleId)
            .populate('comments.author')
            .then(article => {
                if (article&&article.comments.id(req.params.commentId)) {
                    res.statusCode=200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(article.comments.id(req.params.commentId));
                } else if (!article) {
                    err=new Error(`Article ${req.params.articleId} not found`);
                    err.status=404;
                    return next(err);
                } else {
                    err=new Error(`Comment ${req.params.commentId} not found`);
                    err.status=404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode=403;
        res.end(`POST operation not supported on /article/${req.params.articleId}/comments/${req.params.commentId}`);
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Article.findById(req.params.articleId)
            .then(article => {
                if (article&&article.comments.id(req.params.commentId)) {
                    if ((article.comments.id(req.params.commentId).author).equals(req.user._id)) {
                        if (req.body.liked) {
                            article.comments.id(req.params.commentId).liked=req.body.liked;
                        }
                        article.save()
                            .then(article => {
                                res.statusCode=200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(article);
                            })
                            .catch(err => next(err));
                    }
                    else {
                        err=new Error(`You are not authorized to perform this action since you are not author for this comment`);
                        err.status=403;
                        return next(err);
                    }
                } else if (!article) {
                    err=new Error(`Article ${req.params.articleId} not found`);
                    err.status=404;
                    return next(err);
                } else {
                    err=new Error(`Comment ${req.params.commentId} not found`);
                    err.status=404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Article.findById(req.params.articleId)
            .then(article => {
                if (article&&article.comments.id(req.params.commentId)) {
                    if ((article.comments.id(req.params.commentId).author).equals(req.user._id)) {
                        article.comments.id(req.params.commentId).remove();
                        article.save()
                            .then(article => {
                                res.statusCode=200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(article);
                            })
                            .catch(err => next(err));
                    }
                    else {
                        err=new Error(`You are not authorized to perform since you are not the author for this comment`);
                        err.status=403;
                        return next(err);
                    }
                } else if (!article) {
                    err=new Error(`Article ${req.params.articleId} not found`);
                    err.status=404;
                    return next(err);
                } else {
                    err=new Error(`Comment ${req.params.commentId} not found`);
                    err.status=404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    });
module.exports=articleRouter;