// require('dotenv').config();
// const mysql = require('mysql2/promise');

// async function main() {
//   const connection = await mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     port: process.env.DB_PORT
//   });

//   // Create database if not exists
//   await connection.query(`CREATE DATABASE IF NOT EXISTS mobile_backend`);
//   await connection.query(`USE mobile_backend`);

//   // Create users table
//   await connection.query(`
//     CREATE TABLE IF NOT EXISTS users (
//       users_id INT AUTO_INCREMENT PRIMARY KEY,
//       username VARCHAR(255) NOT NULL UNIQUE,
//       email_id VARCHAR(255) NOT NULL UNIQUE,
//       password VARCHAR(255) NOT NULL,
//       confirm_password VARCHAR(255) NOT NULL,
//       otp VARCHAR(10),
//       dob DATE,
//       ph_no VARCHAR(20),
//       address VARCHAR(255),
//       avatar VARCHAR(255),
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
//     )
//   `);

//   // Create videos table (with title, description, thumbnailUrl)
//   await connection.query(`
//     CREATE TABLE IF NOT EXISTS videos (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       filename VARCHAR(255) NOT NULL,
//       language VARCHAR(50) NOT NULL,
//       level VARCHAR(50) NOT NULL,
//       path VARCHAR(255) NOT NULL,
//       title VARCHAR(255),
//       description TEXT,
//       thumbnailUrl VARCHAR(255),
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
//     )
//   `);

//   // Create images table
//   await connection.query(`
//     CREATE TABLE IF NOT EXISTS images (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       path VARCHAR(255) NOT NULL,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
//     )
//   `);

//   // Create payments table
//   await connection.query(`
//     CREATE TABLE IF NOT EXISTS payments (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       stripe_session_id VARCHAR(255),
//       amount INT,
//       currency VARCHAR(10),
//       course_type VARCHAR(100),
//       status VARCHAR(50),
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     )
//   `);

//   // Seed images table if empty
//   const [rows] = await connection.query('SELECT COUNT(*) as count FROM images');
//   if (rows[0].count === 0) {
//     await connection.query(`
//       INSERT INTO images (path) VALUES
//       ('/assets/images/1749622914064.png'),
//       ('/assets/images/1749622929458.png'),
//       ('/assets/images/1749622934180.png'),
//       ('/assets/images/1749622938374.png'),
//       ('/assets/images/1749622943563.png'),
//       ('/assets/images/1749622948350.png'),
//       ('/assets/images/1749622953080.png'),
//       ('/assets/images/1749622957100.png'),
//       ('/assets/images/1749622960003.png'),
//       ('/assets/images/1749622965295.png')
//     `);
//     console.log('Seeded images table with initial data.');
//   }

//   await connection.end();
//   console.log('Database setup complete!');
// }

// main().catch(err => {
//   console.error('Database setup failed:', err);
//   process.exit(1);
// });