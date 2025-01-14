require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.user}:${process.env.pass}@cluster0.006kz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const db = client.db("ParcelPro");
    const ProductsCollection = db.collection("products");
    const UserCollection = db.collection("users");
    const OrdersCollection = db.collection("orders");

    // store users in db
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
        });
        res.json({
          message: "User created successfully",
          result: result.insertedId,
        });
      } catch (error) {
        res.status(500).json({ error: "error  creating user" });
      }
    });

    // show users from db
    app.get("/users", async (req, res) => {
      try {
        const users = await UserCollection.find().toArray();
        res.json(users);
      } catch (error) {
        res.status(500).json({ error: "error fetching users" });
      }
    });

    app.post("/logout", (req, res) => {
      res
        .status(200)
        .send({ success: true });
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to the ParcelPro Server!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
