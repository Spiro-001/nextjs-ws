import React, { useState } from "react";

function Home(props) {
  return (
    <>
      <head>
        <link rel="stylesheet" href="css/styles.css" />
        <script type="module" src="js/app.js"></script>
      </head>
      <form method="GET">
        <input type="submit" value="Refresh" />
      </form>
      <div className="main">
        <h1>Socket.io command logs</h1>
        <div className="user-info">
          <span className="num-of-users">
            active-users : {props.numberOfUsers}
          </span>
          <table className="user-list">
            <tr className="top-h">
              <th>id</th>
              <th>username</th>
              <th>current_room</th>
              <th>time_joined</th>
            </tr>
            {props.users.map((user) => (
              <tr className="user" key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.room}</td>
                <td>{user.time.toString()}</td>
              </tr>
            ))}
          </table>
        </div>
        <div className="commands">
          <table className="command-list">
            <tr className="top-h">
              <th>user</th>
              <th>command</th>
              <th>time_init</th>
            </tr>
            {props.commands.map((command) => (
              <tr key={command.user}>
                <td>{command.user}</td>
                <td id={command.type}>{command.type}</td>
                <td>{command.timeInit.toString()}</td>
              </tr>
            ))}
          </table>
        </div>
      </div>
    </>
  );
}

module.exports = Home;
