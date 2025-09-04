import { useState } from "react";
import Login from "./Login";
import Properties from "./Properties";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <div className="p-6">
      {!loggedIn ? (
        <Login setLoggedIn={setLoggedIn} />
      ) : (
        <Properties />
      )}
    </div>
  );
}

export default App;
