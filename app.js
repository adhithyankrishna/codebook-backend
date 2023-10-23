const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { exec, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send(
    `<html><body bgcolor="#79898a"><center><h1><br><br><br>Server code is running </h1></center></body></html>`
  );
});

const clientSockets = new Map(); 
const clientProcesses = new Map(); 

io.on("connection", (socket) => {
  console.log("Welcome");

  
  socket.on("join", (clientId) => {
    console.log(clientId);
    clientSockets.set(clientId, socket);

    socket.on("javacode", (javacode) => {
      console.log(socket.id);
      const userDirectory = path.join(__dirname, clientId);

      if (!fs.existsSync(userDirectory)) {
        fs.mkdirSync(userDirectory);
      }

      if (javacode.is === "1") {
        fs.writeFileSync(path.join(userDirectory, "Main.java"), javacode.code);
        process.chdir(userDirectory);

        
        const javaProcess = spawn("java", ["Main"]);
        clientProcesses.set(clientId, javaProcess);

        javaProcess.stdout.on("data", (data) => {
          console.log(data.toString());
          socket.emit("javaoutput", { output: data.toString() });
        });

        javaProcess.stderr.on("data", (data) => {
          console.log(data.toString());
          socket.emit(`Error`, { Error: data.toString() });
        });

        javaProcess.on("close", () => {
          console.log(data.toString());
          clientProcesses.delete(clientId);
        });

        
        socket.on("userinput", (input) => {
          javaProcess.stdin.write(input + "\n");
        });
      }
    });

    socket.on("disconnect", () => {
      const javaProcess = clientProcesses.get(clientId);
      if (javaProcess) {
        javaProcess.kill(); 
      }
      clientProcesses.delete(clientId);
      clientSockets.delete(clientId);
    });
  });
});

server.listen(3001, () => {
  console.log("Server is running on port 3001");
});
