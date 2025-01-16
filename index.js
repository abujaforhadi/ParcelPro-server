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
    const ParcelCollection = db.collection("parcels");

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

    app.post("/bookparcel", async (req, res) => {
      try {
        const parcelData = req.body;

        parcelData.status = "pending";
        parcelData.bookingDate = new Date().toISOString().split("T")[0];

        const result = await ParcelCollection.insertOne(parcelData);
        res.status(200).json({ message: "Parcel booked successfully", result });
      } catch (error) {
        console.error("Error booking parcel:", error);
        res.status(500).json({ message: "Failed to book parcel" });
      }
    });

    app.patch("/parcels/:id", async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;

      if (
        !["pending", "on the way", "delivered", "canceled"].includes(status)
      ) {
        return res.status(400).json({ message: "Invalid status" });
      }

      try {
        const result = await ParcelCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "Parcel not found" });
        }

        res.json({ message: "Parcel status updated successfully" });
      } catch (error) {
        res.status(500).json({ message: "Failed to update parcel status" });
      }
    });

    app.get("/myparcels", async (req, res) => {
      const { email } = req.query;
      // console.log(email);
      try {
        const parcels = await ParcelCollection.find({ email }).toArray();
        res.status(200).json(parcels);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch parcels" });
      }
    });

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
    app.get("/adminUsers", async (req, res) => {
      const email = req.query.email;
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

    //admin logic

    app.get("/admin/stats", async (req, res) => {
      try {
        // Aggregate bookings by date
        const bookingsByDate = await ParcelCollection.aggregate([
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$bookingDate" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } }, // Sort by date
        ]).toArray();

        // Aggregate comparison between booked and delivered parcels per day
        const parcelsComparison = await ParcelCollection.aggregate([
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$bookingDate" },
              },
              booked: { $sum: 1 },
              delivered: {
                $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
              },
            },
          },
          { $sort: { _id: 1 } }, // Sort by date
        ]).toArray();

        // Format the data for the front-end
        const formattedBookingsByDate = bookingsByDate.map((entry) => ({
          date: entry._id,
          bookings: entry.count,
        }));

        const formattedParcelsComparison = parcelsComparison.map((entry) => ({
          date: entry._id,
          booked: entry.booked,
          delivered: entry.delivered,
        }));

        res.status(200).json({
          bookingsByDate: formattedBookingsByDate,
          parcelsComparison: formattedParcelsComparison,
        });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch statistics" });
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
