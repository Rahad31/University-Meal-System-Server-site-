const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const Stripe = require("stripe");
// const stripe = Stripe(
//   "sk_test_51OIuzLKbVrj73WOdsjI1xAt5dE49TlcNAB2MXNmf6h2hIK4F8PfgKYigtMaHxu9ORoy91wCcmvTrPVXoLdHBWQDO00oHuj9VQA"
// );
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// middleware
app.use(cors());
app.use(express.json());
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// midleware
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.64k1q4w.mongodb.net/?retryWrites=true&w=majority`;
//console.log(uri);

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

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // middlewares
    const verifyToken = (req, res, next) => {
      console.log("inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

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
    app.get("/mealup", async (req, res) => {
      const cursor = mealupCollection.find();
      const result = await cursor.toArray();
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
      console.log(req.headers);
      const cursors = usersCollection.find();
      const result = await cursors.toArray();
      res.send(result);
    });

    app.get("/users/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "Admin";
      }
      res.send({ admin });
    });

    app.get("/meal", async (req, res) => {
      const cursor = mealCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/meal/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await mealCollection.findOne(query);
      res.send(result);
    });

    app.post("/reqmeal", async (req, res) => {
      const mealdetail = req.body;
      console.log(mealdetail);
      const result = await reqmealCollection.insertOne(mealdetail);
      res.send(result);
    });
    app.get("/reqmeal", async (req, res) => {
      const cursor = reqmealCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //  Update
    app.put("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "Admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    app.put("/reqmeal/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          stats: "Served",
        },
      };
      const result = await reqmealCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    app.put("/users/check/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const cart = req.body;
      const updatedDoc = {
        $set: {
          status: cart.status,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    app.put("/mealup/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const cart = req.body;
      const updatedDoc = {
        $set: {
          likes: cart.counts,
        },
      };
      const result = await mealupCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.put("/meal/update/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const upProduct = req.body;
      const Product = {
        $set: {
          image: upProduct.image,
          name: upProduct.name,
          username: upProduct.username,
          useremail: upProduct.useremail,
          type: upProduct.type,
          price: upProduct.price,
          description: upProduct.description,
          rating: upProduct.rating,
          username: upProduct.username,
          ing: upProduct.ing,
          pdate: upProduct.pdate,
          likes: upProduct.likes,
          review: upProduct.review,
        },
      };
      const result = await mealCollection.updateOne(filter, Product, options);
      res.send(result);
    });

    //delete

    app.delete("/reqmeal/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reqmealCollection.deleteOne(query);
      res.send(result);
    });
    app.delete("/meal/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await mealCollection.deleteOne(query);
      res.send(result);
    });

    // payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      console.log(amount, "amount inside the intent");

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

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
  res.send("Home page running");
});

app.listen(port, () => {});
