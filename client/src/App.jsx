import { useState, useEffect } from "react";
import socket from "./socket";
import Game from "./components/Game";

function App() {

  const [name, setName] = useState("");

  const [room, setRoom] = useState("");

  const [inviteLink, setInviteLink] = useState("");

  const [rounds, setRounds] = useState(3);

  const [drawTime, setDrawTime] = useState(60);

  const [players, setPlayers] = useState([]);

  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {

    const params =
      new URLSearchParams(window.location.search);

    const roomFromURL =
      params.get("room");

    if (roomFromURL) {

      setRoom(roomFromURL);

    }

    socket.on("room_data", (data) => {

      setPlayers(data.players);

    });

    socket.on("connect", () => {

      console.log("Connected to server");

    });

    return () => {

      socket.off("room_data");

      socket.off("connect");

    };

  }, []);

  const createRoom = () => {

    if (!name || !room) {

      alert("Enter name and room id");

      return;

    }

    socket.emit("create_room", {
      roomId: room,
      playerName: name,
    });

    const link =
      `${window.location.origin}/?room=${room}`;

    setInviteLink(link);

  };

  const joinRoom = () => {

    if (!name || !room) {

      alert("Enter name and room id");

      return;

    }

    socket.emit("join_room", {
      roomId: room,
      playerName: name,
    });

  };

  const startGame = () => {

    socket.emit("start_game", {
      roomId: room,
      rounds,
      drawTime,
    });

    setGameStarted(true);

  };

  return (
    <div
      style={{
        padding: "20px",
        textAlign: "center",
        color: "white",
        background:
          "linear-gradient(to right, #141e30, #243b55)",
        minHeight: "100vh",
        fontFamily: "Arial",
      }}
    >

      <h1
        style={{
          fontSize: "48px",
          marginBottom: "30px",
        }}
      >
        🎨 Skribbl Clone
      </h1>

      <div
        style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          padding: "30px",
          borderRadius: "16px",
          width: "350px",
          marginInline: "auto",
        }}
      >

        <input
          placeholder="Enter name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          style={{
            padding: "14px",
            marginBottom: "15px",
            width: "90%",
            borderRadius: "10px",
            border: "none",
            outline: "none",
          }}
        />

        <input
          placeholder="Room ID"
          value={room}
          onChange={(e) =>
            setRoom(e.target.value)
          }
          style={{
            padding: "14px",
            marginBottom: "20px",
            width: "90%",
            borderRadius: "10px",
            border: "none",
            outline: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >

          <button
            onClick={createRoom}
            style={{
              padding: "12px 20px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#00b894",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Create Room
          </button>

          <button
            onClick={joinRoom}
            style={{
              padding: "12px 20px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#0984e3",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Join Room
          </button>

        </div>

        <div
          style={{
            marginTop: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >

          <div>

            <label>
              Rounds:
            </label>

            <select
              value={rounds}
              onChange={(e) =>
                setRounds(
                  Number(e.target.value)
                )
              }
              style={{
                marginLeft: "10px",
                padding: "8px",
                borderRadius: "8px",
              }}
            >

              <option value={3}>
                3
              </option>

              <option value={5}>
                5
              </option>

              <option value={7}>
                7
              </option>

            </select>

          </div>

          <div>

            <label>
              Draw Time:
            </label>

            <select
              value={drawTime}
              onChange={(e) =>
                setDrawTime(
                  Number(e.target.value)
                )
              }
              style={{
                marginLeft: "10px",
                padding: "8px",
                borderRadius: "8px",
              }}
            >

              <option value={30}>
                30 sec
              </option>

              <option value={60}>
                60 sec
              </option>

              <option value={90}>
                90 sec
              </option>

            </select>

          </div>

        </div>

        {inviteLink && (

          <div
            style={{
              marginTop: "20px",
              background:
                "rgba(255,255,255,0.08)",
              padding: "15px",
              borderRadius: "10px",
              wordBreak: "break-all",
            }}
          >

            <p
              style={{
                marginBottom: "10px",
              }}
            >
              Invite Link:
            </p>

            <a
              href={inviteLink}
              target="_blank"
              style={{
                color: "#74b9ff",
              }}
            >
              {inviteLink}
            </a>

          </div>

        )}

        <button
          onClick={startGame}
          style={{
            padding: "14px 24px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#fdcb6e",
            color: "black",
            cursor: "pointer",
            fontWeight: "bold",
            marginTop: "20px",
          }}
        >
          Start Game
        </button>

      </div>

      <div
        style={{
          marginTop: "30px",
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          padding: "20px",
          borderRadius: "16px",
          width: "300px",
          marginInline: "auto",
        }}
      >

        <h2>👥 Players</h2>

        {players.map((player) => (

          <p key={player.id}>
            {player.name}
          </p>

        ))}

      </div>

      {gameStarted && (

        <Game
          playerName={name}
          roomId={room}
        />

      )}

    </div>
  );
}

export default App;