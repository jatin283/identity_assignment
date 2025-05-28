require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const PORT = 5000;
app.use(bodyParser.json());   

const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.DB_SSL === 'true'
});

app.post('/identify', async (req, res) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({ error: 'Email or phoneNumber is required' });
  }

  try {
    // Fetch contacts that match either email or phone number
    const { rows: matchedContacts } = await db.query(
      `SELECT * FROM contacts WHERE email = $1 OR "phoneNumber" = $2`,
      [email, phoneNumber]
    );

    let primaryContact = null;

    // If no matches at all, insert a new primary contact
    if (matchedContacts.length === 0) {
      const { rows } = await db.query(
        `INSERT INTO contacts (email, "phoneNumber", "linkPrecedence")
         VALUES ($1, $2, 'primary') RETURNING *`,
        [email, phoneNumber]
      );
      primaryContact = rows[0];
    } else {
      // Check if there are matches for email and phoneNumber separately
      const emailMatch = matchedContacts.find(c => c.email === email);
      const phoneMatch = matchedContacts.find(c => c.phoneNumber === phoneNumber);

      let primaryCandidates = [...matchedContacts.filter(c => c.linkPrecedence === 'primary')];

      // Special Case: Email and phoneNumber match different contacts
      if (emailMatch && phoneMatch && emailMatch.id !== phoneMatch.id) {
        // Determine older and newer
        const older = new Date(emailMatch.createdAt) < new Date(phoneMatch.createdAt) ? emailMatch : phoneMatch;
        const newer = emailMatch.id === older.id ? phoneMatch : emailMatch;

        // Update newer to be secondary linked to older
        await db.query(
          `UPDATE contacts SET "linkPrecedence" = 'secondary', "linkedId" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2`,
          [older.id, newer.id]
        );

        primaryContact = older;
      } else {
        // Determine the oldest primary among matches
        if (primaryCandidates.length === 0) {
          primaryCandidates = matchedContacts;
        }
        primaryCandidates.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        primaryContact = primaryCandidates[0];

        // If this exact pair doesn't exist already, insert as secondary
        const exists = matchedContacts.some(
          c => c.email === email && c.phoneNumber === phoneNumber
        );

        if (!exists) {
          await db.query(
            `INSERT INTO contacts (email, "phoneNumber", "linkPrecedence", "linkedId")
             VALUES ($1, $2, 'secondary', $3)`,
            [email, phoneNumber, primaryContact.id]
          );
        }
      }
    }

    // Fetch all contacts linked to the primary contact
    const { rows: linkedContacts } = await db.query(
      `SELECT * FROM contacts WHERE id = $1 OR "linkedId" = $1`,
      [primaryContact.id]
    );

    const uniqueEmails = [...new Set(linkedContacts.map(c => c.email).filter(Boolean))];
    const uniquePhones = [...new Set(linkedContacts.map(c => c.phoneNumber).filter(Boolean))];
    const secondaryIds = linkedContacts
      .filter(c => c.linkPrecedence === 'secondary')
      .map(c => c.id)
      .sort((a, b) => a - b);

    res.json({
      contact: {
        primaryContactId: primaryContact.id,
        emails: uniqueEmails,
        phoneNumbers: uniquePhones,
        secondaryContactIds: secondaryIds
      }
    });

  } catch (err) {
    console.error('Server Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});


// DB_USER=bitespeed_956a_user
// DB_PASSWORD=WzhTAnKEFVDDE4mRfNPvNe0fMjtKL3t4
// DB_HOST=dpg-d0r1jr6mcj7s73cdh2ig-a
// DB_PORT=5432
// DB_NAME=bitespeed_956a
// DB_SSL=false