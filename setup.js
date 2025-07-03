require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
  });

  // Create database if not exists
  await connection.query(`CREATE DATABASE IF NOT EXISTS mobile_backend`);
  await connection.query(`USE mobile_backend`);

  // Create users table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      users_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      email_id VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      confirm_password VARCHAR(255) NOT NULL,
      otp VARCHAR(10),
      dob DATE,
      ph_no VARCHAR(20),
      address VARCHAR(255),
      avatar VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_admin TINYINT(1) DEFAULT 0
    )
  `);

  // Create videos table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS videos (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      language VARCHAR(50) NOT NULL,
      level VARCHAR(50) NOT NULL,
      path VARCHAR(255) NOT NULL,
      title VARCHAR(255),
      description TEXT,
      thumbnailUrl VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Create images table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS images (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      path VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Create payments table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      stripe_session_id VARCHAR(255),
      amount INT,
      currency VARCHAR(10),
      course_type VARCHAR(100),
      status VARCHAR(50),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create user_paid_videos table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_paid_videos (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      language VARCHAR(50) NOT NULL,
      level VARCHAR(50) NOT NULL,
      paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_video (user_id, language, level),
      FOREIGN KEY (user_id) REFERENCES users(users_id)
    )
  `);

  // Seed images table if empty
  const [rows] = await connection.query('SELECT COUNT(*) as count FROM images');
  if (rows[0].count === 0) {
    await connection.query(`
      INSERT INTO images (path) VALUES
      ('/assets/images/1749622914064.png'),
      ('/assets/images/1749622929458.png'),
      ('/assets/images/1749622934180.png'),
      ('/assets/images/1749622938374.png'),
      ('/assets/images/1749622943563.png'),
      ('/assets/images/1749622948350.png'),
      ('/assets/images/1749622953080.png'),
      ('/assets/images/1749622957100.png'),
      ('/assets/images/1749622960003.png'),
      ('/assets/images/1749622965295.png')
    `);
    console.log('Seeded images table with initial data.');
  }

  // Seed admin user if not exists
  const [adminRows] = await connection.query(
    "SELECT COUNT(*) as count FROM users WHERE is_admin = 1"
  );
  if (adminRows[0].count === 0) {
    await connection.query(
      "INSERT INTO users (username, email_id, password, confirm_password, is_admin) VALUES (?, ?, ?, ?, 1)",
      ['admin', 'admin@example.com', 'admin@123', 'admin@123']
    );
    console.log('Admin user created: admin@example.com / adminpassword');
  }

  await connection.end();
  console.log('Database setup complete!');
}

main().catch(err => {
  console.error('Database setup failed:', err);
  process.exit(1);
});