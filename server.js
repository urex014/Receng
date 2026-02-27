const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const app = express();
const prisma = new PrismaClient();
app.use(cors());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 3. Tell Express to serve the 'uploads' folder publicly
app.use('/uploads', express.static(uploadDir));

const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const name = req.body.name || "Test Item";
    const price = req.body.price || 29.99;

    // 4. Save the file to disk permanently with a unique timestamp
    const uniqueFilename = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
    const filePath = path.join(uploadDir, uniqueFilename);
    fs.writeFileSync(filePath, req.file.buffer);

    // 5. Create the public URL for the database
    // This allows Next.js to fetch the image directly from Node
    const publicImageUrl = `http://localhost:5000/uploads/${uniqueFilename}`;

    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);

    const aiResponse = await axios.post('http://localhost:8000/analyze', formData, {
      headers: formData.getHeaders(),
    });

    const { vector, suggested_tags } = aiResponse.data;

    const product = await prisma.product.create({
      data: {
        name: name,
        price: parseFloat(price),
        imageUrl: publicImageUrl, // Save the real URL here!
        tags: suggested_tags,
      },
    });

    const vectorString = `[${vector.join(',')}]`;
    await prisma.$executeRaw`
      UPDATE "Product" 
      SET "featureVector" = ${vectorString}::vector 
      WHERE id = ${product.id}
    `;

    res.json({
      message: "Product successfully tagged and saved!",
      productId: product.id,
      tags: suggested_tags
    });

  } catch (error) {
    console.error("Pipeline Error:", error.message);
    res.status(500).json({ error: "Failed to process the item" });
  }
});
app.get('/recommend/:id', async (req, res) => {
  try {
    const targetId = req.params.id;

    // 1. Get the main product
    const mainProduct = await prisma.product.findUnique({
      where: { id: targetId }
    });

    if (!mainProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 2. Get the visually similar items
    const similarProducts = await prisma.$queryRaw`
      SELECT id, name, price, "imageUrl", tags
      FROM "Product"
      WHERE id != ${targetId}
      ORDER BY "featureVector" <=> (
        SELECT "featureVector" FROM "Product" WHERE id = ${targetId}
      )
      LIMIT 4;
    `;

    res.json({
      product: mainProduct,
      recommendations: similarProducts
    });

  } catch (error) {
    console.error("Recommendation Error:", error.message);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

// --- Reverse Image Search Route ---
app.post('/search', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    // 1. Send the customer's image to the Python Brain to get the vector
    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);

    const aiResponse = await axios.post('http://localhost:8000/analyze', formData, {
      headers: formData.getHeaders(),
    });

    const { vector } = aiResponse.data;

    // 2. Format the vector for PostgreSQL
    const vectorString = `[${vector.join(',')}]`;

    // 3. Ask the database for the 4 closest matching items
    // Notice we don't have a "WHERE id !=" clause here because this is a brand new image
    const matches = await prisma.$queryRaw`
      SELECT id, name, price, "imageUrl", tags
      FROM "Product"
      ORDER BY "featureVector" <=> ${vectorString}::vector
      LIMIT 4;
    `;

    res.json({ matches });

  } catch (error) {
    console.error("Search Error:", error.message);
    res.status(500).json({ error: "Failed to search by image" });
  }
});

app.listen(5000, () => console.log('Node Orchestrator running on port 5000'));