
import "./leftside.css";

const Leftside = () => {

  return (
    <div className="leftside">

      <div className="logo">
        <img src="instagram-icon.png" alt="" />
      </div>

      <div className="navlink">
        
          <img src="https://i.pinimg.com/736x/89/ba/d7/89bad76e046bfe194abbaeb7e40adda3.jpg" alt="" />
          <span>Home</span>
         
      </div>

      <div className="navlink">
        <img src="https://i.pinimg.com/736x/60/35/64/603564da9e25a8bda92ddd181fd9d37d.jpg" alt="" />
        <span>Reel</span>
      </div>
      
      <div className="navlink">
        <img src="message-icons.png" alt="" />
        <span>Messages</span>
      </div>

      <div className="navlink">
        <img src="search-icon.png" alt="" />
        <span>Search</span>
      </div>

      <div className="navlink">
         <img src="notification-icon.png" alt="" />
       <span> Notifications</span>
      </div>

      <div className="navlink">
        <img src="create-icon.png" alt="" />
        <span> Create</span>
      </div>

      <div className="navlinkfooter1">
        <img src="profile-icon.png" alt="" />
        <span>Profile</span>
      </div>

      <div className="navlinkfooter2">
        <img src="more-icon.png" alt="" />
        <span>More</span>
      </div>

    </div>
  );
};

export default Leftside;