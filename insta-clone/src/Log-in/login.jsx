import "./login.css";
const Login = ({ onSignup }) => {
  return (
    <div className="login-page">

      {/* ================= LEFT SIDE ================= */}

      <div className="login-left">

        {/* Instagram Logo */}
        <div className="instagram-logo">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
            alt="Instagram"
          />
        </div>


        {/* Heading */}
        <div className="login-heading">

          <h1>
            See everyday moments from your
          </h1>

          <h1 className="gradient-text">
            close friends.
          </h1>

        </div>


        {/* Instagram Images */}
        <div className="promo-images">

          <div className="promo-card card-left">
            <img
              src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e"
              alt="Instagram"
            />
          </div>

          <div className="promo-card card-middle">
            <img
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9"
              alt="Instagram"
            />
          </div>

          <div className="promo-card card-right">
            <img
              src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce"
              alt="Instagram"
            />
          </div>

          {/* Heart */}
          <div className="heart">
            ❤️
          </div>

          {/* Reaction */}
          <div className="reaction">
            🥰👀😍
          </div>

        </div>

      </div>


      {/* ================= RIGHT SIDE ================= */}

      <div className="login-right">

        <div className="login-form">

          <h2>
            Log into Instagram
          </h2>


          {/* Username */}
          <input
            type="text"
            placeholder="Mobile number, username or email"
          />


          {/* Password */}
          <input
            type="password"
            placeholder="Password"
          />


          {/* Login */}
          <button className="login-button">
            Log in
          </button>


          {/* Forgot Password */}
          <button className="forgot-password">
            Forgot password?
          </button>


          {/* Facebook */}
          <button className="facebook-login">
            <span className="facebook-icon">f</span>
            Log in with Facebook
          </button>


          {/* Create Account */}
          <button className="create-account"
            onClick={onSignup}>
            Create new account
            </button>


          {/* Meta */}
          <div className="meta-logo">
            ∞ Meta
          </div>

        </div>

      </div>


      {/* ================= FOOTER ================= */}

      <div className="login-footer">

        <span>Meta</span>
        <span>About</span>
        <span>Blog</span>
        <span>Jobs</span>
        <span>Help</span>
        <span>API</span>
        <span>Privacy</span>
        <span>Terms</span>
        <span>Locations</span>
        <span>Popular</span>
        <span>Instagram Lite</span>
        <span>Meta AI</span>
        <span>Muse</span>
        <span>Threads</span>
        <span>Contact Uploading & Non-Users</span>
        <span>Meta Verified</span>

      </div>

    </div>
  );
};

export default Login;