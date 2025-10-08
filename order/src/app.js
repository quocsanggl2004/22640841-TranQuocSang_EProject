const express = require("express");
const mongoose = require("mongoose");
const Order = require("./models/order");
const amqp = require("amqplib");
const config = require("./config");
const isAuthenticated = require("./utils/isAuthenticated");

class App {
  constructor() {
    this.app = express();
    this.connectDB();
    this.setMiddlewares();
    this.setRoutes();
    this.setupOrderConsumer();
  }

  async connectDB() {
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  }

  async disconnectDB() {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }

  setMiddlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    
    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
  }

  setRoutes() {
    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.json({ status: "Order service is running", timestamp: new Date().toISOString() });
    });

    // Get all orders for a user
    this.app.get("/", isAuthenticated, async (req, res) => {
      try {
        const orders = await Order.find({ user: req.user.username });
        res.json(orders);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get specific order
    this.app.get("/:id", isAuthenticated, async (req, res) => {
      try {
        const order = await Order.findById(req.params.id);
        if (!order) {
          return res.status(404).json({ error: "Order not found" });
        }
        res.json(order);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Create order (this could be triggered by message queue)
    this.app.post("/", isAuthenticated, async (req, res) => {
      try {
        const { products } = req.body;
        const newOrder = new Order({
          products,
          user: req.user.username,
          totalPrice: products.reduce((acc, product) => acc + product.price, 0),
        });
        
        await newOrder.save();
        res.status(201).json(newOrder);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  async setupOrderConsumer() {
    console.log("Connecting to RabbitMQ...");
  
    setTimeout(async () => {
      try {
        const amqpServer = config.rabbitMQURI;
        const connection = await amqp.connect(amqpServer);
        console.log("Connected to RabbitMQ");
        const channel = await connection.createChannel();
        await channel.assertQueue("orders");
  
        channel.consume("orders", async (data) => {
          // Consume messages from the order queue on buy
          console.log("Consuming ORDER service");
          const { products, username, orderId } = JSON.parse(data.content);
  
          const newOrder = new Order({
            products,
            user: username,
            totalPrice: products.reduce((acc, product) => acc + product.price, 0),
          });
  
          // Save order to DB
          await newOrder.save();
  
          // Send ACK to ORDER service
          channel.ack(data);
          console.log("Order saved to DB and ACK sent to ORDER queue");
  
          // Send fulfilled order to PRODUCTS service
          // Include orderId in the message
          const { user, products: savedProducts, totalPrice } = newOrder.toJSON();
          channel.sendToQueue(
            "products",
            Buffer.from(JSON.stringify({ orderId, user, products: savedProducts, totalPrice }))
          );
        });
      } catch (err) {
        console.error("Failed to connect to RabbitMQ:", err.message);
        console.log("Will retry RabbitMQ connection in 10 seconds...");
      }
    }, 5000); // Reduced delay for faster startup
  }



  start() {
    const port = config.port || 3003;
    this.server = this.app.listen(port, () => {
      console.log(`Order service started on port ${port}`);
      console.log(`Available endpoints:`);
      console.log(`- GET http://localhost:${port}/health`);
      console.log(`- GET http://localhost:${port}/ (get user orders)`);
      console.log(`- GET http://localhost:${port}/:id (get specific order)`);
      console.log(`- POST http://localhost:${port}/ (create order)`);
    });
  }

  async stop() {
    await mongoose.disconnect();
    this.server.close();
    console.log("Server stopped");
  }
}

module.exports = App;
