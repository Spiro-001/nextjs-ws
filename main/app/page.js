"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { socket } from "./socket";

export default function Home() {
  const [clicks, setClicks] = useState(false);
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
        socket.connect();
        setClicks(response);
      }
    }

    function clickResponse(arg, callback) {
      // update all users' variable in global|room in real time
      setClicks(arg);
    }

    socket.timeout(2000).emit("init", true, initConnect);
    socket.on("response", clickResponse);

    setLoaded(true);
    return () => {
      socket.off("init", initConnect);
    };
  }, []);

  function broadcastButton() {
    // update global|room variable in real time
    socket.timeout(2000).emit("click", true, (err, response) => {
      if (err) {
        console.log(err);
      } else {
        console.log(response);
      }
    });
  }

  return (
    loaded && (
      <main className="flex min-h-screen flex-col items-center p-24">
        {clicks !== false ? clicks : "Loading..."}
        <button onClick={broadcastButton}>Click Me</button>
      </main>
    )
  );
}
