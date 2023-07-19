"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "./socket";
import { io } from "socket.io-client";
import { gsap } from "gsap";

export default function Home() {
  const [username, setUsername] = useState("");
  const [users, setUsers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [cursors, setCursors] = useState({});
  const [updateMouse, setUpdateMouse] = useState(false);
  const cursor = useRef();
  const otherCursors = useRef({});

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

  useEffect(() => {
    // console.log(cursors);
    function cursorMove(err, response) {
      if (err) {
        // console.log(err);
      } else {
        console.log(response);
      }
    }

    function trackMouse(mouseEvent) {
      // mouseEvent movement
      socket.timeout(1000).emit(
        "mousemove",
        {
          id: socket.id,
          username: username,
          x: mouseEvent.clientX,
          y: mouseEvent.clientY,
        },
        cursorMove
      );

      // animation using gsap
      gsap.to(cursor.current, {
        x: mouseEvent.clientX,
        y: mouseEvent.clientY,
        duration: 0.5,
        ease: "back.out(1.7)",
      });
    }

    function gatherMouseData(arg, callback) {
      let userCursor = {};
      userCursor[arg.id] = arg;
      if (socket.id !== arg.id) {
        if (cursors[arg.id]) {
          setCursors((prev) => ({ ...prev, ...userCursor }));
        } else
          setCursors((prev) => {
            prev[arg.id] = arg;
            return prev;
          });
      }
    }

    document.addEventListener("mousemove", trackMouse);

    let syncMouse = setInterval(() => {
      Object.keys(cursors).forEach((userCursor) => {
        if (socket.id !== userCursor) {
          gsap.to(otherCursors.current[userCursor], {
            x: cursors[userCursor].x,
            y: cursors[userCursor].y,
            duration: 2,
            ease: "power4.out",
          });
        }
      });
      setUpdateMouse((prev) => !prev);
    }, 500);
    socket.on("mouseSync", gatherMouseData);

    return () => {
      clearInterval(syncMouse);
      document.removeEventListener("mousemove", trackMouse);
    };
  }, [updateMouse]);

  function submitUsername() {
    // update global|room variable in real time
    setUsername("");
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

  function displayName(cx) {
    let name = users.find((user) => user.id === cx);
    return name?.username;
  }

  return (
    loaded && (
      <>
        <span
          id="cursor"
          className="h-6 w-6 bg-white absolute cursor-none select-none"
          ref={cursor}
        >
          <span className="relative bottom-6 flex justify-center">
            {displayName(socket.id) ?? "Anonymous"}
          </span>
        </span>
        {Object.keys(cursors).map((userCursor) => (
          <span
            key={userCursor}
            id={userCursor + "cx"}
            className="h-6 w-6 bg-white absolute cursor-none select-none"
            ref={(ref) => (otherCursors.current[userCursor] = ref)}
          >
            <span className="relative bottom-6 flex justify-center">
              {displayName(userCursor) ?? "Anonymous"}
            </span>
          </span>
        ))}
        <main className="flex min-h-screen flex-row justify-center p-24 flex-wrap cursor-none">
          <div className="flex gap-x-1 flex-1 justify-center h-fit">
            <input
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              value={username}
              className="text-black px-2 outline-none py-1 rounded-l-sm"
            />
            <button
              onClick={submitUsername}
              className="bg-white text-black px-2 py-1 rounded-r-sm"
            >
              Confirm
            </button>
          </div>
          <div className="border-white border p-6 grid col-auto h-fit max-h-64 overflow-y-auto">
            <h1>current_users : {users.length}</h1>
            {users.map((user) => (
              <span key={user.id}>{user.username}</span>
            ))}
          </div>
        </main>
      </>
    )
  );
}
