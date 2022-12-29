import express from 'express'
import {GoogleAuth} from 'google-auth-library';

const auth = new GoogleAuth();
const app = express()

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

app.get('/', (req, res) => {
  res.send('Hello World Guys!')
})

app.get('/vm/list', async (req, res) => {
	
	try {
		const url = `https://us-central1-sabre-winter-course-2022.cloudfunctions.net/list-vms`;
		const client = await auth.getIdTokenClient(url);
		const response = await client.request({url});
	
		res.status(200).json(response.data);
	} catch (err) {
		console.log(err);
		res.status(400).send(err);
	}
})

const port = parseInt(process.env.PORT) || 3000;
app.listen(port, () => {
	console.log(`Server listening`);
	console.log(`Listening on port ${port}`);
})