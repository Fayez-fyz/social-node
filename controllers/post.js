import Post from "../models/post";
import cloudinary from "cloudinary";
import User from "../models/users";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export const createPost = async (req, res) => {
  const { content, image } = req.body;
  if (!content.length) {
    return res.json({
      error: "content is required",
    });
  }
  try {
    const post = new Post({ content, image, postedBy: req.user._id });
   await post.save();
   const postWithUser = await Post.findById(post._id).populate('postedBy','-password -secret')
    res.json(postWithUser);
  } catch (error) {
    console.log(error);
    res.sendstatus(400);
  }
};
export const uploadImage = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.files.image.path);
    // console.log("uploaded image url=>", result);
    res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.log(error);
  }
};
export const postByUser = async (req, res) => {
  try {
    // const posts = await Post.find({ postedBy: req.user._id })
    const posts = await Post.find({})
      .populate("postedBy", "_id name image")
      .sort({ createdAt: -1 })
      .limit(10);
    //   console.log('posts',posts)
    res.json(posts);
  } catch (error) {
    console.log(error);
  }
};

export const userPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params._id)
      .populate("postedBy", "_id name image")
      .populate("comments.postedBy", "_id name image");
    res.json(post);
  } catch (error) {
    console.log(error);
  }
};

export const updatePost = async (req, res) => {
  console.log("Update post", req.body);
  try {
    const post = await Post.findByIdAndUpdate(req.params._id, req.body, {
      new: true,
    });
    res.json(post);
  } catch (error) {
    console.log(error);
  }
};
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params._id);
    //remove item from cloudinary
    if (post.image && post.image.public_id) {
      const image = await cloudinary.uploader.destroy(post.image.public_id);
    }
    res.json({
      ok: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const newsFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let following = user.following;
    //to show my own id post  and following
    following.push(req.user._id);

    //pagination
    const currentPage = req.params.page || 1;
    const perPage = 5;

    const post = await Post.find({ postedBy: { $in: following } })
      .skip((currentPage - 1) * perPage)
      .populate("postedBy", "_id name image")
      .populate("comments.postedBy", "_id name image")
      .sort({ createdAt: -1 })
      .limit(perPage);
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};
export const likePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.body._id,
      {
        $addToSet: { likes: req.user._id },
      },
      { new: true }
    );
    res.json(post);
  } catch (error) {
    console.log(error);
  }
};
export const unlikePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.body._id,
      {
        $pull: { likes: req.user._id },
      },
      { new: true }
    );
    res.json(post);
  } catch (error) {
    console.log(error);
  }
};
export const addComment = async (req, res) => {
  try {
    const { postId, comment } = req.body;
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { comments: { text: comment, postedBy: req.user._id } },
      },
      { new: true }
    )
      .populate("postedBy", "_id name image")
      .populate("comments.postedBy", "_id name image");
    res.json(post);
  } catch (error) {
    console.log(error);
  }
};
export const removeComment = async (req, res) => {
  try {
    const { postId, comment } = req.body;
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { comments: { _id: comment._id } },
      },
      { new: true }
    );
    res.json(post);
  } catch (error) {
    console.log(error);
  }
};
export const totalPosts = async (req, res) => {
  try {
    const total = await Post.find().estimatedDocumentCount();
    res.json(total);
  } catch (error) {
    console.log(error);
  }
};

export const posts = async (req,res)=>{
  try {
    const posts = await Post.find()
    .populate("postedBy", "_id name image")
    .populate("comments.postedBy", "_id name image")
    .sort({createdAt:-1})
    .limit(12)
    res.json(posts)
  } catch (error) {
    console.log(error)
  }
}
export const getPost = async (req,res)=>{
  try {
    const post = await Post.findById(req.params._id)
    .populate("postedBy", "_id name image")
    .populate("comments.postedBy", "_id name image")
    res.json(post)
  } catch (error) {
    console.log(error)
  }
}

