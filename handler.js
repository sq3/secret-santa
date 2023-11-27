'use strict';

const AWS = require('aws-sdk');
const ses = new AWS.SES();

module.exports.secretSantaFunction = async (event) => {
  try {
    const participants = JSON.parse(event.body || '').participants || [];

    // Shuffle the participants to randomize the pairings
    const shuffledParticipants = shuffleArray(participants);

    // Generate pairs
    const pairs = [];
    for (let i = 0; i < shuffledParticipants.length; i++) {
      console.log('Current Participant:', shuffledParticipants[i]);
      const giver = shuffledParticipants[i];
      const receiverIndex = (i + 1) % shuffledParticipants.length;
      const receiver = shuffledParticipants[receiverIndex];

      // Check if giver and receiver are the same person
      if (giver.email !== receiver.email) {
        pairs.push({
          giver: giver.name,
          giver_email: giver.email,
          receiver: receiver.name,
          receiver_email: receiver.email,
        });
      } else {
        // If giver and receiver are the same person, find the next available receiver
        let nextReceiverIndex = (receiverIndex + 1) % shuffledParticipants.length;
        while (nextReceiverIndex !== receiverIndex) {
          const nextReceiver = shuffledParticipants[nextReceiverIndex];
          if (giver.email !== nextReceiver.email) {
            pairs.push({
              giver: giver.name,
              giver_email: giver.email,
              receiver: nextReceiver.name,
              receiver_email: nextReceiver.email,
            });
            break;
          }
          nextReceiverIndex = (nextReceiverIndex + 1) % shuffledParticipants.length;
        }
      }
    }

    // Send email notifications via SES
    for (const pair of pairs) {
      const subject = 'Secret Santa Notification';
      const message = `Hello ${pair.giver}, your Secret Santa receiver is ${pair.receiver}.`;

      await ses.sendEmail({
        Destination: { ToAddresses: [pair.giver_email] },
        Message: {
          Body: { Text: { Data: message } },
          Subject: { Data: subject },
        },
        Source: 'secret-santa@mschnitzius.com', // Replace with your verified SES email
      }).promise();
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Secret Santa pairs created successfully', pairs }),
    };
  } catch (error) {
    console.error('Error creating Secret Santa pairs:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error creating Secret Santa pairs', error: String(error) }),
    };
  }
};

function shuffleArray(array) {
  // Fisher-Yates shuffle algorithm
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
