require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.user}:${process.env.pass}@cluster0.006kz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("ParcelPro");
    const UserCollection = db.collection("users");

    // Middleware to verify JWT
    const verifyToken = (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
      }
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.secret_key);
        req.user = decoded;
        next();
      } catch (error) {
        res.status(403).json({ message: "Invalid or expired token" });
      }
    };

    // Admin Check Route
    app.get("/admin", verifyToken, async (req, res) => {
      const email = req.user.email; // Extract email from token
      try {
        const user = await UserCollection.findOne({ email });
        if (user && user.role === "admin") {
          res.json({ isAdmin: true, message: "User is an admin" });
        } else {
          res
            .status(403)
            .json({
              isAdmin: false,
              message: "Access denied. User is not an admin.",
            });
        }
      } catch (error) {
        res.status(500).json({ error: "Error checking admin status" });
      }
    });

    // Other Routes...
    app.get("/users", async (req, res) => {
      try {
        const users = await UserCollection.find().toArray();
        res.json(users);
      } catch (error) {
        res.status(500).json({ error: "Error fetching users" });
      }
    });

    app.post("/users", async (req, res) => {
      const { email, displayName, photoURL } = req.body;
      try {
        const existingUser = await UserCollection.findOne({ email });
        if (existingUser) {
          return res.status(409).json({ message: "User already exists" });
        }
        const result = await UserCollection.insertOne({
          email,
          displayName,
          photoURL,
          role: "customer",
        });
        res.json({ message: "User created successfully", result });
      } catch (error) {
        res.status(500).json({ error: "Error creating user" });
      }
    });

    app.patch("/users/:id", async (req, res) => {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }

      try {
        const result = await UserCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { role } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "Role updated successfully" });
      } catch (error) {
        res.status(500).json({ error: "Error updating role" });
      }
    });
    // Fetch a user by email
    app.get("/adminUsers", async (req, res) => {
      const email = req.query.email; // Read email from query params
      try {
        const user = await UserCollection.findOne({ email });
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
      } catch (error) {
        res.status(500).json({ error: "Error fetching user" });
      }
    });

    app.delete("/users/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const result = await UserCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User deleted successfully" });
      } catch (error) {
        res.status(500).json({ error: "Error deleting user" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } finally {
    // Do not close the client for production apps
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to the ParcelPro Server!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
