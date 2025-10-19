// Script để thêm dữ liệu mẫu vào MongoDB
// Chạy: node seed-data.js

const { MongoClient } = require('mongodb');

const uri = 'mongodb://admin:password@localhost:27017/?authSource=admin';
const client = new MongoClient(uri);

async function seedData() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    // 1. Thêm Users vào auth_db
    const authDb = client.db('auth_db');
    const usersCollection = authDb.collection('users');
    
    const users = [
      {
        username: 'admin',
        password: '$2a$10$abcdefghijklmnopqrstuv1234567890abcdefghij' // password: admin123
      },
      {
        username: 'user1',
        password: '$2a$10$abcdefghijklmnopqrstuv1234567890abcdefghij' // password: user123
      },
      {
        username: 'user2',
        password: '$2a$10$abcdefghijklmnopqrstuv1234567890abcdefghij' // password: user123
      }
    ];

    const insertedUsers = await usersCollection.insertMany(users);
    console.log(`✅ Inserted ${insertedUsers.insertedCount} users`);

    // 2. Thêm Products vào product_db
    const productDb = client.db('product_db');
    const productsCollection = productDb.collection('products');
    
    const products = [
      {
        name: 'iPhone 15 Pro Max',
        price: 29990000,
        description: 'Flagship smartphone từ Apple với chip A17 Pro'
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        price: 31990000,
        description: 'Smartphone cao cấp với bút S Pen và camera 200MP'
      },
      {
        name: 'MacBook Pro 14" M3',
        price: 45990000,
        description: 'Laptop chuyên nghiệp với chip M3, RAM 16GB'
      },
      {
        name: 'iPad Air M2',
        price: 15990000,
        description: 'Tablet đa năng với chip M2 mạnh mẽ'
      },
      {
        name: 'AirPods Pro 2',
        price: 6490000,
        description: 'Tai nghe không dây chống ồn chủ động'
      },
      {
        name: 'Dell XPS 15',
        price: 35990000,
        description: 'Laptop cao cấp cho dân văn phòng và sáng tạo'
      },
      {
        name: 'Sony WH-1000XM5',
        price: 8990000,
        description: 'Tai nghe over-ear chống ồn tốt nhất'
      },
      {
        name: 'Apple Watch Ultra 2',
        price: 21990000,
        description: 'Smartwatch cao cấp dành cho thể thao extreme'
      }
    ];

    const insertedProducts = await productsCollection.insertMany(products);
    console.log(`✅ Inserted ${insertedProducts.insertedCount} products`);

    // 3. Thêm Orders vào order_db (sử dụng product IDs vừa tạo)
    const orderDb = client.db('order_db');
    const ordersCollection = orderDb.collection('orders');
    
    const productIds = Object.values(insertedProducts.insertedIds);
    
    const orders = [
      {
        products: [productIds[0], productIds[4]], // iPhone + AirPods
        totalPrice: 36480000,
        createdAt: new Date('2025-10-15')
      },
      {
        products: [productIds[2]], // MacBook Pro
        totalPrice: 45990000,
        createdAt: new Date('2025-10-16')
      },
      {
        products: [productIds[1], productIds[3]], // Samsung + iPad
        totalPrice: 47980000,
        createdAt: new Date('2025-10-17')
      },
      {
        products: [productIds[5], productIds[6]], // Dell + Sony
        totalPrice: 44980000,
        createdAt: new Date('2025-10-18')
      }
    ];

    const insertedOrders = await ordersCollection.insertMany(orders);
    console.log(`✅ Inserted ${insertedOrders.insertedCount} orders`);

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${insertedUsers.insertedCount}`);
    console.log(`   - Products: ${insertedProducts.insertedCount}`);
    console.log(`   - Orders: ${insertedOrders.insertedCount}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await client.close();
    console.log('\nConnection closed');
  }
}

seedData();
