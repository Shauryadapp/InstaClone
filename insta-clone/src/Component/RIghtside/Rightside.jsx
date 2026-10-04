
import "./rightside.css";

const Rightside = () => {

  const suggestions = [
    {
      username: "Thakur",
      image: "atul-image-1.jpeg",
      text: "Followed by sa farxfeelings"
    },
    {
      username: "Yash Singh",
      image: "atul-image-1.jpeg ",
      text: "Suggested for you"
    },
    {
      username: "Harsh",
      image: "atul-image-1.jpeg ",
      text: "Suggested for you"
    }
  ];

  return (
    <div className="right-container">

      {/* CURRENT USER */}

      <div className="current-user">

        <div className="current-user-info">

          <img
            src="atul-image-1.jpeg "
            alt="profile"
          />

          <div>
            <strong>singh707724</strong>
            <span>Singh</span>
          </div>

        </div>

        <button className="switch-btn">
          Switch
        </button>

      </div>


      {/* SUGGESTED TITLE */}

      <div className="suggested-heading">

        <strong>
          Suggested for you
        </strong>

        <button>
          See all
        </button>

      </div>


      {/* SUGGESTIONS */}

      <div className="suggestions">

        {suggestions.map((user, index) => (

          <div
            className="suggestion"
            key={index}
          >

            <div className="suggestion-info">

              <img
                src={user.image}
                alt={user.username}
              />

              <div>

                <strong>
                  {user.username}
                </strong>

                <span>
                  {user.text}
                </span>

              </div>

            </div>

            <button className="follow-btn">
              Follow
            </button>

          </div>

        ))}

      </div>


      {/* FOOTER */}

      <div className="right-footer">

        <p>
          About · Help · Press · API · Jobs · Privacy
        </p>

        <p>
          Terms · Locations · Language · Meta Verified
        </p>

        <span>
          © 2026 INSTAGRAM CLONE
        </span>

      </div>

    </div>
  );
};

export default Rightside;