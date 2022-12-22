import express from 'express'

const app = express()

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.listen(process.env.PORT || 3000)