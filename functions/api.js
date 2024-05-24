const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const router = express.Router();

app.use(bodyParser.urlencoded({ extended: true }));

router.post('/submit', async (req, res) => {
  const refNo = req.body.refNo;
  const url = `https://bill.pitc.com.pk/gepcobill/general?refno=${refNo}`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);

    const billDetails = {};
    let nameText = $('p').text().trim();
    billDetails.name = nameText.replace(/NAME & ADDRESS\s*/, '');
    billDetails.amount = $('.nested7 tr:nth-of-type(8) td:nth-of-type(2)').text().trim();
    const lastTable = $('table').last();
    billDetails.dueDate = lastTable.find('tr:nth-of-type(2) td:nth-of-type(2)').text().trim();
    billDetails.damount = lastTable.find('tr:nth-of-type(2) td:nth-of-type(5)').text().trim();
    billDetails.fullHTML = $.html();

    res.redirect(`/bill-details.html?name=${encodeURIComponent(billDetails.name)}&amount=${encodeURIComponent(billDetails.amount)}&dueDate=${encodeURIComponent(billDetails.dueDate)}&damount=${encodeURIComponent(billDetails.damount)}&fullHTML=${encodeURIComponent(billDetails.fullHTML)}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving bill data');
  }
});

app.use('/.netlify/functions/api', router);

module.exports.handler = serverless(app);
