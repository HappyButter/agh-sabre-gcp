import { InstancesClient, ZoneOperationsClient } from '@google-cloud/compute';
const instancesClient = new InstancesClient();
const operationsClient = new ZoneOperationsClient();

const stopInstance = async (req, res) =>  {
  try {
    const instancesNamesToStop = req.body.instancesNames || [];
    const projectId = await instancesClient.getProjectId();

    const aggListRequest = instancesClient.aggregatedListAsync({
      project: projectId,
    });

    console.log('Instances found:');

    for await (const [zone, instancesObject] of aggListRequest) {
      const instances = instancesObject.instances;

      if (instances && instances.length > 0) {
        await Promise.all(
          instances.map(async instance => {
            if (!instancesNamesToStop.includes(instance.name)) return;

            const [response] = await instancesClient.stop({
              project: projectId,
              zone: zone.replace("zones/", ""),
              instance: instance.name,
            });

            return waitForOperation(projectId, response.latestResponse);
          })
        );
      }
    }
    
    const message = 'Successfully stopped instance(s)';
    console.log(message);
    res.status(200).send(message);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
}

async function waitForOperation(projectId, operation) {
  while (operation.status !== 'DONE') {
    [operation] = await operationsClient.wait({
      operation: operation.name,
      project: projectId,
      zone: operation.zone.split('/').pop(),
    });
  }
}

export {stopInstance};