import express from 'express'
import { GoogleAuth } from 'google-auth-library';
// import { CloudSchedulerClient } from '@google-cloud/scheduler';
import { google }  from 'googleapis';

const cloudscheduler = google.cloudscheduler('v1');
const auth = new GoogleAuth();
// const schedulerClient = new CloudSchedulerClient();

const projectName = 'sabre-winter-course-2022';
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

app.get('/vm/schedule/list', async (req, res) => {
	try {
		let aggregatedResponse = [];

		const request = {
			name: `projects/${projectName}`,
			auth: auth,
		  };
		
		  let response;
		  do {
			if (response && response.nextPageToken) {
			  request.pageToken = response.nextPageToken;
			}

			response = (await cloudscheduler.projects.locations.list(request)).data;
			const currentLocationsNames = response?.locations?.map(el => el.name) || [];
			aggregatedResponse = [...aggregatedResponse, ...currentLocationsNames];
			
		  } while (response.nextPageToken);
	
		res.status(200).json(aggregatedResponse);
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