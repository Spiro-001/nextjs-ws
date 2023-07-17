"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function Home() {
  const [clicks, setClicks] = useState(0);
  const socket = io("ws://localhost:5000"); // Connect to websocket

  useEffect(() => {
    socket.timeout(2000).emit("init", true, (err, response) => {
      // catch up to current
      if (err) {
        console.log(err);
      } else {
        console.log("init response : ", response);
        setClicks(response);
      }
    });

    socket.on("response", (arg, callback) => {
      // update all users' variable in global|room in real time
      console.log(arg);
      setClicks(arg);
    });
  }, []);

  const broadcastButton = () => {
    // update global|room variable in real time
    socket.timeout(2000).emit("click", true, (err, response) => {
      if (err) {
        console.log(err);
      } else {
        console.log(response);
      }
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      {clicks ? clicks : "Loading..."}
      <button onClick={broadcastButton}>Click Me</button>
    </main>
  );
}
