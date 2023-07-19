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
  const [colorOpen, setColorOpen] = useState(false);

  const [penDown, setPenDown] = useState(false);
  const [brushSize, setBrushSize] = useState(10);
  const [brushColor, setBrushColor] = useState("#000000");
  const [selectedTool, setSelectedTool] = useState(0);

  const cursor = useRef();
  const otherCursors = useRef({});
  const canvasRef = useRef();

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
    socket.on("userDisconnected", refreshUsers);
    socket.on("response", collectUsers);

    setLoaded(true);
    return () => {
      socket.off("init", initConnect);
      socket.off("userDisconnected", refreshUsers);
      socket.off("response", collectUsers);
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
      if (!colorOpen) {
        gsap.to(cursor.current, {
          x: mouseEvent.clientX + 10,
          y: mouseEvent.clientY + 10,
          duration: 0.1,
          ease: "back.out(2.2)",
        });
      }
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
    }, 10);

    function syncDrawing(arg, callback) {
      console.log(arg);
      wsDraw(arg.coord, arg.size, arg.color);
    }

    socket.on("userDrawing", syncDrawing);
    socket.on("mouseSync", gatherMouseData);

    return () => {
      clearInterval(syncMouse);
      socket.off("userDrawing", syncDrawing);
      socket.off("mouseSync", gatherMouseData);
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

  function onClickColor() {
    gsap.to(cursor.current, {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
  }

  function changeCursorColor(element) {
    cursor.current.style.backgroundColor = element.target.value;
  }

  function draw(coord, size, color) {
    socket.emit("drawing", { coord, size, color }, (err, response) => {
      if (err) {
        // console.log(err);
      } else {
        // console.log(response);
      }
    });
    let ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.arc(coord.x, coord.y, size, 0, 2 * Math.PI); // x, y, size
    ctx.fillStyle = color;
    if (selectedTool === 1) ctx.fillStyle = "white";
    ctx.fill();
  }

  function wsDraw(coord, size, color) {
    let ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.arc(coord.x, coord.y, size, 0, 2 * Math.PI); // x, y, size
    ctx.fillStyle = color;
    if (selectedTool === 1) ctx.fillStyle = "white";
    ctx.fill();
  }

  function drawStart(event) {
    let coord = { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY };
    setPenDown(true);
    draw(coord, brushSize, brushColor);
  }

  function readyDraw(event) {
    let coord = { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY };
    if (penDown) {
      // draw
      draw(coord, brushSize, brushColor);
    }
  }

  function endDraw(event) {
    setPenDown(false);
  }

  return (
    loaded && (
      <>
        <span
          id="cursor"
          className="h-6 w-6 bg-white absolute cursor-none select-none border border-black"
          ref={cursor}
        >
          <span className="relative top-6 flex justify-center whitespace-nowrap">
            {displayName(socket.id) ?? "Anonymous"}
          </span>
        </span>
        {Object.keys(cursors).map((userCursor) => (
          <span
            key={userCursor}
            id={userCursor + "cx"}
            className="h-6 w-6 bg-white absolute cursor-none select-none border border-black"
            ref={(ref) => (otherCursors.current[userCursor] = ref)}
          >
            <span className="relative top-6 flex justify-center">
              {displayName(userCursor) ?? "Anonymous"}
            </span>
          </span>
        ))}
        <main className="min-h-screen cursor-none flex flex-col items-center select-none">
          <div className="flex flex-row justify-center p-24 flex-wrap w-full">
            <div className="flex gap-x-1 flex-1 justify-center h-fit">
              <input
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                value={username}
                maxLength={15}
                className="text-black px-2 outline-none py-1 rounded-l-sm"
              />
              <button
                onClick={submitUsername}
                className="bg-white text-black px-2 py-1 rounded-r-sm"
              >
                Confirm
              </button>
              <input
                type="color"
                onChange={changeCursorColor}
                onClick={onClickColor}
                onFocus={(e) => setColorOpen(true)}
                onBlur={(e) => setColorOpen(false)}
              />
            </div>
            <div className="border-white border p-6 grid col-auto h-fit max-h-64 overflow-y-auto">
              <h1>current_users : {users.length}</h1>
              {users.map((user) => (
                <span key={user.id}>{user.username}</span>
              ))}
            </div>
          </div>
          <div className="w-full justify-center grid auto-cols-auto">
            <canvas
              width="1080px"
              height="512px"
              className="bg-white"
              onMouseDown={drawStart}
              onMouseMove={readyDraw}
              onMouseLeave={(e) => setPenDown(false)}
              onMouseUp={endDraw}
              ref={canvasRef}
            />
            <div>
              <input
                type="range"
                min={1}
                max={25}
                step={0.5}
                value={brushSize}
                onChange={(e) => setBrushSize(e.target.value)}
                className="w-32"
              />
              <input
                type="color"
                onChange={(e) => setBrushColor(e.target.value)}
              />
              <span
                className={selectedTool === 0 ? "border border-white" : ""}
                onClick={(e) => setSelectedTool(0)}
              >
                Pen
              </span>
              <span
                className={selectedTool === 1 ? "border border-white" : ""}
                onClick={(e) => setSelectedTool(1)}
              >
                Eraser
              </span>
            </div>
          </div>
        </main>
      </>
    )
  );
}
