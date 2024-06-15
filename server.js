const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

let tasks = [];
let idCounter = 1;

const users = [
    { id: 1, username: "realUser", password: "realPassword" },
];

const findUser = (username, password) => {
    return users.find(
        (user) => user.username === username && user.password === password
    );
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, "your_secret_key", (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

// CURD Routes Staarts

// Get all tasks
app.get("/tasks", authenticateToken, (req, res) => {
    let sortedTasks = [...tasks];

    const sortBy = req.query.sortBy;
    if (sortBy === "title") {
        sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "completed") {
        sortedTasks.sort((a, b) => a.completed - b.completed);
    }

    const filterBy = req.query.filterBy;
    if (filterBy === "completed") {
        sortedTasks = sortedTasks.filter((task) => task.completed);
    }

    res.json(sortedTasks);
});

app.get("/tasks/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const task = tasks.find((task) => task.id == id);

    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
});

app.post("/tasks", authenticateToken, (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        return res
            .status(400)
            .json({ message: "Title and description are required" });
    }

    const newTask = { id: idCounter++, title, description, completed: false };
    tasks.push(newTask);

    res.status(201).json(newTask);
});

app.put("/tasks/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { title, description, completed } = req.body;
    const task = tasks.find((task) => task.id == id);

    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }

    task.title = title !== undefined ? title : task.title;
    task.description = description !== undefined ? description : task.description;
    task.completed = completed !== undefined ? completed : task.completed;

    res.json(task);
});

app.delete("/tasks/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const taskIndex = tasks.findIndex((task) => task.id == id);

    if (taskIndex === -1) {
        return res.status(404).json({ message: "Task not found" });
    }

    tasks.splice(taskIndex, 1);
    res.status(204).end();
});

// CURD Routes end


// Login route Starts
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const user = findUser(username, password);

    if (!user) {
        return res.status(401).json({ message: "Authentication failed" });
    }

    const accessToken = jwt.sign({ username: user.username }, "your_secret_key");
    res.json({ accessToken });
});


// Login route end

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal Server Error" });
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});