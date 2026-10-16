
import "./leftside.css";

const Leftside = ({ onProfile, onCreateClick, onSearch, onMessages, onNotifications }) => {

  return (
    <div className="leftside">

      <div className="logo">
        <img src="instagram-icon.png" alt="" />
      </div>

      <div className="navlink">
        
          <img src="home-icon.png" alt="" />
          <span>Home</span>
         
      </div>

      {/* <div className="navlink">
        <img src="reelicon.png" alt="" />
        <span>Reel</span>
      </div> */}
      
      <div className="navlink" onClick={onMessages} >
        <img src="message-icons.png" alt="" />
        <span>Messages</span>
      </div>

      <div className="navlink" onClick= {onSearch}>
        <img src="search-icon.png" alt="" />
        <span>Search</span>
      </div>

      <div className="navlink" onClick={onNotifications}>
         <img src="notification-icon1.png" alt="" />
       <span> Notifications</span>
      </div>

      <div className="navlink"
           onClick= {() => {
            console.log("CREATE CLICKED");
            onCreateClick();
           }}>

        <img src="create-icon.png" alt="" />
        <span> Create</span>
      </div>

     

      <div className="navlink"
          onClick={onProfile}
>
        <img src="profile-icon.png" alt="" />
        <span>Profile</span>
      </div>

       <div className="navlinkfooter1">
        
      </div>
      
      <div className="navlinkfooter3">
        <img src="more-icon.png" alt="" />
        <span>More</span>
      </div>

    </div>
  );
};

export default Leftside;