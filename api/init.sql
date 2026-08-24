CREATE DATABASE IF NOT EXISTS dominicantodo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dominicantodo;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role ENUM('super_admin', 'editor', 'viewer') DEFAULT 'editor',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  province VARCHAR(255),
  short_description TEXT,
  long_description TEXT,
  hero_image VARCHAR(500),
  is_popular TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  icon VARCHAR(100),
  color VARCHAR(50),
  emoji VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  city_id INT,
  category_id INT,
  description TEXT,
  price DECIMAL(10,2),
  duration VARCHAR(100),
  is_popular TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS businesses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  city_id INT,
  category_id INT,
  description TEXT,
  phone VARCHAR(50),
  address TEXT,
  status ENUM('pending', 'approved', 'rejected', 'draft') DEFAULT 'pending',
  is_verified TINYINT(1) DEFAULT 0,
  is_featured TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image VARCHAR(500),
  category VARCHAR(100),
  is_published TINYINT(1) DEFAULT 0,
  is_featured TINYINT(1) DEFAULT 0,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cruises (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ship_name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  port VARCHAR(100),
  arrival_date DATE NOT NULL,
  departure_date DATE,
  passengers INT,
  status ENUM('scheduled', 'arrived', 'departed', 'cancelled') DEFAULT 'scheduled',
  notes TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed: initial admin user (credentials managed via env vars, this row unused by API)
INSERT IGNORE INTO admin_users (email, password_hash, full_name, role)
VALUES ('salopzmatt+test@gmail.com', 'env-managed', 'Admin', 'super_admin');

-- Seed: sample categories
INSERT IGNORE INTO categories (name, slug, icon, emoji) VALUES
  ('Playas', 'playas', 'Waves', '🏖️'),
  ('Aventura', 'aventura', 'Mountain', '🧗'),
  ('Gastronomia', 'gastronomia', 'UtensilsCrossed', '🍽️'),
  ('Cultura', 'cultura', 'Landmark', '🏛️'),
  ('Naturaleza', 'naturaleza', 'TreePine', '🌿');

-- Seed: major cities
INSERT IGNORE INTO cities (slug, name, province, short_description, is_popular) VALUES
  ('santo-domingo', 'Santo Domingo', 'Distrito Nacional', 'La capital de la República Dominicana', 1),
  ('punta-cana', 'Punta Cana', 'La Altagracia', 'El destino turístico más popular del Caribe', 1),
  ('santiago', 'Santiago', 'Santiago', 'La segunda ciudad más grande del país', 1),
  ('puerto-plata', 'Puerto Plata', 'Puerto Plata', 'La ciudad de la costa norte', 1),
  ('samana', 'Samaná', 'Samaná', 'Paraíso natural con ballenas jorobadas', 1),
  ('la-romana', 'La Romana', 'La Romana', 'Hogar de Casa de Campo y Altos de Chavón', 0),
  ('bavaro', 'Bávaro', 'La Altagracia', 'Playas de arena blanca y aguas cristalinas', 1),
  ('barahona', 'Barahona', 'Barahona', 'La perla del sur dominicano', 0);
