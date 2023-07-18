"use client";

import { useEffect, useState } from "react";
import { socket } from "./socket";
import { io } from "socket.io-client";

export default function Home() {
  const [username, setUsername] = useState("");
  const [users, setUsers] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    function initConnect(err, response) {
      // catch up to current
      if (err) {
        console.log(err);
      } else {
        setUsers(response);
      }
    }

    function collectUsers(arg, callback) {
      // update all users' variable in global|room in real time
      console.log(arg);
      setUsers(arg);
    }

    function refreshUsers(arg, callback) {
      // refresh user list
      console.log(arg);
      setUsers(arg);
    }

    socket.timeout(2000).emit("init", true, initConnect);
    socket.on("test", (arg, callback) => console.log(arg));
    socket.on("userDisconnected", refreshUsers);
    socket.on("response", collectUsers);

    setLoaded(true);
    return () => {
      socket.off("init", initConnect);
    };
  }, []);

  function submitUsername() {
    // update global|room variable in real time
    if (!users.find((user) => user.id === socket.id)) {
      socket.timeout(2000).emit("setUsername", username, (err, response) => {
        if (err) {
          console.log(err);
        } else {
          console.log(response);
        }
      });
    } else {
      // set errors
    }
  }

  return (
    loaded && (
      <main className="flex min-h-screen flex-col items-center p-24">
        <div className="ml-auto border-white border p-6 grid col-auto">
          <h1>current_users : {users.length}</h1>
          {users.map((user) => (
            <span key={user.id}>{user.username}</span>
          ))}
        </div>
        <input
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          value={username}
          className="text-black"
        />
        <button onClick={submitUsername}>Confirm</button>
      </main>
    )
  );
}
