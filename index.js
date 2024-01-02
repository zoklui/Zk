const express = require('express')

const app = express()
const PORT = 4000

app.listen(PORT, () => {
  console.log(`<h1>API listening on PORT ${PORT} `)
})

app.get('/', (req, res) => {
  res.send('<h1>Hey this is my API running ok 🥳</h1>')
})

app.get('/about', (req, res) => {
  res.send('This is my about route..... ')
})

// Export the Express API
module.exports = app
