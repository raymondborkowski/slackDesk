//Globals
var globalObj = {
    subject:"Slack Created Task", 
    partnerName:"xxxxxxx", 
    priority: 4, 
    labels: "General Pie Task", 
    description: "Not Available", 
    email: "xxxxxxx", 
    firstName: "undefined",
    assign: ""
};
var customersID = {
    heather: "xxxxxxx",
    angus: "xxxxxxx",
    ray: "xxxxxxx",
    dorothy: "xxxxxxx",
    tristan: "xxxxxxx",
    danny: "xxxxxxx",
    andrew: "xxxxxxx"
};
var customerIDNum;
var globalStop = 'STOP';

if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('./lib/Botkit.js');
var os = require('os');

var controller = Botkit.slackbot({
    debug: true
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();

//Creates Ticker
controller.hears('bailey', 'direct_message,direct_mention,mention,message_received,ambient', function(bot, message) {
    bot.api.users.info({user: message.user}, function(err, info){
        //check if it's the right user using info.user.name or info.user.id
        globalObj.email = info.user.profile.email;
        globalObj.firstName = info.user.profile.first_name;
    });

    controller.storage.users.get(message.user, function(err, user) {

        bot.startConversation(message, function(err, convo) {

            //Find Subject
            convo.ask('What is the Subject of this ticket?', function(response, convo) {
                if(response.text.toUpperCase() == globalStop){
                    convo.stop();
                }
                convo.next();
            }, {'key': 'subject'});

            //Get Partner
            convo.ask('What is the Partner Name?', function(response, convo){
                if(response.text.toUpperCase() == globalStop){
                    convo.stop();
                }
                convo.next();
            }, {'key': 'partnerName'});

            //Get Priority
            convo.ask('What is the priority (1-10):', function(response, convo){
                if(response.text.toUpperCase() == globalStop){
                    convo.stop();
                }
                if(Number(response.text) > 10 || Number(response.text) < 1 || isNaN(response.text)){
                    convo.repeat();
                }
                if(response.text === '9' || response.text === '10'){
                     convo.ask('Please assign this high priority to "Dorothy" or "Ray": ', [
                        {
                            pattern: 'ray',
                            callback: function(response, convo) {
                                globalObj.assign = "xxxxxxx"
                                convo.next();
                            }
                        },
                        {
                            pattern: 'dorothy',
                            callback: function(response, convo) {
                                globalObj.assign = "xxxxxxx"
                                convo.next();
                            }
                        },
                        {
                            default: true,
                            callback: function(response, convo) {
                                convo.repeat();
                                convo.next();
                            }
                        }
                    ]);
                }
                convo.next();
            }, {'key': 'priority'});

            //Get Labels
            convo.ask('Please enter one label (Default: General PIE Task)\n(Integration Phase, post-launch, faq, urgent/high priority, low priority, internal, Integration Phase):', function(response, convo){
                if(response.text.toUpperCase() == globalStop){
                    convo.stop();
                }
                convo.next();
            }, {'key': 'labels'});

            //Description
            convo.ask('Please enter description and Asana/Google Drive links if available:', function(response, convo){
                if(response.text.toUpperCase() == globalStop){
                    convo.stop();
                }
                convo.next();
            }, {'key': 'description'});

            //Collect Variables to format and pass
            convo.on('end', function(convo) {
                if (convo.status == 'completed') {
                    controller.storage.users.get(message.user, function(err, user) {
                        if (!user)
                            user = {id: message.user};
                        globalObj.subject = convo.extractResponse('subject');
                        globalObj.priority = convo.extractResponse('priority');
                        globalObj.partnerName = convo.extractResponse('partnerName');
                        globalObj.labels = convo.extractResponse('labels');
                        globalObj.description = convo.extractResponse('description');
                        controller.storage.users.save(user, function(err, id) {
                            bot.startConversation(message, function(err, convo) {
                                convo.ask({'icon_emoji': ':dog:','username': "Bailey", "attachments": [
                                                {
                                                    "title": globalObj.partnerName + ': ' +  globalObj.subject,
                                                    'color': '#7CD197',
                                                    "pretext":globalObj.firstName + ', does this look good?' ,
                                                    "text": "Replies will be sent to: " 
                                                        + globalObj.email + "\n" 
                                                        + "*Description:* " + globalObj.description
                                                        + "\n*Label:* " + globalObj.labels,
                                                    "mrkdwn_in": [
                                                        "text",
                                                        "pretext"
                                                    ]
                                                }
                                            ]},[
                                    {
                                        pattern: bot.utterances.yes,
                                        callback: function(response,convo) {
                                            runDeskAPI();
                                            convo.say(globalObj.firstName + ', ticket has been created! WOOF! :dog:');
                                            convo.next();
                                        }
                                    },
                                    {
                                        pattern: bot.utterances.no,
                                        callback: function(response, convo) {
                                            convo.say(globalObj.firstName + ', the ticket has been cancelled.');
                                            convo.next();
                                        }
                                    },
                                    {
                                        default: true,
                                        callback: function(response, convo) {
                                            convo.repeat();
                                            convo.next();
                                        }
                                    }
                                ]);
                            });
                        });
                        
                    });
                } 
                else {
                     bot.reply(message, 'OK OK! Ticket aborted! Woof. :dog:');
                }
            });



        });
    });
});

function findCustomer(){
    switch(globalObj.firstName) {
        case "Heather":
            customerIDNum = customersID.heather;
            break;
        case "Raymond":
            customerIDNum = customersID.ray;
            break;
        case "Angus":
            customerIDNum = customersID.angus;
            break;
        case "Tristan":
            customerIDNum = customersID.tristan;
            break;
        case "Andrew":
            customerIDNum = customersID.andrew;
            break;
        case "Dorothy":
            customerIDNum = customersID.dorothy;
            break;
        case "Danny":
            customerIDNum = customersID.danny;
            break;
        default:
            customerIDNum = customersID.ray;
    }
}

function runDeskAPI(){
    findCustomer();
    var desk = require('desk.js')
      , client = desk.createClient({
      subdomain: 'xxxxxxx',
      // use it with basic auth
      consumerKey: 'xxxxxxx',
      consumerSecret: 'xxxxxxx',
      token: 'xxxxxxx',
      tokenSecret: 'xxxxxxx',
      // allow retry
      retry: true
    });

    client.cases().create({
      external_id: null,
      subject: globalObj.subject,
      priority: globalObj.priority,
      description: globalObj.description,
      status: 'new',
      assigned_user: globalObj.assign,
      type: 'email',
      labels: [globalObj.labels, "SlackMade"],
      language: null,
      custom_fields: {partner_name: globalObj.partnerName},
      message: {
        direction: 'in',
        status: 'received',
        body: globalObj.description,
        subject: globalObj.subject,
        from: globalObj.email,
        to: 'xxxxxxx'
      },
      _links: {
        customer: {
            href: '/api/v2/customers/' + customerIDNum,
            'class': 'customer'
        },
        assigned_user: {
            href: globalObj.assign,
            "class": "user"
    },
      }
    }, function(err, myCase) {
            console.log(err);
            // => Message requires to, cc or bcc fields to be set to a non-blank value
    });
   globalObj.assign = "";
}