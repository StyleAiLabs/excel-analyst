const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const XLSX = require('xlsx');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());

app.post('/analyze', async (req, res) => {
  const { fileData, question } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  try {
    const binaryData = Buffer.from(fileData, 'base64');
    const workbook = XLSX.read(binaryData, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

    // Convert the JSON data into a readable table format
    let formattedData = 'Here is the sales data from the Excel file:\n\n';
    jsonData.forEach((row, rowIndex) => {
      if (rowIndex === 0) {
        formattedData += 'Headers: ' + row.join(', ') + '\n';
      } else {
        formattedData += 'Row ' + rowIndex + ': ' + row.join(', ') + '\n';
      }
    });

    // Check if formattedData has useful data
    if (!jsonData || jsonData.length === 0) {
      throw new Error('Failed to parse Excel data');
    }

    // Prepare the prompt with context and question
    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant that can analyze and answer questions about tabular data."
      },
      {
        role: "user",
        content: `${formattedData}\n\nQuestion: ${question}`
      }
    ];

    const response = await axios.post(endpoint, {
      model: 'gpt-3.5-turbo',
      messages: messages,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error('No valid response from OpenAI');
    }

    const answer = response.data.choices[0].message.content.trim();
    console.log(response.data);
    res.json({ answer });

  } catch (error) {
    console.error('Error fetching data from OpenAI:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from OpenAI' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
