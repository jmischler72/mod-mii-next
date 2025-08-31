const express = require("express");

const app = express();
app.use(express.json());

app.get("/ping", (req, res) => {
    res.json({ message: "pong" });
});

// /modmii endpoint: calls modmii-wrapper's runCommandWithOutput with arbitrary args
app.post("/modmii", async (req, res) => {
    const { args = "", outputStr = undefined, debug = false } = req.body;
    try {
        // Dynamically import the TypeScript wrapper
        const modmii = await import("./modmii-wrapper.js");
        const result = await modmii.runCommandWithOutput(args, outputStr, debug);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message || err.toString() });
    }
});

app.listen(4000, () => console.log("Executor API running on port 4000"));
