// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";

// dotenv.config();

// const app = express();
// const port = process.env.PORT || 3000;

// app.use(cors());
// app.use(express.json());

// // MongoDB
// const uri = process.env.MONGODB_URI;

// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// async function run() {
//   try {
//     await client.connect();

//     const db = client.db("volunteerDB");
//     const postsCollection = db.collection("posts");
//     const requestsCollection = db.collection("requests");

//     console.log("✅ MongoDB Connected");

//     // =========================
//     // POSTS API
//     // =========================

//     app.get("/posts", async (req, res) => {
//       const { search, limit } = req.query;

//       let query = {};

//       if (search) {
//         query = {
//           title: {
//             $regex: search,
//             $options: "i",
//           },
//         };
//       }

//       let cursor = postsCollection.find(query).sort({ deadline: 1 });

//       if (limit) {
//         cursor = cursor.limit(parseInt(limit));
//       }

//       const result = await cursor.toArray();
//       res.send(result);
//     });

//     app.get("/posts/my-posts", async (req, res) => {
//       const email = req.query.email;

//       const result = await postsCollection
//         .find({ organizerEmail: email })
//         .toArray();

//       res.send(result);
//     });

//     app.get("/posts/:id", async (req, res) => {
//       const id = req.params.id;

//       const result = await postsCollection.findOne({
//         _id: new ObjectId(id),
//       });

//       res.send(result);
//     });

//     app.post("/posts", async (req, res) => {
//       const post = req.body;

//       const result = await postsCollection.insertOne(post);

//       res.send(result);
//     });

//     app.put("/posts/:id", async (req, res) => {
//       const id = req.params.id;
//       const updatedPost = req.body;

//       const result = await postsCollection.updateOne(
//         { _id: new ObjectId(id) },
//         {
//           $set: {
//             title: updatedPost.title,
//             thumbnail: updatedPost.thumbnail,
//             description: updatedPost.description,
//             category: updatedPost.category,
//             location: updatedPost.location,
//             volunteersNeeded: parseInt(
//               updatedPost.volunteersNeeded
//             ),
//             deadline: updatedPost.deadline,
//           },
//         }
//       );

//       res.send(result);
//     });

//     app.delete("/posts/:id", async (req, res) => {
//       const id = req.params.id;

//       const result = await postsCollection.deleteOne({
//         _id: new ObjectId(id),
//       });

//       res.send(result);
//     });

//     // =========================
//     // REQUESTS API
//     // =========================

//     app.get("/requests", async (req, res) => {
//       const email = req.query.email;

//       const result = await requestsCollection
//         .find({ volunteerEmail: email })
//         .toArray();

//       res.send(result);
//     });

//     app.post("/requests", async (req, res) => {
//       const requestData = req.body;

//       await postsCollection.updateOne(
//         { _id: new ObjectId(requestData.postId) },
//         {
//           $inc: {
//             volunteersNeeded: -1,
//           },
//         }
//       );

//       const result = await requestsCollection.insertOne(
//         requestData
//       );

//       res.send(result);
//     });

//     app.delete("/requests/:id", async (req, res) => {
//       const id = req.params.id;

//       const requestDoc = await requestsCollection.findOne({
//         _id: new ObjectId(id),
//       });

//       if (requestDoc) {
//         await postsCollection.updateOne(
//           { _id: new ObjectId(requestDoc.postId) },
//           {
//             $inc: {
//               volunteersNeeded: 1,
//             },
//           }
//         );
//       }

//       const result = await requestsCollection.deleteOne({
//         _id: new ObjectId(id),
//       });

//       res.send(result);
//     });

//   } catch (error) {
//     console.log(error);
//   }
// }

// run();

// app.get("/", (req, res) => {
//   res.send("Volunteer Server Running");
// });

// app.listen(port, () => {
//   console.log(`🚀 Server running on port ${port}`);
// });










import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("❌ MONGODB_URI is missing in .env");
  process.exit(1);
}

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
    console.log("✅ MongoDB Connected Successfully");

    const db = client.db("volunteerDB");
    const postsCollection = db.collection("posts");
    const requestsCollection = db.collection("requests");

    // =========================
    // POSTS API
    // =========================

    app.get("/posts", async (req, res) => {
      try {
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

        let cursor = postsCollection.find(query).sort({ deadline: 1 });

        if (limit) {
          cursor = cursor.limit(parseInt(limit));
        }

        const result = await cursor.toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to get posts" });
      }
    });

    app.get("/posts/my-posts", async (req, res) => {
      try {
        const email = req.query.email;

        if (!email) {
          return res.status(400).send({ message: "Email required" });
        }

        const result = await postsCollection
          .find({ organizerEmail: email })
          .toArray();

        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Error fetching my posts" });
      }
    });

    app.get("/posts/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await postsCollection.findOne({
          _id: new ObjectId(id),
        });

        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Invalid post ID" });
      }
    });

    app.post("/posts", async (req, res) => {
      try {
        const post = req.body;

        const result = await postsCollection.insertOne(post);

        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to create post" });
      }
    });

    app.put("/posts/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedPost = req.body;

        const result = await postsCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              title: updatedPost.title,
              thumbnail: updatedPost.thumbnail,
              description: updatedPost.description,
              category: updatedPost.category,
              location: updatedPost.location,
              volunteersNeeded: parseInt(updatedPost.volunteersNeeded),
              deadline: updatedPost.deadline,
            },
          }
        );

        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to update post" });
      }
    });

    app.delete("/posts/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await postsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to delete post" });
      }
    });

    // =========================
    // REQUESTS API
    // =========================

    app.get("/requests", async (req, res) => {
      try {
        const email = req.query.email;

        if (!email) {
          return res.status(400).send({ message: "Email required" });
        }

        const result = await requestsCollection
          .find({ volunteerEmail: email })
          .toArray();

        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to get requests" });
      }
    });

    app.post("/requests", async (req, res) => {
      try {
        const requestData = req.body;

        // prevent duplicate request
        const existing = await requestsCollection.findOne({
          postId: requestData.postId,
          volunteerEmail: requestData.volunteerEmail,
        });

        if (existing) {
          return res.status(400).send({ message: "Already requested" });
        }

        // decrease volunteer count safely
        const post = await postsCollection.findOne({
          _id: new ObjectId(requestData.postId),
        });

        if (!post || post.volunteersNeeded <= 0) {
          return res.status(400).send({ message: "No slots available" });
        }

        await postsCollection.updateOne(
          { _id: new ObjectId(requestData.postId) },
          { $inc: { volunteersNeeded: -1 } }
        );

        const result = await requestsCollection.insertOne(requestData);

        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to create request" });
      }
    });

    app.delete("/requests/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const requestDoc = await requestsCollection.findOne({
          _id: new ObjectId(id),
        });

        if (requestDoc) {
          await postsCollection.updateOne(
            { _id: new ObjectId(requestDoc.postId) },
            { $inc: { volunteersNeeded: 1 } }
          );
        }

        const result = await requestsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to delete request" });
      }
    });

  } catch (error) {
    console.error("❌ MongoDB Error:", error);
    process.exit(1);
  }
}

run();

// Home route
app.get("/", (req, res) => {
  res.send("🚀 Volunteer Server Running Successfully");
});

// Server start
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});