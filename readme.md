# Meetabout

Meetabout is an app that tries to make meetings between strangers about topics easy. Eg "Let's meet about X" Meetabout is an example implementation of the Kaltura `Virtual Meeting Room` API. 

## Getting started:

### Things to know:

This is a demonstration of meetabout, in no way is this demo code intended to run in any production environment.

### Prerequisites:

1. [Nodejs](https://nodejs.org/en/) 
2. MongoDB. I recommend the free, hosted cloud Mongo service https://www.mongodb.com/
3. A Kaltura Account: NEED LINK
4. Meetings need to be activated for your Kaltura account. Please email vpaas@kaltura.com 

### Installation

1. Clone the [Meetabout Github Repo:](https://github.com/kaltura-vpaas/meetabout) 
2. run `npm install`
3. Copy `.env.template` to .env and fill out the following required fields:

```
SESSION_SECRET= #randomstring
SERVER_HOST_URL=http://localhost:3000
MONGO_URI= #mongodb+srv://
KALTURA_SERVICE_URL=https://www.kaltura.com
KALTURA_ADMIN_SECRET= #obtained from https://kmc.kaltura.com/index.php/kmcng/settings/integrationSettings
KALTURA_PARTNER_ID=#obtained from https://kmc.kaltura.com/index.php/kmcng/settings/integrationSettings
```

There are many other credentials in .env, however, none of them are required to run the app. 

Now you should be ready to run the app. So type:

`npm start`

### Logging In

Meetabout requires a logged-in user to work, and any attempt to use the app will force a modal login window to appear.  The default login method uses passportjs local strategy and is completely insecure and you should only run this on your local machine, however, this approach makes it very easy to get up and running.

**Note:** If you want to run meetabout as a production app, comment out `router.post('/', ` in `routes/auth_local.js` and implement other authentication strategies, for example, the github, linkedin, microsoft and google oauth strategies are implemented in `routes/auth_<x>` and you can uncomment those routes from `app.js` You would also need to create oauth credentials of your own for those services and supply the keys in `.env`

Once you are logged in, you can use the app!



### Adding a topic

You will first want to create a topic to have a meeting about! So type a topic into "More Topics" and press "Add New Topic"

<img src="readme_images/addtopic.png" alt="addtopic" style="zoom:50%;" />

### Finding a meeting

If you click on the "Find Meetings" button next, you won't actually see anyone to meet with. At this point, you could go to another browser, login with a different user, subscribe to "First Topic" with both users. And now you will be able to see each other!! 

You should see something like this: 

<img src="readme_images/foundmeeting.png" alt="foundmeeting" style="zoom:75%;" />

Click on the other user to go to the meeting page.

## A Meeting!

The meeting page is the place within meetabout where meetings happen on a given topic. It consists of: 

1. Descriptions of the two users in the meeting
2. A Join Meeting button
3. A chat area where users can chat with each other via email and come back to this meeting page when a new message occurs.  Some setup is required to get the chat feature to work, and that will be covered later.

Here is what a meeting page looks like:

<img src="readme_images/meetingpage.png" alt="meetingpage" style="zoom:70%;" />

If either user on this meeting page clicks on the "Join Meeting" Button they will enter a live, virtual meeting room like this:<img src="/Users/hunterp/Documents/GitHub/meetabout/readme_images/newrow_room.png" alt="newrow_room" style="zoom:35%;" />



### Setting up a meeting: Beneath the hood

A Kaltura virtual meeting room is created and joined through a certain set of API calls. You will also want to refer to [this guide]( https://github.com/kaltura-vpaas/virtual-meeting-rooms) for a fuller understand of the API. As well as download and play with the [Virtual Room Manager App](https://github.com/kaltura-vpaas/liveroom_manager)

We will briefly cover the meeting API here as it relates to Meetabout.

When a new meeting is created in Meetabout we are routed to [/routes/meetings.js](https://github.com/kaltura-vpaas/meetabout/blob/master/routes/meetings.js)

The meeting is first created at this point: 

```javascript
 createRoom(topicName, function (kalturaResponse) {
```

Which calls the `createRoom` function from [/lib/createroom.js](https://github.com/kaltura-vpaas/meetabout/blob/master/lib/createroom.js)

The completion of `kaltura.services.session.start(` which creates a [Kaltura Admin Session](https://github.com/kaltura-vpaas/virtual-meeting-rooms#creating-an-admin-session)

Then proceeds to [create a meeting](https://github.com/kaltura-vpaas/virtual-meeting-rooms#creating-a-resource)

```javascript
// Create the room
let scheduleResource = new kaltura.objects.LocationScheduleResource();
scheduleResource.name = topicName;
scheduleResource.tags = "vcprovider:newrow";

kaltura.services.scheduleResource.add(scheduleResource)
.execute(client)
```

You will notice that we pass the topicName from Meetabout to be the topic of the Virtual Room. And that is it!

The call to `kaltura.services.scheduleResource.add(scheduleResource)` creates a `resource` aka Virtual Meeting id and we save that string to the Mongo `Meeting` Model in [/routes/meetings.js](https://github.com/kaltura-vpaas/meetabout/blob/master/routes/meetings.js)

```javascript
createRoom(topicName, function (kalturaResponse) {
      new Meeting({
        topic: topicId,
        user1: uid1,
        user2: uid2,
        kalturaResourceId: kalturaResponse.id
      }).save(function (err, doc) {
```

So now the Virtual Meeting Room exists and is ready to be joined and used!

### Joining the Virtual Meeting Room

Some prep work is needed to join the `resource` or virtual meeting room we just created. The room needs to know who you are, and also what kind of meeting user you are. Meeting rooms typically have admins and viewers where the admins have special privileges. However, in the case of Meetabout we assume both users are equals and we will make both of them admins. 

In order to identify a user to the room, we need to create a [Kaltura Session](https://github.com/kaltura-vpaas/virtual-meeting-rooms#creating-a-kaltura-session) with some meta data related to the Virtual Meeting Room API. 

And this is kicked off from  [/routes/meetings.js](https://github.com/kaltura-vpaas/meetabout/blob/master/routes/meetings.js) right after `.save` from above by calling 

`  joinRoom(kalturaResponse.id, user.name, user.email, function (joinLink) {`

which then calls [/lib/joinroom.js](/lib/joinroom.js) to create a [Kaltura Session](https://github.com/kaltura-vpaas/virtual-meeting-rooms#creating-a-kaltura-session) for the user that clicked the "Join Meeting" button. 

The url scheme for the room follows the [convention for virtual meeting rooms:](https://github.com/kaltura-vpaas/virtual-meeting-rooms#creating-the-virtual-meeting-room-url) 

and it is created in  [/lib/joinroom.js](/lib/joinroom.js)  

```javascript
let roomUrl = "https://" + partnerId + ".kaf.kaltura.com/virtualEvent/launch?ks=" + result;
```

The `ks` is a string representing the `Kaltura Session` for the user for this meeting room. And the `partnerid` is your Kaltura VPaaS API account's id. 

And thats it! This URL is ready to use!! And we pass this URL back to the meeting webpage and into the href of the "Join Meeting" button!

#### Email Setup: 

Note: if you want to understand how to integrate the Kaltura Virtual Room API better, you can skip this step as it is not required. A production app would use an smtp server at a company, or an smtp service. And for testing purposes, you can sign up for a free account at [ethereal](https://ethereal.email/ ) and fill out the following fields in `.env`  

```
SMTP_HOST=smtp.ethereal.email
SMTP_USER=
SMTP_PASS=
SMTP_PORT=587
```

