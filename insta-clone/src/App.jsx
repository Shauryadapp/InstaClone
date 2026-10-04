import { useState } from "react";
import "./App.css";
import Leftside from "./Component/Leftside/leftside";
import Middle from "./Component/MIddle/middle";
import Rightside from "./Component/RIghtside/rightside";
import Login from "./Log-in/login";
import Signup from "./Log-in/signup";

const App = () => {

  const [page, setPage] = useState("login");

  if (page === "login") {
    return (
      <Login
        onSignup={() => setPage("signup")}
      />
    );
  }

  if (page === "signup") {
    return (
      <Signup />
    );
  }

  return (
    <div className="App">

      <div className="leftsidehome">
        <Leftside />
      </div>

      <div className="middleside">
        <Middle />
      </div>

      <div className="rightside">
        <Rightside />
      </div>

    </div>
  );
};

export default App;