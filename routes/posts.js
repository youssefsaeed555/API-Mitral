const express = require("express");
const routes = express.Router();
const postController = require("../controllers/posts");
const isAuth = require("../middleware/is-auth");
const {
  postValidator,
  updatePostValidator,
} = require("../middleware/validator");

routes.post("/createPost", isAuth, postValidator, postController.addpost);

routes.get("/allPosts", postController.getAllPosts);

routes
  .route("/post/:postId")
  .get(postController.getSpesficPost)
  .patch(isAuth, postController.updatePost)
  .delete(isAuth, postController.deletePost);

routes.post("/:postId/addComment", isAuth, postController.addComment);

routes
  .route("/:postId/comment/:commentId")
  .put(isAuth, postController.updateComment)
  .delete(isAuth, postController.deleteComment);

module.exports = routes;
