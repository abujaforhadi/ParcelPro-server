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
    // await client.connect();
    const db = client.db("ParcelPro");
    const UserCollection = db.collection("users");
    const ParcelCollection = db.collection("parcels");
    const ReviewCollection = db.collection("reviews");

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

    app.put("/updateparcels/:id", async (req, res) => {
      const { id } = req.params;
      const updateFields = req.body;
      delete updateFields._id;

      try {
        const result = await ParcelCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateFields }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "Parcel not found" });
        }

        res.status(200).json({ message: "Parcel updated successfully" });
      } catch (error) {
        console.error("Error updating parcel:", error);
        res.status(500).json({ message: "Failed to update parcel", error });
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
    app.get("/myreviews", async (req, res) => {
      const { deliveryManId } = req.query;

      // console.log(deliveryManId); // Debugging the deliveryManId

      try {
        const reviews = await ReviewCollection.find({
          deliveryManId: new ObjectId(deliveryManId),
        }).toArray();
        res.status(200).json(reviews);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch reviews", error });
      }
    });

    app.get("/allparcels", async (req, res) => {
      const { startDate, endDate } = req.query;
      const filter = {};

      if (startDate && endDate) {
        filter.requestedDeliveryDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      try {
        const parcels = await ParcelCollection.find(filter).toArray();
        res.status(200).json(parcels);
      } catch (error) {
        res.status(500).json({ message: "Error fetching parcels" });
      }
    });

    // Endpoint to update parcel with delivery man and status
    app.put("/updateparcel/:id", async (req, res) => {
      const { id } = req.params;
      const { status, deliveryMenId, approximateDeliveryDate } = req.body;
      // console.log(status, deliveryMenId);

      try {
        const result = await ParcelCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status,
              deliveryMenId,
              approximateDeliveryDate,
            },
          }
        );

        res
          .status(200)
          .json({ message: "Parcel updated successfully", result });
      } catch (error) {
        res.status(500).json({ message: "Error updating parcel" });
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
    app.get("/totaluser", async (req, res) => {
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
    // Backend Route to Update User Information
    app.patch("/userupdate/:id", async (req, res) => {
      const { id } = req.params; 
      const updatedData = req.body; 

      try {
        const result = await UserCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User updated successfully", result });
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update user", error });
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
        const bookingsByDate = await ParcelCollection.aggregate([
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$bookingDate" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]).toArray();

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
          { $sort: { _id: 1 } },
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

    // Review endpoints
    app.post("/reviews", async (req, res) => {
      const { deliveryManId, giverName, giverImage, rating, feedback } =
        req.body;

      if (!deliveryManId || !rating || !feedback) {
        return res.status(400).json({ message: "Required fields are missing" });
      }

      try {
        const review = {
          deliveryManId: new ObjectId(deliveryManId), 
          giverName,
          giverImage,
          rating,
          feedback,
          date: new Date(),
        };

        const result = await ReviewCollection.insertOne(review);
        res.status(200).json({ message: "Review added successfully", result });
      } catch (error) {
        console.error("Failed to add review:", error);
        res.status(500).json({ message: "Failed to add review", error });
      }
    });

    app.get("/allreview", async (req, res) => {
      try {
        const reviews = await ReviewCollection.find().toArray();
        res.status(200).json({ reviews });
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
        res.status(500).json({ message: "Failed to fetch reviews", error });
      }
    });

    app.get("/reviews", async (req, res) => {
      const { deliveryManId } = req.query;
      // console.log(deliveryManId);

      if (!deliveryManId) {
        return res.status(400).json({ message: "DeliveryManId is required" });
      }

      try {
        const reviews = await ReviewCollection.find({
          deliveryManId: new ObjectId(deliveryManId),
        }).toArray();
        res.status(200).json(reviews);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch reviews", error });
      }
    });

    app.delete("/reviews/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const result = await ReviewCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Review not found" });
        }
        res.json({ message: "Review deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete review", error });
      }
    });

    // await client.db("admin").command({ ping: 1 });
    // console.log("Connected to MongoDB!");
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
