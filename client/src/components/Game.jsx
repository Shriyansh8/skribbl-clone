import { useEffect, useRef, useState } from "react";
import socket from "../socket";

function Game({ playerName, roomId }) {

  const canvasRef = useRef(null);

  const ctxRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);

  const [color, setColor] = useState("#000000");

  const [brushSize, setBrushSize] = useState(5);

  const [isErasing, setIsErasing] = useState(false);

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([]);

  const [drawerId, setDrawerId] = useState("");

  const [drawerName, setDrawerName] = useState("");

  const [displayWord, setDisplayWord] = useState("");

  const [scores, setScores] = useState({});

  const [timeLeft, setTimeLeft] = useState(60);

  const [winner, setWinner] = useState("");

  const [round, setRound] = useState(1);

  const [wordChoices, setWordChoices] = useState([]);

  const [strokes, setStrokes] = useState([]);

  const currentStroke = useRef([]);

  useEffect(() => {

    const canvas = canvasRef.current;

    canvas.width = 900;

    canvas.height = 500;

    const ctx = canvas.getContext("2d");

    ctx.lineCap = "round";

    ctx.strokeStyle = color;

    ctx.lineWidth = brushSize;

    ctxRef.current = ctx;

  }, []);

  useEffect(() => {

    if (isErasing) {

      ctxRef.current.strokeStyle = "white";

    }

    else {

      ctxRef.current.strokeStyle = color;

    }

  }, [color, isErasing]);

  useEffect(() => {

    ctxRef.current.lineWidth = brushSize;

  }, [brushSize]);

  const redrawCanvas = (allStrokes) => {

    const canvas = canvasRef.current;

    const ctx = ctxRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    allStrokes.forEach((stroke) => {

      ctx.beginPath();

      stroke.forEach((point, index) => {

        ctx.strokeStyle = point.color;

        ctx.lineWidth = point.brushSize;

        if (index === 0) {

          ctx.moveTo(point.x, point.y);

        }

        else {

          ctx.lineTo(point.x, point.y);

        }

      });

      ctx.stroke();

      ctx.closePath();

    });

  };

  const startDrawing = (e) => {

    if (socket.id !== drawerId) return;

    setIsDrawing(true);

    const rect =
      canvasRef.current.getBoundingClientRect();

    const x = e.clientX - rect.left;

    const y = e.clientY - rect.top;

    currentStroke.current = [
      {
        x,
        y,
        color: isErasing ? "white" : color,
        brushSize,
      }
    ];

    ctxRef.current.beginPath();

    ctxRef.current.moveTo(x, y);

    socket.emit("draw_start", {
      roomId,
      x,
      y,
      color: isErasing ? "white" : color,
      brushSize,
    });

  };

  const draw = (e) => {

    if (!isDrawing) return;

    const rect =
      canvasRef.current.getBoundingClientRect();

    const x = e.clientX - rect.left;

    const y = e.clientY - rect.top;

    currentStroke.current.push({
      x,
      y,
      color: isErasing ? "white" : color,
      brushSize,
    });

    ctxRef.current.lineTo(x, y);

    ctxRef.current.stroke();

    socket.emit("draw_move", {
      roomId,
      x,
      y,
      color: isErasing ? "white" : color,
      brushSize,
    });

  };

  const stopDrawing = () => {

    if (!isDrawing) return;

    setIsDrawing(false);

    ctxRef.current.closePath();

    setStrokes((prev) => [
      ...prev,
      currentStroke.current,
    ]);

    socket.emit("draw_end", {
      roomId,
    });

  };

  const undoLastStroke = () => {

    if (socket.id !== drawerId) return;

    const updatedStrokes = [...strokes];

    updatedStrokes.pop();

    setStrokes(updatedStrokes);

    redrawCanvas(updatedStrokes);

    socket.emit("draw_undo", {
      roomId,
    });

  };

  useEffect(() => {

    socket.on("undo_last_stroke", () => {

      setStrokes((prev) => {

        const updated = [...prev];

        updated.pop();

        redrawCanvas(updated);

        return updated;

      });

    });

    return () => {

      socket.off("undo_last_stroke");

    };

  }, []);

  useEffect(() => {

    socket.on("draw_data", ({
      x,
      y,
      type,
      color,
      brushSize,
    }) => {

      ctxRef.current.strokeStyle =
        color || "#000000";

      ctxRef.current.lineWidth =
        brushSize || 5;

      if (type === "start") {

        ctxRef.current.beginPath();

        ctxRef.current.moveTo(x, y);

      }

      else if (type === "move") {

        ctxRef.current.lineTo(x, y);

        ctxRef.current.stroke();

      }

      else if (type === "end") {

        ctxRef.current.closePath();

      }

    });

    return () => {

      socket.off("draw_data");

    };

  }, []);

  const clearCanvas = () => {

    if (socket.id !== drawerId) return;

    const canvas = canvasRef.current;

    const ctx = ctxRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    setStrokes([]);

    socket.emit("clear_canvas", {
      roomId,
    });

  };

  useEffect(() => {

    socket.on("canvas_cleared", () => {

      const canvas = canvasRef.current;

      const ctx = ctxRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      setStrokes([]);

    });

    return () => {

      socket.off("canvas_cleared");

    };

  }, []);

  useEffect(() => {

    socket.on("chat_message", (data) => {

      setMessages((prev) => [...prev, data]);

    });

    return () => {

      socket.off("chat_message");

    };

  }, []);

  useEffect(() => {

    socket.on("score_update", (updatedScores) => {

      setScores(updatedScores);

    });

    return () => {

      socket.off("score_update");

    };

  }, []);

  useEffect(() => {

    socket.on("timer_update", (time) => {

      setTimeLeft(time);

    });

    return () => {

      socket.off("timer_update");

    };

  }, []);

  useEffect(() => {

    socket.on("game_started", (data) => {

      setDrawerId(data.drawerId);

      setDrawerName(data.drawerName);

      setScores(data.scores);

      setTimeLeft(data.timeLeft);

      setRound(data.round);

      setWinner("");

      const canvas = canvasRef.current;

      const ctx = ctxRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      setStrokes([]);

      if (socket.id === data.drawerId) {

        setDisplayWord(data.word);

      }

      else {

        setDisplayWord(
          "_ ".repeat(data.word.length)
        );

      }

    });

    return () => {

      socket.off("game_started");

    };

  }, []);

  useEffect(() => {

    socket.on("choose_word", (words) => {

      setWordChoices(words);

    });

    return () => {

      socket.off("choose_word");

    };

  }, []);

  useEffect(() => {

    socket.on("game_over", ({ winner }) => {

      setWinner(winner);

    });

    return () => {

      socket.off("game_over");

    };

  }, []);

  const selectWord = (word) => {

    socket.emit("word_selected", {
      roomId,
      selectedWord: word,
    });

    setWordChoices([]);

  };

  const sendMessage = () => {

    if (!message.trim()) return;

    socket.emit("send_message", {
      roomId,
      text: message,
      playerName,
    });

    setMessage("");

  };

  return (
    <div
      style={{
        marginTop: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
      }}
    >

      {wordChoices.length > 0 && (

        <div
          style={{
            background: "rgba(0,0,0,0.7)",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >

          <div
            style={{
              background: "#1e272e",
              padding: "40px",
              borderRadius: "16px",
              textAlign: "center",
            }}
          >

            <h1
              style={{
                marginBottom: "20px",
              }}
            >
              Choose a Word
            </h1>

            <div
              style={{
                display: "flex",
                gap: "15px",
              }}
            >

              {wordChoices.map((word) => (

                <button
                  key={word}
                  onClick={() => selectWord(word)}
                  style={{
                    padding: "14px 24px",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    backgroundColor: "#00cec9",
                    color: "white",
                    fontSize: "18px",
                  }}
                >
                  {word}
                </button>

              ))}

            </div>

          </div>

        </div>

      )}

      <div
        style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          border:
            "1px solid rgba(255,255,255,0.15)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.3)",
          padding: "20px",
          borderRadius: "16px",
          width: "900px",
          maxWidth: "95%",
        }}
      >

        <h2>🎮 Round: {round}</h2>

        <h3>✏️ Drawer: {drawerName}</h3>

        <h3>🔤 Word: {displayWord}</h3>

        <h3>⏳ Time Left: {timeLeft}s</h3>

        {winner && (

          <h1
            style={{
              color: "#ffeaa7",
            }}
          >
            🏆 Winner: {winner}
          </h1>

        )}

      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          border:
            "1px solid rgba(255,255,255,0.15)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.3)",
          padding: "20px",
          borderRadius: "16px",
          display: "flex",
          gap: "15px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >

        <input
          type="color"
          value={color}
          onChange={(e) =>
            setColor(e.target.value)
          }
          disabled={socket.id !== drawerId}
        />

        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) =>
            setBrushSize(e.target.value)
          }
          disabled={socket.id !== drawerId}
        />

        <button
          onClick={() =>
            setIsErasing(!isErasing)
          }
          disabled={socket.id !== drawerId}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            backgroundColor: isErasing
              ? "#d63031"
              : "#636e72",
            color: "white",
            fontWeight: "bold",
            transition: "0.2s",
          }}
        >
          {isErasing
            ? "Drawing Mode"
            : "Eraser"}
        </button>

        <button
          onClick={undoLastStroke}
          disabled={socket.id !== drawerId}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "0.2s",
          }}
        >
          Undo
        </button>

        <button
          onClick={clearCanvas}
          disabled={socket.id !== drawerId}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "0.2s",
          }}
        >
          Clear Canvas
        </button>

      </div>

      <canvas
        ref={canvasRef}
        style={{
          border:
            "5px solid rgba(255,255,255,0.2)",
          backgroundColor: "white",
          borderRadius: "16px",
          cursor: "crosshair",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.4)",
          maxWidth: "100%",
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />

      <div
        style={{
          width: "900px",
          maxWidth: "95%",
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          border:
            "1px solid rgba(255,255,255,0.15)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.3)",
          padding: "20px",
          borderRadius: "16px",
        }}
      >

        <h2
          style={{
            fontSize: "32px",
            marginBottom: "15px",
          }}
        >
          🏆 Scoreboard
        </h2>

        {Object.entries(scores)
          .sort((a, b) => b[1] - a[1])
          .map(([player, score]) => (

            <div
              key={player}
              style={{
                display: "flex",
                justifyContent: "space-between",
                background:
                  "rgba(255,255,255,0.08)",
                padding: "12px",
                borderRadius: "10px",
                marginBottom: "10px",
              }}
            >

              <span>{player}</span>

              <span>{score} pts</span>

            </div>

          ))}

        <h2
          style={{
            fontSize: "30px",
            marginBottom: "15px",
            marginTop: "25px",
          }}
        >
          💬 Chat
        </h2>

        <div
          style={{
            background: "rgba(0,0,0,0.35)",
            height: "220px",
            overflowY: "scroll",
            padding: "10px",
            textAlign: "left",
            borderRadius: "10px",
          }}
        >

          {messages.map((msg, index) => (

            <p
              key={index}
              style={{
                padding: "8px",
                marginBottom: "8px",
                borderBottom:
                  "1px solid rgba(255,255,255,0.1)",
              }}
            >

              <strong>
                {msg.playerName}:
              </strong>

              {" "}

              {msg.text}

            </p>

          ))}

        </div>

        <div
          style={{
            marginTop: "15px",
            display: "flex",
            gap: "10px",
          }}
        >

          <input
            type="text"
            placeholder="Type guess or message..."
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            onKeyDown={(e) => {

              if (e.key === "Enter") {

                sendMessage();

              }

            }}
            style={{
              padding: "14px",
              flex: 1,
              borderRadius: "10px",
              border: "none",
              outline: "none",
            }}
          />

          <button
            onClick={sendMessage}
            style={{
              padding: "14px 24px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              backgroundColor: "#00cec9",
              color: "white",
              fontWeight: "bold",
              transition: "0.2s",
            }}
          >
            Send
          </button>

        </div>

      </div>

    </div>
  );
}

export default Game;