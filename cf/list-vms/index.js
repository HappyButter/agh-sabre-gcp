import { InstancesClient } from '@google-cloud/compute';
const instancesClient = new InstancesClient();

// List all instances in the specified project.
const listAllInstances = async (req, res) =>  {
  try {
    const projectId = await instancesClient.getProjectId();

    const aggListRequest = instancesClient.aggregatedListAsync({
      project: projectId,
    });

    console.log('Instances found:');

    let instancesStatus = {};

    for await (const [zone, instancesObject] of aggListRequest) {
      const instances = instancesObject.instances;

      if (instances && instances.length > 0) {
        console.log(` ${zone}`);
        for (const instance of instances) {
          instancesStatus = {...instancesStatus, [instance.name]: instance.status};
          console.log(` - ${instance.name} (${instance.machineType})`);
        }
      }
    }

    res.status(200).json(instancesStatus);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
}

export {listAllInstances};