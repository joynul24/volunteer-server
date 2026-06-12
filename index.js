import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";

dotenv.config();

const app = express();
app.use(cors({
  origin: ["http://localhost:5173", "https://volunteer-server-smfv.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// =======================
// ENV CHECK
// =======================
const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("❌ MONGODB_URI is missing in environment variables");
}

// =======================
// MONGO CLIENT
// =======================
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// =======================
// LAZY DB CONNECTION (IMPORTANT FOR VERCEL)
// =======================
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("volunteerDB");
    console.log("✅ MongoDB Connected");
  }
  return db;
}

// =======================
// TEST ROUTE
// =======================
app.get("/", (req, res) => {
  res.send("🚀 Volunteer Server Running Successfully");
});

// =======================
// POSTS API
// =======================

// GET ALL POSTS
app.get("/posts", async (req, res) => {
  try {
    const db = await connectDB();
    const posts = db.collection("posts");

    const { search, limit } = req.query;

    let query = {};

    if (search) {
      query = {
        title: {
          $regex: search,
          $options: "i",
        },
      };
    }

    let cursor = posts.find(query).sort({ deadline: 1 });

    if (limit) {
      cursor = cursor.limit(parseInt(limit));
    }

    const result = await cursor.toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});



app.get("/posts/my-posts", async (req, res) => {
  try {
    const db = await connectDB();
    const posts = db.collection("posts");

    const email = req.query.email;

    if (!email) {
      return res.status(400).send({ error: "Email required" });
    }

    const result = await posts
      .find({ organizerEmail: email })
      .toArray();

    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});


// GET SINGLE POST
app.get("/posts/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const posts = db.collection("posts");

    const result = await posts.findOne({
      _id: new ObjectId(req.params.id),
    });

    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// CREATE POST
app.post("/posts", async (req, res) => {
  try {
    const db = await connectDB();
    const posts = db.collection("posts");

    const result = await posts.insertOne(req.body);
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// UPDATE POST
app.put("/posts/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const posts = db.collection("posts");

    const updated = req.body;

    const result = await posts.updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          title: updated.title,
          thumbnail: updated.thumbnail,
          description: updated.description,
          category: updated.category,
          location: updated.location,
          volunteersNeeded: parseInt(updated.volunteersNeeded),
          deadline: updated.deadline,
        },
      }
    );

    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// DELETE POST
app.delete("/posts/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const posts = db.collection("posts");

    const result = await posts.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// =======================
// REQUESTS API
// =======================

// GET REQUESTS
app.get("/requests", async (req, res) => {
  try {
    const db = await connectDB();
    const requests = db.collection("requests");

    const email = req.query.email;

    if (!email) {
      return res.status(400).send({ error: "Email required" });
    }

    const result = await requests.find({ volunteerEmail: email }).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// CREATE REQUEST
app.post("/requests", async (req, res) => {
  try {
    const db = await connectDB();
    const posts = db.collection("posts");
    const requests = db.collection("requests");

    const data = req.body;

    // prevent duplicate
    const existing = await requests.findOne({
      postId: data.postId,
      volunteerEmail: data.volunteerEmail,
    });

    if (existing) {
      return res.status(400).send({ error: "Already requested" });
    }

    // check post
    const post = await posts.findOne({
      _id: new ObjectId(data.postId),
    });

    if (!post || post.volunteersNeeded <= 0) {
      return res.status(400).send({ error: "No slots available" });
    }

    // decrease slot
    await posts.updateOne(
      { _id: new ObjectId(data.postId) },
      { $inc: { volunteersNeeded: -1 } }
    );

    const result = await requests.insertOne(data);

    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// DELETE REQUEST
app.delete("/requests/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const posts = db.collection("posts");
    const requests = db.collection("requests");

    const requestDoc = await requests.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (requestDoc) {
      await posts.updateOne(
        { _id: new ObjectId(requestDoc.postId) },
        { $inc: { volunteersNeeded: 1 } }
      );
    }

    const result = await requests.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// =======================
// EXPORT (IMPORTANT FOR VERCEL)
// =======================
export default app;