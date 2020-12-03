var kaltura = require('kaltura-client');

function createMeetingRoom(topicName, done) {
  const config = new kaltura.Configuration();
  config.serviceUrl = process.env.KALTURA_SERVICE_URL;
  const client = new kaltura.Client(config);
  const apiSecret = process.env.KALTURA_ADMIN_SECRET
  const partnerId = process.env.KALTURA_PARTNER_ID
  const type = kaltura.enums.SessionType.ADMIN;
  const userId = "anything";

  // Generate KS
  kaltura.services.session.start(
    apiSecret,
    userId,
    type,
    partnerId)
  .completion((success, ks) => {
    if (!success) throw new Error(ks.message);
    client.setKs(ks);

    // Create the room
    let scheduleResource = new kaltura.objects.LocationScheduleResource();
    scheduleResource.name = topicName;
    console.log("THIS NAME:"+topicName)
    //scheduleResource.description = req.body.description;
    scheduleResource.tags = "vcprovider:newrow";

    kaltura.services.scheduleResource.add(scheduleResource)
    .execute(client)
    .then(result => {
      console.log(result);
      done(result);
    });
  })
  .execute(client);
}

module.exports = createMeetingRoom