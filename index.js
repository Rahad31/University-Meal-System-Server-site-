const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// midleware
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.64k1q4w.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);

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
    // await client.connect();
    const mealCollection = client.db("unimealDB").collection("meal");
     const mealupCollection = client.db("unimealDB").collection("mealup");
    const usersCollection = client.db("unimealDB").collection("users");
    
     const reqmealCollection = client.db("unimealDB").collection("reqmeal");
    app.post("/meal", async (req, res) => {
      const mealdetail = req.body;
      console.log(mealdetail);
      const result = await mealCollection.insertOne(mealdetail);
      res.send(result);
    });

       app.post("/mealup", async (req, res) => {
         const mealdetail = req.body;
         console.log(mealdetail);
         const result = await mealupCollection.insertOne(mealdetail);
         res.send(result);
       });

           app.post("/users", async (req, res) => {
             const user = req.body;
             // insert email if user doesnt exists:
             // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
             const query = { email: user.email };
             const existingUser = await usersCollection.findOne(query);
             if (existingUser) {
               return res.send({
                 message: "user already exists",
                 insertedId: null,
               });
             }
             const result = await usersCollection.insertOne(user);
             res.send(result);
           });
            app.get("/users", async (req, res) => {
              const cursor = usersCollection.find();
              const result = await cursor.toArray();
              res.send(result);
            });

         app.get("/meal", async (req, res) => {
           const cursor = mealCollection.find();
           const result = await cursor.toArray();
           res.send(result);
         });

         app.post("/reqmeal", async (req, res) => {
           const mealdetail = req.body;
           console.log(mealdetail);
           const result = await reqmealCollection.insertOne(mealdetail);
           res.send(result);
         });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
     await client.close();
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Home page running");
});

app.listen(port, () => {});
