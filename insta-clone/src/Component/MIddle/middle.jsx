// eslint-disable-next-line no-unused-vars
import React from "react";
import "./middle.css";

const Middle = () => {

  return (
    <div className="middle">

      {/* STORIES */}
      <div className="stories">

        <div className="story">
          <img
            src="atul-image-1.jpeg"
            alt="story"
          />
          <p>Your story</p>
        </div>

        <div className="story">
          <img
            src="atul-image-1.jpeg"
            alt="story"
          />
          <p>utkarshsingh1112</p>
        </div>

        <div className="story">
          <img
            src="atul-image-1.jpeg"
            alt="story"
          />
          <p>Shaurya</p>
        </div>

        <div className="story">
          <img
            src="atul-image-1.jpeg"
            alt="story"
          />
          <p>harsh</p>
        </div>

      </div>


      {/* POST */}
      <div className="post">

        {/* POST HEADER */}

        <div className="post-header">

          <div className="post-user">

            <img
              src="atul-image-1.jpeg"
              alt="profile"
            />

            <div>
              <strong>utkarshsingh1112</strong>
              <span> • 1d</span>
            </div>

          </div>

          <button className="follow-button">
            Follow
            
          </button>
          
       
        <div className="three-dot" >
          <img src="three-icon.png"  alt=""></img>
          </div>
        </div>

        {/* POST IMAGE */}

        <div className="post-image">

          <img
            src="atul-image-1.jpeg"
            alt="post"
          />

        </div>


        {/* POST ACTIONS */}

        <div className="post-actions">

          <div className="left-actions">

            <button><img src="like-icon.png" alt=""></img></button>

            <button><img src="comment-icon.png" alt=""></img></button>

            <button><img src="repost-icon.png" alt=""></img></button>

            <button><img src="share-icon.png" alt=""></img></button>

          </div>

          <button><img src="save-icon.png" alt=""></img></button>

        </div>


        {/* LIKES */}

        <div className="post-likes">
          4529888888888 likes
        </div>


        {/* CAPTION */}

        <div className="caption">

          <strong>utkarshsingh1112</strong>

          <span>
            Beautiful day ❤️✨
          </span>

        </div>


        {/* COMMENTS */}

        <div className="comments">
          View all 49 comments
        </div>


      </div>

    </div>
  );
};

export default Middle;